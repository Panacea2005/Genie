"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import GradientSphere from "@/components/gradient-sphere"
import { Shield, Lock, Eye, Database, UserCheck, AlertCircle, Star, Sparkles } from "lucide-react"

const sections = [
  {
    title: "Information We Collect",
    icon: Database,
    color: "from-blue-400 to-cyan-400",
    content: [
      {
        subtitle: "Information You Provide",
        points: [
          "Account information (email, name)",
          "Conversation content with Genie",
          "Feedback and support requests"
        ]
      },
      {
        subtitle: "Automatically Collected",
        points: [
          "Usage patterns and preferences",
          "Device and browser information",
          "Anonymous analytics data"
        ]
      }
    ]
  },
  {
    title: "How We Use Your Information",
    icon: UserCheck,
    color: "from-green-400 to-emerald-400",
    content: [
      {
        subtitle: "To Provide Our Service",
        points: [
          "Personalize your experience with Genie",
          "Improve our AI's understanding and responses",
          "Maintain and enhance platform security"
        ]
      },
      {
        subtitle: "We Never",
        points: [
          "Sell your personal data",
          "Share conversations without consent",
          "Use your data for advertising"
        ]
      }
    ]
  },
  {
    title: "Data Security",
    icon: Lock,
    color: "from-purple-400 to-indigo-400",
    content: [
      {
        subtitle: "Protection Measures",
        points: [
          "End-to-end encryption for all conversations",
          "Regular security audits and updates",
          "Secure data centers with redundancy"
        ]
      },
      {
        subtitle: "Access Control",
        points: [
          "Strict internal access policies",
          "No human review of conversations",
          "Automated monitoring for threats"
        ]
      }
    ]
  },
  {
    title: "Your Rights",
    icon: Eye,
    color: "from-pink-400 to-rose-400",
    content: [
      {
        subtitle: "You Can Always",
        points: [
          "Access your personal data",
          "Delete conversations or your account",
          "Export your data in standard formats",
          "Opt-out of non-essential processing"
        ]
      }
    ]
  }
]

