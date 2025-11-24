import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';

const Wishlist = () => {
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();
    const navigation = useNavigation();

    const WishlistItem = ({ item }) => (
        <View style={styles.wishlistItem}>
            <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { product: item })}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
            </TouchableOpacity>
            <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemBrand}>{item.brand}</Text>
                <Text style={styles.itemPrice}>${item.price}</Text>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.addToCartButton}
                        onPress={() => addToCart(item)}
                    >
                        <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromWishlist(item.id)}
            >
                <Ionicons name="heart" size={24} color="#FF6B6B" />
            </TouchableOpacity>
        </View>
    );

    if (wishlistItems.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="heart-outline" size={80} color="#CCC" />
                    <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
                    <Text style={styles.emptySubtitle}>
                        Save your favorite items here for later
                    </Text>
                    <TouchableOpacity
                        style={styles.continueShoppingButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.continueShoppingText}>Browse Products</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Wishlist</Text>
                <Text style={styles.itemCount}>{wishlistItems.length} items</Text>
            </View>

            <FlatList
                data={wishlistItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <WishlistItem item={item} />}
                style={styles.wishlistList}
                contentContainerStyle={styles.wishlistContent}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    itemCount: {
        fontSize: 14,
        color: '#666',
    },
    wishlistList: {
        flex: 1,
    },
    wishlistContent: {
        padding: 16,
    },
    wishlistItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    itemDetails: {
        flex: 1,
        marginLeft: 12,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    itemBrand: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563EB',
        marginBottom: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
    },
    addToCartButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    addToCartText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    removeButton: {
        padding: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    continueShoppingButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    continueShoppingText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Wishlist;