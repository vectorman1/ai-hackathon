import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Load the classifier prompt
const CLASSIFIER_PROMPT = fs.readFileSync(path.join(process.cwd(), 'prompts/classifier.md'), 'utf-8');

// Initialize the OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function classifyImage(imagePath) {
    try {
        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);

        // Convert the image to base64
        const base64Image = imageBuffer.toString('base64');

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: CLASSIFIER_PROMPT
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Classify this image as either 'object' or 'scene':" },
                        {
                            type: "image_url",
                            image_url: {
                                "url": `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 20,
            temperature: 0.3,
        });

        const classification = response.choices[0].message.content.toLowerCase().trim();

        if (classification === "object" || classification === "scene") {
            return classification;
        } else {
            throw new Error("Invalid classification result");
        }
    } catch (error) {
        console.error("Error classifying image:", error);
        throw error;
    }
}
