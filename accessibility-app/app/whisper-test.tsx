import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useWhisper } from "../hooks/useWhisper";

export default function WhisperTestPage() {
  const {
    isInitialized,
    isTranscribing,
    isRecording,
    transcription,
    error,
    startRecording,
    stopRecording,
  } = useWhisper();

  const handlePressIn = () => {
    if (isInitialized && !isRecording) {
      startRecording();
    }
  };

  const handlePressOut = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Whisper.rn Test</Text>
      
      {!isInitialized && (
        <Text style={styles.initializingText}>Initializing Whisper...</Text>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordingButton]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isInitialized || isTranscribing}
      >
        <Text style={styles.recordButtonText}>
          {isRecording ? 'Release to Stop' : 'Hold to Speak'}
        </Text>
      </TouchableOpacity>

      {isTranscribing && (
        <View style={styles.transcribingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.transcribingText}>Transcribing...</Text>
        </View>
      )}

      {transcription && (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionTitle}>Transcription:</Text>
          <Text style={styles.transcriptionText}>{transcription}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  initializingText: {
    fontSize: 16,
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
  },
  recordButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 50,
    marginBottom: 20,
  },
  recordingButton: {
    backgroundColor: '#F44336',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  transcribingText: {
    fontSize: 16,
    marginLeft: 10,
  },
  transcriptionContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  transcriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  transcriptionText: {
    fontSize: 16,
  },
});