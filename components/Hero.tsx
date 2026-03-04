"use client"
import { motion } from "framer-motion"

export default function Hero() {
  return (
    <section className="relative h-[500px] flex items-center justify-center overflow-hidden my-6 bg-zinc-950 dark:bg-black">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070')] bg-cover bg-center opacity-40" />
      <div className="relative z-10 text-center space-y-4 px-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold text-white tracking-tighter"
        >
          MOVIE <span className="text-primary">VAULT</span>
        </motion.h1>
        <p className="text-zinc-300 max-w-lg mx-auto">Discover, track, and watch trailers for the latest cinematic masterpieces.</p>
      </div>
    </section>
  )
}