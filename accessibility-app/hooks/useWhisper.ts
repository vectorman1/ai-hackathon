import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';
import { useWhisperContext } from './useWhisperContext';

export const useWhisper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const { transcribedTexts, setTranscribedTexts, whisperContext } = useWhisperContext();

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // @ts-ignore
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.LOW,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording');
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setRecording(null);
      setIsRecording(false);

      if (uri) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists && fileInfo.size > 0) {
          return await transcribeAudio(uri);
        } else {
          setError('Recording file is empty or does not exist');
        }
      } else {
        setError('No recording URI available');
      }
    } catch (err) {
      setError('Failed to stop recording');
      console.error('Error stopping recording:', err);
    }
  };

  const transcribeAudio = async (audioUri: string): Promise<string> => {
    if (!whisperContext) {
      setError('Whisper context is not available');
      return "";
    }

    setIsLoading(true);
    setError(null);

    try {
      const { promise } = await whisperContext.transcribe(audioUri, {
        language: 'en',
        translate: false,
        temperature: 0,
      });

      const result = await promise;

      console.log("got transcription result", result);

      if (!result || !result.result) {
        setError('Transcription returned no result');
      }

      setTranscribedTexts([...transcribedTexts, result.result]);
      return result.result;
    } catch (err) {
      setError('Failed to transcribe audio');
      console.error('Error transcribing audio:', err);
      return ""
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingAndTranscription = async () => {
    if (isRecording) {
      return await stopRecording();
    } else {
      return await startRecording();
    }
  };

  return {
    isLoading,
    isRecording,
    error,
    handleRecordingAndTranscription,
  };
};