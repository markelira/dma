'use client';

import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface RegistrationProgressBarProps {
  currentStep: 1 | 2 | 3;
  totalSteps?: 1 | 3; // 1 for invited employees, 3 for normal registration
}

const stepLabels = {
  1: 'Adatok',
  2: 'Csapat',
  3: 'Fizetés'
};

export function RegistrationProgressBar({
  currentStep,
  totalSteps = 3
}: RegistrationProgressBarProps) {
  const steps = totalSteps === 1 ? [1] : [1, 2, 3];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <Fragment key={step}>
          {/* Connector line (not before first step) */}
          {index > 0 && (
            <motion.div
              className="h-0.5 w-8 sm:w-12"
              initial={{ backgroundColor: '#e5e7eb' }}
              animate={{
                backgroundColor: step <= currentStep ? '#3B82F6' : '#e5e7eb'
              }}
              transition={{ duration: 0.3, delay: step <= currentStep ? 0.2 : 0 }}
            />
          )}

          {/* Step circle */}
          <motion.div
            className={`
              relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold
              transition-all duration-300
              ${step < currentStep
                ? 'bg-brand-secondary text-white'
                : step === currentStep
                  ? 'bg-brand-secondary text-white ring-4 ring-brand-secondary/20'
                  : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
              }
            `}
            initial={{ scale: 1 }}
            animate={{
              scale: step === currentStep ? 1.05 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {step < currentStep ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="w-5 h-5" />
              </motion.div>
            ) : (
              step
            )}
          </motion.div>
        </Fragment>
      ))}
    </div>
  );
}

/**
 * Alternative version with step labels below the circles
 */
export function RegistrationProgressBarWithLabels({
  currentStep,
  totalSteps = 3
}: RegistrationProgressBarProps) {
  const steps = totalSteps === 1 ? [1] : [1, 2, 3];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, index) => (
          <Fragment key={step}>
            {/* Connector line */}
            {index > 0 && (
              <div
                className={`h-0.5 w-8 sm:w-16 transition-colors duration-300 ${
                  step <= currentStep ? 'bg-brand-secondary' : 'bg-gray-200'
                }`}
              />
            )}

            {/* Step with label */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-300
                  ${step < currentStep
                    ? 'bg-brand-secondary text-white'
                    : step === currentStep
                      ? 'bg-brand-secondary text-white ring-4 ring-brand-secondary/20'
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                  }
                `}
              >
                {step < currentStep ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  step
                )}
              </div>
              <span
                className={`
                  mt-1.5 text-xs font-medium transition-colors duration-300
                  ${step <= currentStep ? 'text-brand-secondary' : 'text-gray-400'}
                `}
              >
                {stepLabels[step as keyof typeof stepLabels]}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
