import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { firestore } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';

const OrderHistory = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        if (user?.uid) {
            fetchOrders();
        }
    }, [user?.uid]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const ordersRef = collection(firestore, 'orders');
            const q = query(
                ordersRef,
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const ordersData = [];

            for (const docSnap of querySnapshot.docs) {
                const orderData = docSnap.data();

                // Fetch product details for each item in the order
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
                                    productImage: productData.images?.[0] || '📦',
                                    productPrice: productData.price,
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

            setOrders(ordersData);
        } catch (error) {
            console.error('Error fetching orders:', error);
            Alert.alert('Error', 'Failed to load orders. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
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

    const OrderCard = ({ order }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
        >
            <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
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
                    {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
            </View>

            {selectedOrder?.id === order.id && (
                <View style={styles.orderDetails}>
                    <View style={styles.divider} />

                    <Text style={styles.detailsTitle}>Order Details</Text>

                    {order.items?.map((item, index) => (
                        <View key={index} style={styles.orderItem}>
                            <View style={styles.itemImagePlaceholder}>
                                <Text style={styles.itemEmoji}>{item.productImage}</Text>
                            </View>
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName}>{item.productName || item.name}</Text>
                                <Text style={styles.itemPrice}>
                                    {formatCurrency(item.productPrice || item.price)} × {item.quantity}
                                </Text>
                            </View>
                            <Text style={styles.itemTotal}>
                                {formatCurrency((item.productPrice || item.price) * item.quantity)}
                            </Text>
                        </View>
                    ))}

                    {/* Shipping Information from Checkout */}
                    {order.shippingInfo && (
                        <View style={styles.shippingSection}>
                            <Text style={styles.sectionLabel}>Shipping Information</Text>
                            <View style={styles.shippingDetails}>
                                <Text style={styles.shippingName}>{order.shippingInfo.fullName}</Text>
                                <Text style={styles.shippingAddress}>{order.shippingInfo.address}</Text>
                                <Text style={styles.shippingCity}>
                                    {order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.zipCode}
                                </Text>
                                <Text style={styles.shippingCountry}>{order.shippingInfo.country}</Text>
                                <Text style={styles.shippingPhone}>📞 {order.shippingInfo.phone}</Text>
                                <Text style={styles.shippingEmail}>✉️ {order.shippingInfo.email}</Text>
                            </View>
                        </View>
                    )}

                    {/* Payment Information */}
                    <View style={styles.paymentSection}>
                        <Text style={styles.sectionLabel}>Payment Information</Text>
                        <View style={styles.paymentDetails}>
                            <View style={styles.paymentMethod}>
                                <Ionicons name="card-outline" size={16} color="#6B7280" />
                                <Text style={styles.paymentText}>{order.paymentMethod || 'Credit Card'}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: '#10B98120' }]}>
                                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                <Text style={[styles.statusText, { color: '#10B981' }]}>Paid</Text>
                            </View>
                        </View>
                    </View>

                    {/* Order Summary */}
                    <View style={styles.summarySection}>
                        <Text style={styles.sectionLabel}>Order Summary</Text>
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
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.reorderButton}
                            onPress={() => handleReorder(order)}
                        >
                            <Ionicons name="cart" size={16} color="#2563EB" />
                            <Text style={styles.reorderButtonText}>Reorder</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.helpButton}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Ionicons name="help-circle-outline" size={16} color="#6B7280" />
                            <Text style={styles.helpButtonText}>Get Help</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );

    const handleReorder = (order) => {
        Alert.alert(
            'Reorder Items',
            'Would you like to add these items to your cart?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Add to Cart',
                    onPress: () => {
                        // In a real app, you would add items to cart here
                        Alert.alert('Success', 'Items added to cart!');
                        navigation.navigate('Cart');
                    }
                }
            ]
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
            {/* Header */}
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
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.shopButtonText}>Start Shopping</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.ordersHeader}>
                            <Text style={styles.ordersCount}>
                                {orders.length} order{orders.length !== 1 ? 's' : ''}
                            </Text>
                            <TouchableOpacity
                                style={styles.filterButton}
                                onPress={() => Alert.alert('Filter', 'Filter by status coming soon!')}
                            >
                                <Ionicons name="filter" size={20} color="#6B7280" />
                                <Text style={styles.filterText}>Filter</Text>
                            </TouchableOpacity>
                        </View>

                        {orders.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}

                        <View style={styles.bottomSpacer} />
                    </>
                )}
            </ScrollView>
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
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
        padding: 16,
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
        padding: 8,
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
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderInfo: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 16,
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
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
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
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    orderDetails: {
        marginTop: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    detailsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 16,
    },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemImagePlaceholder: {
        width: 40,
        height: 40,
        backgroundColor: '#F3F4F6',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemEmoji: {
        fontSize: 16,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 12,
        color: '#6B7280',
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    shippingSection: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    paymentSection: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    summarySection: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    shippingDetails: {
        marginLeft: 4,
    },
    shippingName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    shippingAddress: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 2,
    },
    shippingCity: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 2,
    },
    shippingCountry: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 4,
    },
    shippingPhone: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 2,
    },
    shippingEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    paymentDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentText: {
        fontSize: 14,
        color: '#374151',
        marginLeft: 6,
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
        paddingTop: 8,
        marginTop: 4,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    summaryValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    reorderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        marginRight: 8,
    },
    reorderButtonText: {
        color: '#2563EB',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        marginLeft: 8,
    },
    helpButtonText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    bottomSpacer: {
        height: 20,
    },
});

export default OrderHistory;