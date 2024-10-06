import { LlamaContextType } from '@/hooks/useLLamaContext';
import * as FileSystem from 'expo-file-system';
import { initLlama, LlamaContext as LlamaContextRN } from 'llama.rn';
import { createContext, useEffect, useState } from 'react';

const MODEL_URL = "https://huggingface.co/guinmoon/MobileVLM-3B-GGUF/resolve/main/MobileVLM-3B-q3_K_S.gguf"
const MODEL_FILENAME = "MobileVLM-3B-q3_K_S.gguf"

export const LlamaContext = createContext<LlamaContextType | undefined>(undefined);

export function LlamaProvider({ children }: { children: React.ReactNode }) {
    const [llamaContext, setLlamaContext] = useState<LlamaContextRN | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        initializeLama()
    }, []);

    const initializeLama = async () => {
        try {
            const modelDir = `${FileSystem.documentDirectory}llama-models/`;
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

            const context = await initLlama({
                model: modelPath,
                use_mlock: true,
                n_ctx: 2048,
                n_gpu_layers: 1, // > 0: enable Metal on iOS
                // embedding: true, // use embedding
            })

            setLlamaContext(context);
            setIsInitialized(true);
        } catch (err) {
            setError('Failed to initialize Whisper');
            console.error('Error initializing Whisper:', err);
        }
    }

    return (
        <LlamaContext.Provider value={{ llamaContext, downloadProgress, error, isInitialized }}>
            {children}
        </LlamaContext.Provider>
    )
}
