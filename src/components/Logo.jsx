import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const Logo = ({
                  width = 200,
                  height = 200,
                  animated = true,
                  speed = 3000,
                  showSparkles = true
              }) => {
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const sparkleOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (animated) {
            // Rotation animation for main gear
            const rotate = Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: speed,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            );

            // Pulsing scale animation
            const scale = Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.05,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );

            // Sparkle twinkle animation
            const sparkle = Animated.loop(
                Animated.sequence([
                    Animated.timing(sparkleOpacity, {
                        toValue: 0.3,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(sparkleOpacity, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );

            rotate.start();
            scale.start();
            sparkle.start();

            return () => {
                rotate.stop();
                scale.stop();
                sparkle.stop();
            };
        }
    }, [animated, speed]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const reverseRotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-360deg']
    });

    const smallReverseRotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-180deg']
    });

    return (
        <AnimatedSvg
            width={width}
            height={height}
            viewBox="0 0 200 200"
            fill="none"
            style={{
                transform: [{ scale: scaleAnim }]
            }}
        >
            {/* Outer Glow Circle */}
            <Circle cx="100" cy="100" r="80" fill="#2563EB" opacity="0.1"/>

            {/* Main Rotating Gear */}
            <AnimatedG
                rotation={rotate}
                origin="100, 100"
            >
                <Circle cx="100" cy="100" r="40" fill="#2563EB"/>
                <Circle cx="100" cy="100" r="20" fill="white"/>

                {/* Gear Teeth */}
                <Path d="M100 60L103 66H97L100 60Z" fill="#2563EB"/>
                <Path d="M140 100L134 103V97L140 100Z" fill="#2563EB"/>
                <Path d="M100 140L97 134H103L100 140Z" fill="#2563EB"/>
                <Path d="M60 100L66 97V103L60 100Z" fill="#2563EB"/>

                {/* Diagonal Teeth */}
                <G rotation="45" origin="100, 100">
                    <Path d="M116 68L118 73H112L116 68Z" fill="#2563EB"/>
                    <Path d="M132 116L127 118V112L132 116Z" fill="#2563EB"/>
                    <Path d="M84 132L82 127H88L84 132Z" fill="#2563EB"/>
                    <Path d="M68 84L73 82V88L68 84Z" fill="#2563EB"/>
                </G>
            </AnimatedG>

            {/* Smaller Gear (Top Right) - Rotates in opposite direction */}
            <AnimatedG
                rotation={reverseRotate}
                origin="140, 60"
            >
                <Circle cx="140" cy="60" r="20" fill="#3B82F6"/>
                <Circle cx="140" cy="60" r="8" fill="white"/>

                {/* Small Gear Teeth */}
                <Path d="M140 40L142 44H138L140 40Z" fill="#3B82F6"/>
                <Path d="M160 60L156 62V58L160 60Z" fill="#3B82F6"/>
                <Path d="M140 80L138 76H142L140 80Z" fill="#3B82F6"/>
                <Path d="M120 60L124 58V62L120 60Z" fill="#3B82F6"/>
            </AnimatedG>

            {/* Smaller Gear (Bottom Left) - Rotates in opposite direction slower */}
            <AnimatedG
                rotation={smallReverseRotate}
                origin="60, 140"
            >
                <Circle cx="60" cy="140" r="15" fill="#60A5FA"/>
                <Circle cx="60" cy="140" r="6" fill="white"/>

                {/* Small Gear Teeth */}
                <Path d="M60 125L62 128H58L60 125Z" fill="#60A5FA"/>
                <Path d="M75 140L72 142V138L75 140Z" fill="#60A5FA"/>
                <Path d="M60 155L58 152H62L60 155Z" fill="#60A5FA"/>
                <Path d="M45 140L48 138V142L45 140Z" fill="#60A5FA"/>
            </AnimatedG>

            {/* Animated Sparkle Effects */}
            {showSparkles && (
                <>
                    <AnimatedCircle
                        cx="100"
                        cy="30"
                        r="3"
                        fill="#FBBF24"
                        opacity={sparkleOpacity}
                    />
                    <AnimatedCircle
                        cx="170"
                        cy="100"
                        r="3"
                        fill="#FBBF24"
                        opacity={sparkleOpacity}
                    />
                    <AnimatedCircle
                        cx="100"
                        cy="170"
                        r="3"
                        fill="#FBBF24"
                        opacity={sparkleOpacity}
                    />
                    <AnimatedCircle
                        cx="30"
                        cy="100"
                        r="3"
                        fill="#FBBF24"
                        opacity={sparkleOpacity}
                    />
                </>
            )}
        </AnimatedSvg>
    );
};

// Helper component for animated circles
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default Logo;