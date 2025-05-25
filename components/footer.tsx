"use client"

import { Heart, Flower2, Sparkles, MessageCircle, Shield, Mail } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <motion.footer 
      className="relative py-3 px-6 bg-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left section - Brand and tagline */}
          <motion.div 
            className="flex flex-col md:flex-row items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
              >
                <Flower2 className="w-5 h-5 text-purple-400" />
                <motion.div
                  className="absolute inset-0 blur-sm"
                  animate={{
                    opacity: [0.4, 0.8, 0.4]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                >
                  <Flower2 className="w-5 h-5 text-purple-400" />
                </motion.div>
              </motion.div>
              <span className="text-sm font-light text-gray-700">Genie</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500 font-light italic">Your compassionate AI companion</span>
            </div>
          </motion.div>

          {/* Center section - Quick links */}
          <motion.div 
            className="flex items-center gap-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link 
              href="/about" 
              className="text-xs text-gray-600 hover:text-purple-600 transition-colors font-light flex items-center gap-1 group"
            >
              <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              About
            </Link>
            <Link 
              href="/resources" 
              className="text-xs text-gray-600 hover:text-purple-600 transition-colors font-light flex items-center gap-1 group"
            >
              <Heart className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              Wellness Resources
            </Link>
            <Link 
              href="/support" 
              className="text-xs text-gray-600 hover:text-purple-600 transition-colors font-light flex items-center gap-1 group"
            >
              <MessageCircle className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              Support
            </Link>
            <Link 
              href="/privacy" 
              className="text-xs text-gray-600 hover:text-purple-600 transition-colors font-light flex items-center gap-1 group"
            >
              <Shield className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              Privacy
            </Link>
          </motion.div>

          {/* Right section - Social and contact */}
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            {/* Contact */}
            <a 
              href="mailto:hello@genie.ai" 
              className="text-xs text-gray-500 hover:text-purple-600 transition-colors font-light flex items-center gap-1"
            >
              <Mail className="w-3 h-3" />
              hello@genie.ai
            </a>
            
            {/* Decorative separator */}
            <div className="h-4 w-px bg-gray-200" />
            
            {/* Copyright with floral accent */}
            <div className="flex items-center gap-2 text-xs text-gray-500 font-light">
              <span>© {currentYear}</span>
              <motion.span
                className="text-purple-400"
                animate={{ 
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 20, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              >
                ✿
              </motion.span>
              <span>Made with care</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  )
}