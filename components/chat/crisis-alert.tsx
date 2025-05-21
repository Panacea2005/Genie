// components/CrisisAlert.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, MessageCircle, Users, Heart, X } from 'lucide-react';

interface CrisisAlertProps {
  onClose?: () => void;
  onRequestHelp?: (helpType: string) => void;
  userLocation?: string;
  className?: string;
}

export default function CrisisAlert({
  onClose,
  onRequestHelp,
  userLocation = 'United States', // Default location
  className = ''
}: CrisisAlertProps) {
  const [step, setStep] = useState<'initial' | 'resources' | 'safety'>('initial');
  const [acknowledged, setAcknowledged] = useState(false);
  
  // Crisis resources based on user location
  const getCrisisResources = (location: string) => {
    // Default US resources
    let resources = {
      hotline: '988 or 1-800-273-8255',
      textline: 'Text HOME to 741741',
      emergencyNumber: '911'
    };
    
    // Add location-specific resources
    switch(location.toLowerCase()) {
      case 'united kingdom':
      case 'uk':
        resources = {
          hotline: 'Samaritans: 116 123',
          textline: 'Text SHOUT to 85258',
          emergencyNumber: '999 or 112'
        };
        break;
      case 'canada':
        resources = {
          hotline: 'Crisis Services Canada: 1-833-456-4566',
          textline: 'Text HOME to 686868',
          emergencyNumber: '911'
        };
        break;
      case 'australia':
        resources = {
          hotline: 'Lifeline Australia: 13 11 14',
          textline: 'Text 0477 13 11 14',
          emergencyNumber: '000'
        };
        break;
      // Add more countries as needed
    }
    
    return resources;
  };
  
  const resources = getCrisisResources(userLocation);
  
  return (
    <motion.div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => acknowledged && onClose && onClose()}
      />
      
      <motion.div 
        className="bg-white rounded-xl shadow-xl overflow-hidden max-w-md w-full relative z-10"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {/* Header */}
        <div className="bg-red-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2" />
            <h2 className="text-lg font-semibold">Crisis Support</h2>
          </div>
          
          {acknowledged && onClose && (
            <button
              onClick={() => onClose()}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <AnimatePresence mode="wait">
          {step === 'initial' && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5"
            >
              <p className="text-gray-800 mb-4">
                I'm concerned about what you've shared. Your safety and wellbeing are important. If you're experiencing a crisis or having thoughts of suicide, please consider reaching out for immediate support.
              </p>
              
              <div className="space-y-3 mb-5">
                <button
                  onClick={() => setStep('resources')}
                  className="w-full bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-3 text-left text-red-800 flex items-center transition-colors"
                >
                  <Phone className="w-5 h-5 mr-3 text-red-600" />
                  <div>
                    <div className="font-medium">Crisis Resources</div>
                    <div className="text-sm text-red-700">Hotlines and text lines available 24/7</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setStep('safety')}
                  className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-3 text-left text-blue-800 flex items-center transition-colors"
                >
                  <Heart className="w-5 h-5 mr-3 text-blue-600" />
                  <div>
                    <div className="font-medium">Safety Planning</div>
                    <div className="text-sm text-blue-700">Strategies to help during a crisis</div>
                  </div>
                </button>
                
                <button
                  onClick={() => onRequestHelp && onRequestHelp('chat')}
                  className="w-full bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-3 text-left text-purple-800 flex items-center transition-colors"
                >
                  <MessageCircle className="w-5 h-5 mr-3 text-purple-600" />
                  <div>
                    <div className="font-medium">Continue Chatting</div>
                    <div className="text-sm text-purple-700">I'm here to listen and support you</div>
                  </div>
                </button>
              </div>
              
              <div className="text-xs text-gray-500">
                Please note: Genie is not a crisis service or a substitute for professional help. If you're in immediate danger, please call {resources.emergencyNumber}.
              </div>
            </motion.div>
          )}
          
          {step === 'resources' && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5"
            >
              <h3 className="font-semibold text-gray-800 mb-3">Crisis Resources</h3>
              
              <div className="space-y-3 mb-5">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="font-medium text-red-800">National Suicide Prevention Lifeline</div>
                  <div className="text-red-700 text-lg font-bold">{resources.hotline}</div>
                  <div className="text-sm text-red-600 mt-1">
                    Available 24/7. Confidential support for people in distress.
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="font-medium text-blue-800">Crisis Text Line</div>
                  <div className="text-blue-700 text-lg font-bold">{resources.textline}</div>
                  <div className="text-sm text-blue-600 mt-1">
                    Available 24/7. Text-based support from trained counselors.
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="font-medium text-purple-800">Emergency Services</div>
                  <div className="text-purple-700 text-lg font-bold">{resources.emergencyNumber}</div>
                  <div className="text-sm text-purple-600 mt-1">
                    If you're in immediate danger, call emergency services.
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="font-medium text-green-800">Support People</div>
                  <div className="flex items-center text-green-700 mt-1">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Reach out to a trusted friend or family member</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => setStep('initial')}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                
                <button
                  onClick={() => {
                    setAcknowledged(true);
                    onRequestHelp && onRequestHelp('resources');
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          )}
          
          {step === 'safety' && (
            <motion.div
              key="safety"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5"
            >
              <h3 className="font-semibold text-gray-800 mb-3">Safety Strategies</h3>
              
              <div className="space-y-3 mb-5">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="font-medium text-gray-800">Right Now:</div>
                  <ul className="mt-1 space-y-1 text-sm text-gray-700">
                    <li>• Take slow, deep breaths</li>
                    <li>• Move to a safe, quiet environment</li>
                    <li>• Use the 5-4-3-2-1 grounding exercise (5 things you see, 4 things you can touch, 3 things you hear, 2 things you smell, 1 thing you taste)</li>
                    <li>• Remind yourself that intense feelings will pass</li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="font-medium text-gray-800">Connect with Others:</div>
                  <ul className="mt-1 space-y-1 text-sm text-gray-700">
                    <li>• Call or text someone you trust</li>
                    <li>• Use a crisis hotline or text line</li>
                    <li>• Contact your therapist or counselor if you have one</li>
                    <li>• Consider attending a support group</li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="font-medium text-gray-800">Create Distance from Harm:</div>
                  <ul className="mt-1 space-y-1 text-sm text-gray-700">
                    <li>• Remove any means of self-harm from your environment</li>
                    <li>• Create physical distance from situations/people that may be unsafe</li>
                    <li>• Delay making any major decisions during a crisis</li>
                    <li>• Use distraction techniques (music, physical activity, creative outlet)</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => setStep('initial')}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                
                <button
                  onClick={() => {
                    setAcknowledged(true);
                    onRequestHelp && onRequestHelp('safetyPlan');
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Safety Plan
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}