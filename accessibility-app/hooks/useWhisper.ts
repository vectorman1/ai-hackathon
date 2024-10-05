import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Whisper from 'whisper.rn';

export const useWhisper = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  useEffect(() => {
    initializeWhisper();
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  const initializeWhisper = async () => {
    try {
      // Check if initialize method exists
      if (typeof Whisper.initialize === 'function') {
        await Whisper.initialize();
        setIsInitialized(true);
      } else {
        throw new Error('Whisper.initialize is not a function');
      }
    } catch (err) {
      setError('Failed to initialize Whisper');
      console.error('Error initializing Whisper:', err);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
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
        await transcribeAudio(uri);
      }
    } catch (err) {
      setError('Failed to stop recording');
      console.error('Error stopping recording:', err);
    }
  };

  const transcribeAudio = async (audioUri: string) => {
    if (!isInitialized) {
      setError('Whisper is not initialized');
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      // Check if transcribe method exists
      if (typeof Whisper.transcribe === 'function') {
        const result = await Whisper.transcribe(audioUri);
        setTranscription(result.text);
      } else {
        throw new Error('Whisper.transcribe is not a function');
      }
    } catch (err) {
      setError('Failed to transcribe audio');
      console.error('Error transcribing audio:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  return {
    isInitialized,
    isTranscribing,
    isRecording,
    transcription,
    error,
    startRecording,
    stopRecording,
  };
};