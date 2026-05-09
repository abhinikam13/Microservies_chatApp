import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Socket } from 'socket.io-client';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  isGroup: boolean;
  name: string | null;
  participants: any[];
  messages: Message[];
}

interface ChatState {
  user: User | null;
  token: string | null;
  socket: Socket | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  users: User[];
  setUser: (user: User | null, token: string | null) => void;
  setSocket: (socket: Socket | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  setUsers: (users: User[]) => void;
  setActiveConversationId: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      socket: null,
      conversations: [],
      activeConversationId: null,
      users: [],
      setUser: (user, token) => set({ user, token }),
      setSocket: (socket) => set({ socket: socket as any }), // Socket is not serializable, but we store it separately or handle it
      setConversations: (conversations) => set({ conversations }),
      setUsers: (users) => set({ users }),
      setActiveConversationId: (id) => set({ activeConversationId: id }),
      addMessage: (conversationId, message) =>
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id === conversationId) {
              // Avoid duplicates
              if (c.messages.find(m => m.id === message.id)) return c;
              return { ...c, messages: [...c.messages, message] };
            }
            return c;
          }),
        })),
      setMessages: (conversationId, messages) =>
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id === conversationId) {
              return { ...c, messages };
            }
            return c;
          }),
        })),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        activeConversationId: state.activeConversationId 
      }), // Only persist user and token
    }
  )
);
