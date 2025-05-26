"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import GradientSphere from "@/components/gradient-sphere"
import { BookOpen, Heart, Brain, Sparkles, Phone, Globe, Users, MessageCircle, Star, Zap } from "lucide-react"

const resources = [
  {
    category: "Self-Help Guides",
    icon: BookOpen,
    color: "from-blue-400 to-cyan-400",
    items: [
      {
        title: "Managing Daily Anxiety",
        description: "Practical techniques for handling everyday stress and worry with proven mindfulness approaches",
        tags: ["Anxiety", "Stress Management"]
      },
      {
        title: "Building Emotional Resilience",
        description: "Strengthen your ability to bounce back from life's challenges with research-backed strategies",
        tags: ["Resilience", "Growth"]
      },
      {
        title: "Mindfulness for Beginners",
        description: "Simple exercises to stay present and reduce overwhelm through guided meditation practices",
        tags: ["Mindfulness", "Meditation"]
      }
    ]
  },
  {
    category: "Wellness Techniques",
    icon: Heart,
    color: "from-pink-400 to-rose-400",
    items: [
      {
        title: "Breathing Exercises",
        description: "Calming techniques to regulate your nervous system and find instant peace",
        tags: ["Breathing", "Relaxation"]
      },
      {
        title: "Sleep Hygiene",
        description: "Improve your sleep quality for better mental health and emotional balance",
        tags: ["Sleep", "Rest"]
      },
      {
        title: "Movement & Mood",
        description: "How gentle exercise can boost your emotional wellbeing and energy levels",
        tags: ["Exercise", "Mood"]
      }
    ]
  },
  {
    category: "Understanding Emotions",
    icon: Brain,
    color: "from-purple-400 to-indigo-400",
    items: [
      {
        title: "Emotional Intelligence",
        description: "Learn to identify and understand your feelings for better self-awareness",
        tags: ["Emotions", "Self-awareness"]
      },
      {
        title: "Healthy Boundaries",
        description: "Setting limits that protect your mental energy and nurture relationships",
        tags: ["Boundaries", "Relationships"]
      },
      {
        title: "Self-Compassion",
        description: "Treating yourself with the kindness you deserve during difficult times",
        tags: ["Self-care", "Compassion"]
      }
    ]
  }
]

const emergencyResources = [
  {
    name: "Crisis Text Line",
    contact: "Text HOME to 741741",
    description: "24/7 crisis support via text",
    icon: MessageCircle,
    urgent: true
  },
  {
    name: "National Suicide Prevention Lifeline",
    contact: "988",
    description: "24/7 phone support",
    icon: Phone,
    urgent: true
  },
  {
    name: "International Crisis Lines",
    contact: "findahelpline.com",
    description: "Global directory of helplines",
    icon: Globe,
    urgent: false
  }
]

