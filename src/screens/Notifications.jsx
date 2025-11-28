import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { firestore } from '../firebase/config';
import {
    collection,
    query,
    getDocs,
    orderBy,
    where,
    doc,
    updateDoc,
    onSnapshot
} from 'firebase/firestore';

const Notifications = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            fetchNotifications();
            setupRealtimeListener();
        }
    }, [user?.uid]);

    const fetchNotifications = async () => {
        try {
            const notificationsRef = collection(firestore, 'notifications');
            const q = query(
                notificationsRef,
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const notificationsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setNotifications(notificationsData);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            Alert.alert('Error', 'Failed to load notifications.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const setupRealtimeListener = () => {
        const notificationsRef = collection(firestore, 'notifications');
        const q = query(
            notificationsRef,
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notificationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotifications(notificationsData);
        });

        return unsubscribe;
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAsRead = async (notificationId) => {
        try {
            const notificationRef = doc(firestore, 'notifications', notificationId);
            await updateDoc(notificationRef, {
                read: true
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(notif => !notif.read);
            const updatePromises = unreadNotifications.map(notif =>
                updateDoc(doc(firestore, 'notifications', notif.id), { read: true })
            );

            await Promise.all(updatePromises);
            Alert.alert('Success', 'All notifications marked as read.');
        } catch (error) {
            console.error('Error marking all as read:', error);
            Alert.alert('Error', 'Failed to mark all as read.');
        }
    };

    const deleteNotification = async (notificationId) => {
        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // You'll need to implement deleteDoc if you want deletion
                            // await deleteDoc(doc(firestore, 'notifications', notificationId));
                            Alert.alert('Info', 'Delete functionality would be implemented here.');
                        } catch (error) {
                            console.error('Error deleting notification:', error);
                        }
                    }
                }
            ]
        );
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order_cancelled':
                return { name: 'close-circle', color: '#EF4444' };
            case 'order_delivered':
                return { name: 'checkmark-circle', color: '#10B981' };
            case 'order_shipped':
                return { name: 'car', color: '#2563EB' };
            case 'order_processing':
                return { name: 'build', color: '#F59E0B' };
            case 'order_confirmed':
                return { name: 'checkmark-done', color: '#8B5CF6' };
            case 'promotion':
                return { name: 'megaphone', color: '#EC4899' };
            default:
                return { name: 'notifications', color: '#6B7280' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    const NotificationItem = ({ item }) => {
        const icon = getNotificationIcon(item.type);

        return (
            <TouchableOpacity
                style={[
                    styles.notificationItem,
                    !item.read && styles.unreadNotification
                ]}
                onPress={() => markAsRead(item.id)}
                onLongPress={() => deleteNotification(item.id)}
            >
                <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                    <Ionicons name={icon.name} size={20} color={icon.color} />
                </View>

                <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationMessage}>{item.message}</Text>
                    <Text style={styles.notificationTime}>
                        {formatDate(item.createdAt)}
                    </Text>
                </View>

                {!item.read && (
                    <View style={styles.unreadDot} />
                )}
            </TouchableOpacity>
        );
    };

    const unreadCount = notifications.filter(notif => !notif.read).length;

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Notifications</Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
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
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                </Text>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead}>
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Notifications List */}
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <NotificationItem item={item} />}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2563EB']}
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.notificationsList}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyTitle}>No Notifications</Text>
                        <Text style={styles.emptyMessage}>
                            You don't have any notifications yet.
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

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
    markAllText: {
        color: '#2563EB',
        fontWeight: '600',
        fontSize: 14,
    },
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
    notificationsList: {
        padding: 16,
        flexGrow: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'flex-start',
    },
    unreadNotification: {
        backgroundColor: '#EFF6FF',
        borderLeftWidth: 3,
        borderLeftColor: '#2563EB',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 8,
    },
    notificationTime: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2563EB',
        marginLeft: 8,
        marginTop: 4,
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
    },
});

export default Notifications;