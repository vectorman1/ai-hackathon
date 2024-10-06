import 'expo-router/entry';

import { WhisperProvider } from '@/components/WhisperProvider';
import { useLlamaContext } from '@/hooks/useLlamaContext';
import { useCameraPermissions } from 'expo-camera';
import { Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useWhisperContext } from '../hooks/useWhisperContext';

const RootLayout = () => {
  return (
    <WhisperProvider>
      <WhisperInitializer />
    </WhisperProvider>
  );
};

const WhisperInitializer = () => {
  const { isInitialized, error, downloadProgress } = useWhisperContext();

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'black' }}>Initializing Whisper: {Math.round(downloadProgress * 100)}%</Text>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Layout />;
};

const LlamaInitializer = () => {
  const { isInitialized, error, downloadProgress } = useLlamaContext();

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'black' }}>Initializing Llama: {Math.round(downloadProgress * 100)}%</Text>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
    </>
  )
}

const Layout = () => {
  const [cameraPermissions, requestCameraPermissions] = useCameraPermissions();

  return (
    <Stack>
      <Stack.Screen name="index" options={{
        headerShown: cameraPermissions?.granted ? false : true,
        title: cameraPermissions?.granted ? 'Camera' : 'Permission'
      }} />
      <Stack.Screen name="photo" options={{ headerShown: true }} />
    </Stack>
  );
};


export default RootLayout;
