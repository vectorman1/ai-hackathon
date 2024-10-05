import { processImageAndQuestion } from './imgProcessing.js';
import { generateSpeech } from './speechAssistant.js';
import { classifyImage } from './classifier.js';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

const OBJECT_PROMPT = fs.readFileSync(path.join(process.cwd(), 'promots/object-prompt.md'), 'utf-8');
const SCENE_PROMPT = fs.readFileSync(path.join(process.cwd(), 'prompts/scene-prompt.md'), 'utf-8');


export async function handleConversation(imagePath) {
    try {
        // Step 1: Classify the image
        const imageClassification = await classifyImage(imagePath);

        // Step 2: Prepare the initial prompt based on classification
        const initialPrompt = imageClassification === "object" ? OBJECT_PROMPT : SCENE_PROMPT;

        // Step 3: Start the conversation with the initial description
        let conversationHistory = [
            { role: "system", content: initialPrompt },
        ];

        const { response: initialDescription, updatedHistory } = await processImageAndQuestion(
            imagePath,
            "Describe this image based on the given prompt.",
            conversationHistory
        );

        conversationHistory = updatedHistory;

        return initialDescription
        // // Step 4: Handle follow-up questions
        // while (true) {
        //     const followUpQuestion = await getFollowUpQuestion();
        //     if (followUpQuestion.toLowerCase() === 'exit') break;

        //     const { response, updatedHistory: newHistory } = await processImageAndQuestion(
        //         imagePath,
        //         followUpQuestion,
        //         conversationHistory
        //     );

        //     conversationHistory = newHistory;

        //     // Optionally, generate speech for the response
        //     await generateSpeech(response);
        // }

    } catch (error) {
        console.error("Error in handleConversation:", error);
        throw error;
    } finally {
    }
}


// Implement this function to get user input for follow-up questions
function getFollowUpQuestion() {
    // TODO: Get the user's follow-up question
}


