'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { StepWizard } from './components/StepWizard';
import { StepIdentity } from './components/StepIdentity';
import { StepSocial } from './components/StepSocial';
import { StepHunger } from './components/StepHunger';
import { StepOath } from './components/StepOath';
import { StepSubmit } from './components/StepSubmit';
import { StepSuccess } from './components/StepSuccess';
import { Navbar } from '@/components/layout/Navbar';

const STORAGE_KEY = 'ebt_application_state';

export interface ApplicationData {
  // Identity
  username: string;
  profilePicURL: string;
  // Social connections
  twitter: string;
  discord: string;
  telegram: string;
  github: string;
  email: string;
  // Hunger declaration
  monthlyIncome: string;
  dependents: number;
  zipCode: string;
  hungerLevel: string;
  // Oath
  agreedToTerms: boolean;
  understandsTokenomics: boolean;
  // Result
  userId: string;
  applicationId?: number;
}

const initialData: ApplicationData = {
  username: '',
  profilePicURL: '',
  twitter: '',
  discord: '',
  telegram: '',
  github: '',
  email: '',
  monthlyIncome: '',
  dependents: 0,
  zipCode: '',
  hungerLevel: '',
  agreedToTerms: false,
  understandsTokenomics: false,
  userId: '',
};

const steps = [
  { id: 'identity', title: 'Prove You Exist', achievement: 'Digital Citizen' },
  { id: 'social', title: 'Link Your Socials', achievement: 'Social Butterfly' },
  { id: 'hunger', title: 'Declare Your Hunger', achievement: 'Breadline Regular' },
  { id: 'oath', title: 'Take the Oath', achievement: 'Welfare Warrior' },
  { id: 'submit', title: 'Submit Application', achievement: 'Applicant' },
  { id: 'success', title: 'Application Submitted', achievement: 'Queue Member' },
];

export default function ApplyContent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [applicationData, setApplicationData] = useState<ApplicationData>(initialData);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [isRestored, setIsRestored] = useState(false);

  const { authenticated, login } = usePrivy();
  const { address, isConnected } = useAccount();

  // Restore state from sessionStorage on mount (handles OAuth redirects)
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const { step, data, achievements } = JSON.parse(savedState);
        if (step !== undefined) setCurrentStep(step);
        if (data) setApplicationData(data);
        if (achievements) setUnlockedAchievements(achievements);
      }
    } catch {
      // Ignore parse errors
    }
    setIsRestored(true);
  }, []);

  // Persist state to sessionStorage whenever it changes
  const saveState = useCallback(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step: currentStep,
          data: applicationData,
          achievements: unlockedAchievements,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [currentStep, applicationData, unlockedAchievements]);

  useEffect(() => {
    if (isRestored) {
      saveState();
    }
  }, [isRestored, saveState]);

  const handleNext = (data: Partial<ApplicationData>) => {
    const newData = { ...applicationData, ...data };
    setApplicationData(newData);

    // Unlock achievement
    const achievement = steps[currentStep].achievement;
    const newAchievements = unlockedAchievements.includes(achievement)
      ? unlockedAchievements
      : [...unlockedAchievements, achievement];
    setUnlockedAchievements(newAchievements);

    const nextStep = Math.min(currentStep + 1, steps.length - 1);
    setCurrentStep(nextStep);

    // Immediately persist
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step: nextStep,
          data: newData,
          achievements: newAchievements,
        })
      );
    } catch {
      // Ignore
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };


  // Require wallet connection
  if (!authenticated || !isConnected) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <h1 className="text-3xl font-mono font-bold text-ebt-gold mb-4">
              Connect to Apply
            </h1>
            <p className="text-gray-400 mb-8 font-mono">
              You need to connect your wallet to apply for your EBT card.
              Don&apos;t worry, even trust fund kids are welcome.
            </p>
            <button
              onClick={login}
              className="px-8 py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors"
            >
              Connect Wallet
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Step Wizard Progress */}
        <StepWizard
          steps={steps}
          currentStep={currentStep}
          unlockedAchievements={unlockedAchievements}
        />

        {/* Step Content */}
        <div className="mt-12">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="identity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepIdentity
                  data={applicationData}
                  onNext={handleNext}
                  walletAddress={address}
                />
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="social"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepSocial
                  data={applicationData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="hunger"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepHunger
                  data={applicationData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="oath"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepOath
                  data={applicationData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="submit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepSubmit
                  data={applicationData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <StepSuccess
                  data={applicationData}
                  achievements={unlockedAchievements}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
