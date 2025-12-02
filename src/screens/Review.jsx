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
import { useAuth } from '../context/AuthContext'; // Assuming this provides user data
import { firestore } from '../firebase/config'; // Assuming this is your Firestore instance
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

const ReviewScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();

    // Get parameters passed from OrderHistory.jsx
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
                    >
                        <Ionicons
                            name={rating >= star ? 'star' : 'star-outline'}
                            size={40}
                            color={rating >= star ? '#FBBF24' : '#9CA3AF'} // Amber color for filled stars
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Required', 'Please select a star rating before submitting.');
            return;
        }

        if (!user?.uid) {
            Alert.alert('Error', 'You must be logged in to submit a review.');
            return;
        }

        if (!productId || !orderId) {
            Alert.alert('Error', 'Missing product or order information.');
            return;
        }

        setLoading(true);

        try {
            // 1. Save the review to the 'reviews' collection
            const reviewData = {
                userId: user.uid,
                userName: user.displayName || 'Anonymous User', // Use user's display name
                productId: productId,
                orderId: orderId,
                rating: rating,
                comment: reviewText.trim() || null,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(firestore, 'reviews'), reviewData);

            // 2. OPTIONAL: Update a flag in the order item to prevent duplicate reviews
            // This is complex for a nested item, but for simplicity, we could update the order status
            // or a flag on the order document itself in a more detailed implementation.
            // For now, we will rely on the review screen logic to be triggered once.

            Alert.alert(
                'Success!',
                'Your review has been submitted successfully.',
                [{
                    text: 'OK',
                    onPress: () => navigation.goBack()
                }]
            );

        } catch (error) {
            console.error('Error submitting review:', error);
            Alert.alert('Submission Failed', 'Could not submit your review. Please try again.');
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
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Write a Review</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <Text style={styles.productLabel}>
                        Reviewing:
                    </Text>
                    <Text style={styles.productName}>{productName || 'Product'}</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Rating</Text>
                        <Text style={styles.sectionSubtitle}>Tap a star to rate the product.</Text>
                        <StarRating />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Comment (Optional)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Tell us what you loved or what could be improved..."
                            value={reviewText}
                            onChangeText={setReviewText}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            maxLength={500}
                        />
                        <Text style={styles.charCount}>{reviewText.length}/500</Text>
                    </View>

                    <View style={styles.submitContainer}>
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.disabledButton]}
                            onPress={handleSubmit}
                            disabled={loading || rating === 0}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Review</Text>
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
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    placeholder: {
        width: 32,
    },
    scrollContent: {
        padding: 20,
    },
    productLabel: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 4,
    },
    productName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 24,
    },
    section: {
        marginBottom: 30,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    starContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    starButton: {
        paddingHorizontal: 8,
    },
    textInput: {
        minHeight: 120,
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
        marginTop: 8,
        backgroundColor: '#F9FAFB',
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    submitContainer: {
        paddingTop: 10,
        marginBottom: 30,
    },
    submitButton: {
        backgroundColor: '#059669', // Green color for submission
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.7,
    },
});

export default ReviewScreen;