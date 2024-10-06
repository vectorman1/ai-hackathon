import { WhisperContext } from '@/components/WhisperProvider';
import { useContext } from "react";
import { WhisperContext as WhisperRNContext } from 'whisper.rn';

export type WhisperContextType = {
  whisperContext: WhisperRNContext | null;
  isInitialized: boolean;
  error: string | null;
  downloadProgress: number;
  transcribedTexts: string[];
  setTranscribedTexts: (texts: string[]) => void;
};

export const useWhisperContext = () => {
  const context = useContext(WhisperContext);
  if (!context) {
    throw new Error('useWhisperContext must be used within a WhisperProvider');
  }
  return context;
};
