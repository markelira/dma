'use client';

import React from 'react';
import { Building2, User, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export type AccountType = 'individual' | 'company';

interface AccountTypeSelectorProps {
  onSelect: (type: AccountType) => void;
  onBack?: () => void;
}

export const AccountTypeSelector: React.FC<AccountTypeSelectorProps> = ({ onSelect, onBack }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Válassz fiók típust
        </h2>
        <p className="text-sm text-gray-600">
          Hogyan szeretnél csatlakozni az DMA platformhoz?
        </p>
      </div>

      {/* Account Type Cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Individual Account */}
        <motion.button
          onClick={() => onSelect('individual')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-900 transition-all text-left group"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-900 transition-colors">
              <User className="w-6 h-6 text-gray-700 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Egyéni fiók
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Személyes fejlődés és tanulás masterclass programokon keresztül
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-xs text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Azonnali hozzáférés minden masterclass programhoz</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Személyre szabott tanulási élmény</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Haladás követése és tanúsítványok</span>
                </div>
              </div>
            </div>
          </div>
        </motion.button>

        {/* Company Account */}
        <motion.button
          onClick={() => onSelect('company')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-900 transition-all text-left group"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-900 transition-colors">
              <Building2 className="w-6 h-6 text-gray-700 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Vállalati fiók
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Csapatod képzése és fejlesztése központi adminisztrációval
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-xs text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Alkalmazottak meghívása és kezelése</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Csapat haladásának nyomon követése</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Központi számlázás és riportok</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>14 napos ingyenes próbaidőszak</span>
                </div>
              </div>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Back to login */}
      {onBack && (
        <div className="text-center pt-4">
          <button
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Vissza a bejelentkezéshez
          </button>
        </div>
      )}
    </div>
  );
};
