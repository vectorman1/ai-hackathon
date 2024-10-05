import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI();

export async function generateSpeech(inputText) {
    const speechFile = path.resolve("./speech.wav");

    try {
        const wav = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: inputText,
            response_format: "wav"
        });

        const buffer = Buffer.from(await wav.arrayBuffer());
        await fs.promises.writeFile(speechFile, buffer);

        return speechFile;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw error;
    }
}