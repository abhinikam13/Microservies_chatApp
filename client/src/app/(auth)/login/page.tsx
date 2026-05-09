"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/lib/store";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useChatStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:4001"}/api/auth/login`, {
        email,
        password,
      });
      setUser(res.data.user, res.data.token);
      
      // Also fetch conversations here and set them
      const convRes = await axios.get(`${process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:4002"}/api/chat/conversations/${res.data.user.id}`);
      useChatStore.getState().setConversations(convRes.data);

      router.push("/chat");
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/50 text-sm">Sign in to your Chatz account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <Input 
                type="email" 
                placeholder="Email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/50 border-white/10 text-white h-12 rounded-xl focus-visible:ring-blue-500"
                required
              />
            </div>
            <div>
              <Input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/50 border-white/10 text-white h-12 rounded-xl focus-visible:ring-blue-500"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-lg"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-white/50 text-sm mt-8">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
