import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const GearZoneLogo = ({ width = 100, height = 100, rotateAnim }) => {
    return (
        <AnimatedSvg
            width={width}
            height={height}
            viewBox="0 0 200 200"
            style={{
                transform: [{ rotate: rotateAnim }]
            }}
        >
            <Circle cx="100" cy="100" r="80" fill="#2563EB" opacity="0.1"/>
            <Circle cx="100" cy="100" r="40" fill="#2563EB"/>
            <Circle cx="100" cy="100" r="20" fill="white"/>
            <Path d="M100 60L103 66H97L100 60Z" fill="#2563EB"/>
            <Path d="M140 100L134 103V97L140 100Z" fill="#2563EB"/>
            <Path d="M100 140L97 134H103L100 140Z" fill="#2563EB"/>
            <Path d="M60 100L66 97V103L60 100Z" fill="#2563EB"/>
            <Path d="M116 68L118 73H112L116 68Z" fill="#2563EB" transform="rotate(45 100 100)"/>
            <Path d="M132 116L127 118V112L132 116Z" fill="#2563EB" transform="rotate(45 100 100)"/>
            <Path d="M84 132L82 127H88L84 132Z" fill="#2563EB" transform="rotate(45 100 100)"/>
            <Path d="M68 84L73 82V88L68 84Z" fill="#2563EB" transform="rotate(45 100 100)"/>

            {/* Small decorative gears */}
            <Circle cx="140" cy="60" r="12" fill="#3B82F6"/>
            <Circle cx="60" cy="140" r="10" fill="#60A5FA"/>
        </AnimatedSvg>
    );
};

const LoadingScreen = () => {
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const rotateAnimation = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        rotateAnimation.start();

        return () => rotateAnimation.stop();
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={styles.container}>
            <GearZoneLogo width={120} height={120} rotateAnim={spin} />
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
        padding: 20,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#2563EB',
        marginTop: 24,
        marginBottom: 32,
        letterSpacing: 1.5,
        textShadowColor: 'rgba(37, 99, 235, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    spinner: {
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 8,
        maxWidth: 250,
    },
});

export default LoadingScreen;