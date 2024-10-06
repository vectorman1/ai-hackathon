import { useContext } from "react";

import { LlamaContext } from "@/components/LlamaProvider";
import { LlamaContext as LlamaContextRN } from 'llama.rn';

export type LlamaContextType = {
    llamaContext: LlamaContextRN | null;
    isInitialized: boolean;
    error: string | null;
    downloadProgress: number;
};

export const useLlamaContext = () => {
    const context = useContext(LlamaContext);
    if (!context) {
        throw new Error('useWhisperContext must be used within a WhisperProvider');
    }
    return context;
};
