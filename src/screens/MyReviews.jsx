import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Modal,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { firestore } from '../firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, orderBy, getDoc } from 'firebase/firestore';

const MyReviews = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [editRating, setEditRating] = useState(0);
    const [editComment, setEditComment] = useState('');
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            fetchReviews();
        } else {
            setReviews([]);
            setLoading(false);
        }
    }, [user?.uid]);

    const formatDate = (dateValue) => {
        if (!dateValue) return 'Unknown date';

        try {
            let date;

            if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
                date = dateValue.toDate();
            } else if (dateValue && typeof dateValue === 'object' && dateValue._seconds) {
                date = new Date(dateValue._seconds * 1000);
            } else if (dateValue && typeof dateValue === 'string') {
                date = new Date(dateValue);
            } else if (dateValue && typeof dateValue === 'number') {
                date = new Date(dateValue);
            } else {
                return 'Unknown date';
            }

            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }

            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    const fetchReviews = async () => {
        setLoading(true);
        try {
            if (!user?.uid) {
                setReviews([]);
                return;
            }

            const reviewsRef = collection(firestore, 'reviews');
            const q = query(
                reviewsRef,
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const reviewsData = [];

            for (const docSnap of querySnapshot.docs) {
                const reviewData = docSnap.data();

                try {
                    const productRef = doc(firestore, 'products', reviewData.productId);
                    const productSnap = await getDoc(productRef);

                    if (productSnap.exists()) {
                        const productData = productSnap.data();
                        reviewsData.push({
                            id: docSnap.id,
                            ...reviewData,
                            product: {
                                id: reviewData.productId,
                                name: productData.name,
                                image: productData.images?.[0] || null,
                                price: productData.price,
                                category: productData.category,
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error fetching product details:', error);
                    reviewsData.push({
                        id: docSnap.id,
                        ...reviewData,
                        product: null
                    });
                }
            }

            setReviews(reviewsData);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            Alert.alert('Error', 'Failed to load your reviews. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchReviews();
    };

    const handleEditReview = (review) => {
        setEditingReview(review);
        setEditRating(review.rating);
        setEditComment(review.comment || '');
        setEditModalVisible(true);
    };

    const handleUpdateReview = async () => {
        if (!editingReview) return;

        if (editRating === 0) {
            Alert.alert('Error', 'Please select a rating');
            return;
        }

        if (!editComment.trim()) {
            Alert.alert('Error', 'Please write a review comment');
            return;
        }

        setUpdating(true);
        try {
            const reviewRef = doc(firestore, 'reviews', editingReview.id);
            await updateDoc(reviewRef, {
                rating: editRating,
                comment: editComment.trim(),
                updatedAt: new Date()
            });

            setEditModalVisible(false);
            fetchReviews();
            Alert.alert('Success', 'Review updated successfully');
        } catch (error) {
            console.error('Error updating review:', error);
            Alert.alert('Error', 'Failed to update review. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteReview = async () => {
        if (!selectedReview) return;

        setDeleting(true);
        try {
            await deleteDoc(doc(firestore, 'reviews', selectedReview.id));

            setReviews(prev => prev.filter(review => review.id !== selectedReview.id));
            setDeleteModalVisible(false);
            setSelectedReview(null);

            Alert.alert('Success', 'Review deleted successfully');
        } catch (error) {
            console.error('Error deleting review:', error);
            Alert.alert('Error', 'Failed to delete review. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const confirmDeleteReview = (review) => {
        setSelectedReview(review);
        setDeleteModalVisible(true);
    };

    const StarRating = ({ rating, onRatingPress, editable = false, size = 20 }) => {
        const stars = [1, 2, 3, 4, 5];

        return (
            <View style={styles.starContainer}>
                {stars.map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => editable && onRatingPress && onRatingPress(star)}
                        disabled={!editable}
                        activeOpacity={editable ? 0.7 : 1}
                    >
                        <Ionicons
                            name={star <= rating ? "star" : "star-outline"}
                            size={size}
                            color="#F59E0B"
                            style={styles.starIcon}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const ReviewItem = ({ review }) => {
        return (
            <View style={styles.reviewCard}>
                <TouchableOpacity
                    style={styles.reviewHeader}
                >
                    <View style={styles.productInfo}>
                        {review.product?.image ? (
                            <Image
                                source={{ uri: review.product.image }}
                                style={styles.productImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.productImagePlaceholder}>
                                <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                            </View>
                        )}
                        <View style={styles.productDetails}>
                            <Text style={styles.productName} numberOfLines={2}>
                                {review.product?.name || 'Product not available'}
                            </Text>
                            <Text style={styles.productCategory}>
                                {review.product?.category || 'General'}
                            </Text>
                            <Text style={styles.productPrice}>
                                ${review.product?.price?.toFixed(2) || '0.00'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.reviewContent}>
                    <View style={styles.ratingContainer}>
                        <StarRating rating={review.rating} size={20} />
                        <Text style={styles.reviewDate}>
                            {formatDate(review.createdAt)}
                            {review.updatedAt && review.updatedAt !== review.createdAt && ' (edited)'}
                        </Text>
                    </View>

                    {review.comment ? (
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                    ) : (
                        <Text style={styles.noComment}>No comment provided</Text>
                    )}

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEditReview(review)}
                        >
                            <Ionicons name="create-outline" size={16} color="#2563EB" />
                            <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => confirmDeleteReview(review)}
                        >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderEditModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={editModalVisible}
            onRequestClose={() => setEditModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Review</Text>
                        <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {editingReview?.product && (
                            <View style={styles.productInfoModal}>
                                {editingReview.product.image ? (
                                    <Image
                                        source={{ uri: editingReview.product.image }}
                                        style={styles.productImageModal}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.productImagePlaceholderModal}>
                                        <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                                    </View>
                                )}
                                <Text style={styles.productNameModal}>
                                    {editingReview.product.name}
                                </Text>
                            </View>
                        )}

                        <View style={styles.ratingSection}>
                            <Text style={styles.ratingLabel}>Your Rating</Text>
                            <StarRating
                                rating={editRating}
                                onRatingPress={setEditRating}
                                editable={true}
                                size={32}
                            />
                        </View>

                        <View style={styles.commentSection}>
                            <Text style={styles.commentLabel}>Your Review</Text>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Share your experience with this product..."
                                placeholderTextColor="#9CA3AF"
                                value={editComment}
                                onChangeText={setEditComment}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setEditModalVisible(false)}
                            disabled={updating}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.updateButton}
                            onPress={handleUpdateReview}
                            disabled={updating}
                        >
                            {updating ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                                    <Text style={styles.updateButtonText}>Update Review</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderDeleteModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={deleteModalVisible}
            onRequestClose={() => setDeleteModalVisible(false)}
        >
            <View style={styles.deleteModalOverlay}>
                <View style={styles.deleteModalContainer}>
                    <View style={styles.deleteModalIcon}>
                        <Ionicons name="warning" size={48} color="#EF4444" />
                    </View>
                    <Text style={styles.deleteModalTitle}>Delete Review</Text>
                    <Text style={styles.deleteModalText}>
                        Are you sure you want to delete this review? This action cannot be undone.
                    </Text>

                    <View style={styles.deleteModalButtons}>
                        <TouchableOpacity
                            style={styles.deleteCancelButton}
                            onPress={() => setDeleteModalVisible(false)}
                            disabled={deleting}
                        >
                            <Text style={styles.deleteCancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteConfirmButton}
                            onPress={handleDeleteReview}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="trash" size={18} color="#FFFFFF" />
                                    <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Reviews</Text>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.signInContainer}>
                    <Ionicons name="star-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.signInTitle}>Sign In Required</Text>
                    <Text style={styles.signInText}>
                        Please sign in to view and manage your product reviews.
                    </Text>
                    <TouchableOpacity
                        style={styles.signInButton}
                        onPress={() => navigation.navigate('ProfileTab', { screen: 'SignIn' })}
                    >
                        <Text style={styles.signInButtonText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Reviews</Text>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading your reviews...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Reviews</Text>
                <View style={styles.placeholder} />
            </View>

            {reviews.length === 0 ? (
                <ScrollView
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#2563EB']}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.emptyState}>
                        <Ionicons name="star-outline" size={80} color="#D1D5DB" />
                        <Text style={styles.emptyTitle}>No Reviews Yet</Text>
                        <Text style={styles.emptyMessage}>
                            You haven't reviewed any products yet. Your reviews will appear here after you submit them.
                        </Text>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => navigation.navigate('HomeTab')}
                        >
                            <Text style={styles.shopButtonText}>Browse Products</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            ) : (
                <FlatList
                    data={reviews}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <ReviewItem review={item} />}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#2563EB']}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={styles.statsContainer}>
                            <View style={styles.statsCard}>
                                <Ionicons name="star" size={24} color="#F59E0B" />
                                <Text style={styles.statsNumber}>
                                    {reviews.length}
                                </Text>
                                <Text style={styles.statsLabel}>
                                    Review{reviews.length !== 1 ? 's' : ''}
                                </Text>
                            </View>
                            <View style={styles.statsCard}>
                                <Ionicons name="pencil" size={24} color="#2563EB" />
                                <Text style={styles.statsNumber}>
                                    {reviews.filter(r => r.updatedAt && formatDate(r.updatedAt) !== formatDate(r.createdAt)).length}
                                </Text>
                                <Text style={styles.statsLabel}>
                                    Edited
                                </Text>
                            </View>
                        </View>
                    }
                    ListFooterComponent={<View style={styles.bottomSpacer} />}
                />
            )}

            {renderEditModal()}
            {renderDeleteModal()}
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
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    placeholder: {
        width: 32,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    signInContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    signInTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    signInText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    signInButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    signInButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statsCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statsNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 8,
        marginBottom: 4,
    },
    statsLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    reviewCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    reviewHeader: {
        marginBottom: 16,
    },
    productInfo: {
        flexDirection: 'row',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: '#F3F4F6',
    },
    productImagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    productDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    reviewContent: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 16,
    },
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    starContainer: {
        flexDirection: 'row',
    },
    starIcon: {
        marginRight: 4,
    },
    reviewDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    reviewComment: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
        marginBottom: 16,
    },
    noComment: {
        fontSize: 15,
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginBottom: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        gap: 6,
    },
    editButtonText: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: '600',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        gap: 6,
    },
    deleteButtonText: {
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    shopButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    shopButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        width: '90%',
        maxHeight: '80%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    modalContent: {
        maxHeight: 400,
        padding: 20,
    },
    productInfoModal: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    productImageModal: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: '#F3F4F6',
    },
    productImagePlaceholderModal: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    productNameModal: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
    },
    ratingSection: {
        marginBottom: 24,
    },
    ratingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    commentSection: {
        marginBottom: 24,
    },
    commentLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1F2937',
        minHeight: 120,
        textAlignVertical: 'top',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    updateButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: '#2563EB',
        borderRadius: 12,
        gap: 8,
    },
    updateButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    deleteModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    deleteModalContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    deleteModalIcon: {
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    deleteModalText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    deleteModalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    deleteCancelButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    deleteCancelButtonText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    deleteConfirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        gap: 8,
    },
    deleteConfirmButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default MyReviews;