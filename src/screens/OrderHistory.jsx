import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Image,
    Dimensions,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { firestore } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const OrderHistory = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { addToCart } = useCart();

    const isMounted = useRef(true);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [addingToCart, setAddingToCart] = useState(false);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    const [userReviews, setUserReviews] = useState({});

    useEffect(() => {
        isMounted.current = true;

        if (user?.uid) {
            fetchOrders();
            fetchUserReviews();
        }

        return () => {
            isMounted.current = false;
        };
    }, [user?.uid, filterStatus]);

    const fetchUserReviews = async () => {
        if (!user?.uid) return;

        try {
            const reviewsRef = collection(firestore, 'reviews');
            const q = query(reviewsRef, where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);

            const reviewsMap = {};
            querySnapshot.forEach((docSnap) => {
                const reviewData = docSnap.data();
                reviewsMap[reviewData.productId] = {
                    id: docSnap.id,
                    ...reviewData
                };
            });

            if (isMounted.current) {
                setUserReviews(reviewsMap);
            }
        } catch (error) {
            console.error('Error fetching user reviews:', error);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);

        try {
            const ordersRef = collection(firestore, 'orders');

            let q;
            if (filterStatus === 'All') {
                q = query(
                    ordersRef,
                    where('userId', '==', user.uid),
                    orderBy('createdAt', 'desc')
                );
            } else {
                q = query(
                    ordersRef,
                    where('userId', '==', user.uid),
                    where('status', '==', filterStatus.toLowerCase()),
                    orderBy('createdAt', 'desc')
                );
            }

            const querySnapshot = await getDocs(q);
            const ordersData = [];

            for (const docSnap of querySnapshot.docs) {
                const orderData = docSnap.data();

                const itemsWithDetails = await Promise.all(
                    orderData.items.map(async (item) => {
                        try {
                            const productRef = doc(firestore, 'products', item.productId);
                            const productSnap = await getDoc(productRef);

                            if (productSnap.exists()) {
                                const productData = productSnap.data();
                                return {
                                    ...item,
                                    productName: productData.name,
                                    productImage: productData.images?.[0] || null,
                                    productPrice: productData.price,
                                    productData: productData,
                                };
                            }
                            return item;
                        } catch (error) {
                            console.error('Error fetching product details:', error);
                            return item;
                        }
                    })
                );

                ordersData.push({
                    id: docSnap.id,
                    ...orderData,
                    items: itemsWithDetails,
                });
            }

            if (isMounted.current) {
                setOrders(ordersData);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            Alert.alert('Error', 'Failed to load orders. Please try again.');
        } finally {
            if (isMounted.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
        fetchUserReviews();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '$0.00';
        return `$${parseFloat(amount).toFixed(2)}`;
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return '#10B981';
            case 'shipped':
                return '#2563EB';
            case 'processing':
                return '#F59E0B';
            case 'cancelled':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return 'checkmark-circle';
            case 'shipped':
                return 'car';
            case 'processing':
                return 'time';
            case 'cancelled':
                return 'close-circle';
            default:
                return 'help-circle';
        }
    };

    const handleReorder = async (order) => {
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to add items to cart.');
            return;
        }

        setAddingToCart(true);

        try {
            let addedItemsCount = 0;
            let failedItemsCount = 0;

            for (const item of order.items) {
                try {
                    const productForCart = {
                        id: item.productId,
                        name: item.productName || item.name,
                        price: item.productPrice || item.price,
                        image: item.productImage,
                        images: item.productImage ? [item.productImage] : [],
                        brand: item.brand || 'Unknown Brand',
                        category: item.category || 'General',
                        ...item.productData
                    };

                    for (let i = 0; i < item.quantity; i++) {
                        addToCart(productForCart);
                    }

                    addedItemsCount += item.quantity;
                } catch (error) {
                    console.error('Error adding item to cart:', error);
                    failedItemsCount += item.quantity;
                }
            }

            if (failedItemsCount === 0) {
                Alert.alert(
                    'Success!',
                    `${addedItemsCount} item${addedItemsCount !== 1 ? 's' : ''} added to cart from order #${order.orderNumber}`,
                    [
                        {
                            text: 'Continue Shopping',
                            style: 'cancel'
                        },
                        {
                            text: 'View Cart',
                            onPress: () => navigation.navigate('CartTab')
                        }
                    ]
                );
            } else if (addedItemsCount > 0) {
                Alert.alert(
                    'Partial Success',
                    `${addedItemsCount} item${addedItemsCount !== 1 ? 's' : ''} added to cart. ${failedItemsCount} item${failedItemsCount !== 1 ? 's' : ''} could not be added.`,
                    [
                        {
                            text: 'Continue Shopping',
                            style: 'cancel'
                        },
                        {
                            text: 'View Cart',
                            onPress: () => navigation.navigate('CartTab')
                        }
                    ]
                );
            } else {
                Alert.alert('Error', 'Failed to add items to cart. Please try again.');
            }
        } catch (error) {
            console.error('Error in reorder process:', error);
            Alert.alert('Error', 'Failed to add items to cart. Please try again.');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleReview = (order) => {
        if (order.items && order.items.length > 0) {
            const firstItem = order.items[0];
            const hasReview = userReviews[firstItem.productId];

            navigation.navigate('ReviewScreen', {
                orderId: order.id,
                productId: firstItem.productId,
                productName: firstItem.productName || firstItem.name,
                isEditing: !!hasReview,
                existingReview: hasReview
            });
        } else {
            Alert.alert('No Items', 'This order has no items to review.');
        }
    };

    const handleSelectFilter = (status) => {
        setFilterStatus(status);
        setIsFilterVisible(false);
    };

    const ProductImage = ({ uri }) => {
        const [imageError, setImageError] = useState(false);
        const [imageLoading, setImageLoading] = useState(true);

        const handleImageError = () => {
            setImageError(true);
            setImageLoading(false);
        };

        if (imageError || !uri) {
            return (
                <View style={styles.itemImagePlaceholder}>
                    <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                </View>
            );
        }

        return (
            <View style={styles.itemImageContainer}>
                <Image
                    source={{ uri: uri }}
                    style={styles.itemImage}
                    resizeMode="cover"
                    onError={handleImageError}
                    onLoad={() => setImageLoading(false)}
                />
                {imageLoading && (
                    <View style={styles.imageLoading}>
                        <ActivityIndicator size="small" color="#2563EB" />
                    </View>
                )}
            </View>
        );
    };

    const OrderCard = ({ order }) => {
        const isDelivered = order.status?.toLowerCase() === 'delivered';
        const firstItem = order.items?.[0];
        const hasReviewForFirstItem = firstItem ? userReviews[firstItem.productId] : false;

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                activeOpacity={0.8}
            >
                <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
                        <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '1A' }]}>
                        <Ionicons
                            name={getStatusIcon(order.status)}
                            size={16}
                            color={getStatusColor(order.status)}
                        />
                        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                            {order.status || 'Processing'}
                        </Text>
                    </View>
                </View>

                <View style={styles.orderSummary}>
                    <Text style={styles.itemsCount}>
                        {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} • {order.items?.[0]?.productName} {order.items.length > 1 ? 'and more' : ''}
                    </Text>
                    <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
                </View>

                {selectedOrder?.id === order.id && (
                    <View style={styles.orderDetails}>
                        <View style={styles.divider} />

                        <Text style={styles.detailsTitle}>Items Ordered</Text>

                        {order.items?.map((item, index) => {
                            const hasReview = userReviews[item.productId];
                            return (
                                <View key={index} style={styles.orderItem}>
                                    <ProductImage uri={item.productImage} />
                                    <View style={styles.itemDetails}>
                                        <Text style={styles.itemName} numberOfLines={2}>{item.productName || item.name}</Text>
                                        <Text style={styles.itemPrice}>
                                            Qty: {item.quantity} | {formatCurrency(item.productPrice || item.price)}
                                        </Text>
                                        {isDelivered && (
                                            <TouchableOpacity
                                                style={styles.reviewStatusContainer}
                                                onPress={() => navigation.navigate('ReviewScreen', {
                                                    orderId: order.id,
                                                    productId: item.productId,
                                                    productName: item.productName || item.name,
                                                    isEditing: !!hasReview,
                                                    existingReview: hasReview
                                                })}
                                            >
                                                <Ionicons
                                                    name={hasReview ? "star" : "star-outline"}
                                                    size={14}
                                                    color={hasReview ? "#F59E0B" : "#6B7280"}
                                                />
                                                <Text style={[styles.reviewStatusText, hasReview && styles.reviewedText]}>
                                                    {hasReview ? 'Reviewed' : 'Write Review'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Text style={styles.itemTotal}>
                                        {formatCurrency((item.productPrice || item.price) * item.quantity)}
                                    </Text>
                                </View>
                            );
                        })}

                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionLabel}>Shipping Information</Text>
                            {order.shippingInfo ? (
                                <View style={styles.sectionContent}>
                                    <Text style={styles.shippingName}>{order.shippingInfo.fullName}</Text>
                                    <Text style={styles.detailText}>{order.shippingInfo.address}, {order.shippingInfo.city}</Text>
                                    <Text style={styles.detailText}>
                                        {order.shippingInfo.state} {order.shippingInfo.zipCode}, {order.shippingInfo.country}
                                    </Text>
                                    <Text style={styles.detailText}><Ionicons name="call-outline" size={12} color="#6B7280" /> {order.shippingInfo.phone}</Text>
                                </View>
                            ) : (
                                <Text style={styles.noDetailText}>No shipping info available.</Text>
                            )}
                        </View>

                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionLabel}>Payment</Text>
                            <View style={styles.sectionContent}>
                                <View style={styles.paymentRow}>
                                    <Text style={styles.detailText}>Method:</Text>
                                    <Text style={styles.paymentText}>{order.paymentMethod || 'Credit Card'}</Text>
                                </View>
                                <View style={styles.paymentRow}>
                                    <Text style={styles.detailText}>Status:</Text>
                                    <View style={[styles.paidBadge]}>
                                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                        <Text style={[styles.statusText, { color: '#10B981' }]}>Paid</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionLabel}>Summary</Text>
                            <View style={styles.sectionContent}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Subtotal</Text>
                                    <Text style={styles.summaryValue}>{formatCurrency(order.subtotal || order.total)}</Text>
                                </View>
                                {order.shippingCost > 0 && (
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Shipping</Text>
                                        <Text style={styles.summaryValue}>{formatCurrency(order.shippingCost)}</Text>
                                    </View>
                                )}
                                {order.tax > 0 && (
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Tax</Text>
                                        <Text style={styles.summaryValue}>{formatCurrency(order.tax)}</Text>
                                    </View>
                                )}
                                <View style={[styles.summaryRow, styles.totalRow]}>
                                    <Text style={styles.totalLabel}>Order Total</Text>
                                    <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.reorderButton, addingToCart && styles.disabledButton, { flex: 1 }]}
                                onPress={() => handleReorder(order)}
                                disabled={addingToCart}
                            >
                                {addingToCart ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="cart" size={16} color="#FFFFFF" />
                                        <Text style={styles.reorderButtonText}>Reorder</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {isDelivered && (
                                <TouchableOpacity
                                    style={[styles.reviewButton, { flex: 1, marginLeft: 8 }]}
                                    onPress={() => handleReview(order)}
                                >
                                    <Ionicons
                                        name={hasReviewForFirstItem ? "create-outline" : "star-outline"}
                                        size={16}
                                        color={hasReviewForFirstItem ? "#2563EB" : "#059669"}
                                    />
                                    <Text style={[styles.reviewButtonText, hasReviewForFirstItem && styles.editReviewButtonText]}>
                                        {hasReviewForFirstItem ? 'Edit Review' : 'Write Review'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.helpButton, { flex: 1, marginLeft: 8 }]}
                                onPress={() => Alert.alert('Get Help', `Support for order #${order.orderNumber}`)}
                            >
                                <Ionicons name="help-circle-outline" size={16} color="#2563EB" />
                                <Text style={styles.helpButtonText}>Get Help</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderFilterModal = () => {
        const statuses = ['All', 'Delivered', 'Shipped', 'Processing', 'Cancelled'];

        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={isFilterVisible}
                onRequestClose={() => setIsFilterVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsFilterVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.filterBox}>
                            <Text style={styles.filterModalTitle}>Filter by Status</Text>
                            {statuses.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={styles.filterOption}
                                    onPress={() => handleSelectFilter(status)}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        filterStatus === status && styles.filterOptionTextSelected,
                                    ]}>
                                        {status}
                                    </Text>
                                    {filterStatus === status && (
                                        <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Loading your orders...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order History</Text>
                <View style={styles.placeholder} />
            </View>

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
                {orders.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyTitle}>No Orders Yet</Text>
                        <Text style={styles.emptyMessage}>
                            You haven't placed any orders yet. Start shopping to see your order history here.
                        </Text>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => navigation.navigate('HomeTab')}
                        >
                            <Text style={styles.shopButtonText}>Start Shopping</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.ordersHeader}>
                            <Text style={styles.ordersCount}>
                                {orders.length} {filterStatus !== 'All' ? filterStatus.toLowerCase() : 'total'} order{orders.length !== 1 ? 's' : ''} found
                            </Text>
                            <TouchableOpacity
                                style={styles.filterButton}
                                onPress={() => setIsFilterVisible(true)}
                            >
                                <Ionicons name="filter" size={20} color="#2563EB" />
                                <Text style={[styles.filterText, { color: '#2563EB' }]}>
                                    Filter: <Text style={{ fontWeight: '700' }}>{filterStatus}</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {orders.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}

                        <View style={styles.bottomSpacer} />
                    </>
                )}
            </ScrollView>

            {renderFilterModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
    scrollView: {
        flex: 1,
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
    ordersHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    ordersCount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#DBEAFE',
    },
    filterText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 4,
    },
    orderCard: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    orderInfo: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 14,
        color: '#6B7280',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 6,
    },
    orderSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemsCount: {
        fontSize: 14,
        color: '#6B7280',
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    orderDetails: {
        marginTop: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 20,
    },
    detailsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemImageContainer: {
        position: 'relative',
        width: 60,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    imageLoading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    itemImagePlaceholder: {
        width: 60,
        height: 60,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 13,
        color: '#6B7280',
    },
    reviewStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    reviewStatusText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
    },
    reviewedText: {
        color: '#F59E0B',
        fontWeight: '600',
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    sectionContainer: {
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    sectionContent: {
        paddingHorizontal: 4,
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    shippingName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    detailText: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 3,
    },
    noDetailText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    paymentText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    paidBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 10,
        marginTop: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    summaryValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    reorderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#2563EB',
        borderRadius: 10,
    },
    reorderButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    reviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#D1FAE5',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    reviewButtonText: {
        color: '#059669',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
    },
    editReviewButtonText: {
        color: '#2563EB',
    },
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#E5E7EB',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DBEAFE'
    },
    helpButtonText: {
        color: '#2563EB',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    disabledButton: {
        opacity: 0.6,
    },
    bottomSpacer: {
        height: 20,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '100%',
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    filterBox: {
        backgroundColor: 'white',
    },
    filterModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8,
    },
    filterOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    filterOptionText: {
        fontSize: 16,
        color: '#374151',
    },
    filterOptionTextSelected: {
        fontWeight: '700',
        color: '#2563EB',
    },
});

export default OrderHistory;