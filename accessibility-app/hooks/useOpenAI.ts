import { CLASSIFICATION_PROMPT } from '@/constants/ClassificationPrompt';
import { OBJECT_PROMPT } from '@/constants/ObjectPrompt';
import { SCENE_PROMPT } from '@/constants/ScenePrompt';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import OpenAI from 'openai-react-native';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { useEffect, useState } from 'react';
import { Vibration } from 'react-native';

const API_KEY = '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'; // Replace with your actual API key

const openai = new OpenAI({ apiKey: API_KEY, baseURL: 'https://api.openai.com/v1' });

export const useOpenAI = () => {
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [completions, setCompletions] = useState<string[]>([]);
  const [imgClass, setImgClass] = useState<"object" | "scene">();


  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isLoadingText || isLoadingAudio) {
      // Vibrate every second while loading
      interval = setInterval(() => {
        Vibration.vibrate(100); // Vibrate for 100ms
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      Vibration.cancel(); // Stop any ongoing vibration
    };
  }, [isLoadingText, isLoadingAudio]);

  const classifyImage = async (imageB64: string): Promise<'object' | 'scene'> => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: CLASSIFICATION_PROMPT,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Classify this image as either 'object' or 'scene':" },
            {
              type: "image_url",
              image_url: {
                "url": `data:image/jpeg;base64,${imageB64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 20,
      temperature: 0.3,
    });

    if (!response.choices || !response.choices[0].message.content) {
      throw new Error("Invalid classification result");
    }

    const classification = response.choices[0].message.content.toLowerCase().trim();

    if (classification === "object" || classification === "scene") {
      return classification;
    } else {
      throw new Error("Invalid classification result");
    }
  }

  const buildMessages = (imageB64: string, prompt: string, texts: string[], question: string): ChatCompletionMessageParam[] => {
    const baseMessages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: [
          { type: "text", text: prompt },
        ]
      },
      {
        role: "user",
        content: [
          { type: "text", text: question },
          {
            type: "image_url",
            image_url: {
              "url": `data:image/jpeg;base64,${imageB64}`,
            },
          },
        ],
      },
    ]

    if (texts.length > 0) {
      let role: "assistant" | "user" = "assistant";
      texts.forEach(t => {
        baseMessages.push({
          role: role,
          content: [
            {
              type: "text", text: t
            }
          ]
        });
        if (role === "assistant") {
          role = "user";
        } else {
          role = "assistant"
        }
      });
    }

    return baseMessages;
  }

  const getImageDescription = async (imageB64: string, texts: string[], question?: string): Promise<string> => {
    setIsLoadingText(true);
    setError(null);

    try {
      let tempImgClass;
      if (!imgClass) {
        console.log("classifying image");
        const newImgClass = await classifyImage(imageB64);
        console.log(`classified image as ${newImgClass}`)
        setImgClass(newImgClass)
        tempImgClass = newImgClass;
      } else {
        console.log(`using previous classification of ${imgClass}`);
        tempImgClass = imgClass;
      }

      const prompt = tempImgClass === 'object' ? OBJECT_PROMPT : SCENE_PROMPT;

      const messages = buildMessages(imageB64, prompt, texts, question ?? 'Describe this image based on the given prompt.');

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 300
      });

      if (response.choices && response.choices.length > 0 && response.choices[0].message) {
        const res = response.choices[0].message.content || 'No description available';
        setCompletions((prev) => ([...prev, res]))
        return res;
      } else {
        throw new Error('Unexpected response structure from OpenAI API');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error in getImageDescription:', errorMessage);
      return 'Error: Unable to generate image description';
    } finally {
      setIsLoadingText(false);
    }
  };

  const generateAndPlayAudio = async (text: string) => {
    setIsLoadingAudio(true);
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
      setIsLoadingAudio(false);
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
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (e) {
        console.log(e);
      }
      setSound(null);
    }
  };

  return {
    getImageDescription,
    generateAndPlayAudio,
    replayAudio,
    stopAudio,
    isLoadingText,
    isLoadingAudio,
    error,
    completions,
  };
};