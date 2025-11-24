import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LoadingScreen = () => {
    return (
        <View style={styles.container}>
            <Ionicons name="cube-outline" size={64} color="#2563EB" />
            <Text style={styles.title}>GearZone</Text>
            <ActivityIndicator size="large" color="#2563EB" style={styles.spinner} />
            <Text style={styles.subtitle}>Loading...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2563EB',
        marginTop: 16,
        marginBottom: 32,
    },
    spinner: {
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
});

export default LoadingScreen;