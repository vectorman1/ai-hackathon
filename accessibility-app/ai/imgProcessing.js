import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function processImageAndQuestion(imagePath, question, conversationHistory = []) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        const messages = [
            ...conversationHistory,
            {
                role: "user",
                content: [
                    { type: "text", text: question },
                    {
                        type: "image_url",
                        image_url: {
                            "url": `data:image/jpeg;base64,${base64Image}`,
                        },
                    },
                ],
            },
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
            max_tokens: 300,
            temperature: 0.2,
            frequency_penalty: 0.5,
            presence_penalty: 0.5,
        });

        const aiResponse = response.choices[0].message.content;

        // Add the AI's response to the conversation history
        conversationHistory.push({
            role: "assistant",
            content: aiResponse,
        });

        return { response: aiResponse, updatedHistory: conversationHistory };
    } catch (error) {
        console.error("Error processing image and question:", error);
        throw error;
    }
}
