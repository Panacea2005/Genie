"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import GradientSphere from "@/components/gradient-sphere"
import { Heart, Brain, Shield, Users, Sparkles, Star } from "lucide-react"

const values = [
  {
    icon: Heart,
    title: "Compassionate Care",
    description: "We believe in providing empathetic support that truly understands your emotional journey.",
    color: "from-pink-400 to-rose-400"
  },
  {
    icon: Brain,
    title: "Intelligent Understanding",
    description: "Our AI learns and adapts to provide personalized support tailored to your unique needs.",
    color: "from-purple-400 to-indigo-400"
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your conversations and personal data are protected with enterprise-grade security.",
    color: "from-blue-400 to-cyan-400"
  },
  {
    icon: Users,
    title: "Accessible Support",
    description: "Mental wellness support should be available to everyone, anytime they need it.",
    color: "from-indigo-400 to-purple-400"
  }
]

const team = [
  {
    name: "Truc",
    role: "Python Queen",
    bio: "Former Stanford psychiatrist with 15 years in mental health technology.",
    flower: "✿"
  },
  {
    name: "Thien",
    role: "Python Baby",
    bio: "ML researcher focused on empathetic AI systems and natural language understanding.",
    flower: "❀"
  },
  {
    name: "Hung",
    role: "Python King",
    bio: "UX specialist creating calming, intuitive interfaces for mental wellness.",
    flower: "❋"
  }
]

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Parallax transforms
  const sphereY = useTransform(scrollYProgress, [0, 1], [0, -200])
  const sphereScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -100])

  return (
    <main className="min-h-screen flex flex-col bg-white overflow-x-hidden" ref={containerRef}>
      {/* Dynamic gradient background that changes with scroll */}
      <motion.div 
        className="fixed inset-0 -z-10"
        style={{
          background: useTransform(
            scrollYProgress,
            [0, 0.5, 1],
            [
              "linear-gradient(to bottom right, #ffffff, #fafafa, #f5f5f5)",
              "linear-gradient(to bottom right, #fef3ff, #f0f4ff, #fef3ff)",
              "linear-gradient(to bottom right, #f0f4ff, #fef3ff, #ffffff)"
            ]
          )
        }}
      />
      
      <Navbar currentPage="about" />
      
      {/* Hero Section with Gradient Sphere */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
        {/* Gradient Sphere as background element */}
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] z-0"
          style={{ y: sphereY, scale: sphereScale }}
        >
          <div style={{ transform: 'scale(1.5)' }}>
            <GradientSphere />
          </div>
        </motion.div>

        {/* Floating decorative elements */}
        <motion.div
          className="absolute top-20 left-10 text-4xl text-purple-200/50 z-10"
          animate={{ 
            rotate: [0, 360],
            y: [0, -20, 0]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          ✧
        </motion.div>
        
        <motion.div
          className="absolute bottom-20 right-10 text-5xl text-pink-200/50 z-10"
          animate={{ 
            rotate: [360, 0],
            x: [0, 20, 0]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          ✿
        </motion.div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ y: textY }}
          >
            <motion.h1 
              className="text-6xl md:text-7xl font-light text-gray-800 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              About <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Genie</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 font-light leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              We're building a future where mental wellness support is as natural and accessible as having a conversation with a trusted friend.
            </motion.p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
            <motion.div 
              className="w-1 h-3 bg-gray-400 rounded-full mt-2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Mission Section - Full width with side-by-side layout */}
      <motion.section 
        className="relative py-32 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-light text-gray-800 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 font-light leading-relaxed mb-6">
                Genie exists to democratize mental health support through compassionate AI technology. 
                We believe everyone deserves a safe space to express their feelings, celebrate their joys, 
                and navigate life's challenges with understanding and support.
              </p>
              <p className="text-lg text-gray-600 font-light leading-relaxed">
                By combining cutting-edge AI with genuine empathy, we're creating a companion that 
                truly understands and adapts to your unique emotional journey.
              </p>
            </motion.div>
            
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="aspect-square rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="text-6xl opacity-50">
                      {i === 1 ? "✿" : i === 2 ? "❀" : i === 3 ? "✧" : "❋"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Values Section - Staggered cards with hover effects */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-transparent via-purple-50/30 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-4xl font-light text-gray-800 mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            What We Stand For
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <motion.div
                  className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 h-full overflow-hidden group"
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Gradient overlay on hover */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />
                  
                  <div className="relative z-10">
                    <motion.div 
                      className="inline-flex p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 mb-4"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <value.icon className="w-6 h-6 text-gray-700" />
                    </motion.div>
                    
                    <h3 className="text-xl font-medium text-gray-800 mb-3">{value.title}</h3>
                    <p className="text-gray-600 font-light leading-relaxed">{value.description}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section - Creative circular layout */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-4xl font-light text-gray-800 mb-16 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            The Hearts Behind Genie
          </motion.h2>
          
          <div className="relative">
            {/* Central decorative element */}
            <motion.div
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 opacity-20 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            
            <div className="grid md:grid-cols-3 gap-12">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  className="text-center"
                >
                  <motion.div
                    className="relative inline-block mb-6"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden">
                      <span className="text-5xl text-gray-600">{member.flower}</span>
                    </div>
                    
                    {/* Floating decoration */}
                    <motion.div
                      className="absolute -top-2 -right-2 text-2xl"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </motion.div>
                  </motion.div>
                  
                  <h3 className="text-xl font-medium text-gray-800 mb-1">{member.name}</h3>
                  <p className="text-sm text-purple-600 mb-3">{member.role}</p>
                  <p className="text-sm text-gray-600 font-light max-w-xs mx-auto">{member.bio}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with parallax effect */}
      <motion.section 
        className="relative py-32 px-6"
        style={{ y: useTransform(scrollYProgress, [0.8, 1], [50, 0]) }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl transform rotate-3 opacity-50" />
            
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-12 md:p-16 border border-gray-100">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-6"
              >
                <Star className="w-12 h-12 text-purple-500" />
              </motion.div>
              
              <h2 className="text-3xl font-light text-gray-800 mb-4">Ready to Start Your Journey?</h2>
              <p className="text-lg text-gray-600 font-light mb-8">
                Join thousands who have found support and understanding with Genie.
              </p>
              
              <motion.a
                href="/waitlist"
                className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-full text-sm font-light hover:bg-gray-800 transition-all duration-300"
                whileHover={{ scale: 1.05, gap: "16px" }}
                whileTap={{ scale: 0.95 }}
              >
                Join Waitlist
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