export default function ResourcesPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Parallax transforms
  const sphereY = useTransform(scrollYProgress, [0, 1], [0, -300])
  const sphereScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.7])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -150])

  return (
    <main className="min-h-screen flex flex-col bg-white overflow-x-hidden" ref={containerRef}>
      {/* Dynamic gradient background that changes with scroll */}
      <motion.div 
        className="fixed inset-0 -z-10"
        style={{
          background: useTransform(
            scrollYProgress,
            [0, 0.3, 0.6, 1],
            [
              "linear-gradient(to bottom right, #ffffff, #fafafa, #f5f5f5)",
              "linear-gradient(to bottom right, #fef3ff, #f0f4ff, #e0f2ff)",
              "linear-gradient(to bottom right, #f0f4ff, #fef3ff, #fff0f5)",
              "linear-gradient(to bottom right, #ffffff, #fafafa, #f5f5f5)"
            ]
          )
        }}
      />
      
      <Navbar currentPage="resources" />
      
      {/* Hero Section with Gradient Sphere */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
        {/* Gradient Sphere as background element */}
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] z-0"
          style={{ y: sphereY, scale: sphereScale }}
        >
          <div style={{ transform: 'scale(1.8)' }}>
            <GradientSphere />
          </div>
        </motion.div>

        {/* Floating decorative elements */}
        <motion.div
          className="absolute top-20 left-16 text-4xl text-blue-200/50 z-10"
          animate={{ 
            rotate: [0, 360],
            y: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          ✧
        </motion.div>
        
        <motion.div
          className="absolute bottom-32 right-16 text-5xl text-pink-200/50 z-10"
          animate={{ 
            rotate: [360, 0],
            x: [0, 25, 0],
            y: [0, 15, 0]
          }}
          transition={{ 
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          ❀
        </motion.div>

        <motion.div
          className="absolute top-1/3 right-1/4 text-3xl text-purple-200/50 z-10"
          animate={{ 
            rotate: [0, -360],
            scale: [1, 1.3, 1]
          }}
          transition={{ 
            duration: 20,
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
            <motion.div 
              className="inline-block mb-6 p-4 rounded-full bg-white/80 backdrop-blur-sm shadow-lg"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sparkles className="w-10 h-10 text-purple-500" />
            </motion.div>
            
            <motion.h1 
              className="text-6xl md:text-7xl font-light text-gray-800 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Wellness <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Resources</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 font-light leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Curated guides and techniques to support your mental wellness journey with evidence-based practices and compassionate guidance.
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
              className="w-1 h-3 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Emergency Resources Section - Enhanced with urgency design */}
      <motion.section
        className="relative py-20 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-r from-red-50 via-pink-50 to-red-50 rounded-3xl p-8 md:p-12 border border-red-100 overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-100/50 to-pink-100/50 rounded-full blur-3xl -translate-y-32 translate-x-32" />
            
            <div className="relative z-10">
              <motion.h2 
                className="text-3xl font-light text-red-800 mb-6 flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Phone className="w-8 h-8" />
                </motion.div>
                Crisis Support - Available 24/7
              </motion.h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                {emergencyResources.map((resource, index) => (
                  <motion.div
                    key={resource.name}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <motion.div
                      className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-white/50 h-full"
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {resource.urgent && (
                        <motion.div
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Zap className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                      
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-red-100">
                          <resource.icon className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 mb-1">{resource.name}</h3>
                          <p className="text-lg font-semibold text-red-600 mb-2">{resource.contact}</p>
                          <p className="text-sm text-gray-600 font-light">{resource.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Resource Categories Section - Enhanced with staggered animations */}
      {resources.map((category, categoryIndex) => (
        <motion.section
          key={category.category}
          className="relative py-20 px-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="max-w-6xl mx-auto">
            {/* Category Header */}
            <motion.div
              className="text-center mb-16"
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
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${category.color} shadow-lg`}>
                  <category.icon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-light text-gray-800">{category.category}</h2>
              </motion.div>
              
              {/* Decorative line */}
              <motion.div
                className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto"
                initial={{ width: 0 }}
                whileInView={{ width: 96 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
              />
            </motion.div>
            
            {/* Resource Cards Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {category.items.map((item, itemIndex) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: 0.1 * itemIndex,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100
                  }}
                >
                  <motion.div
                    className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 h-full overflow-hidden group cursor-pointer"
                    whileHover={{ 
                      scale: 1.03, 
                      y: -8,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {/* Gradient overlay on hover */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                    />
                    
                    {/* Floating decoration */}
                    <motion.div
                      className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300"
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Star className="w-6 h-6 text-gray-400" />
                    </motion.div>
                    
                    <div className="relative z-10">
                      <motion.h3 
                        className="text-xl font-medium text-gray-800 mb-4 group-hover:text-purple-700 transition-colors duration-300"
                        layoutId={`title-${categoryIndex}-${itemIndex}`}
                      >
                        {item.title}
                      </motion.h3>
                      
                      <p className="text-gray-600 font-light mb-6 leading-relaxed">
                        {item.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, tagIndex) => (
                          <motion.span
                            key={tag}
                            className="text-xs bg-white/80 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 group-hover:border-purple-200 group-hover:bg-purple-50 transition-all duration-300"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 + tagIndex * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                          >
                            {tag}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      ))}

      {/* Community Section - Enhanced with parallax */}
      <motion.section
        className="relative py-32 px-6"
        style={{ y: useTransform(scrollYProgress, [0.6, 0.9], [50, -50]) }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Background decorations */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-3xl transform rotate-1 opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-l from-purple-100 to-pink-100 rounded-3xl transform -rotate-1 opacity-30" />
            
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-12 md:p-16 border border-gray-100 text-center overflow-hidden">
              {/* Floating elements */}
              <motion.div
                className="absolute top-8 left-8 text-3xl text-purple-200/50"
                animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              >
                ✧
              </motion.div>
              
              <motion.div
                className="absolute bottom-8 right-8 text-4xl text-pink-200/50"
                animate={{ rotate: [360, 0], y: [0, -10, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              >
                ❀
              </motion.div>
              
              <motion.div
                className="inline-block mb-8"
              >
                <Users className="w-16 h-16 text-purple-500" />
              </motion.div>
              
              <h2 className="text-4xl font-light text-gray-800 mb-6">Join Our Wellness Community</h2>
              <p className="text-lg text-gray-600 font-light mb-8 max-w-2xl mx-auto leading-relaxed">
                Connect with others on their wellness journey. Share experiences, find support, 
                and celebrate progress together in a safe, moderated environment designed for growth.
              </p>
              
              <motion.button
                className="bg-black text-white px-8 py-4 rounded-full text-sm font-light hover:bg-gray-800 transition-all duration-300 inline-flex items-center gap-3"
                whileHover={{ scale: 1.05, gap: "16px" }}
                whileTap={{ scale: 0.95 }}
              >
                Coming Soon
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ✨
                </motion.span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section
        className="relative py-20 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.p 
            className="text-sm text-gray-500 font-light mb-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            New resources added weekly • Last updated: {new Date().toLocaleDateString()}
          </motion.p>
          
          <motion.div
            className="flex items-center justify-center gap-2 text-purple-400"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Stay tuned for more</span>
            <Sparkles className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.section>
      
      <Footer />
    </main>
  )
}