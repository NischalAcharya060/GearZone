import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigation = useNavigation();

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
                            navigation.navigate('HomeTab');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const menuItems = [
        { icon: 'person-outline', title: 'Personal Information', color: '#2563EB' },
        { icon: 'location-outline', title: 'Addresses', color: '#10B981' },
        { icon: 'card-outline', title: 'Payment Methods', color: '#F59E0B' },
        { icon: 'document-text-outline', title: 'Order History', color: '#8B5CF6' },
        { icon: 'heart-outline', title: 'Wishlist', color: '#EC4899' },
        { icon: 'settings-outline', title: 'Settings', color: '#6B7280' },
        { icon: 'help-circle-outline', title: 'Help & Support', color: '#EF4444' },
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
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' }}
                            style={styles.avatar}
                        />
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>
                                {user.role === 'admin' ? 'ADMIN' : 'USER'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.userName}>{user.fullName || 'User'}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userPhone}>{user.phone}</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>12</Text>
                        <Text style={styles.statLabel}>Orders</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>8</Text>
                        <Text style={styles.statLabel}>Wishlist</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>2</Text>
                        <Text style={styles.statLabel}>Compare</Text>
                    </View>
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
                            onPress={() => {
                                // Add navigation handlers for each menu item
                                switch(item.title) {
                                    case 'Personal Information':
                                        // navigation.navigate('PersonalInfo');
                                        Alert.alert('Coming Soon', 'Personal Information feature coming soon!');
                                        break;
                                    case 'Addresses':
                                        navigation.navigate('Addresses');
                                        break;
                                    case 'Order History':
                                        navigation.navigate('Orders');
                                        break;
                                    case 'Wishlist':
                                        navigation.navigate('WishlistTab');
                                        break;
                                    case 'Settings':
                                        // navigation.navigate('Settings');
                                        Alert.alert('Coming Soon', 'Settings feature coming soon!');
                                        break;
                                    case 'Help & Support':
                                        // navigation.navigate('HelpSupport');
                                        Alert.alert('Coming Soon', 'Help & Support feature coming soon!');
                                        break;
                                    default:
                                        break;
                                }
                            }}
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
        marginBottom: 12,
    },
    signInButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    backToHomeButton: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    backToHomeButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '500',
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
        backgroundColor: '#2563EB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
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