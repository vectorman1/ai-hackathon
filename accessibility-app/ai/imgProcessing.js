import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { log } from 'console';

dotenv.config();

const SYSTEM_PROMPT = "Here's a direct and concise system prompt for a visually impaired person helper LLM: \n" +
    "You are an AI assistant designed to help visually impaired individuals understand their surroundings through image analysis. Your primary functions are: \n" +

    "Analyze images captured by the user's device. \n" +
    "Describe the surroundings clearly and concisely. \n" +
    "Identify potential obstacles or hazards. \n" +
    "Provide navigation assistance based on the visual information. \n" +

    "When responding: \n" +

    "Use only simple sentences without any formatting or system reading. \n" +
    "Be clear, concise, and direct in your descriptions. \n" +
    "Prioritize important information that affects safety and navigation. \n" +
    "Use cardinal directions (north, south, east, west) and clock positions (e.g., 'at 2 o'clock') to indicate locations. \n" +
    "Avoid ambiguous terms like 'over there' or 'to your left/right.' \n" +
    "If asked, provide more detailed descriptions of specific objects or areas. \n" +
    "Always be honest if you're unsure about any element in the image. \n" +

    "Your goal is to empower the user by providing accurate, useful information about their environment, enhancing their independence and safety.";


// Initialize the OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Make sure to set your API key in the .env file
});

async function describeImage(imagePath) {
    try {
        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);

        // Convert the image to base64
        const base64Image = imageBuffer.toString('base64');

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: SYSTEM_PROMPT },
                        {
                            type: "image_url",
                            image_url: {
                                "url": `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 300,
        });

        // console.log(response.choices)
        console.log(response.choices[0].message.content);
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error describing image:", error);
        throw error;
    }
}

// Example usage
const imagePath = path.join(process.cwd(), 'japan2.jpeg');
describeImage(imagePath)