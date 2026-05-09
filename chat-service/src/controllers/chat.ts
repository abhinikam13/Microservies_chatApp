import { Request, Response } from 'express';
import { prisma } from '../prisma';

// Create a direct conversation or a group
export const createConversation = async (req: Request, res: Response) => {
  try {
    const { isGroup, name, participantIds } = req.body;
    // req.user would have the currently authenticated user's ID in a real scenario
    // For now, we expect the sender to include their ID in participantIds

    if (!participantIds || participantIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 participants required' });
    }

    if (!isGroup) {
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: participantIds.map((id: string) => ({
            participants: { some: { userId: id } }
          }))
        },
        include: {
          participants: { include: { user: true } },
          messages: { orderBy: { createdAt: 'asc' } }
        }
      });

      if (existing) {
        return res.json(existing);
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        isGroup,
        name: isGroup ? name : null,
        participants: {
          create: participantIds.map((userId: string) => ({ userId })),
        },
      },
      include: {
        participants: { include: { user: true } },
        messages: true
      },
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch conversations for a user
export const getConversations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: userId as string },
        },
      },
      include: {
        participants: { include: { user: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch messages for a conversation
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const messages = await prisma.message.findMany({
      where: { conversationId: conversationId as string },
      orderBy: { createdAt: 'asc' },
      include: { sender: true },
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
