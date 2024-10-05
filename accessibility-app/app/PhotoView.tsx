import React, { useEffect, useState, useCallback } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, ActivityIndicator, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useOpenAI } from '../hooks/useOpenAI';
import * as FileSystem from 'expo-file-system';

export default function PhotoView() {
  const { photoUri } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { getImageDescription, generateAndPlayAudio, replayAudio, stopAudio, isGeneratingText, isGeneratingAudio } = useOpenAI();
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (photoUri) {
      handleImageDescription();
    }
  }, [photoUri]);

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

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      stopAudio();
    });

    return unsubscribe;
  }, [navigation, stopAudio]);

  const handleImageDescription = async () => {
    try {
      setIsLoading(true);
      // Read the file and convert it to base64
      const base64 = await FileSystem.readAsStringAsync(photoUri as string, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const description = await getImageDescription(base64);
      setImageDescription(description);
      await generateAndPlayAudio(description);
    } catch (error) {
      console.error('Failed to get description:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const closePhotoView = () => {
    stopAudio();
    router.back();
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri as string }} style={styles.capturedPhoto} accessible={true} accessibilityLabel="Captured photo" />
      {(isLoading || isGeneratingText) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>
            {isLoading ? "Loading image..." : "Generating description..."}
          </Text>
        </View>
      )}
      {imageDescription && (
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>{imageDescription}</Text>
          {isGeneratingAudio && (
            <View style={styles.audioLoadingContainer}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.audioLoadingText}>Generating audio...</Text>
            </View>
          )}
        </View>
      )}
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
      </View>
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
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
    zIndex: 1000,
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
  // All necessary styles are already defined for this component
});