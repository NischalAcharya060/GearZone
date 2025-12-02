import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl, // Add this import
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

// Firebase imports
import { firestore } from '../firebase/config';
import { collection, query, getDocs } from 'firebase/firestore';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigation = useNavigation();
    const isMounted = useRef(true);

    // State for real-time stats
    const [orderCount, setOrderCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [compareCount, setCompareCount] = useState(0);
    const [statsLoading, setStatsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // Add refreshing state

    // --- Data Fetching Logic ---
    const fetchStats = async () => {
        if (!user?.uid) {
            setStatsLoading(false);
            return;
        }

        try {
            const userId = user.uid;

            // Query nested subcollections under the user document
            const ordersQuery = query(
                collection(firestore, 'users', userId, 'orders')
            );
            const wishlistQuery = query(
                collection(firestore, 'users', userId, 'wishlist')
            );
            const compareQuery = query(
                collection(firestore, 'users', userId, 'compare')
            );

            // Execute Queries concurrently
            const [ordersSnapshot, wishlistSnapshot, compareSnapshot] = await Promise.all([
                getDocs(ordersQuery),
                getDocs(wishlistQuery),
                getDocs(compareQuery),
            ]);

            // Only update state if the component is still mounted
            if (isMounted.current) {
                setOrderCount(ordersSnapshot.size);
                setWishlistCount(wishlistSnapshot.size);
                setCompareCount(compareSnapshot.size);
            }
        } catch (error) {
            console.error('Error fetching user stats:', error);
            // On error, we keep the counts at their initial 0 state
            if (isMounted.current) {
                // Set default values on error
                setOrderCount(0);
                setWishlistCount(0);
                setCompareCount(0);
            }
        } finally {
            if (isMounted.current) {
                setStatsLoading(false);
                setRefreshing(false); // Stop refreshing when done
            }
        }
    };

    useEffect(() => {
        isMounted.current = true;
        setStatsLoading(true);
        fetchStats();

        // Cleanup function
        return () => {
            isMounted.current = false;
        };
    }, [user?.uid]);

    // --- Pull to Refresh Handler ---
    const onRefresh = useCallback(async () => {
        if (!user?.uid) {
            setRefreshing(false);
            return;
        }

        setRefreshing(true);
        await fetchStats();
    }, [user?.uid]);

    // --- Logout Handler ---
    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            // Navigate to home after logout
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'HomeTab' }],
                            });
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const menuItems = [
        {
            icon: 'person-outline',
            title: 'Personal Information',
            color: '#2563EB',
            onPress: () => navigation.navigate('My Profile')
        },
        {
            icon: 'location-outline',
            title: 'Addresses',
            color: '#10B981',
            onPress: () => navigation.navigate('Addresses')
        },
        {
            icon: 'document-text-outline',
            title: 'Order History',
            color: '#8B5CF6',
            onPress: () => navigation.navigate('Orders')
        },
        {
            icon: 'star-outline',
            title: 'My Reviews',
            color: '#8B5CF6',
            onPress: () => navigation.navigate('MyReviews')
        },
        {
            icon: 'heart-outline',
            title: 'Wishlist',
            color: '#EC4899',
            onPress: () => navigation.navigate('WishlistTab')
        },
        {
            icon: 'settings-outline',
            title: 'Settings',
            color: '#6B7280',
            onPress: () => Alert.alert('Coming Soon', 'Settings feature coming soon!')
        },
        {
            icon: 'help-circle-outline',
            title: 'Help & Support',
            color: '#EF4444',
            onPress: () => Alert.alert('Coming Soon', 'Help & Support feature coming soon!')
        },
    ];

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.notSignedIn}>
                    <Ionicons name="person-circle-outline" size={80} color="#CCC" />
                    <Text style={styles.notSignedInTitle}>Not Signed In</Text>
                    <Text style={styles.notSignedInText}>
                        Sign in to access your profile and orders
                    </Text>
                    <TouchableOpacity
                        style={styles.signInButton}
                        onPress={() => navigation.navigate('SignIn')}
                    >
                        <Text style={styles.signInButtonText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2563EB']} // Android
                        tintColor="#2563EB" // iOS
                        title="Refreshing..."
                        titleColor="#666"
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{
                                uri: user.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
                            }}
                            style={styles.avatar}
                        />
                        <View style={[
                            styles.roleBadge,
                            user.role === 'admin' ? styles.adminBadge : styles.userBadge
                        ]}>
                            <Text style={styles.roleText}>
                                {user.role === 'admin' ? 'ADMIN' : 'USER'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.userName}>
                        {user.displayName || user.fullName || user.email?.split('@')[0] || 'User'}
                    </Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    {user.phoneNumber && (
                        <Text style={styles.userPhone}>{user.phoneNumber}</Text>
                    )}
                </View>

                {/* Stats - NOW DYNAMICALLY FETCHED */}
                <View style={styles.statsContainer}>
                    {statsLoading ? (
                        <View style={styles.loadingStats}>
                            <ActivityIndicator size="small" color="#2563EB" />
                            <Text style={styles.loadingStatsText}>Loading stats...</Text>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.statItem}
                                onPress={() => navigation.navigate('Orders')}
                            >
                                <Text style={styles.statNumber}>{orderCount}</Text>
                                <Text style={styles.statLabel}>Orders</Text>
                            </TouchableOpacity>
                            <View style={styles.statDivider} />
                            <TouchableOpacity
                                style={styles.statItem}
                                onPress={() => navigation.navigate('WishlistTab')}
                            >
                                <Text style={styles.statNumber}>{wishlistCount}</Text>
                                <Text style={styles.statLabel}>Wishlist</Text>
                            </TouchableOpacity>
                            <View style={styles.statDivider} />
                            <TouchableOpacity
                                style={styles.statItem}
                                onPress={() => navigation.navigate('CompareTab')}
                            >
                                <Text style={styles.statNumber}>{compareCount}</Text>
                                <Text style={styles.statLabel}>Compare</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Admin Panel (Only for admin users) */}
                {user?.role === 'admin' && (
                    <View style={styles.adminSection}>
                        <Text style={styles.adminTitle}>Admin Panel</Text>
                        <View style={styles.adminActions}>
                            <TouchableOpacity
                                style={styles.adminButton}
                                onPress={() => navigation.navigate('AddProduct')}
                            >
                                <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
                                <Text style={styles.adminButtonText}>Add Product</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.adminButton}
                                onPress={() => navigation.navigate('AddCategory')}
                            >
                                <Ionicons name="folder-open-outline" size={20} color="#10B981" />
                                <Text style={styles.adminButtonText}>Add Category</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.adminButton}
                                onPress={() => navigation.navigate('ManageOrders')}
                            >
                                <Ionicons name="list-outline" size={20} color="#F59E0B" />
                                <Text style={styles.adminButtonText}>Manage Orders</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.adminButton}
                                onPress={() => navigation.navigate('Analytics')}
                            >
                                <Ionicons name="analytics-outline" size={20} color="#8B5CF6" />
                                <Text style={styles.adminButtonText}>Analytics</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={item.onPress}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                                <Ionicons name={item.icon} size={20} color={item.color} />
                            </View>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    ))}

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                        </View>
                        <Text style={[styles.menuTitle, { color: '#DC2626' }]}>Logout</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    notSignedIn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    notSignedInTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6B7280',
        marginTop: 16,
        marginBottom: 8,
    },
    notSignedInText: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    signInButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    signInButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    roleBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    adminBadge: {
        backgroundColor: '#2563EB',
    },
    userBadge: {
        backgroundColor: '#10B981',
    },
    roleText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 2,
    },
    userPhone: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginTop: 8,
        paddingVertical: 24,
        marginHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    loadingStats: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    loadingStatsText: {
        fontSize: 14,
        color: '#6B7280',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2563EB',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        height: '60%',
        alignSelf: 'center',
    },
    adminSection: {
        backgroundColor: 'white',
        marginTop: 16,
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    adminTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    adminActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    adminButton: {
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    adminButtonText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
        marginTop: 4,
        textAlign: 'center',
    },
    menuContainer: {
        marginTop: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuTitle: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
});

export default Profile;