import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Button, GestureResponderEvent, Image, AccessibilityInfo, ActivityIndicator } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { CameraType } from 'expo-camera/build/legacy/Camera.types';
import { PermissionStatus } from 'expo-modules-core';
import { Audio } from 'expo-av';
import { useOpenAI } from '../hooks/useOpenAI';

export default function Index() {
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>(CameraType.back);
  const [recording, setRecording] = useState<Audio.Recording>();
  const [cameraPermissions, requestCameraPermissions] = useCameraPermissions();
  const [audioPermissions, requestAudioPermissions] = Audio.usePermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [lastRecordingUri, setLastRecordingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const { getImageDescription, generateAndPlayAudio, replayAudio, stopAudio, isGeneratingText, isGeneratingAudio, isLoading, error } = useOpenAI();
  const [imageDescription, setImageDescription] = useState<string | null>(null);

  useEffect(() => {
    // Announce when the screen is focused
    AccessibilityInfo.announceForAccessibility("Camera screen is ready. Tap the bottom of the screen for controls.");
    
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  if (!cameraPermissions) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!cameraPermissions.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestCameraPermissions} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  }

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

      // Get description from OpenAI using the base64 property
      const description = await getImageDescription(photo.base64);
      console.log('Image description:', description);
      setImageDescription(description);
      AccessibilityInfo.announceForAccessibility(`Description generated. Generating audio...`);

      // Generate and play audio description
      await generateAndPlayAudio(description);

    } catch (error) {
      console.error('Failed to take picture or get description:', error);
    }
  }

  const closePhotoView = () => {
    setCapturedPhoto(null);
    setLastRecordingUri(null);
    setImageDescription(null);
    stopAudio(); // Stop the audio when closing the photo view
    AccessibilityInfo.announceForAccessibility("Returned to camera view.");
  }

  const pttOnPointerDown = async (e: GestureResponderEvent) => {
    try {
      if (!audioPermissions) {
        console.log('Audio permissions are not ready');
        return;
      }

      if (audioPermissions.status !== 'granted') {
        console.log('Requesting permission..');
        await requestAudioPermissions();
      }

      if (recording) {
        console.log('Recording is already in progress');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRecording);
      console.log('Recording started');
      if (newRecording) {
        AccessibilityInfo.announceForAccessibility("Recording started. Speak now.");
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }

  const pttOnPointerUp = async (e: GestureResponderEvent) => {
    console.log('Stopping recording..');
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Recording stopped and stored at', uri);
        setLastRecordingUri(uri);
        if (uri) {
          AccessibilityInfo.announceForAccessibility("Recording stopped and saved. You can now play it back.");
        }
      } catch (error) {
        console.error('Failed to stop recording:', error);
      }
      setRecording(undefined);
    } else {
      console.log('No active recording to stop');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
  }

  const playRecording = async () => {
    if (lastRecordingUri) {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: lastRecordingUri });
        setSound(newSound);
        await newSound.playAsync();
        newSound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            await newSound.unloadAsync();
            setSound(null);
          }
        });
        if (newSound) {
          AccessibilityInfo.announceForAccessibility("Playing recorded description.");
        }
      } catch (error) {
        console.error('Failed to play recording:', error);
      }
    }
  }



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
          <TouchableOpacity 
            style={[styles.largeButton, recording ? styles.recordingButton : null]} 
            onPressIn={pttOnPointerDown} 
            onPressOut={pttOnPointerUp}
            accessible={true}
            accessibilityLabel={recording ? "Recording in progress" : "Record description"}
            accessibilityHint="Press and hold to record a description of the photo"
          >
            <Text style={styles.largeText}>{recording ? 'Recording...' : 'Record Description'}</Text>
          </TouchableOpacity>
          {lastRecordingUri && (
            <TouchableOpacity 
              style={styles.largeButton} 
              onPress={playRecording}
              accessible={true}
              accessibilityLabel="Play recorded description"
              accessibilityHint="Plays back the recorded description of the photo"
            >
              <Text style={styles.largeText}>Play Recording</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.largeButton} 
              onPress={toggleCameraFacing}
              accessible={true}
              accessibilityLabel="Flip Camera"
              accessibilityHint="Switches between front and back camera"
            >
              <Text style={styles.largeText}>Flip Camera</Text>
            </TouchableOpacity>
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
});