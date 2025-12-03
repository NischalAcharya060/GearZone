import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { firestore } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const COLORS = {
    primary: '#4F46E5',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#FBBF24',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#1F2937',
    subText: '#6B7280',
    border: '#E5E7EB',
};

const ReviewScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();

    const { orderId, productId, productName } = route.params || {};

    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [loading, setLoading] = useState(false);

    const StarRating = () => {
        return (
            <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        style={styles.starButton}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={rating >= star ? 'star' : 'star-outline'}
                            size={44}
                            color={rating >= star ? COLORS.warning : COLORS.border}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Required', 'Please select a star rating before submitting.', [{ text: 'OK' }]);
            return;
        }

        if (!user?.uid) {
            Alert.alert('Error', 'You must be logged in to submit a review.', [{ text: 'OK' }]);
            return;
        }

        if (!productId || !orderId) {
            Alert.alert('Error', 'Missing product or order information.', [{ text: 'OK' }]);
            return;
        }

        setLoading(true);

        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const reviewsCollectionRef = collection(firestore, `artifacts/${appId}/public/data/reviews`);

            const reviewData = {
                userId: user.uid,
                userName: user.displayName || user.email || 'Anonymous User',
                productId: productId,
                orderId: orderId,
                rating: rating,
                comment: reviewText.trim() || null,
                createdAt: serverTimestamp(),
            };

            await addDoc(reviewsCollectionRef, reviewData);

            Alert.alert(
                'Review Submitted!',
                'Your feedback is valuable and helps other shoppers. Thank you!',
                [{
                    text: 'Done',
                    onPress: () => navigation.goBack()
                }]
            );

        } catch (error) {
            console.error('Error submitting review:', error);
            Alert.alert('Submission Failed', 'Could not submit your review. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <Text style={styles.mainTitle}>Share Your Experience</Text>

                    <View style={styles.productInfoContainer}>
                        <Text style={styles.productLabel}>
                            Reviewing:
                        </Text>
                        <Text style={styles.productName}>{productName || 'Product Title'}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>1. How would you rate this product?</Text>
                        <Text style={styles.sectionSubtitle}>Select the number of stars you believe it deserves.</Text>
                        <StarRating />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. Write your comments (Optional)</Text>
                        <Text style={styles.sectionSubtitle}>Share your experience—what you liked or what could be better.</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type your detailed review here..."
                            placeholderTextColor={COLORS.subText + '90'}
                            value={reviewText}
                            onChangeText={setReviewText}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            maxLength={500}
                        />
                        <Text style={styles.charCount}>{reviewText.length}/500 characters</Text>
                    </View>

                    <View style={styles.submitContainer}>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                loading && styles.disabledButton,
                                rating === 0 && styles.disabledButton
                            ]}
                            onPress={handleSubmit}
                            disabled={loading || rating === 0}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={COLORS.surface} />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {rating === 0 ? 'Select Rating to Submit' : 'Submit Review'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 20,
    },
    productInfoContainer: {
        marginBottom: 25,
        padding: 15,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    productLabel: {
        fontSize: 14,
        color: COLORS.subText,
        marginBottom: 2,
    },
    productName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    section: {
        marginBottom: 25,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: COLORS.subText,
        marginBottom: 16,
    },
    starContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    starButton: {
        paddingHorizontal: 6,
    },
    textInput: {
        minHeight: 140,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.text,
        backgroundColor: COLORS.background,
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: COLORS.subText,
        marginTop: 8,
    },
    submitContainer: {
        paddingTop: 10,
        marginBottom: 40,
    },
    submitButton: {
        backgroundColor: COLORS.success,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    submitButtonText: {
        color: COLORS.surface,
        fontSize: 18,
        fontWeight: '800',
    },
    disabledButton: {
        backgroundColor: COLORS.subText,
        opacity: 0.8,
        shadowOpacity: 0.0,
        elevation: 0,
    },
});

export default ReviewScreen;