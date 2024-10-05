import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Button, Image, AccessibilityInfo, ActivityIndicator, ScrollView } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { CameraType } from 'expo-camera/build/legacy/Camera.types';
import { useOpenAI } from '../hooks/useOpenAI';
import { useWhisper } from '../hooks/useWhisper';

export default function Index() {
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>(CameraType.back);
  const [cameraPermissions, requestCameraPermissions] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const { getImageDescription, generateAndPlayAudio, replayAudio, stopAudio, isGeneratingText, isGeneratingAudio, isLoading, error } = useOpenAI();
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  const { 
    isInitialized, 
    isTranscribing, 
    isRecording,
    transcription, 
    error: whisperError, 
    handleRecordingAndTranscription,
    downloadProgress, 
    debugInfo,
  } = useWhisper();
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility("Camera screen is ready. Tap the bottom of the screen for controls.");
  }, []);

  if (!cameraPermissions) {
    return <View />;
  }

  if (!cameraPermissions.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestCameraPermissions} title="grant permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  };

  const snapPhoto = async () => {
    if (!cameraRef.current) {
      console.log('Camera ref is not ready');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: true,
        exif: false,
      });

      if (!photo || !photo.base64) {
        console.error('Failed to take picture or base64 is missing');
        return;
      }

      console.log('Photo taken:', photo.uri);
      setCapturedPhoto(photo.uri);
      AccessibilityInfo.announceForAccessibility("Photo captured. Generating description...");

      const description = await getImageDescription(photo.base64);
      console.log('Image description:', description);
      setImageDescription(description);
      AccessibilityInfo.announceForAccessibility(`Description generated. Generating audio...`);

      await generateAndPlayAudio(description);

    } catch (error) {
      console.error('Failed to take picture or get description:', error);
    }
  };

  const closePhotoView = () => {
    setCapturedPhoto(null);
    setImageDescription(null);
    stopAudio();
    AccessibilityInfo.announceForAccessibility("Returned to camera view.");
  };

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedPhoto }} style={styles.capturedPhoto} accessible={true} accessibilityLabel="Captured photo" />
        {isGeneratingText && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Generating description...</Text>
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
            onPress={closePhotoView}
            accessible={true}
            accessibilityLabel="Close photo view"
            accessibilityHint="Returns to camera view"
          >
            <Text style={styles.largeText}>Close</Text>
          </TouchableOpacity>
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

  return (
    <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.largeButton} 
          onPress={snapPhoto}
          accessible={true}
          accessibilityLabel="Take Photo"
          accessibilityHint="Captures a photo"
        >
          <Text style={styles.largeText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.largeButton, isRecording ? styles.recordingButton : null]}
          onPress={handleRecordingAndTranscription}
          accessible={true}
          accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
          accessibilityHint={isRecording ? "Stops recording and starts transcription" : "Starts recording speech for transcription"}
        >
          <Text style={styles.largeText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
        </TouchableOpacity>
      </View>
      {transcription && (
        <View style={styles.transcriptionBox}>
          <Text style={styles.transcriptionText}>{transcription}</Text>
        </View>
      )}
      {isTranscribing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Transcribing...</Text>
        </View>
      )}
      {!isInitialized && downloadProgress < 1 && (
        <View style={styles.downloadProgressContainer}>
          <Text style={styles.downloadProgressText}>Downloading Whisper model: {Math.round(downloadProgress * 100)}%</Text>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.debugToggleButton}
        onPress={toggleDebug}
        accessible={true}
        accessibilityLabel={showDebug ? "Hide debug info" : "Show debug info"}
        accessibilityHint="Toggles the visibility of debug information"
      >
        <Text style={styles.debugToggleText}>{showDebug ? 'Hide Debug' : 'Show Debug'}</Text>
      </TouchableOpacity>

      {showDebug && (
        <ScrollView style={styles.debugBox}>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </ScrollView>
      )}
    </CameraView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'flex-end',
    paddingBottom: 20,
    gap: 20,
  },
  cameraButton: {
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 50,
  },
  flipButton: {
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 50,
  },
  pttButton: {
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
  message: {
    fontSize: 18,
  },
  capturedPhoto: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
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
  playButton: {
    padding: 15,
    backgroundColor: 'rgba(0, 255, 0, 0.6)',
    borderRadius: 50,
  },
  pttButtonRecording: {
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
  },
  largeButton: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    margin: 10,
    minWidth: 150,
    alignItems: 'center',
  },

  largeButton1: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    margin: 50,
    minWidth: 150,
    alignItems: 'center',
  },
  largeText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
  },
  descriptionBox: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
  },
  descriptionText: {
    color: 'white',
    fontSize: 16,
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
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 10,
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
  transcriptionBox: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
  },
  transcriptionText: {
    color: 'white',
    fontSize: 16,
  },
  downloadProgressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  downloadProgressText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
  },
  debugToggleButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1, // Ensure the button is above other elements
  },
  debugToggleText: {
    color: 'white',
    fontSize: 12,
  },
  debugBox: {
    position: 'absolute',
    top: 90, // Increased from 80 to 90 to move it below the button
    left: 20,
    right: 20,
    bottom: 20, // Added to give some space at the bottom
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
  },
  errorBox: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    color: 'white',
    fontSize: 14,
  },
});