export default function PrivacyPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Parallax transforms
  const sphereY = useTransform(scrollYProgress, [0, 1], [0, -250])
  const sphereScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.8])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120])

  return (
    <main className="min-h-screen flex flex-col bg-white overflow-x-hidden" ref={containerRef}>
      {/* Dynamic gradient background */}
      <motion.div 
        className="fixed inset-0 -z-10"
        style={{
          background: useTransform(
            scrollYProgress,
            [0, 0.4, 0.8, 1],
            [
              "linear-gradient(to bottom right, #ffffff, #fafafa, #f5f5f5)",
              "linear-gradient(to bottom right, #f0f4ff, #e6f3ff, #f0f9ff)",
              "linear-gradient(to bottom right, #fef3ff, #f0f4ff, #e6f3ff)",
              "linear-gradient(to bottom right, #ffffff, #fafafa, #f5f5f5)"
            ]
          )
        }}
      />
      
      <Navbar currentPage="privacy" />
      
      {/* Hero Section with Gradient Sphere */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
        {/* Gradient Sphere as background element */}
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] z-0"
          style={{ y: sphereY, scale: sphereScale }}
        >
          <div style={{ transform: 'scale(1.4)' }}>
            <GradientSphere />
          </div>
        </motion.div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ y: textY }}
          >
            <motion.div 
              className="inline-block mb-6 p-4 rounded-full bg-white/80 backdrop-blur-sm shadow-lg"
            >
              <Shield className="w-10 h-10 text-purple-500" />
            </motion.div>
            
            <motion.h1 
              className="text-6xl md:text-7xl font-light text-gray-800 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Privacy <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Policy</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 font-light leading-relaxed max-w-3xl mx-auto mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Your privacy is fundamental to our mission. We're committed to protecting your personal information and being completely transparent about our practices.
            </motion.p>
            
            <motion.p 
              className="text-sm text-gray-500 font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </motion.p>
          </motion.div>
        </div>

        {/* Enhanced scroll indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center relative overflow-hidden">
            <motion.div 
              className="w-1 h-3 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Key Promise Banner - Enhanced */}
      <motion.section
        className="relative py-16 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 rounded-3xl p-8 md:p-12 border border-purple-100 overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100/50 to-blue-100/50 rounded-full blur-3xl -translate-y-32 translate-x-32" />
            
            <div className="relative z-10 flex items-start gap-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <AlertCircle className="w-10 h-10 text-purple-600 mt-1" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-light text-purple-800 mb-4">Our Privacy Promise</h2>
                <p className="text-purple-700 font-light text-lg leading-relaxed">
                  Your conversations with Genie are encrypted and private. We never sell your data, 
                  share it without your consent, or use it for advertising. Your mental wellness journey 
                  is yours alone, protected by enterprise-grade security.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Privacy Sections - Enhanced with staggered animations */}
      {sections.map((section, index) => (
        <motion.section
          key={section.title}
          className="relative py-16 px-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="max-w-5xl mx-auto">
            {/* Section Header */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <motion.div 
                className="inline-flex items-center gap-4 mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${section.color} shadow-lg`}>
                  <section.icon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-light text-gray-800">{section.title}</h2>
              </motion.div>
              
              {/* Decorative line */}
              <motion.div
                className={`w-24 h-1 bg-gradient-to-r ${section.color} rounded-full mx-auto`}
                initial={{ width: 0 }}
                whileInView={{ width: 96 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
              />
            </motion.div>
            
            {/* Content */}
            <motion.div
              className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-gray-100 overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
            >
              {/* Gradient overlay on hover */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 hover:opacity-5 transition-opacity duration-500`}
              />
              
              {/* Floating decoration */}
              <motion.div
                className="absolute top-6 right-6 opacity-20"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Star className="w-8 h-8 text-gray-400" />
              </motion.div>
              
              <div className="relative z-10 space-y-8">
                {section.content.map((subsection, subIndex) => (
                  <motion.div
                    key={subsection.subtitle}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * subIndex }}
                  >
                    <h3 className="text-xl font-medium text-gray-800 mb-4">{subsection.subtitle}</h3>
                    <ul className="space-y-3">
                      {subsection.points.map((point, pointIndex) => (
                        <motion.li
                          key={point}
                          className="flex items-start gap-4"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.05 * pointIndex }}
                        >
                          <motion.span 
                            className={`w-2 h-2 rounded-full bg-gradient-to-r ${section.color} mt-2 flex-shrink-0`}
                            whileHover={{ scale: 1.5 }}
                          />
                          <span className="text-gray-600 font-light leading-relaxed">{point}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>
      ))}

      {/* Data Retention Section - Enhanced */}
      <motion.section
        className="relative py-20 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-light text-gray-800 mb-4">Data Retention</h2>
            <motion.div
              className="w-24 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mx-auto"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            />
          </motion.div>
          
          <motion.div
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-gray-100 mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <p className="text-gray-600 font-light mb-8 text-lg leading-relaxed text-center">
              We retain your data only as long as necessary to provide our services. You can delete 
              your data at any time through your account settings.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: "Active Accounts",
                  description: "Data retained while account is active and for 30 days after deletion request",
                  color: "from-green-400 to-emerald-400"
                },
                {
                  title: "Anonymized Data",
                  description: "May be retained indefinitely for service improvement, fully de-identified",
                  color: "from-blue-400 to-cyan-400"
                }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  className="relative bg-white/80 rounded-xl p-6 border border-gray-100 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <motion.div
                    className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.color}`}
                  />
                  <h3 className="font-medium text-gray-800 mb-3 text-lg">{item.title}</h3>
                  <p className="text-gray-600 font-light leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Section - Enhanced with parallax */}
      <motion.section
        className="relative py-32 px-6"
        style={{ y: useTransform(scrollYProgress, [0.8, 1], [50, 0]) }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Background decorations */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-blue-100 rounded-3xl transform rotate-2 opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-l from-blue-100 to-indigo-100 rounded-3xl transform -rotate-1 opacity-30" />
            
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-12 md:p-16 border border-gray-100 text-center overflow-hidden">  
              <motion.div
                className="inline-block mb-8"
              >
                <Sparkles className="w-16 h-16 text-purple-500" />
              </motion.div>
              
              <h2 className="text-4xl font-light text-gray-800 mb-6">Questions About Privacy?</h2>
              <p className="text-lg text-gray-600 font-light mb-8 leading-relaxed">
                We're here to help clarify any concerns about your data and privacy practices.
              </p>
              
              <motion.a
                href="mailto:privacy@genie.ai"
                className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-full text-sm font-light hover:bg-gray-800 transition-all duration-300"
                whileHover={{ scale: 1.05, gap: "16px" }}
                whileTap={{ scale: 0.95 }}
              >
                Contact Privacy Team
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </motion.section>
      
      <Footer />
    </main>
  )
}