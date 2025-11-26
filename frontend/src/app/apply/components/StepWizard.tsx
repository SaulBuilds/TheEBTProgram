'use client';

import { motion } from 'framer-motion';

interface Step {
  id: string;
  title: string;
  achievement: string;
}

interface StepWizardProps {
  steps: Step[];
  currentStep: number;
  unlockedAchievements: string[];
}

export function StepWizard({ steps, currentStep, unlockedAchievements }: StepWizardProps) {
  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-800">
        <motion.div
          className="h-full bg-gradient-to-r from-ebt-gold to-welfare-red"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUnlocked = unlockedAchievements.includes(step.achievement);

          return (
            <div key={step.id} className="flex flex-col items-center">
              {/* Step circle */}
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  font-mono font-bold text-sm z-10
                  ${isCompleted ? 'bg-ebt-gold text-black' : ''}
                  ${isCurrent ? 'bg-welfare-red text-white ring-4 ring-welfare-red/30' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-gray-800 text-gray-500' : ''}
                `}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </motion.div>

              {/* Step title */}
              <div className="mt-3 text-center">
                <p
                  className={`text-xs font-mono ${
                    isCurrent ? 'text-ebt-gold' : isCompleted ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {step.title}
                </p>

                {/* Achievement badge */}
                {isUnlocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 px-2 py-0.5 bg-ebt-gold/20 rounded text-[10px] font-mono text-ebt-gold"
                  >
                    {step.achievement}
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
