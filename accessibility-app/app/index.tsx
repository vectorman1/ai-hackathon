import { CameraView, useCameraPermissions } from 'expo-camera';
import { CameraType } from 'expo-camera/build/legacy/Camera.types';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
    const cameraRef = useRef<CameraView>(null);
    const [facing, setFacing] = useState<CameraType>(CameraType.back);
    const [cameraPermissions, requestCameraPermissions] = useCameraPermissions();
    const router = useRouter();
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
                base64: false,
                exif: false,
            });

            if (!photo) {
                console.log('Failed to take photo');
                return;
            }

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

            router.push({ pathname: '/photo', params: { photoUri: resizedPhoto.uri } });

        } catch (error) {
            console.error('Failed to take or resize picture:', error);
        }
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
        alignItems: 'center',
        zIndex: 1000,
    },
    text: {
        fontSize: 18,
        color: 'white',
    },
    message: {
        fontSize: 18,
    },
    largeButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    largeText: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
    },
});