// components/WellnessExercise.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTechniqueById } from '@/lib/services/mentalHealthResources';

interface WellnessExerciseProps {
  type?: 'breathing' | 'grounding' | 'bodyScan' | 'visualization';
  techniqueId?: string;
  onComplete?: () => void;
  theme?: 'light' | 'dark';
}

export default function WellnessExercise({ 
  type = 'breathing', 
  techniqueId, 
  onComplete,
  theme = 'light'
}: WellnessExerciseProps) {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [technique, setTechnique] = useState<any>(null);
  
  // Colors based on theme
  const colors = {
    background: theme === 'light' ? 'bg-blue-50/30' : 'bg-blue-900/20',
    border: theme === 'light' ? 'border-blue-100' : 'border-blue-800',
    text: theme === 'light' ? 'text-gray-800' : 'text-gray-100',
    subtext: theme === 'light' ? 'text-gray-600' : 'text-gray-300',
    primary: theme === 'light' ? 'bg-blue-600 text-white' : 'bg-blue-400 text-gray-900',
    secondary: theme === 'light' ? 'bg-white text-blue-600' : 'bg-gray-800 text-blue-200'
  };
  
  // Load technique if techniqueId is provided
  useEffect(() => {
    if (techniqueId) {
      const foundTechnique = getTechniqueById(techniqueId);
      if (foundTechnique) {
        setTechnique(foundTechnique);
      }
    }
  }, [techniqueId]);
  
  // Handle exercise completion
  useEffect(() => {
    if (technique && completedSteps.length === technique.steps.length && onComplete) {
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  }, [completedSteps, technique, onComplete]);
  
  const handleStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
    
    if (technique && technique.steps.length > stepIndex + 1) {
      setCurrentStep(stepIndex + 1);
    }
  };
  
  const renderBreathingExercise = () => {
    return (
      <div className="text-center p-4">
        <h3 className={`font-medium mb-2 ${colors.text}`}>4-7-8 Breathing</h3>
        <p className={`text-sm ${colors.subtext} mb-4`}>
          A calming breathing technique to reduce anxiety
        </p>
        
        <motion.div 
          className={`breathing-circle ${active ? 'active' : ''}`}
          animate={active ? {
            scale: [1, 1.2, 1.2, 1, 1],
          } : {}}
          transition={{
            duration: 19,
            times: [0, 0.21, 0.58, 0.79, 1],
            repeat: active ? Infinity : 0
          }}
        >
          <span className="text-xs">
            {active ? "Breathe with me" : "Start"}
          </span>
        </motion.div>
        
        {active && (
          <div className={`text-sm my-2 ${colors.text}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key="inhale"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 1, 1, 0, 0, 0, 0]
                }}
                transition={{
                  duration: 19, 
                  times: [0, 0.1, 0.21, 0.23, 0.3, 0.6, 1],
                  repeat: Infinity
                }}
              >
                Inhale - 4 seconds
              </motion.div>
              <motion.div
                key="hold1"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 0, 0, 1, 1, 0, 0]
                }}
                transition={{
                  duration: 19, 
                  times: [0, 0.21, 0.23, 0.26, 0.58, 0.6, 1],
                  repeat: Infinity
                }}
              >
                Hold - 7 seconds
              </motion.div>
              <motion.div
                key="exhale"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 0, 0, 0, 0, 1, 0]
                }}
                transition={{
                  duration: 19, 
                  times: [0, 0.58, 0.6, 0.62, 0.64, 0.7, 1],
                  repeat: Infinity
                }}
              >
                Exhale - 8 seconds
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        
        <button 
          className={`mt-4 px-4 py-2 rounded-full text-sm transition-colors ${active ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}
          onClick={() => setActive(!active)}
        >
          {active ? "Stop Exercise" : "Begin Exercise"}
        </button>
      </div>
    );
  };
  
  const renderGroundingExercise = () => {
    const steps = [
      { text: "Find 5 things you can see", duration: 10 },
      { text: "Find 4 things you can touch", duration: 10 },
      { text: "Find 3 things you can hear", duration: 10 },
      { text: "Find 2 things you can smell", duration: 10 },
      { text: "Find 1 thing you can taste", duration: 10 }
    ];
    
    return (
      <div className="text-center p-4">
        <h3 className={`font-medium mb-2 ${colors.text}`}>5-4-3-2-1 Grounding</h3>
        <p className={`text-sm ${colors.subtext} mb-4`}>
          A technique to help manage anxiety by focusing on your senses
        </p>
        
        {active ? (
          <div className="my-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <h4 className={`text-lg mb-2 ${colors.text}`}>
                  {steps[currentStep].text}
                </h4>
                <div className="relative h-1.5 bg-gray-200 rounded-full w-full max-w-xs mx-auto mb-3">
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-green-400 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ 
                      duration: steps[currentStep].duration,
                      ease: 'linear'
                    }}
                    onAnimationComplete={() => handleStepComplete(currentStep)}
                  />
                </div>
                <p className={`text-sm ${colors.subtext}`}>
                  Take your time and really notice the details...
                </p>
              </motion.div>
            </AnimatePresence>
            
            <div className="flex justify-center space-x-1 mt-3">
              {steps.map((_, index) => (
                <div 
                  key={index}
                  className={`h-1.5 w-5 rounded-full ${
                    completedSteps.includes(index) 
                      ? 'bg-green-400' 
                      : currentStep === index 
                        ? 'bg-blue-400' 
                        : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p className={`mb-4 text-sm ${colors.subtext}`}>
              This exercise helps bring your attention to the present moment by using your five senses.
            </p>
            <button 
              className={`px-4 py-2 ${colors.primary} rounded-full text-sm transition-colors`}
              onClick={() => {
                setActive(true);
                setCurrentStep(0);
                setCompletedSteps([]);
              }}
            >
              Begin Exercise
            </button>
          </div>
        )}
        
        {active && (
          <button 
            className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm"
            onClick={() => setActive(false)}
          >
            Stop Exercise
          </button>
        )}
      </div>
    );
  };
  
  const renderTechnique = () => {
    if (!technique) return null;
    
    return (
      <div className="text-center p-4">
        <h3 className={`font-medium mb-2 ${colors.text}`}>{technique.name}</h3>
        <p className={`text-sm ${colors.subtext} mb-4`}>
          {technique.description}
        </p>
        
        {active ? (
          <div className="my-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <h4 className={`text-base mb-2 ${colors.text}`}>
                  Step {currentStep + 1}:
                </h4>
                <p className={`mb-3 ${colors.text} font-medium`}>
                  {technique.steps[currentStep]}
                </p>
                <div className="relative h-1.5 bg-gray-200 rounded-full w-full max-w-xs mx-auto mb-3">
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-green-400 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ 
                      duration: technique.category === 'breathing' ? 8 : 15,
                      ease: 'linear'
                    }}
                    onAnimationComplete={() => handleStepComplete(currentStep)}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
            
            <div className="flex justify-center space-x-1 mt-3">
              {technique.steps.map((_: any, index: number) => (
                <div 
                  key={index}
                  className={`h-1.5 w-5 rounded-full ${
                    completedSteps.includes(index) 
                      ? 'bg-green-400' 
                      : currentStep === index 
                        ? 'bg-blue-400' 
                        : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p className={`mb-4 text-sm ${colors.subtext}`}>
              This {technique.duration} exercise has {technique.steps.length} steps.
            </p>
            <button 
              className={`px-4 py-2 ${colors.primary} rounded-full text-sm transition-colors`}
              onClick={() => {
                setActive(true);
                setCurrentStep(0);
                setCompletedSteps([]);
              }}
            >
              Begin Exercise
            </button>
          </div>
        )}
        
        {active && (
          <button 
            className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm"
            onClick={() => setActive(false)}
          >
            Stop Exercise
          </button>
        )}
      </div>
    );
  };
  
  // Choose which exercise to render
  const renderExercise = () => {
    if (techniqueId && technique) {
      return renderTechnique();
    }
    
    switch(type) {
      case 'breathing':
        return renderBreathingExercise();
      case 'grounding':
        return renderGroundingExercise();
      default:
        return renderBreathingExercise();
    }
  };
  
  return (
    <div className={`my-4 border ${colors.border} rounded-lg ${colors.background}`}>
      {renderExercise()}
      
      {/* CSS for breathing animation */}
      <style jsx>{`
        .breathing-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(circle, #a5d8ff 0%, #4c6ef5 100%);
          margin: 20px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          position: relative;
          box-shadow: 0 0 20px rgba(76, 110, 245, 0.4);
        }
        
        .breathing-circle:before {
          content: '';
          position: absolute;
          top: -8px;
          left: -8px;
          right: -8px;
          bottom: -8px;
          border-radius: 50%;
          border: 2px solid rgba(165, 216, 255, 0.3);
          opacity: 0;
          animation: pulse 4s infinite;
        }
        
        .breathing-circle.active:before {
          opacity: 1;
        }
        
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}