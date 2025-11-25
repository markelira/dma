'use client';

import React from 'react';
import { Building2, User, CheckCircle2 } from 'lucide-react';

export type AccountType = 'individual' | 'company';

interface AccountTypeSelectorProps {
  onSelect: (type: AccountType) => void;
  onBack?: () => void;
}

export const AccountTypeSelector: React.FC<AccountTypeSelectorProps> = ({ onSelect, onBack }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold">Válassz fiók típust</h1>
        <p className="text-sm text-gray-600 mt-3">
          Hogyan szeretnél csatlakozni az DMA platformhoz?
        </p>
      </div>

      {/* Account Type Cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Individual Account */}
        <button
          onClick={() => onSelect('individual')}
          className="relative p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-all text-left group"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-900 transition-colors">
              <User className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Egyéni fiók
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Személyes fejlődés és tanulás masterclass programokon keresztül
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Azonnali hozzáférés minden masterclass programhoz</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Személyre szabott tanulási élmény</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Haladás követése és tanúsítványok</span>
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Company Account */}
        <button
          onClick={() => onSelect('company')}
          className="relative p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-all text-left group"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-900 transition-colors">
              <Building2 className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Vállalati fiók
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Csapatod képzése és fejlesztése központi adminisztrációval
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Alkalmazottak meghívása és kezelése</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Csapat haladásának nyomon követése</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Központi számlázás és riportok</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
                  <span>14 napos ingyenes próbaidőszak</span>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Back to login */}
      {onBack && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Már van fiókod?{' '}
          <button
            onClick={onBack}
            className="font-medium text-gray-900 underline hover:no-underline"
          >
            Bejelentkezés
          </button>
        </div>
      )}
    </div>
  );
};
