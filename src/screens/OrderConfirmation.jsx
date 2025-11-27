import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
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

    const mockupOrderDetails = {
        orderNumber: orderNumber || `ORD-${Math.floor(Math.random() * 100000)}`,
        total: orderTotal || 0,
        subtotal: orderTotal ? orderTotal * 0.9 : 0,
        shippingCost: orderTotal ? orderTotal * 0.1 : 0,
        tax: 0,
        items: route.params?.items || [],
        shippingInfo: {
            fullName: user?.displayName || 'Guest User',
            address: '123 E-Commerce St',
            city: 'Shopville',
            state: 'CA',
            zipCode: '90210',
            country: 'USA',
            phone: '(555) 555-1234',
        },
        paymentMethod: paymentMethod,
        status: 'placed',
        createdAt: new Date().toISOString(),
    };

    // Fetch real order data from Firestore
    useEffect(() => {
        const fetchOrderDetails = async () => {
            let data = null;
            try {
                if (orderId && user) {
                    const orderRef = doc(firestore, 'orders', orderId);
                    const orderDoc = await getDoc(orderRef);

                    if (orderDoc.exists()) {
                        data = { id: orderDoc.id, ...orderDoc.data() };
                    }
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
            } finally {
                setOrderDetails(data || {
                    id: orderId || mockupOrderDetails.orderNumber,
                    ...mockupOrderDetails,
                });
                setLoading(false);
                clearCart();
            }
        };

        fetchOrderDetails();
    }, [orderId, clearCart, user]);

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '$0.00';
        return `$${parseFloat(amount).toFixed(2)}`;
    };

    const getDeliveryDateRange = (dateString) => {
        if (!dateString) return 'Not available';
        const orderDate = new Date(dateString);

        const date4 = new Date(orderDate);
        date4.setDate(orderDate.getDate() + 4);

        const date5 = new Date(orderDate);
        date5.setDate(orderDate.getDate() + 5);

        const dayMonthFormatter = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric'
        });
        const yearFormatter = new Intl.DateTimeFormat('en-US', {
            year: 'numeric'
        });

        const rangeStart = dayMonthFormatter.format(date4);
        let rangeEnd = dayMonthFormatter.format(date5);

        if (date4.getFullYear() !== date5.getFullYear()) {
            return `${rangeStart}, ${yearFormatter.format(date4)} - ${rangeEnd}, ${yearFormatter.format(date5)}`;
        }

        rangeEnd += `, ${yearFormatter.format(date5)}`;

        return `${rangeStart} - ${rangeEnd}`;
    };

    // --- UPDATED NAVIGATION FUNCTIONS ---
    const resetToHome = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'HomeTab' }], // Assumes 'HomeTab' is the name of your Tab Navigator
        });
    };

    const handleContinueShopping = () => {
        resetToHome();
    };

    const handleViewOrders = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'ProfileTab', params: { screen: 'Orders' } }],
        });
    };
    // ------------------------------------

    const ProductImage = ({ product }) => {
        const [imageError, setImageError] = useState(false);
        const [imageLoading, setImageLoading] = useState(true);

        const handleImageError = () => {
            setImageError(true);
            setImageLoading(false);
        };

        const imageUri = (product?.images && product.images.length > 0)
            ? product.images[0]
            : (product?.image || null);

        if (imageError || !imageUri) {
            return (
                <View style={styles.itemImagePlaceholder}>
                    <Ionicons name="image-outline" size={24} color="#999" />
                </View>
            );
        }

        return (
            <View style={styles.itemImageContainer}>
                <Image
                    source={{ uri: imageUri }}
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

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Confirming your order...</Text>
            </SafeAreaView>
        );
    }

    const estimatedDeliveryRange = getDeliveryDateRange(orderDetails?.createdAt);
    const timelineData = [
        { title: 'Order Placed', description: 'Your order has been received', status: 'placed' },
        { title: 'Processing', description: 'Preparing your order', status: 'processing' },
        { title: 'Shipped', description: 'On its way to you', status: 'shipped' },
        { title: 'Delivered', description: `Expected ${estimatedDeliveryRange}`, status: 'delivered' },
    ];

    const currentStatusIndex = timelineData.findIndex(step => step.status === orderDetails?.status) || 0;

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={resetToHome} // Use reset function
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Confirmation</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
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
                        Thank you for your purchase. Your order has been successfully placed.
                    </Text>
                    <View style={styles.orderNumberBadge}>
                        <Text style={styles.orderNumberText}>Order #{orderDetails?.orderNumber}</Text>
                    </View>
                    {/* Expected Delivery Date Range */}
                    <View style={styles.deliveryEstimateBox}>
                        <Ionicons name="calendar-outline" size={18} color="#2563EB" />
                        <Text style={styles.deliveryEstimateText}>
                            Estimated Delivery: <Text style={styles.deliveryEstimateDate}>{estimatedDeliveryRange}</Text>
                        </Text>
                    </View>
                </View>

                {/* Order Timeline Card */}
                <View style={styles.timelineCard}>
                    <Text style={styles.sectionTitle}>Order Status</Text>
                    <View style={styles.timeline}>
                        {timelineData.map((step, index) => (
                            <View key={index}>
                                <View style={styles.timelineStep}>
                                    <View style={[
                                        styles.timelineDot,
                                        index < currentStatusIndex && styles.timelineDotComplete,
                                        index === currentStatusIndex && styles.timelineDotActive,
                                        index > currentStatusIndex && styles.timelineDotUpcoming,
                                    ]}>
                                        {index < currentStatusIndex ? (
                                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                        ) : (
                                            <View style={[
                                                styles.timelineDotInner,
                                                index === currentStatusIndex && styles.timelineDotInnerActive
                                            ]} />
                                        )}
                                    </View>
                                    <View style={styles.timelineStepContent}>
                                        <Text style={[
                                            styles.timelineStepTitle,
                                            index === currentStatusIndex && styles.timelineStepTitleActive
                                        ]}>
                                            {step.title}
                                        </Text>
                                        <Text style={styles.timelineStepDescription}>{step.description}</Text>
                                    </View>
                                </View>

                                {index < timelineData.length - 1 && (
                                    <View style={[
                                        styles.timelineConnector,
                                        index < currentStatusIndex && styles.timelineConnectorActive
                                    ]} />
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Order Summary Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="receipt-outline" size={20} color="#2563EB" />
                        <Text style={styles.cardTitle}>Order Details</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Items Ordered ({orderDetails?.items?.length || 0})</Text>
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
                                    {(item.size || item.color) && (
                                        <Text style={styles.itemVariant}>
                                            {item.size ? `Size: ${item.size}` : ''}
                                            {item.size && item.color ? ' | ' : ''}
                                            {item.color ? `Color: ${item.color}` : ''}
                                        </Text>
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
                            <Text style={styles.noItemsText}>No items found in this order</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    {/* Order Total */}
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
                    {/* Shipping Information */}
                    <View style={[styles.card, styles.halfCard]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="location-outline" size={20} color="#2563EB" />
                            <Text style={styles.cardTitle}>Shipping</Text>
                        </View>
                        {orderDetails?.shippingInfo ? (
                            <View style={styles.shippingInfo}>
                                <Text style={styles.shippingName}>{orderDetails.shippingInfo.fullName}</Text>
                                <Text style={styles.shippingAddress}>
                                    {orderDetails.shippingInfo.address}, {orderDetails.shippingInfo.city}
                                </Text>
                                <Text style={styles.shippingAddress}>
                                    {orderDetails.shippingInfo.state} {orderDetails.shippingInfo.zipCode}, {orderDetails.shippingInfo.country}
                                </Text>
                                {orderDetails.shippingInfo.phone && (
                                    <Text style={styles.shippingPhone}>
                                        <Ionicons name="call-outline" size={14} color="#6B7280" /> {orderDetails.shippingInfo.phone}
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
        paddingBottom: 120,
        paddingHorizontal: 16,
    },
    successBanner: {
        backgroundColor: 'white',
        marginTop: 16,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
    },
    successIconContainer: {
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 26,
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
        marginBottom: 20,
    },
    orderNumberBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        marginBottom: 16,
    },
    orderNumberText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2563EB',
    },
    deliveryEstimateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    deliveryEstimateText: {
        fontSize: 14,
        color: '#10B981',
        marginLeft: 8,
        fontWeight: '500',
    },
    deliveryEstimateDate: {
        fontWeight: '700',
        color: '#047857',
    },
    timelineCard: {
        backgroundColor: 'white',
        marginTop: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 20,
    },
    timeline: {
        // Timeline container
    },
    timelineStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        marginTop: 2,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    timelineDotInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFFFFF',
    },
    timelineDotInnerActive: {
        backgroundColor: '#2563EB',
    },
    timelineDotComplete: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    timelineDotActive: {
        backgroundColor: '#FFFFFF',
        borderColor: '#2563EB',
    },
    timelineDotUpcoming: {
        backgroundColor: '#E5E7EB',
        borderColor: '#D1D5DB',
    },
    timelineStepContent: {
        flex: 1,
        paddingBottom: 10,
    },
    timelineStepTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    timelineStepTitleActive: {
        color: '#2563EB',
        fontWeight: '700',
    },
    timelineStepDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 18,
    },
    timelineConnector: {
        width: 2,
        height: 30,
        backgroundColor: '#E5E7EB',
        marginLeft: 11,
        marginVertical: -6,
    },
    timelineConnectorActive: {
        backgroundColor: '#10B981',
    },
    card: {
        backgroundColor: 'white',
        marginTop: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    halfCard: {
        flex: 1,
        marginTop: 0,
    },
    infoRow: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 16,
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
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
    },
    itemImageContainer: {
        position: 'relative',
        width: 50,
        height: 50,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 12,
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    itemImagePlaceholder: {
        width: 50,
        height: 50,
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
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    itemDetails: {
        flex: 1,
        marginRight: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 13,
        color: '#6B7280',
    },
    itemVariant: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    itemTotal: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
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
        paddingVertical: 10,
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
        fontWeight: '600',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    totalAmount: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    shippingInfo: {
        // Shipping info styles
    },
    shippingName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    shippingAddress: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 2,
        lineHeight: 18,
    },
    shippingPhone: {
        fontSize: 14,
        color: '#6B7280',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
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