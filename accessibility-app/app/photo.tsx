import { useWhisper } from '@/hooks/useWhisper';
import { useWhisperContext } from '@/hooks/useWhisperContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOpenAI } from '../hooks/useOpenAI';

export default function Photo() {
  const { photoUri } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const {
    getImageDescription,
    generateAndPlayAudio,
    replayAudio,
    stopAudio,
    isLoadingText,
    isLoadingAudio,
    completions
  } = useOpenAI();
  const { transcribedTexts } = useWhisperContext();
  const { isRecording, handleRecordingAndTranscription, isLoading: isLoadingWhisper } = useWhisper();
  const [texts, setTexts] = useState<string[]>([]);

  useEffect(() => {
    if (photoUri) {
      handleImageDescription();
    }
  }, [photoUri]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      stopAudio();
    });

    return unsubscribe;
  }, [navigation, stopAudio]);

  useEffect(() => {
    // make a new list interleaving both completions and transcribed texts, starting with a completion
    const interleaved = completions.flatMap((completion, index) => {
      const transcription = transcribedTexts[index];
      return transcription ? [completion, transcription] : [completion];
    });
    setTexts(interleaved);
  }, [completions, transcribedTexts]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        stopAudio();
        router.back();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [stopAudio, router])
  );

  const handleImageDescription = async () => {
    try {
      // Read the file and convert it to base64
      const base64 = await FileSystem.readAsStringAsync(photoUri as string, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const description = await getImageDescription(base64, texts);
      await generateAndPlayAudio(description);
    } catch (error) {
      console.error('Failed to get description:', error);
    }
  };

  const handleTalkBack = async () => {
    stopAudio();
    const res = await handleRecordingAndTranscription();

    if (res) {
      const latestTranscription = res;
      console.log(`getting new description from: ${latestTranscription}; context history: ${texts}`);
      const base64 = await FileSystem.readAsStringAsync(photoUri as string, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const response = await getImageDescription(base64, texts, latestTranscription);
      await generateAndPlayAudio(response);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri as string }} style={styles.capturedPhoto} accessible={true} accessibilityLabel="Captured photo" />
      {isLoadingText && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>
            Generating description...
          </Text>
        </View>
      )}
      {texts.length > 0 ? (
        <View style={StyleSheet.absoluteFill}>
          <ScrollView style={styles.descriptionBox}>
            {
              texts.map((completion, idx) => (
                <View key={idx}>
                  <Text style={styles.descriptionText}>{completion}</Text>
                </View>
              ))
            }
            {isLoadingAudio && (
              <View style={styles.audioLoadingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.audioLoadingText}>Generating audio...</Text>
              </View>
            )}
          </ScrollView>
        </View>
      ) : null}

      {texts.length > 0 && (
        <View style={styles.photoViewButtonContainer}>
          <TouchableOpacity
            style={styles.largeButton}
            onPress={replayAudio}
            accessible={true}
            accessibilityLabel="Replay audio description"
            accessibilityHint="Plays the audio description of the photo again"
          >
            <Text style={styles.largeText}>Replay Audio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.largeButton, isRecording && styles.recordingButton]}
            onPress={handleTalkBack}
            accessible={true}
            accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
            accessibilityHint={isRecording ? "Stops recording your question" : "Starts recording your question"}
          >
            <Text style={styles.largeText}>{isRecording ? "Stop Talking" : "Talk Back"}</Text>
          </TouchableOpacity>
        </View>
      )}
      {isLoadingWhisper && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>
            {isLoadingWhisper ? "Processing speech..." :
              isLoadingText ? "Generating response..." :
                "Generating audio..."}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  capturedPhoto: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  descriptionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    margin: 10,
    borderRadius: 10,
    zIndex: 1000,
    maxHeight: '70%',
  },
  descriptionText: {
    color: 'white',
    fontSize: 16,
  },
  descriptionInput: {
    color: 'white',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',

  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    zIndex: 1000,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  photoViewButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeButton: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    margin: 10,
    minWidth: 150,
    alignItems: 'center',
  },
  largeText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  audioLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  audioLoadingText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 10,
  },
  volumeControlContainer: {
    marginTop: 10,
  },
  volumeText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  volumeSlider: {
    width: '100%',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
  },
  // All necessary styles are already defined for this component
});