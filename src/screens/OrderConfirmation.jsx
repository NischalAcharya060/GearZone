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
    Animated,
    StatusBar,
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
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(50))[0];

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

                // Start animations
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ]).start();
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

    const resetToHome = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'HomeTab' }],
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
                    <Ionicons name="image-outline" size={20} color="#9CA3AF" />
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
                        <ActivityIndicator size="small" color="#6366F1" />
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingText}>Confirming your order...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const estimatedDeliveryRange = getDeliveryDateRange(orderDetails?.createdAt);
    const timelineData = [
        { title: 'Order Placed', description: 'Your order has been received', status: 'placed', icon: 'checkmark-circle' },
        { title: 'Processing', description: 'Preparing your order', status: 'processing', icon: 'build' },
        { title: 'Shipped', description: 'On its way to you', status: 'shipped', icon: 'car' },
        { title: 'Delivered', description: `Expected ${estimatedDeliveryRange}`, status: 'delivered', icon: 'home' },
    ];

    const currentStatusIndex = timelineData.findIndex(step => step.status === orderDetails?.status) || 0;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Modern Header - Moved down with proper spacing */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={resetToHome}
                >
                    <Ionicons name="chevron-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Confirmed</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Success Hero Section */}
                <Animated.View
                    style={[
                        styles.successHero,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={styles.successIconWrapper}>
                        <View style={styles.successIconBackground}>
                            <Ionicons name="checkmark" size={32} color="#FFFFFF" />
                        </View>
                    </View>
                    <Text style={styles.successHeroTitle}>Order Confirmed!</Text>
                    <Text style={styles.successHeroSubtitle}>
                        Thank you for your purchase. We've sent a confirmation email.
                    </Text>

                    <View style={styles.orderInfoBadge}>
                        <Text style={styles.orderInfoLabel}>Order Number</Text>
                        <Text style={styles.orderInfoValue}>#{orderDetails?.orderNumber}</Text>
                    </View>

                    <View style={styles.deliveryCard}>
                        <Ionicons name="time-outline" size={20} color="#6366F1" />
                        <View style={styles.deliveryInfo}>
                            <Text style={styles.deliveryLabel}>Estimated Delivery</Text>
                            <Text style={styles.deliveryDate}>{estimatedDeliveryRange}</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Order Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Order Timeline</Text>
                    <View style={styles.timeline}>
                        {timelineData.map((step, index) => (
                            <View key={index} style={styles.timelineItem}>
                                <View style={styles.timelineContent}>
                                    <View style={[
                                        styles.timelineIcon,
                                        index <= currentStatusIndex ? styles.timelineIconActive : styles.timelineIconInactive
                                    ]}>
                                        <Ionicons
                                            name={step.icon}
                                            size={16}
                                            color={index <= currentStatusIndex ? "#FFFFFF" : "#9CA3AF"}
                                        />
                                    </View>
                                    <View style={styles.timelineText}>
                                        <Text style={[
                                            styles.timelineTitle,
                                            index <= currentStatusIndex && styles.timelineTitleActive
                                        ]}>
                                            {step.title}
                                        </Text>
                                        <Text style={styles.timelineDescription}>{step.description}</Text>
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

                {/* Order Items */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionHeader}>Order Items</Text>
                        <Text style={styles.itemsCount}>({orderDetails?.items?.length || 0})</Text>
                    </View>
                    <View style={styles.itemsCard}>
                        {orderDetails?.items && orderDetails.items.length > 0 ? (
                            orderDetails.items.map((item, index) => (
                                <View key={item.productId || index} style={styles.orderItem}>
                                    <ProductImage product={item} />
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName} numberOfLines={2}>
                                            {item.name || 'Product'}
                                        </Text>
                                        <Text style={styles.itemMeta}>
                                            {formatCurrency(item.price)} × {item.quantity}
                                        </Text>
                                        {(item.size || item.color) && (
                                            <Text style={styles.itemVariants}>
                                                {item.size ? `Size: ${item.size}` : ''}
                                                {item.size && item.color ? ' • ' : ''}
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
                            <View style={styles.emptyItems}>
                                <Ionicons name="cart-outline" size={40} color="#E5E7EB" />
                                <Text style={styles.emptyItemsText}>No items found</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Order Summary</Text>
                    <View style={styles.summaryCard}>
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
                        <View style={styles.divider} />
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalAmount}>
                                {formatCurrency(orderDetails?.total)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Shipping & Payment Info */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                        <View style={styles.infoCardHeader}>
                            <Ionicons name="location" size={20} color="#6366F1" />
                            <Text style={styles.infoCardTitle}>Shipping Address</Text>
                        </View>
                        {orderDetails?.shippingInfo ? (
                            <View style={styles.shippingDetails}>
                                <Text style={styles.shippingName}>{orderDetails.shippingInfo.fullName}</Text>
                                <Text style={styles.shippingAddress}>
                                    {orderDetails.shippingInfo.address}
                                </Text>
                                <Text style={styles.shippingAddress}>
                                    {orderDetails.shippingInfo.city}, {orderDetails.shippingInfo.state} {orderDetails.shippingInfo.zipCode}
                                </Text>
                                <Text style={styles.shippingAddress}>
                                    {orderDetails.shippingInfo.country}
                                </Text>
                                {orderDetails.shippingInfo.phone && (
                                    <Text style={styles.shippingPhone}>
                                        <Ionicons name="call" size={14} color="#6B7280" /> {orderDetails.shippingInfo.phone}
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.noData}>No shipping information</Text>
                        )}
                    </View>

                    <View style={styles.infoCard}>
                        <View style={styles.infoCardHeader}>
                            <Ionicons name="card" size={20} color="#6366F1" />
                            <Text style={styles.infoCardTitle}>Payment Method</Text>
                        </View>
                        <View style={styles.paymentDetails}>
                            <Text style={styles.paymentMethod}>{orderDetails?.paymentMethod || 'Credit Card'}</Text>
                            <View style={styles.paymentStatus}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.paymentStatusText}>Payment Successful</Text>
                            </View>
                        </View>
                        <Text style={styles.paymentTotal}>{formatCurrency(orderDetails?.total)}</Text>
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Modern Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.primaryAction}
                    onPress={handleContinueShopping}
                    activeOpacity={0.8}
                >
                    <Ionicons name="bag-handle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>Continue Shopping</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={handleViewOrders}
                    activeOpacity={0.7}
                >
                    <Ionicons name="document-text-outline" size={20} color="#6366F1" />
                    <Text style={styles.secondaryActionText}>View Orders</Text>
                </TouchableOpacity>
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
    loadingContent: {
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        marginTop: 10, // Added margin to push header down
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    headerRight: {
        width: 40,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10, // Reduced top padding since header is lower
        paddingBottom: 140, // Increased for better spacing with buttons
    },
    successHero: {
        backgroundColor: '#6366F1',
        marginTop: 10,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    successIconWrapper: {
        marginBottom: 16,
    },
    successIconBackground: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    successHeroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    successHeroSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    orderInfoBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    orderInfoLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginBottom: 2,
        textAlign: 'center',
    },
    orderInfoValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '800',
        textAlign: 'center',
    },
    deliveryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        width: '100%',
    },
    deliveryInfo: {
        marginLeft: 10,
        flex: 1,
    },
    deliveryLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginBottom: 2,
    },
    deliveryDate: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    section: {
        marginTop: 20,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginRight: 6,
    },
    itemsCount: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    timeline: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    timelineItem: {
        position: 'relative',
    },
    timelineContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timelineIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    timelineIconActive: {
        backgroundColor: '#6366F1',
    },
    timelineIconInactive: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    timelineText: {
        flex: 1,
        paddingBottom: 20,
    },
    timelineTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 2,
    },
    timelineTitleActive: {
        color: '#1E293B',
    },
    timelineDescription: {
        fontSize: 13,
        color: '#94A3B8',
        lineHeight: 16,
    },
    timelineConnector: {
        position: 'absolute',
        left: 13,
        top: 28,
        bottom: 0,
        width: 2,
        backgroundColor: '#E2E8F0',
    },
    timelineConnectorActive: {
        backgroundColor: '#6366F1',
    },
    itemsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    itemImageContainer: {
        width: 50,
        height: 50,
        borderRadius: 10,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: '#F8FAFC',
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    itemImagePlaceholder: {
        width: 50,
        height: 50,
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageLoading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(248,250,252,0.8)',
    },
    itemInfo: {
        flex: 1,
        marginRight: 8,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    itemMeta: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 1,
    },
    itemVariants: {
        fontSize: 11,
        color: '#94A3B8',
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    emptyItems: {
        alignItems: 'center',
        padding: 30,
    },
    emptyItemsText: {
        fontSize: 13,
        color: '#94A3B8',
        marginTop: 6,
        fontStyle: 'italic',
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 12,
    },
    totalRow: {
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: '800',
        color: '#6366F1',
    },
    infoGrid: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12,
    },
    infoCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginLeft: 6,
    },
    shippingDetails: {
        // Shipping details styles
    },
    shippingName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    shippingAddress: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 1,
        lineHeight: 16,
    },
    shippingPhone: {
        fontSize: 12,
        color: '#64748B',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    paymentDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    paymentMethod: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    paymentStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 3,
    },
    paymentStatusText: {
        fontSize: 11,
        color: '#10B981',
        fontWeight: '600',
    },
    paymentTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6366F1',
    },
    noData: {
        fontSize: 13,
        color: '#94A3B8',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 16,
    },
    bottomSpacer: {
        height: 20,
    },
    actions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 30, // Extra padding for bottom safe area
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        gap: 10,
    },
    primaryAction: {
        backgroundColor: '#6366F1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        gap: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    secondaryAction: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    primaryActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryActionText: {
        color: '#64748B',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default OrderConfirmation;