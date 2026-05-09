"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/30 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/30 blur-[120px]" />
      
      <main className="z-10 text-center px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            Microservices Architecture Powered
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
            Realtime Chat. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
              Reimagined.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto font-light">
            An advanced, scalable, and ultra-fast messaging platform built with Next.js, Node.js microservices, Kafka, Redis, and PostgreSQL.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="rounded-full bg-white text-black hover:bg-white/90 h-12 px-8 font-medium">
                Get Started
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 h-12 px-8 font-medium backdrop-blur-md">
                Create Account
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>

      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <p className="text-sm text-white/40 mb-2">Powered by</p>
        <div className="flex gap-4 opacity-50">
          <span className="font-semibold tracking-wider text-xs">NEXT.JS</span>
          <span className="font-semibold tracking-wider text-xs">KAFKA</span>
          <span className="font-semibold tracking-wider text-xs">REDIS</span>
          <span className="font-semibold tracking-wider text-xs">POSTGRES</span>
        </div>
      </motion.div>
    </div>
  );
}
