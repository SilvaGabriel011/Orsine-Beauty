"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export default function HomeHeroClient() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-warm-800 via-burgundy-800 to-warm-900" />

        {/* Decorative orbs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute inset-0"
        >
          <div className="absolute left-[10%] top-[20%] h-[400px] w-[400px] rounded-full bg-burgundy-600/20 blur-[100px]" />
          <div className="absolute right-[15%] top-[30%] h-[300px] w-[300px] rounded-full bg-gold-400/10 blur-[80px]" />
          <div className="absolute bottom-[10%] left-[30%] h-[350px] w-[350px] rounded-full bg-burgundy-500/15 blur-[90px]" />
        </motion.div>

        {/* Subtle grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-block font-display text-sm italic tracking-[0.3em] text-gold-400 uppercase">
              Beauty Studio
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 font-serif text-5xl leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            Bela Orsine
            <br />
            <span className="text-gold-300">Beauty</span>
          </motion.h1>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mx-auto mt-8 h-px w-24 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
          />

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mx-auto mt-8 max-w-lg text-lg leading-relaxed text-warm-300 sm:text-xl"
          >
            Enhance your natural beauty with our specialised services.
            Choose, build your cart and book — all in a few clicks.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/agendar">
              <Button
                size="lg"
                className="gap-2 rounded-full bg-gold-300 px-8 text-burgundy-900 shadow-xl shadow-gold-400/20 hover:bg-gold-200 hover:shadow-2xl transition-all duration-300 text-sm font-semibold tracking-wide"
              >
                Book Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/servicos">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 rounded-full border-white/40 px-8 text-white hover:bg-white/10 hover:border-white/60 transition-all duration-300 text-sm tracking-wide"
              >
                Explore Services
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="mx-auto mt-16 flex max-w-sm justify-center gap-10 sm:gap-16"
          >
            <div className="text-center">
              <span className="font-serif text-3xl font-bold text-gold-300">500+</span>
              <p className="mt-1 text-xs tracking-wider text-warm-400 uppercase">Happy Clients</p>
            </div>
            <div className="h-12 w-px bg-warm-600/30" />
            <div className="text-center">
              <span className="font-serif text-3xl font-bold text-gold-300">5.0</span>
              <p className="mt-1 text-xs tracking-wider text-warm-400 uppercase">Rating</p>
            </div>
            <div className="h-12 w-px bg-warm-600/30" />
            <div className="text-center">
              <span className="font-serif text-3xl font-bold text-gold-300">3+</span>
              <p className="mt-1 text-xs tracking-wider text-warm-400 uppercase">Years</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] tracking-[0.2em] text-warm-400 uppercase">Scroll</span>
          <ChevronDown className="h-4 w-4 text-warm-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}
