import React, { useRef, useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Button, AccessibilityInfo, ActivityIndicator, ScrollView } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { CameraType } from 'expo-camera/build/legacy/Camera.types';
import { useRouter } from 'expo-router';
import { useWhisper } from '../hooks/useWhisper';
import * as ImageManipulator from 'expo-image-manipulator';

export default function Index() {
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>(CameraType.back);
  const [cameraPermissions, requestCameraPermissions] = useCameraPermissions();
  const router = useRouter();
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

  const snapPhoto = async () => {
    if (!cameraRef.current) {
      console.log('Camera ref is not ready');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Reduced quality
        base64: false, // We don't need base64 here anymore
        exif: false,
      });

      console.log('Photo taken:', photo.uri);
      AccessibilityInfo.announceForAccessibility("Photo captured. Resizing...");

      // Resize the image
      const resizedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }], // Resize to 800px width, height will adjust proportionally
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log('Photo resized:', resizedPhoto.uri);
      AccessibilityInfo.announceForAccessibility("Photo resized. Opening photo view...");
      
      router.push({ pathname: '/PhotoView', params: { photoUri: resizedPhoto.uri } });

    } catch (error) {
      console.error('Failed to take or resize picture:', error);
    }
  };

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

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
      {whisperError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{whisperError}</Text>
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