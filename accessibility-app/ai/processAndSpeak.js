import { describeImage } from './imgProcessing.js';
import { generateSpeech } from './textToSpeech.js';
import path from 'path';

async function processImageAndSpeak(imagePath) {
    try {
        // Step 1: Describe the image
        const imageDescription = await describeImage(imagePath);

        // Step 2: Generate speech from the description
        const speechFilePath = await generateSpeech(imageDescription);

        console.log(`Image processed and speech generated. Audio file saved at: ${speechFilePath}`);
        return speechFilePath;
    } catch (error) {
        console.error("Error in processImageAndSpeak:", error);
        throw error;
    }
}
