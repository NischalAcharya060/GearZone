import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
    FlatList,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { firestore } from '../../firebase/config';
import {
    collection,
    query,
    getDocs,
    orderBy,
    doc,
    updateDoc,
    where,
    getDoc // ADD THIS IMPORT
} from 'firebase/firestore';

const ManageOrders = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [updatingOrder, setUpdatingOrder] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminCheckLoading, setAdminCheckLoading] = useState(true);

    // Check if user is admin
    useEffect(() => {
        checkAdminStatus();
    }, [user]);

    const checkAdminStatus = async () => {
        if (!user?.uid) {
            setIsAdmin(false);
            setAdminCheckLoading(false);
            return;
        }

        try {
            // Check if user has admin role in the users collection
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                setIsAdmin(userData.role === 'admin');
            } else {
                setIsAdmin(false);
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
        } finally {
            setAdminCheckLoading(false);
        }
    };

    useEffect(() => {
        if (user?.uid && !adminCheckLoading) {
            fetchOrders();
        }
    }, [user?.uid, filterStatus, adminCheckLoading]);

    const fetchOrders = async () => {
        if (adminCheckLoading) return;

        setLoading(true);
        try {
            const ordersRef = collection(firestore, 'orders');
            let q;

            if (isAdmin) {
                // Admin can see all orders
                if (filterStatus === 'All') {
                    q = query(ordersRef, orderBy('createdAt', 'desc'));
                } else {
                    q = query(
                        ordersRef,
                        where('status', '==', filterStatus.toLowerCase()),
                        orderBy('createdAt', 'desc')
                    );
                }
            } else {
                // Regular user can only see their own orders
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
            }

            const querySnapshot = await getDocs(q);
            const ordersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setOrders(ordersData);
        } catch (error) {
            console.error('Error fetching orders:', error);
            if (error.code === 'permission-denied') {
                Alert.alert('Permission Denied', 'You do not have permission to view these orders.');
            } else {
                Alert.alert('Error', 'Failed to load orders. Please try again.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        if (!orderId || !isAdmin) return;

        setUpdatingOrder(orderId);
        try {
            const orderRef = doc(firestore, 'orders', orderId);
            await updateDoc(orderRef, {
                status: newStatus,
                updatedAt: new Date().toISOString(),
                updatedBy: user.uid
            });

            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId ? { ...order, status: newStatus } : order
                )
            );

            Alert.alert('Success', `Order status updated to ${newStatus}`);
            setIsModalVisible(false);
            setSelectedOrder(null);
        } catch (error) {
            console.error('Error updating order:', error);
            Alert.alert('Error', 'Failed to update order status.');
        } finally {
            setUpdatingOrder(null);
        }
    };

    const cancelOrder = async (orderId) => {
        if (!orderId || !cancelReason.trim()) {
            Alert.alert('Error', 'Please provide a cancellation reason.');
            return;
        }

        setUpdatingOrder(orderId);
        try {
            const orderRef = doc(firestore, 'orders', orderId);
            await updateDoc(orderRef, {
                status: 'cancelled',
                cancelReason: cancelReason,
                cancelledAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                cancelledBy: user.uid
            });

            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId
                        ? {
                            ...order,
                            status: 'cancelled',
                            cancelReason: cancelReason,
                            cancelledAt: new Date().toISOString()
                        }
                        : order
                )
            );

            Alert.alert('Success', 'Order has been cancelled.');
            setIsCancelModalVisible(false);
            setCancelReason('');
            setSelectedOrder(null);
        } catch (error) {
            console.error('Error cancelling order:', error);
            Alert.alert('Error', 'Failed to cancel order.');
        } finally {
            setUpdatingOrder(null);
        }
    };

    const getStatusColor = (status) => {
        if (!status) return '#6B7280';

        switch (status.toLowerCase()) {
            case 'delivered':
                return '#10B981';
            case 'shipped':
                return '#2563EB';
            case 'processing':
                return '#F59E0B';
            case 'cancelled':
                return '#EF4444';
            case 'pending':
                return '#6B7280';
            case 'confirmed':
                return '#8B5CF6';
            default:
                return '#6B7280';
        }
    };

    const getStatusIcon = (status) => {
        if (!status) return 'help-circle';

        switch (status.toLowerCase()) {
            case 'delivered':
                return 'checkmark-circle';
            case 'shipped':
                return 'car';
            case 'processing':
                return 'build';
            case 'cancelled':
                return 'close-circle';
            case 'pending':
                return 'hourglass';
            case 'confirmed':
                return 'checkmark-done';
            default:
                return 'help-circle';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
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

    const canCancelOrder = (order) => {
        if (!order || !order.status) return false;
        const cancellableStatuses = ['pending', 'confirmed', 'processing'];
        return cancellableStatuses.includes(order.status.toLowerCase());
    };

    const canUpdateStatus = (order) => {
        if (!order || !order.status || !isAdmin) return false;
        const nonUpdatableStatuses = ['cancelled', 'delivered'];
        return !nonUpdatableStatuses.includes(order.status.toLowerCase());
    };

    const getNextStatus = (currentStatus) => {
        if (!currentStatus) return null;

        const statusFlow = {
            'pending': 'confirmed',
            'confirmed': 'processing',
            'processing': 'shipped',
            'shipped': 'delivered'
        };
        return statusFlow[currentStatus.toLowerCase()];
    };

    const getStatusDisplayName = (status) => {
        const statusNames = {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'processing': 'Processing',
            'shipped': 'Shipped',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled'
        };
        return statusNames[status?.toLowerCase()] || status;
    };

    const handleOpenDetails = (order) => {
        setSelectedOrder(order);
        setIsModalVisible(true);
    };

    const handleOpenCancel = (order) => {
        setSelectedOrder(order);
        setIsCancelModalVisible(true);
    };

    const handleCloseModals = () => {
        setIsModalVisible(false);
        setIsCancelModalVisible(false);
        setSelectedOrder(null);
        setCancelReason('');
    };

    // Calculate status counts
    const statusCounts = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        processing: orders.filter(o => o.status === 'processing').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = searchQuery === '' ||
            order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.shippingInfo?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = filterStatus === 'All' || order.status === filterStatus.toLowerCase();

        return matchesSearch && matchesFilter;
    });

    const OrderCard = ({ order }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                    {isAdmin && order.shippingInfo && (
                        <Text style={styles.customerName}>{order.shippingInfo.fullName}</Text>
                    )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '1A' }]}>
                    <Ionicons
                        name={getStatusIcon(order.status)}
                        size={16}
                        color={getStatusColor(order.status)}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {getStatusDisplayName(order.status)}
                    </Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <Text style={styles.itemsCount}>
                    {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
            </View>

            {order.cancelReason && (
                <View style={styles.cancelReason}>
                    <Text style={styles.cancelReasonText}>
                        <Text style={styles.cancelReasonLabel}>Cancellation Reason: </Text>
                        {order.cancelReason}
                    </Text>
                </View>
            )}

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => handleOpenDetails(order)}
                >
                    <Ionicons name="eye-outline" size={16} color="#2563EB" />
                    <Text style={styles.detailsButtonText}>View Details</Text>
                </TouchableOpacity>

                {canCancelOrder(order) && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleOpenCancel(order)}
                        disabled={updatingOrder === order.id}
                    >
                        {updatingOrder === order.id ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <>
                                <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {canUpdateStatus(order) && (
                    <TouchableOpacity
                        style={styles.updateButton}
                        onPress={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                        disabled={updatingOrder === order.id}
                    >
                        {updatingOrder === order.id ? (
                            <ActivityIndicator size="small" color="#10B981" />
                        ) : (
                            <>
                                <Ionicons name="arrow-forward-circle-outline" size={16} color="#10B981" />
                                <Text style={styles.updateButtonText}>
                                    Mark as {getNextStatus(order.status)?.charAt(0).toUpperCase() + getNextStatus(order.status)?.slice(1)}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    if (adminCheckLoading || loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Manage Orders</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>
                        {adminCheckLoading ? 'Checking permissions...' : 'Loading orders...'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {isAdmin ? 'Manage Orders' : 'My Orders'}
                </Text>
                <View style={styles.placeholder} />
            </View>

            {/* Search and Filter Bar */}
            <View style={styles.searchFilterContainer}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#6B7280" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={isAdmin ? "Search by order # or customer..." : "Search by order #..."}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                    contentContainerStyle={styles.filterContainer}
                >
                    {['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterChip,
                                filterStatus === status && styles.filterChipActive
                            ]}
                            onPress={() => setFilterStatus(status)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                filterStatus === status && styles.filterChipTextActive
                            ]}>
                                {status} ({statusCounts[status.toLowerCase()] || 0})
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Orders List */}
            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2563EB']}
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.ordersList}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyTitle}>No Orders Found</Text>
                        <Text style={styles.emptyMessage}>
                            {filterStatus !== 'All'
                                ? `No ${filterStatus.toLowerCase()} orders found.`
                                : 'No orders have been placed yet.'
                            }
                        </Text>
                    </View>
                }
                renderItem={({ item }) => <OrderCard order={item} />}
            />

            {/* Order Details Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCloseModals}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Order #{selectedOrder?.orderNumber || 'N/A'}
                            </Text>
                            <TouchableOpacity onPress={handleCloseModals}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {selectedOrder ? (
                                <>
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Status</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '1A' }]}>
                                            <Ionicons
                                                name={getStatusIcon(selectedOrder.status)}
                                                size={16}
                                                color={getStatusColor(selectedOrder.status)}
                                            />
                                            <Text style={[styles.statusText, { color: getStatusColor(selectedOrder.status) }]}>
                                                {getStatusDisplayName(selectedOrder.status)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Order Date</Text>
                                        <Text style={styles.detailValue}>
                                            {formatDate(selectedOrder.createdAt)}
                                        </Text>
                                    </View>

                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Total Amount</Text>
                                        <Text style={styles.detailValue}>
                                            {formatCurrency(selectedOrder.total)}
                                        </Text>
                                    </View>

                                    {isAdmin && (
                                        <View style={styles.detailSection}>
                                            <Text style={styles.detailLabel}>Customer</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedOrder.shippingInfo?.fullName || 'N/A'}
                                            </Text>
                                            <Text style={styles.detailValue}>
                                                {selectedOrder.shippingInfo?.email || selectedOrder.userEmail || 'N/A'}
                                            </Text>
                                        </View>
                                    )}

                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Items</Text>
                                        {selectedOrder.items?.map((item, index) => (
                                            <View key={index} style={styles.itemRow}>
                                                <Text style={styles.detailValue}>
                                                    • {item.name || item.productName}
                                                </Text>
                                                <Text style={styles.itemDetails}>
                                                    Qty: {item.quantity || 1} × {formatCurrency(item.price || item.productPrice)}
                                                </Text>
                                            </View>
                                        )) || <Text style={styles.detailValue}>No items found</Text>}
                                    </View>

                                    {selectedOrder.shippingInfo && (
                                        <View style={styles.detailSection}>
                                            <Text style={styles.detailLabel}>Shipping Address</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedOrder.shippingInfo.fullName}
                                            </Text>
                                            <Text style={styles.detailValue}>
                                                {selectedOrder.shippingInfo.address}
                                            </Text>
                                            <Text style={styles.detailValue}>
                                                {selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.state} {selectedOrder.shippingInfo.zipCode}
                                            </Text>
                                            <Text style={styles.detailValue}>
                                                {selectedOrder.shippingInfo.country}
                                            </Text>
                                            {selectedOrder.shippingInfo.phone && (
                                                <Text style={styles.detailValue}>
                                                    📞 {selectedOrder.shippingInfo.phone}
                                                </Text>
                                            )}
                                        </View>
                                    )}

                                    {selectedOrder.cancelReason && (
                                        <View style={styles.detailSection}>
                                            <Text style={styles.detailLabel}>Cancellation Reason</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedOrder.cancelReason}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Status Update Section - Only for Admins */}
                                    {isAdmin && canUpdateStatus(selectedOrder) && (
                                        <View style={styles.detailSection}>
                                            <Text style={styles.detailLabel}>Update Status</Text>
                                            <TouchableOpacity
                                                style={styles.modalActionButton}
                                                onPress={() => updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status))}
                                                disabled={updatingOrder === selectedOrder.id}
                                            >
                                                {updatingOrder === selectedOrder.id ? (
                                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                                ) : (
                                                    <Text style={styles.modalActionButtonText}>
                                                        Mark as {getNextStatus(selectedOrder.status)?.charAt(0).toUpperCase() + getNextStatus(selectedOrder.status)?.slice(1)}
                                                    </Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <Text style={styles.detailValue}>No order data available</Text>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={handleCloseModals}
                            >
                                <Text style={styles.modalCloseButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Cancel Order Modal */}
            <Modal
                visible={isCancelModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCloseModals}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => {}}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Cancel Order</Text>
                                    <TouchableOpacity onPress={handleCloseModals}>
                                        <Ionicons name="close" size={24} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalBody}>
                                    <Text style={styles.cancelWarning}>
                                        Cancel order #{selectedOrder?.orderNumber || 'N/A'}?
                                    </Text>
                                    {isAdmin && (
                                        <Text style={styles.cancelSubtext}>
                                            Customer: {selectedOrder?.shippingInfo?.fullName || 'N/A'}
                                        </Text>
                                    )}
                                    <Text style={styles.cancelSubtext}>
                                        This action cannot be undone.
                                    </Text>

                                    <TextInput
                                        style={styles.reasonInput}
                                        placeholder="Please provide a reason for cancellation..."
                                        placeholderTextColor="#9CA3AF"
                                        multiline
                                        numberOfLines={3}
                                        value={cancelReason}
                                        onChangeText={setCancelReason}
                                        returnKeyType="done"
                                        blurOnSubmit={true}
                                    />
                                </View>

                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        style={[styles.modalActionButton, styles.cancelModalButton]}
                                        onPress={() => selectedOrder && cancelOrder(selectedOrder.id)}
                                        disabled={updatingOrder === selectedOrder?.id || !cancelReason.trim() || !selectedOrder}
                                    >
                                        {updatingOrder === selectedOrder?.id ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.modalActionButtonText}>
                                                Confirm Cancellation
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
};

// ... (keep all your existing styles exactly as they were)

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    placeholder: { width: 24 },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    searchFilterContainer: {
        backgroundColor: 'white',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#374151',
    },
    filterScroll: {
        marginHorizontal: -16,
    },
    filterContainer: {
        paddingHorizontal: 16,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#2563EB',
    },
    filterChipText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: 'white',
    },
    ordersList: {
        padding: 16,
        flexGrow: 1,
    },
    orderCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
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
        marginBottom: 2,
    },
    customerName: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    orderDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
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
    cancelReason: {
        backgroundColor: '#FEF2F2',
        padding: 8,
        borderRadius: 6,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#EF4444',
    },
    cancelReasonText: {
        fontSize: 12,
        color: '#DC2626',
    },
    cancelReasonLabel: {
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        flex: 1,
        justifyContent: 'center',
    },
    detailsButtonText: {
        fontSize: 12,
        color: '#2563EB',
        fontWeight: '600',
        marginLeft: 4,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        flex: 1,
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '600',
        marginLeft: 4,
    },
    updateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        flex: 1,
        justifyContent: 'center',
    },
    updateButtonText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '600',
        marginLeft: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
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
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    modalBody: {
        padding: 20,
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    detailSection: {
        marginBottom: 20,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    detailValue: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 2,
    },
    itemRow: {
        marginBottom: 8,
    },
    itemDetails: {
        fontSize: 12,
        color: '#9CA3AF',
        marginLeft: 16,
    },
    modalActionButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    modalActionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    modalCloseButton: {
        backgroundColor: '#6B7280',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelModalButton: {
        backgroundColor: '#EF4444',
    },
    cancelWarning: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    cancelSubtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 4,
    },
    reasonInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#374151',
        textAlignVertical: 'top',
        minHeight: 80,
        marginTop: 16,
    },
});

export default ManageOrders;