"use client"

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion"
import { useState, useRef } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import GradientSphere from "@/components/gradient-sphere"
import { MessageCircle, Mail, Book, ChevronDown, Search, Send, Star, Sparkles, Zap } from "lucide-react"

const faqs = [
  {
    category: "Getting Started",
    color: "from-blue-400 to-cyan-400",
    questions: [
      {
        q: "What is Genie?",
        a: "Genie is an AI companion designed to provide compassionate mental wellness support. We offer a safe space for you to express your feelings, celebrate achievements, and navigate life's challenges with understanding and empathy."
      },
      {
        q: "How do I start using Genie?",
        a: "Simply sign up for an account and start a conversation. Genie will guide you through the process and adapt to your communication style over time, learning your preferences for more personalized support."
      },
      {
        q: "Is Genie free to use?",
        a: "We offer a free tier with basic features that includes daily conversations and essential wellness tools. Premium plans are available for enhanced support, unlimited conversations, and additional features."
      }
    ]
  },
  {
    category: "Privacy & Security",
    color: "from-purple-400 to-indigo-400",
    questions: [
      {
        q: "Is my data private?",
        a: "Absolutely. We use end-to-end encryption for all conversations and never share your personal information with third parties. Your conversations are completely private and secure."
      },
      {
        q: "Can I delete my data?",
        a: "Yes, you have full control over your data. You can delete individual conversations, clear your history, or delete your entire account at any time through your account settings."
      },
      {
        q: "Who can see my conversations?",
        a: "Only you can see your conversations. Our AI processes them securely without human review, and we never store readable copies of your personal conversations."
      }
    ]
  },
  {
    category: "Using Genie",
    color: "from-pink-400 to-rose-400",
    questions: [
      {
        q: "Can Genie replace therapy?",
        a: "Genie is a supportive companion designed to complement, not replace, professional mental health care. We encourage seeking professional help when needed and can help you find resources."
      },
      {
        q: "What can I talk about with Genie?",
        a: "Anything on your mind - from daily stresses to celebrations, personal growth to emotional challenges. Genie is here to listen, support, and provide thoughtful responses to whatever you're experiencing."
      },
      {
        q: "How does Genie understand my emotions?",
        a: "Genie uses advanced natural language processing and emotional intelligence algorithms to recognize emotional patterns, context, and nuance in your messages, responding with appropriate empathy and support."
      }
    ]
  }
]

