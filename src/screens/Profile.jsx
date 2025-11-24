import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Profile = () => {
    const menuItems = [
        { icon: 'person-outline', title: 'Personal Information', color: '#2563EB' },
        { icon: 'location-outline', title: 'Addresses', color: '#10B981' },
        { icon: 'card-outline', title: 'Payment Methods', color: '#F59E0B' },
        { icon: 'document-text-outline', title: 'Order History', color: '#8B5CF6' },
        { icon: 'heart-outline', title: 'Wishlist', color: '#EC4899' },
        { icon: 'settings-outline', title: 'Settings', color: '#6B7280' },
        { icon: 'help-circle-outline', title: 'Help & Support', color: '#EF4444' },
        { icon: 'log-out-outline', title: 'Logout', color: '#DC2626' },
    ];

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
                        <TouchableOpacity style={styles.editButton}>
                            <Ionicons name="camera-outline" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>John Doe</Text>
                    <Text style={styles.userEmail}>john.doe@example.com</Text>
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

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.menuItem}>
                            <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                                <Ionicons name={item.icon} size={20} color={item.color} />
                            </View>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    ))}
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
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2563EB',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginTop: 8,
        paddingVertical: 24,
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
        color: '#666',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
    },
    menuContainer: {
        marginTop: 8,
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
        color: '#333',
    },
});

export default Profile;