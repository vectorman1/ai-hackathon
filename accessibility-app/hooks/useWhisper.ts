import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { initWhisper, WhisperContext } from 'whisper.rn';

const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin';
const MODEL_FILENAME = 'ggml-base.en.bin';

export const useWhisper = () => {
  const [whisperContext, setWhisperContext] = useState<WhisperContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');

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
      const modelDir = `${FileSystem.documentDirectory}whisper-models/`;
      const modelPath = `${modelDir}${MODEL_FILENAME}`;

      const modelInfo = await FileSystem.getInfoAsync(modelPath);
      if (!modelInfo.exists) {
        await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });
        
        const downloadResumable = FileSystem.createDownloadResumable(
          MODEL_URL,
          modelPath,
          {},
          (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            setDownloadProgress(progress);
          }
        );

        const { uri } = await downloadResumable.downloadAsync();
        console.log('Finished downloading to ', uri);
      }

      const context = await initWhisper({
        filePath: modelPath,
      });
      setWhisperContext(context);
      setIsInitialized(true);
      setDebugInfo(prev => prev + `\nWhisper initialized successfully; model: ${MODEL_FILENAME}`);
    } catch (err) {
      setError('Failed to initialize Whisper');
      console.error('Error initializing Whisper:', err);
      setDebugInfo(prev => prev + '\nError initializing Whisper: ' + JSON.stringify(err));
    }
  };

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
      setDebugInfo(prev => prev + '\nRecording started with 16kHz WAV format');
    } catch (err) {
      setError('Failed to start recording');
      console.error('Error starting recording:', err);
      setDebugInfo(prev => prev + '\nError starting recording: ' + JSON.stringify(err));
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
      setDebugInfo(prev => prev + '\nRecording stopped. URI: ' + uri);

      if (uri) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        setDebugInfo(prev => prev + '\nFile info: ' + JSON.stringify(fileInfo));
        
        if (fileInfo.exists && fileInfo.size > 0) {
          await transcribeAudio(uri);
        } else {
          setError('Recording file is empty or does not exist');
          setDebugInfo(prev => prev + '\nRecording file is empty or does not exist');
        }
      } else {
        setError('No recording URI available');
        setDebugInfo(prev => prev + '\nNo recording URI available');
      }
    } catch (err) {
      setError('Failed to stop recording');
      console.error('Error stopping recording:', err);
      setDebugInfo(prev => prev + '\nError stopping recording: ' + JSON.stringify(err));
    }
  };

  const transcribeAudio = async (audioUri: string) => {
    if (!isInitialized || !whisperContext) {
      setError('Whisper is not initialized');
      setDebugInfo(prev => prev + '\nWhisper not initialized for transcription');
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      setDebugInfo(prev => prev + '\nStarting transcription of file: ' + audioUri);
      const { promise } = whisperContext.transcribe(audioUri, { 
        language: 'en',
        translate: false,
        temperature: 0,
      });
      
      const result = await promise;
      setDebugInfo(prev => prev + '\nTranscription completed. Result: ' + JSON.stringify(result));
      
      if (result && result.result) {
        setTranscription(result.result);
      } else {
        setError('Transcription returned no result');
        setDebugInfo(prev => prev + '\nTranscription returned no result');
      }
    } catch (err) {
      setError('Failed to transcribe audio');
      console.error('Error transcribing audio:', err);
      setDebugInfo(prev => prev + '\nError transcribing audio: ' + JSON.stringify(err));
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleRecordingAndTranscription = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return {
    isInitialized,
    isTranscribing,
    isRecording,
    transcription,
    error,
    handleRecordingAndTranscription,
    downloadProgress,
    debugInfo,
  };
};