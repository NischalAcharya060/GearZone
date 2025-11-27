import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { firestore } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const { width: screenWidth } = Dimensions.get('window');

const OrderConfirmation = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { clearCart } = useCart();
    const { user } = useAuth();

    const { orderTotal, orderNumber, orderId, paymentMethod = 'Credit Card' } = route.params || {};

    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch real order data from Firestore
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                if (orderId && user) {
                    // Fetch real order data from Firestore
                    const orderRef = doc(firestore, 'orders', orderId);
                    const orderDoc = await getDoc(orderRef);

                    if (orderDoc.exists()) {
                        const orderData = orderDoc.data();
                        setOrderDetails({
                            id: orderDoc.id,
                            ...orderData
                        });
                    } else {
                        // Fallback to passed data if order not found
                        setOrderDetails({
                            id: orderId,
                            orderNumber: orderNumber,
                            total: orderTotal,
                            items: [],
                            shippingInfo: {},
                            paymentMethod: paymentMethod,
                            status: 'processing',
                            createdAt: new Date().toISOString(),
                            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                        });
                    }
                } else {
                    // Fallback for direct navigation without orderId
                    setOrderDetails({
                        id: orderNumber || `ORD-${Date.now()}`,
                        orderNumber: orderNumber,
                        total: orderTotal || 0,
                        items: [],
                        shippingInfo: {},
                        paymentMethod: paymentMethod,
                        status: 'processing',
                        createdAt: new Date().toISOString(),
                        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                    });
                }

                setLoading(false);
                clearCart(); // Clear cart regardless

            } catch (error) {
                console.error('Error fetching order details:', error);
                // Fallback data on error
                setOrderDetails({
                    id: orderNumber || `ORD-${Date.now()}`,
                    orderNumber: orderNumber,
                    total: orderTotal || 0,
                    items: [],
                    shippingInfo: {},
                    paymentMethod: paymentMethod,
                    status: 'processing',
                    createdAt: new Date().toISOString(),
                    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                });
                setLoading(false);
                clearCart();
            }
        };

        fetchOrderDetails();
    }, [orderId, orderNumber, orderTotal, clearCart, user]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not available';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return '$0.00';
        return `$${parseFloat(amount).toFixed(2)}`;
    };

    const handleContinueShopping = () => {
        navigation.navigate('HomeTab', { screen: 'Home' });
    };

    const handleViewOrders = () => {
        navigation.navigate('ProfileTab', { screen: 'Orders' });
    };

    // Image component with error handling
    const ProductImage = ({ product }) => {
        const [imageError, setImageError] = useState(false);
        const [imageLoading, setImageLoading] = useState(true);

        const handleImageError = () => {
            setImageError(true);
            setImageLoading(false);
        };

        const handleImageLoad = () => {
            setImageLoading(false);
        };

        if (imageError || !product?.images || product.images.length === 0) {
            return (
                <View style={styles.itemImagePlaceholder}>
                    <Ionicons name="image-outline" size={24} color="#999" />
                </View>
            );
        }

        return (
            <View style={styles.itemImageContainer}>
                <Image
                    source={{ uri: product.images[0] }}
                    style={styles.itemImage}
                    resizeMode="cover"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                />
                {imageLoading && (
                    <View style={styles.imageLoading}>
                        <ActivityIndicator size="small" color="#2563EB" />
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Confirming your order...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('HomeTab', { screen: 'Home' })}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Confirmation</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Success Banner */}
                <View style={styles.successBanner}>
                    <View style={styles.successIconContainer}>
                        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                    </View>
                    <Text style={styles.successTitle}>Order Confirmed!</Text>
                    <Text style={styles.successMessage}>
                        Thank you for your purchase. Your order has been successfully placed and is being processed.
                    </Text>
                    <View style={styles.orderNumberBadge}>
                        <Text style={styles.orderNumberText}>Order #{orderDetails?.orderNumber}</Text>
                    </View>
                </View>

                {/* Order Timeline */}
                <View style={styles.timelineCard}>
                    <Text style={styles.timelineTitle}>Order Status</Text>
                    <View style={styles.timeline}>
                        <View style={[styles.timelineStep, styles.timelineStepActive]}>
                            <View style={styles.timelineDot}>
                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            </View>
                            <View style={styles.timelineStepContent}>
                                <Text style={styles.timelineStepTitle}>Order Placed</Text>
                                <Text style={styles.timelineStepDescription}>Your order has been received</Text>
                            </View>
                        </View>

                        <View style={styles.timelineConnector} />

                        <View style={styles.timelineStep}>
                            <View style={[styles.timelineDot, styles.timelineDotUpcoming]} />
                            <View style={styles.timelineStepContent}>
                                <Text style={styles.timelineStepTitle}>Processing</Text>
                                <Text style={styles.timelineStepDescription}>Preparing your order</Text>
                            </View>
                        </View>

                        <View style={styles.timelineConnector} />

                        <View style={styles.timelineStep}>
                            <View style={[styles.timelineDot, styles.timelineDotUpcoming]} />
                            <View style={styles.timelineStepContent}>
                                <Text style={styles.timelineStepTitle}>Shipped</Text>
                                <Text style={styles.timelineStepDescription}>On its way to you</Text>
                            </View>
                        </View>

                        <View style={styles.timelineConnector} />

                        <View style={styles.timelineStep}>
                            <View style={[styles.timelineDot, styles.timelineDotUpcoming]} />
                            <View style={styles.timelineStepContent}>
                                <Text style={styles.timelineStepTitle}>Delivered</Text>
                                <Text style={styles.timelineStepDescription}>
                                    Expected {formatDate(orderDetails?.estimatedDelivery)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Order Summary Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="receipt-outline" size={20} color="#2563EB" />
                        <Text style={styles.cardTitle}>Order Details</Text>
                    </View>

                    {/* Order Items - REAL DATA */}
                    <Text style={styles.sectionTitle}>Items Ordered</Text>
                    {orderDetails?.items && orderDetails.items.length > 0 ? (
                        orderDetails.items.map((item, index) => (
                            <View key={item.productId || index} style={styles.orderItem}>
                                <ProductImage product={item} />
                                <View style={styles.itemDetails}>
                                    <Text style={styles.itemName} numberOfLines={2}>
                                        {item.name || 'Product'}
                                    </Text>
                                    <Text style={styles.itemPrice}>
                                        {formatCurrency(item.price)} × {item.quantity}
                                    </Text>
                                    {item.size && (
                                        <Text style={styles.itemSize}>Size: {item.size}</Text>
                                    )}
                                    {item.color && (
                                        <Text style={styles.itemColor}>Color: {item.color}</Text>
                                    )}
                                </View>
                                <Text style={styles.itemTotal}>
                                    {formatCurrency((item.price || 0) * (item.quantity || 1))}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.noItemsContainer}>
                            <Ionicons name="cart-outline" size={48} color="#E5E7EB" />
                            <Text style={styles.noItemsText}>No items in this order</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    {/* Order Total - REAL DATA */}
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>
                            {formatCurrency(orderDetails?.subtotal || orderDetails?.total)}
                        </Text>
                    </View>
                    {orderDetails?.shippingCost > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Shipping</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(orderDetails?.shippingCost)}</Text>
                        </View>
                    )}
                    {orderDetails?.tax > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(orderDetails?.tax)}</Text>
                        </View>
                    )}
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalAmount}>
                            {formatCurrency(orderDetails?.total)}
                        </Text>
                    </View>
                </View>

                {/* Shipping & Payment Info */}
                <View style={styles.infoRow}>
                    {/* Shipping Information - REAL DATA */}
                    <View style={[styles.card, styles.halfCard]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="location-outline" size={20} color="#2563EB" />
                            <Text style={styles.cardTitle}>Shipping</Text>
                        </View>
                        {orderDetails?.shippingInfo ? (
                            <View style={styles.shippingInfo}>
                                <Text style={styles.shippingName}>{orderDetails.shippingInfo.fullName}</Text>
                                <Text style={styles.shippingAddress}>{orderDetails.shippingInfo.address}</Text>
                                <Text style={styles.shippingCity}>
                                    {orderDetails.shippingInfo.city}, {orderDetails.shippingInfo.state} {orderDetails.shippingInfo.zipCode}
                                </Text>
                                <Text style={styles.shippingCountry}>{orderDetails.shippingInfo.country}</Text>
                                {orderDetails.shippingInfo.phone && (
                                    <Text style={styles.shippingPhone}>
                                        <Ionicons name="call-outline" size={14} color="#6B7280" />
                                        {orderDetails.shippingInfo.phone}
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.noDataText}>Shipping information not available</Text>
                        )}
                    </View>

                    {/* Payment Information */}
                    <View style={[styles.card, styles.halfCard]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="card-outline" size={20} color="#2563EB" />
                            <Text style={styles.cardTitle}>Payment</Text>
                        </View>
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentMethod}>{orderDetails?.paymentMethod || 'Credit Card'}</Text>
                            <View style={[styles.statusBadge, styles.paidBadge]}>
                                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                <Text style={[styles.statusText, styles.paidText]}>Paid</Text>
                            </View>
                        </View>
                        <Text style={styles.paymentAmount}>{formatCurrency(orderDetails?.total)}</Text>
                    </View>
                </View>

                {/* Next Steps */}
                <View style={styles.nextStepsCard}>
                    <Text style={styles.nextStepsTitle}>What's Next?</Text>
                    <View style={styles.nextStep}>
                        <View style={styles.nextStepIcon}>
                            <Ionicons name="mail-outline" size={20} color="#2563EB" />
                        </View>
                        <Text style={styles.nextStepText}>You'll receive an email confirmation shortly</Text>
                    </View>
                    <View style={styles.nextStep}>
                        <View style={styles.nextStepIcon}>
                            <Ionicons name="time-outline" size={20} color="#2563EB" />
                        </View>
                        <Text style={styles.nextStepText}>We'll notify you when your order ships</Text>
                    </View>
                    <View style={styles.nextStep}>
                        <View style={styles.nextStepIcon}>
                            <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                        </View>
                        <Text style={styles.nextStepText}>
                            Expected delivery: {formatDate(orderDetails?.estimatedDelivery)}
                        </Text>
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Fixed Action Buttons */}
            <View style={styles.footer}>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleContinueShopping}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Continue Shopping</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleViewOrders}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="list-outline" size={20} color="#2563EB" />
                        <Text style={styles.secondaryButtonText}>View Orders</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120, // Space for fixed buttons
    },
    successBanner: {
        backgroundColor: 'white',
        margin: 16,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    successIconContainer: {
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#10B981',
        marginBottom: 8,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 16,
    },
    orderNumberBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    orderNumberText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2563EB',
    },
    timelineCard: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 8,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    timelineTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 20,
    },
    timeline: {
        // Timeline container
    },
    timelineStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    timelineStepActive: {
        // Active step styles
    },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    timelineDotUpcoming: {
        backgroundColor: '#E5E7EB',
        borderWidth: 2,
        borderColor: '#D1D5DB',
    },
    timelineStepContent: {
        flex: 1,
    },
    timelineStepTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    timelineStepDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 18,
    },
    timelineConnector: {
        width: 2,
        height: 20,
        backgroundColor: '#E5E7EB',
        marginLeft: 11,
        marginBottom: 8,
    },
    card: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    halfCard: {
        flex: 1,
        marginHorizontal: 8,
    },
    infoRow: {
        flexDirection: 'row',
        marginHorizontal: 8,
        gap: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 16,
    },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
    },
    itemImageContainer: {
        position: 'relative',
        width: 60,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 12,
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    itemImagePlaceholder: {
        width: 60,
        height: 60,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    imageLoading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    itemDetails: {
        flex: 1,
        marginRight: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
        lineHeight: 18,
    },
    itemPrice: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 2,
    },
    itemSize: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 1,
    },
    itemColor: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    itemTotal: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        alignSelf: 'flex-start',
    },
    noItemsContainer: {
        alignItems: 'center',
        padding: 32,
    },
    noItemsText: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 8,
    },
    noDataText: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 16,
        marginTop: 8,
    },
    summaryLabel: {
        fontSize: 15,
        color: '#6B7280',
    },
    summaryValue: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    totalLabel: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    shippingInfo: {
        // Shipping info styles
    },
    shippingName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 6,
    },
    shippingAddress: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 4,
        lineHeight: 18,
    },
    shippingCity: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 4,
        lineHeight: 18,
    },
    shippingCountry: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 8,
    },
    shippingPhone: {
        fontSize: 14,
        color: '#6B7280',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    paymentInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    paymentMethod: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    paymentAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    paidBadge: {
        backgroundColor: '#10B981',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    paidText: {
        color: '#FFFFFF',
    },
    nextStepsCard: {
        backgroundColor: '#F0F9FF',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    nextStepsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0369A1',
        marginBottom: 16,
    },
    nextStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    nextStepIcon: {
        width: 32,
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    nextStepText: {
        fontSize: 15,
        color: '#0C4A6E',
        flex: 1,
        lineHeight: 20,
    },
    bottomSpacer: {
        height: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonContainer: {
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    secondaryButton: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2563EB',
        gap: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButtonText: {
        color: '#2563EB',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default OrderConfirmation;