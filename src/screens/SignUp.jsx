import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const SignUp = () => {
    const navigation = useNavigation();
    const { signUp, user } = useAuth();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'user',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;
    const errorAnim = useRef(new Animated.Value(0)).current;

    const userRoleScale = useRef(new Animated.Value(1)).current;
    const adminRoleScale = useRef(new Animated.Value(1)).current;

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

    const animateRoleSelection = (roleValue) => {
        const targetScale = roleValue === 'user' ? userRoleScale : adminRoleScale;

        Animated.sequence([
            Animated.spring(targetScale, {
                toValue: 0.98,
                useNativeDriver: true,
            }),
            Animated.spring(targetScale, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    };

    useEffect(() => {
        fadeIn();
        if (loading) {
            spin();
        }
    }, []);

    useEffect(() => {
        if (loading) {
            spin();
        } else {
            spinAnim.stopAnimation();
        }
    }, [loading]);

    useEffect(() => {
        showError(!!errorMessage);
    }, [errorMessage]);

    useEffect(() => {
        if (user) {
            navigation.replace('MainApp');
        }
    }, [user, navigation]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        if (errorMessage) {
            setErrorMessage(null);
        }
    };

    const handleRoleSelect = (role) => {
        setFormData(prev => ({
            ...prev,
            role
        }));
        animateRoleSelection(role);
    };

    const validateForm = () => {
        if (!formData.fullName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
            return 'Please fill in all fields';
        }

        if (!formData.email.includes('@')) {
            return 'Please enter a valid email address';
        }

        if (formData.password.length < 6) {
            return 'Password must be at least 6 characters long';
        }

        if (formData.password !== formData.confirmPassword) {
            return 'Passwords do not match';
        }

        if (!formData.phone.match(/^\d{10,15}$/)) {
            return 'Please enter a valid phone number (10-15 digits)';
        }

        return null;
    };

    const handleSignUp = async () => {
        setErrorMessage(null);
        const validationError = validateForm();
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        setLoading(true);

        try {
            const result = await signUp(formData.email, formData.password, {
                fullName: formData.fullName,
                phone: formData.phone,
                role: formData.role,
            });

            if (result.success) {
                setErrorMessage('Account created successfully! Redirecting...');
            } else {
                setErrorMessage(result.error || 'Failed to create account. Please try again.');
            }
        } catch (error) {
            setErrorMessage('An unexpected error occurred during sign up.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('SignIn');
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

    const RoleOption = ({ title, description, value, selected, scaleAnim }) => (
        <TouchableOpacity
            activeOpacity={1}
            onPress={() => handleRoleSelect(value)}
        >
            <Animated.View
                style={[
                    styles.roleOption,
                    selected && styles.roleOptionSelected,
                    { transform: [{ scale: scaleAnim }] }
                ]}
            >
                <View style={styles.roleHeader}>
                    <View style={[
                        styles.roleRadio,
                        selected && styles.roleRadioSelected
                    ]}>
                        {selected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.roleTitle}>{title}</Text>
                </View>
                <Text style={styles.roleDescription}>{description}</Text>
            </Animated.View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBack}
                            >
                                <Ionicons name="arrow-back" size={24} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Create Account</Text>
                            <View style={styles.placeholder} />
                        </View>

                        <View style={styles.content}>
                            <View style={styles.welcomeSection}>
                                <Text style={styles.welcomeTitle}>Join Us Today!</Text>
                                <Text style={styles.welcomeSubtitle}>
                                    Create your account to get started
                                </Text>
                            </View>

                            <Animated.View style={[styles.errorWrapper, { height: errorMessage ? 'auto' : errorHeight, opacity: errorOpacity, marginBottom: errorMessage ? 16 : 0 }]}>
                                {errorMessage && (
                                    <View style={[styles.errorContainer, errorMessage.includes('Success') && styles.successContainer]}>
                                        <Ionicons name={errorMessage.includes('Success') ? "checkmark-circle-outline" : "warning-outline"} size={20} color={errorMessage.includes('Success') ? "#10B981" : "#EF4444"} />
                                        <Text style={[styles.errorText, errorMessage.includes('Success') && styles.successText]}>{errorMessage}</Text>
                                    </View>
                                )}
                            </Animated.View>

                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Full Name</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your full name"
                                            value={formData.fullName}
                                            onChangeText={(text) => handleInputChange('fullName', text)}
                                            placeholderTextColor="#999"
                                            autoCapitalize="words"
                                            autoComplete="name"
                                        />
                                    </View>
                                </View>

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
                                    <Text style={styles.inputLabel}>Phone Number</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your phone number"
                                            value={formData.phone}
                                            onChangeText={(text) => handleInputChange('phone', text)}
                                            keyboardType="phone-pad"
                                            placeholderTextColor="#999"
                                            autoComplete="tel"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Account Type</Text>
                                    <View style={styles.roleOptions}>
                                        <RoleOption
                                            title="User"
                                            description="Browse and purchase products"
                                            value="user"
                                            selected={formData.role === 'user'}
                                            scaleAnim={userRoleScale}
                                        />
                                        <RoleOption
                                            title="Admin"
                                            description="Manage products and orders"
                                            value="admin"
                                            selected={formData.role === 'admin'}
                                            scaleAnim={adminRoleScale}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Password</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Create a password"
                                            value={formData.password}
                                            onChangeText={(text) => handleInputChange('password', text)}
                                            secureTextEntry={!showPassword}
                                            placeholderTextColor="#999"
                                            autoComplete="new-password"
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
                                    <Text style={styles.passwordHint}>
                                        Must be at least 6 characters long
                                    </Text>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Confirm Password</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Confirm your password"
                                            value={formData.confirmPassword}
                                            onChangeText={(text) => handleInputChange('confirmPassword', text)}
                                            secureTextEntry={!showConfirmPassword}
                                            placeholderTextColor="#999"
                                            autoComplete="new-password"
                                        />
                                        <TouchableOpacity
                                            style={styles.eyeButton}
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            <Ionicons
                                                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                                size={20}
                                                color="#666"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <AnimatedButton
                                    style={[
                                        styles.signUpButton,
                                        loading && styles.signUpButtonDisabled
                                    ]}
                                    onPress={handleSignUp}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <View style={styles.loadingContainer}>
                                            <Animated.View style={{ transform: [{ rotate }] }}>
                                                <Ionicons name="refresh" size={20} color="white" />
                                            </Animated.View>
                                            <Text style={styles.signUpButtonText}>Creating Account...</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.signUpButtonText}>Create Account</Text>
                                    )}
                                </AnimatedButton>
                            </View>

                            <View style={styles.termsSection}>
                                <Text style={styles.termsText}>
                                    By creating an account, you agree to our{' '}
                                    <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                                    <Text style={styles.termsLink}>Privacy Policy</Text>
                                </Text>
                            </View>

                            <View style={styles.signInSection}>
                                <Text style={styles.signInText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                                    <Text style={styles.signInLink}>Sign In</Text>
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
        marginBottom: 40,
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
    successContainer: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
    },
    successText: {
        color: '#10B981',
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
    passwordHint: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        marginLeft: 4,
    },
    roleOptions: {
        gap: 12,
    },
    roleOption: {
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
    },
    roleOptionSelected: {
        backgroundColor: '#EFF6FF',
        borderColor: '#2563EB',
    },
    roleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    roleRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleRadioSelected: {
        borderColor: '#2563EB',
        backgroundColor: '#2563EB',
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'white',
    },
    roleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    roleDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 32,
    },
    signUpButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 8,
    },
    signUpButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
    },
    signUpButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    termsSection: {
        marginBottom: 30,
    },
    termsText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    termsLink: {
        color: '#2563EB',
        fontWeight: '500',
    },
    signInSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    signInText: {
        fontSize: 16,
        color: '#6B7280',
    },
    signInLink: {
        fontSize: 16,
        color: '#2563EB',
        fontWeight: 'bold',
    },
});

export default SignUp;