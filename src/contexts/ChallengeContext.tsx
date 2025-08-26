'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import { useChallenge } from '@/components/hooks/useChallenges';

interface ChallengeContextType {
  challenges: any[] | undefined;
  selectedChallengeId: string;
  fetchChallenges: () => Promise<void>;
  loading: boolean;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

export const ChallengeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const challengeData = useChallenge();
  
  return (
    <ChallengeContext.Provider value={challengeData}>
      {children}
    </ChallengeContext.Provider>
  );
};

export const useChallengeContext = () => {
  const context = useContext(ChallengeContext);
  if (context === undefined) {
    throw new Error('useChallengeContext must be used within a ChallengeProvider');
  }
  return context;
};