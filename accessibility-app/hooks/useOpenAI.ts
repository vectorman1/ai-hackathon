import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Vibration } from 'react-native';
import OpenAI from 'openai-react-native';

const API_KEY = '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'; // Replace with your actual API key
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


const openai = new OpenAI({ apiKey: API_KEY, baseURL: 'https://api.openai.com/v1' }); 

export const useOpenAIRealtime = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isLoading) {
      // Vibrate every second while loading
      interval = setInterval(() => {
        Vibration.vibrate(100); // Vibrate for 100ms
      }, 1000);
    } else if (!isLoading && (isGeneratingText || isGeneratingAudio)) {
      // Two quick vibrations when ready
      Vibration.vibrate([0, 100, 100, 100]);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      Vibration.cancel(); // Stop any ongoing vibration
    };
  }, [isLoading, isGeneratingText, isGeneratingAudio]);

  const getImageDescription = async (imageB64: string): Promise<string> => {
    setIsGeneratingText(true);
    setIsLoading(true);
    setError(null);

    try {
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
                  "url": `data:image/jpeg;base64,${imageB64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300
      });

      if (response.choices && response.choices.length > 0 && response.choices[0].message) {
        return response.choices[0].message.content || 'No description available';
      } else {
        throw new Error('Unexpected response structure from OpenAI API');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error in getImageDescription:', errorMessage);
      return 'Error: Unable to generate image description';
    } finally {
      setIsGeneratingText(false);
      setIsLoading(false);
    }
  };

  const generateAndPlayAudio = async (text: string) => {
    setIsGeneratingAudio(true);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: "alloy",
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      const base64Audio = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
          }
        };
      });

      const audioUri = FileSystem.documentDirectory + 'speech.mp3';
      await FileSystem.writeAsStringAsync(audioUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setAudioUri(audioUri);
      await playAudio(audioUri);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error in generateAndPlayAudio:', errorMessage);
    } finally {
      setIsGeneratingAudio(false);
      setIsLoading(false);
    }
  };

  const playAudio = async (uri: string) => {
    try {
      console.log('Playing audio from URI:', uri);
      
      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Ensure the audio mode is set correctly
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1.0 }
      );

      setSound(newSound);

      // Play the sound
      await newSound.playAsync();

      // Set up a listener for when playback finishes
      newSound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          console.log('Audio playback finished');
          newSound.unloadAsync();
        }
      });

    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Failed to play audio');
    }
  };

  const replayAudio = async () => {
    if (audioUri) {
      await playAudio(audioUri);
    } else {
      console.log('No audio to replay');
      setError('No audio available to replay');
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  return {
    getImageDescription,
    generateAndPlayAudio,
    replayAudio,
    stopAudio, // Add this new function to the return object
    isGeneratingText,
    isGeneratingAudio,
    isLoading,
    error,
  };
};