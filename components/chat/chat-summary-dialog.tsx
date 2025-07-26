import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, Heart, MessageSquare, TrendingUp, Clock, Sparkles, User } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

interface ChatSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  summary: string | null;
  isLoading: boolean;
}

export default function ChatSummaryDialog({
  isOpen,
  onClose,
  messages,
  summary,
  isLoading,
}: ChatSummaryDialogProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "insights">("summary");

  const userMessages = messages.filter(m => m.role === "user");
  const assistantMessages = messages.filter(m => m.role === "assistant");
  const totalMessages = messages.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Minimal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Self-Reflection</h2>
                  <p className="text-sm text-gray-500">Understanding yourself through conversation</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-50">
                              <button
                  onClick={() => setActiveTab("summary")}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === "summary"
                      ? "text-gray-900 border-b-2 border-indigo-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Insights
                </button>
              <button
                onClick={() => setActiveTab("insights")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === "insights"
                    ? "text-gray-900 border-b-2 border-indigo-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Stats
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === "summary" ? (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    {isLoading ? (
                                              <div className="flex items-center justify-center py-12">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                            <span className="text-sm text-gray-600">Understanding your patterns...</span>
                          </div>
                        </div>
                    ) : summary ? (
                      <div className="space-y-4">
                        <div className="bg-gray-50/50 rounded-xl p-4">
                          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {summary}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <BarChart3 className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No insights available</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="insights"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <div className="space-y-4">
                      {/* Simple Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-900">Total</span>
                          </div>
                          <div className="text-xl font-semibold text-blue-900">{totalMessages}</div>
                        </div>
                        <div className="bg-green-50/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-green-900">You</span>
                          </div>
                          <div className="text-xl font-semibold text-green-900">{userMessages.length}</div>
                        </div>
                      </div>

                      {/* Engagement */}
                      <div className="bg-gray-50/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Engagement</span>
                          <span className="text-sm text-gray-600">
                            {totalMessages > 0 ? Math.round((userMessages.length / totalMessages) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${totalMessages > 0 ? (userMessages.length / totalMessages) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Quick Info */}
                      <div className="bg-purple-50/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-900">Status</span>
                        </div>
                        <div className="text-sm text-purple-800">
                          {userMessages.length > 2 ? "Active conversation" : "Getting started"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 