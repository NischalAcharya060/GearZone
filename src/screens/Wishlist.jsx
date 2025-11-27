import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';

const Wishlist = () => {
    const {
        wishlistItems,
        removeFromWishlist,
        loading,
        moveToCart,
        clearWishlist
    } = useWishlist();
    const { addToCart } = useCart();
    const navigation = useNavigation();

    const handleMoveToCart = async (item) => {
        await moveToCart(item, { addToCart });
    };

    const handleClearWishlist = () => {
        Alert.alert(
            'Clear Wishlist',
            'Are you sure you want to clear your entire wishlist?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => clearWishlist()
                }
            ]
        );
    };

    const WishlistItem = ({ item }) => {
        const productImage = item.images && item.images.length > 0
            ? item.images[0]
            : 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&h=500&fit=crop';

        return (
            <View style={styles.wishlistItem}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('ProductDetail', { product: item })}
                    style={styles.imageContainer}
                >
                    <Image
                        source={{ uri: productImage }}
                        style={styles.itemImage}
                        resizeMode="cover"
                    />
                </TouchableOpacity>

                <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.itemBrand}>{item.brand}</Text>

                    <View style={styles.priceContainer}>
                        <Text style={styles.itemPrice}>${item.price}</Text>
                        {item.originalPrice > item.price && (
                            <Text style={styles.originalPrice}>${item.originalPrice}</Text>
                        )}
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.moveToCartButton}
                            onPress={() => handleMoveToCart(item)}
                        >
                            <Ionicons name="cart" size={16} color="white" />
                            <Text style={styles.moveToCartText}>Move to Cart</Text>
                        </TouchableOpacity>

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
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#2563EB" style={styles.loadingIndicator} />
            </SafeAreaView>
        );
    }

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
                <View>
                    <Text style={styles.title}>My Wishlist</Text>
                    <Text style={styles.itemCount}>{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}</Text>
                </View>

                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearWishlist}
                >
                    <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={wishlistItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <WishlistItem item={item} />}
                style={styles.wishlistList}
                contentContainerStyle={styles.wishlistContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingIndicator: {
        flex: 1,
        justifyContent: 'center',
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
        marginTop: 2,
    },
    clearButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FEF2F2',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    clearButtonText: {
        fontSize: 14,
        color: '#DC2626',
        fontWeight: '600',
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
    imageContainer: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    itemDetails: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
        lineHeight: 20,
    },
    itemBrand: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563EB',
        marginRight: 8,
    },
    originalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    moveToCartButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 4,
    },
    moveToCartText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    addToCartButton: {
        flex: 1,
        backgroundColor: '#2563EB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    addToCartText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    removeButton: {
        padding: 4,
        alignSelf: 'flex-start',
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
        lineHeight: 22,
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