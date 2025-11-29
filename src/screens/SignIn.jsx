import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const SignIn = () => {
    const navigation = useNavigation();
    const { signIn, authError, clearError, user } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;
    const errorAnim = useRef(new Animated.Value(0)).current;

    const demoAccount = {
        email: 'demo@example.com',
        password: 'demo123'
    };

    const fadeIn = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    };

    const spin = () => {
        spinAnim.setValue(0);
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    };

    const showError = (show) => {
        Animated.timing(errorAnim, {
            toValue: show ? 1 : 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: false,
        }).start();
    };

    const rotate = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const errorHeight = errorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 60],
    });
    const errorOpacity = errorAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.5, 1],
    });

    useEffect(() => {
        fadeIn();
        if (loading) {
            spin();
        }
    }, []);

    useEffect(() => {
        showError(!!authError);
    }, [authError]);

    useEffect(() => {
        if (loading) {
            spin();
        } else {
            spinAnim.stopAnimation();
        }
    }, [loading]);

    useEffect(() => {
        if (user) {
            console.log('User already logged in, redirecting...');
            navigation.replace('MainApp');
        }
    }, [user, navigation]);

    useEffect(() => {
        clearError();
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        if (authError) {
            clearError();
        }
    };

    const handleSignIn = async () => {
        if (!formData.email || !formData.password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (!formData.email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        clearError();

        const result = await signIn(formData.email, formData.password);

        setLoading(false);

        if (result.success) {
            console.log('Sign in successful, user should be redirected automatically');
        } else {
            if (result.error) {
            }
        }
    };

    const handleDemoSignIn = async () => {
        setLoading(true);
        clearError();

        setFormData({
            email: demoAccount.email,
            password: demoAccount.password
        });

        setTimeout(async () => {
            const result = await signIn(demoAccount.email, demoAccount.password);

            setLoading(false);

            if (result.success) {
                console.log('Demo sign in successful');
            } else {
                Alert.alert('Demo Sign In Failed', 'Demo account is not available. Please try with your own credentials.');
            }
        }, 500);
    };

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('MainApp');
        }
    };

    const AnimatedButton = ({ onPress, children, style, disabled = false }) => {
        const scaleAnim = useRef(new Animated.Value(1)).current;

        const handlePressIn = () => {
            Animated.spring(scaleAnim, {
                toValue: 0.96,
                useNativeDriver: true,
            }).start();
        };

        const handlePressOut = () => {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                tension: 40,
                useNativeDriver: true,
            }).start(() => {
                if (onPress && !disabled) {
                    onPress();
                }
            });
        };

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={{ opacity: disabled ? 0.6 : 1 }}
                disabled={disabled}
            >
                <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
                    {children}
                </Animated.View>
            </TouchableOpacity>
        );
    };


    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBack}
                            >
                                <Ionicons name="arrow-back" size={24} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Sign In</Text>
                            <View style={styles.placeholder} />
                        </View>

                        <View style={styles.content}>
                            <View style={styles.welcomeSection}>
                                <Text style={styles.welcomeTitle}>Welcome Back!</Text>
                                <Text style={styles.welcomeSubtitle}>
                                    Sign in to your account to continue
                                </Text>
                            </View>

                            <View style={styles.demoSection}>
                                <View style={styles.demoCard}>
                                    <View style={styles.demoHeader}>
                                        <Ionicons name="rocket-outline" size={20} color="#6366F1" />
                                        <Text style={styles.demoTitle}>Quick Demo</Text>
                                    </View>
                                    <Text style={styles.demoText}>
                                        Try the app instantly with demo account
                                    </Text>
                                    <Text style={styles.demoCredentials}>
                                        Email: {demoAccount.email}{'\n'}
                                        Password: {demoAccount.password}
                                    </Text>
                                    <AnimatedButton
                                        style={styles.demoButton}
                                        onPress={handleDemoSignIn}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <View style={styles.loadingContainer}>
                                                <Animated.View style={{ transform: [{ rotate }] }}>
                                                    <Ionicons name="refresh" size={20} color="white" />
                                                </Animated.View>
                                                <Text style={styles.demoButtonText}>Signing In...</Text>
                                            </View>
                                        ) : (
                                            <>
                                                <Ionicons name="flash" size={20} color="white" />
                                                <Text style={styles.demoButtonText}>Try Demo Account</Text>
                                            </>
                                        )}
                                    </AnimatedButton>
                                </View>
                            </View>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>or sign in manually</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <Animated.View style={[styles.errorWrapper, { height: authError ? 'auto' : errorHeight, opacity: errorOpacity, marginBottom: authError ? 16 : 0 }]}>
                                {authError && (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="warning-outline" size={20} color="#EF4444" />
                                        <Text style={styles.errorText}>{authError}</Text>
                                    </View>
                                )}
                            </Animated.View>

                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Email Address</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your email"
                                            value={formData.email}
                                            onChangeText={(text) => handleInputChange('email', text)}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            placeholderTextColor="#999"
                                            autoComplete="email"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Password</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your password"
                                            value={formData.password}
                                            onChangeText={(text) => handleInputChange('password', text)}
                                            secureTextEntry={!showPassword}
                                            placeholderTextColor="#999"
                                            autoComplete="password"
                                        />
                                        <TouchableOpacity
                                            style={styles.eyeButton}
                                            onPress={() => setShowPassword(!showPassword)}
                                        >
                                            <Ionicons
                                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                                size={20}
                                                color="#666"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.forgotPassword}>
                                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                </TouchableOpacity>

                                <AnimatedButton
                                    style={[
                                        styles.signInButton,
                                        loading && styles.signInButtonDisabled
                                    ]}
                                    onPress={handleSignIn}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <View style={styles.loadingContainer}>
                                            <Animated.View style={{ transform: [{ rotate }] }}>
                                                <Ionicons name="refresh" size={20} color="white" />
                                            </Animated.View>
                                            <Text style={styles.signInButtonText}>Signing In...</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.signInButtonText}>Sign In</Text>
                                    )}
                                </AnimatedButton>
                            </View>

                            <View style={styles.signUpSection}>
                                <Text style={styles.signUpText}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                                    <Text style={styles.signUpLink}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    innerContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    placeholder: {
        width: 32,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    welcomeSection: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    demoSection: {
        marginBottom: 30,
    },
    demoCard: {
        backgroundColor: '#F8FAFF',
        borderWidth: 1,
        borderColor: '#E0E7FF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    demoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    demoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6366F1',
        marginLeft: 8,
    },
    demoText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
        lineHeight: 20,
    },
    demoCredentials: {
        fontSize: 12,
        color: '#6366F1',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        backgroundColor: '#EEF2FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        lineHeight: 18,
    },
    demoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366F1',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    demoButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    form: {
        marginBottom: 30,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1F2937',
    },
    eyeButton: {
        padding: 4,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: '500',
    },
    signInButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    signInButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
    },
    signInButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinner: {
        marginRight: 8,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#6B7280',
        fontSize: 14,
    },
    signUpSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    signUpText: {
        fontSize: 16,
        color: '#6B7280',
    },
    signUpLink: {
        fontSize: 16,
        color: '#2563EB',
        fontWeight: 'bold',
    },
    errorWrapper: {
        overflow: 'hidden',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        padding: 12,
        borderRadius: 8,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
    },
});

export default SignIn;