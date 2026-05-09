"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/lib/store";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, LogOut, MessageCircle, User as UserIcon, Plus, Search } from "lucide-react";
import clsx from "clsx";
import axios from "axios";

export default function ChatPage() {
  const router = useRouter();
  const { user, token, socket, setSocket, addMessage, conversations, activeConversationId, setActiveConversationId, users, setUsers, setConversations, setMessages } = useChatStore();
  const [message, setMessage] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle Hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !token) {
      router.push("/login");
      return;
    }

    if (isHydrated && token && !socket) {
      const newSocket = io(process.env.NEXT_PUBLIC_WS_SERVICE_URL || "http://localhost:4003", {
        auth: { token },
      });

      newSocket.on("connect", () => {
        console.log("Connected to WS service");
      });

      newSocket.on("new_message", (msg) => {
        addMessage(msg.conversationId, msg);
      });

      setSocket(newSocket);
    }
  }, [isHydrated, token, socket, setSocket, addMessage, router]);

  // Initial Fetch
  useEffect(() => {
    if (isHydrated && user?.id) {
      const fetchData = async () => {
        try {
          const [convs, allUsers] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4002"}/api/chat/conversations/${user.id}`),
            axios.get(`${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4002"}/api/chat/users`)
          ]);
          setConversations(convs.data);
          setUsers(allUsers.data.filter((u: any) => u.id !== user.id));
        } catch (err) {
          console.error("Failed to fetch data", err);
        }
      };
      fetchData();
    }
  }, [isHydrated, user?.id, setConversations, setUsers]);

  // Fetch messages for active conversation
  useEffect(() => {
    if (activeConversationId) {
      const fetchMessages = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4002"}/api/chat/messages/${activeConversationId}`);
          setMessages(activeConversationId, res.data);
        } catch (err) {
          console.error("Failed to fetch messages", err);
        }
      };
      fetchMessages();
      socket?.emit("join_conversation", activeConversationId);
    }
  }, [activeConversationId, socket, setMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversations, activeConversationId]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket || !activeConversationId) return;

    socket.emit("send_message", {
      conversationId: activeConversationId,
      content: message,
    });
    
    // Optimistically add message
    addMessage(activeConversationId, {
      id: Math.random().toString(36).substr(2, 9),
      content: message,
      senderId: user!.id,
      conversationId: activeConversationId,
      createdAt: new Date().toISOString(),
    });

    setMessage("");
  };

  const handleLogout = () => {
    useChatStore.getState().setUser(null, null);
    if (socket) socket.disconnect();
    setSocket(null);
    router.push("/");
  };

  const startNewConversation = async (participantId: string) => {
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4002"}/api/chat/conversations`, {
        isGroup: false,
        participantIds: [user?.id, participantId]
      });
      // Check if conversation already exists in our list
      if (!conversations.find(c => c.id === res.data.id)) {
        setConversations([...conversations, res.data]);
      }
      setActiveConversationId(res.data.id);
      setShowUserList(false);
    } catch (err) {
      console.error("Failed to start conversation", err);
    }
  };

  if (!isHydrated || !user) return null;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-80 border-r border-white/10 flex flex-col bg-black/40 backdrop-blur-xl"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-white/20">
              <AvatarFallback className="bg-gradient-to-tr from-purple-500 to-blue-500 text-white font-bold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/50 hover:text-white">
            <LogOut size={18} />
          </Button>
        </div>
        
        <div className="p-4 flex flex-col flex-1 overflow-hidden">
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              {showUserList ? "All Users" : "Recent Chats"}
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowUserList(!showUserList)}
              className={clsx("h-8 w-8 rounded-full", showUserList && "bg-white/10")}
            >
              {showUserList ? <MessageCircle size={16} /> : <Plus size={16} />}
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {showUserList ? (
                users.length === 0 ? (
                  <p className="text-sm text-white/40 text-center mt-10">No users found.</p>
                ) : (
                  users.map((u) => (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={u.id}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-4 py-4 h-auto rounded-xl hover:bg-white/5"
                        onClick={() => startNewConversation(u.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-white/10">
                            <AvatarFallback className="bg-white/10">
                              <UserIcon size={18} />
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <p className="font-medium text-sm">{u.name}</p>
                            <p className="text-xs text-white/40">Start messaging</p>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  ))
                )
              ) : (
                conversations.length === 0 ? (
                  <p className="text-sm text-white/40 text-center mt-10">No conversations yet.</p>
                ) : (
                  conversations.map((conv) => {
                    const otherParticipant = conv.participants.find(p => p.userId !== user?.id)?.user;
                    const displayName = conv.isGroup ? conv.name : otherParticipant?.name;
                    
                    return (
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={conv.id}
                      >
                        <Button
                          variant="ghost"
                          className={clsx(
                            "w-full justify-start px-4 py-6 h-auto rounded-xl transition-all",
                            activeConversationId === conv.id 
                              ? "bg-white/10 shadow-lg border border-white/10" 
                              : "hover:bg-white/5"
                          )}
                          onClick={() => {
                            setActiveConversationId(conv.id);
                            socket?.emit("join_conversation", conv.id);
                          }}
                        >
                          <div className="flex items-center gap-3 w-full text-left">
                            <Avatar className="h-12 w-12 border border-white/10">
                              <AvatarFallback className="bg-white/10">
                                {conv.isGroup ? <MessageCircle size={20} /> : <UserIcon size={20} />}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 truncate">
                              <p className="font-medium">{displayName || "Unknown User"}</p>
                              <p className="text-xs text-white/50 truncate">
                                {conv.messages[conv.messages.length - 1]?.content || "Start a conversation"}
                              </p>
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                    );
                  })
                )
              )}
            </div>
          </ScrollArea>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
        {/* Decorative background blobs */}
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />

        {activeConversation ? (
          <>
            <div className="p-6 border-b border-white/10 bg-black/20 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/20 shadow-md">
                  <AvatarFallback className="bg-white/10">
                    {activeConversation.isGroup ? <MessageCircle size={18} /> : <UserIcon size={18} />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{activeConversation.name || "Direct Message"}</h2>
                  <p className="text-xs text-white/50">{activeConversation.participants.length} participants</p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 z-10">
              <div className="space-y-6 flex flex-col">
                <AnimatePresence initial={false}>
                  {activeConversation.messages.map((msg, i) => {
                    const isMe = msg.senderId === user.id;
                    return (
                      <motion.div
                        key={msg.id || i}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={clsx(
                          "flex flex-col max-w-[70%]",
                          isMe ? "self-end items-end" : "self-start items-start"
                        )}
                      >
                        <div
                          className={clsx(
                            "px-5 py-3 rounded-2xl shadow-xl backdrop-blur-md border",
                            isMe 
                              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm border-blue-500/50" 
                              : "bg-white/10 text-white rounded-tl-sm border-white/10"
                          )}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-white/30 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-6 bg-black/40 backdrop-blur-xl border-t border-white/10 z-10">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border-white/10 text-white rounded-full h-12 px-6 focus-visible:ring-1 focus-visible:ring-blue-500 placeholder:text-white/30"
                />
                <Button 
                  type="submit" 
                  disabled={!message.trim()}
                  className="rounded-full h-12 w-12 p-0 bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Send size={18} className="ml-1" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/30 z-10">
            <MessageCircle size={64} className="mb-6 opacity-20" />
            <p className="text-xl font-light tracking-wide">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