export default function SupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [contactForm, setContactForm] = useState({ email: "", message: "" })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Parallax transforms
  const sphereY = useTransform(scrollYProgress, [0, 1], [0, -200])
  const sphereScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.8])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -100])

  const toggleFaq = (question: string) => {
    setExpandedFaq(expandedFaq === question ? null : question)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
    setTimeout(() => {
      setIsSubmitted(false)
      setContactForm({ email: "", message: "" })
    }, 2000)
  }

  return (
    <main className="min-h-screen flex flex-col bg-white overflow-x-hidden" ref={containerRef}>
      {/* Dynamic gradient background */}
      <motion.div 
        className="fixed inset-0 -z-10"
        style={{
          background: useTransform(
            scrollYProgress,
            [0, 0.3, 0.6, 1],
            [
              "linear-gradient(to bottom right, #ffffff, #fafafa, #f5f5f5)",
              "linear-gradient(to bottom right, #f0f4ff, #e6f3ff, #fef3ff)",
              "linear-gradient(to bottom right, #fef3ff, #f0f9ff, #e6f3ff)",
              "linear-gradient(to bottom right, #ffffff, #fafafa, #f5f5f5)"
            ]
          )
        }}
      />
      
      <Navbar currentPage="support" />
      
      {/* Hero Section with Gradient Sphere */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
        {/* Gradient Sphere as background element */}
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] z-0"
          style={{ y: sphereY, scale: sphereScale }}
        >
          <div style={{ transform: 'scale(1.6)' }}>
            <GradientSphere />
          </div>
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
                y: [0, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <MessageCircle className="w-10 h-10 text-purple-500" />
            </motion.div>
            
            <motion.h1 
              className="text-6xl md:text-7xl font-light text-gray-800 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              How Can We <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Help?</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 font-light leading-relaxed max-w-3xl mx-auto mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Find answers to common questions or reach out to our support team for personalized assistance
            </motion.p>

            {/* Enhanced Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-lg mx-auto relative"
            >
              <motion.input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pl-14 rounded-full border border-gray-200 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100 transition-all text-gray-800 bg-white/90 backdrop-blur-sm shadow-sm"
                whileFocus={{ scale: 1.02 }}
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              
              {/* Search suggestions */}
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-2"
                >
                  <p className="text-sm text-gray-500 px-3 py-2">Searching for "{searchQuery}"...</p>
                </motion.div>
              )}
            </motion.div>
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

      {/* Quick Links Section - Enhanced */}
      <motion.section
        className="relative py-20 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-3xl font-light text-gray-800 text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Quick Access
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                href: "#faq",
                icon: Book,
                title: "Browse FAQs",
                description: "Find quick answers to common questions",
                color: "from-blue-400 to-cyan-400"
              },
              {
                href: "#contact",
                icon: Mail,
                title: "Email Support",
                description: "Get personalized help via email",
                color: "from-purple-400 to-indigo-400"
              },
              {
                href: "#",
                icon: MessageCircle,
                title: "Live Chat",
                description: "Real-time support coming soon",
                color: "from-pink-400 to-rose-400",
                comingSoon: true
              }
            ].map((item, index) => (
              <motion.a
                key={item.title}
                href={item.href}
                className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 text-center group cursor-pointer overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                }}
              >
                {/* Gradient overlay */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                />
                
                {/* Coming soon badge */}
                {item.comingSoon && (
                  <motion.div
                    className="absolute top-4 right-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs px-2 py-1 rounded-full"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Soon
                  </motion.div>
                )}
                
                {/* Floating decoration */}
                <motion.div
                  className="absolute top-4 left-4 opacity-20"
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                >
                  <Star className="w-6 h-6 text-gray-400" />
                </motion.div>
                
                <div className="relative z-10">
                  <motion.div
                    className={`inline-block p-4 rounded-2xl bg-gradient-to-br ${item.color} mb-4 shadow-lg`}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <item.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  <h3 className="text-xl font-medium text-gray-800 mb-3 group-hover:text-purple-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 font-light leading-relaxed">{item.description}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FAQ Section - Enhanced with categories */}
      <motion.section
        id="faq"
        className="relative py-20 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-light text-gray-800 mb-4">Frequently Asked Questions</h2>
            <motion.div
              className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            />
          </motion.div>
          
          {faqs.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="mb-12"
            >
              {/* Category Header */}
              <motion.div
                className="flex items-center gap-3 mb-8"
                whileHover={{ scale: 1.02 }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-medium text-lg">
                    {category.category.charAt(0)}
                  </span>
                </div>
                <h3 className="text-2xl font-light text-gray-800">{category.category}</h3>
              </motion.div>
              
              <div className="space-y-4">
                {category.questions.map((item, index) => (
                  <motion.div
                    key={item.q}
                    className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100 overflow-hidden"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
                  >
                    <motion.button
                      onClick={() => toggleFaq(item.q)}
                      className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-white/80 transition-colors group"
                      whileHover={{ x: 4 }}
                    >
                      <span className="font-medium text-gray-800 pr-4 group-hover:text-purple-700 transition-colors">
                        {item.q}
                      </span>
                      <motion.div
                        animate={{ rotate: expandedFaq === item.q ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </motion.button>
                    
                    <AnimatePresence>
                      {expandedFaq === item.q && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <motion.div
                            className="px-8 pb-6 text-gray-600 font-light leading-relaxed border-t border-gray-100/50"
                            initial={{ y: -10 }}
                            animate={{ y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            {item.a}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Contact Form Section - Enhanced */}
      <motion.section
        id="contact"
        className="relative py-32 px-6"
        style={{ y: useTransform(scrollYProgress, [0.7, 1], [50, 0]) }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Background decorations */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl transform rotate-1 opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-l from-pink-100 to-indigo-100 rounded-3xl transform -rotate-1 opacity-30" />
            
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-12 md:p-16 border border-gray-100 overflow-hidden">            
              
              <div className="text-center mb-12">
                <motion.div
                  className="inline-block mb-6"
                >
                  <Sparkles className="w-16 h-16 text-purple-500" />
                </motion.div>
                
                <h2 className="text-4xl font-light text-gray-800 mb-4">Still Need Help?</h2>
                <p className="text-lg text-gray-600 font-light">
                  Our support team is here to assist you with any questions or concerns
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <label className="block text-sm text-gray-700 mb-3 font-light">Your Email</label>
                  <motion.input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100 transition-all bg-white/80 backdrop-blur-sm"
                    placeholder="you@example.com"
                    whileFocus={{ scale: 1.01 }}
                    required
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm text-gray-700 mb-3 font-light">How can we help?</label>
                  <motion.textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100 transition-all bg-white/80 backdrop-blur-sm h-32 resize-none"
                    placeholder="Tell us more about your question or issue..."
                    whileFocus={{ scale: 1.01 }}
                    required
                  />
                </motion.div>
                
                <motion.button
                  type="submit"
                  className="w-full bg-black text-white py-4 rounded-full text-sm font-light hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.02, gap: "16px" }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitted}
                >
                  <AnimatePresence mode="wait">
                    {isSubmitted ? (
                      <motion.div
                        key="success"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Message Sent!
                      </motion.div>
                    ) : (
                      <motion.div
                        key="send"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center gap-3"
                      >
                        Send Message
                        <Send className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </form>
              
              <motion.p 
                className="text-center text-sm text-gray-600 font-light mt-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                We typically respond within 24 hours
              </motion.p>
            </div>
          </motion.div>
        </div>
      </motion.section>
      
      <Footer />
    </main>
  )
}