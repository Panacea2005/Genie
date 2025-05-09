"use client"

import { X, Instagram, Music } from "lucide-react"
import { motion } from "framer-motion"

export default function Footer() {
  return (
    <motion.footer 
      className="p-5 flex justify-between items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
    >
      <div className="flex gap-5">
        <motion.a 
          href="https://twitter.com" 
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.9 }}
          className="opacity-50 hover:opacity-80 transition-opacity"
        >
          <X className="w-3 h-3 text-gray-600" />
        </motion.a>
        <motion.a 
          href="https://instagram.com" 
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.9 }}
          className="opacity-50 hover:opacity-80 transition-opacity"
        >
          <Instagram className="w-3 h-3 text-gray-600" />
        </motion.a>
        <motion.a 
          href="https://soundcloud.com" 
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.9 }}
          className="opacity-50 hover:opacity-80 transition-opacity"
        >
          <Music className="w-3 h-3 text-gray-600" />
        </motion.a>
      </div>
      <motion.a 
        href="/privacy"
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-light"
        whileHover={{ scale: 1.05 }}
      >
        Privacy Policy
      </motion.a>
    </motion.footer>
  )
}