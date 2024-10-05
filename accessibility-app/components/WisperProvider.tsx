import { WhisperContextType } from "@/hooks/useWhisperContext";
import * as FileSystem from 'expo-file-system';
import React, { createContext, useEffect, useState } from 'react';
import { initWhisper, WhisperContext as WhisperRNContext } from "whisper.rn";

const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin';
const MODEL_FILENAME = 'ggml-base.en.bin';

export const WhisperContext = createContext<WhisperContextType | undefined>(undefined);

export function WhisperProvider({ children }: { children: React.ReactNode }) {
  const [whisperContext, setWhisperContext] = useState<WhisperRNContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [transcribedTexts, setTranscribedTexts] = useState<string[]>([]);

  useEffect(() => {
    initializeWhisper();
  }, []);

  const initializeWhisper = async () => {
    try {
      const modelDir = `${FileSystem.documentDirectory}whisper-models/`;
      const modelPath = `${modelDir}${MODEL_FILENAME}`;

      const modelInfo = await FileSystem.getInfoAsync(modelPath);
      if (!modelInfo.exists) {
        await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });

        const downloadResumable = FileSystem.createDownloadResumable(
          MODEL_URL,
          modelPath,
          {},
          (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            setDownloadProgress(progress);
          }
        );

        await downloadResumable.downloadAsync();
      }

      const context = await initWhisper({
        filePath: modelPath,
      });
      setWhisperContext(context);
      setIsInitialized(true);
    } catch (err) {
      setError('Failed to initialize Whisper');
      console.error('Error initializing Whisper:', err);
    }
  };

  return (
    <WhisperContext.Provider value={{ whisperContext, isInitialized, error, downloadProgress, transcribedTexts, setTranscribedTexts }}>
      {children}
    </WhisperContext.Provider>
  );
};