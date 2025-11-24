import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ProductCard = ({ product, onPress }) => {
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { user } = useAuth();
    const navigation = useNavigation();

    const isWishlisted = isInWishlist(product.id);

    const handleWishlistPress = () => {
        if (!user) {
            Alert.alert(
                'Sign In Required',
                'Please sign in to add items to your wishlist',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Sign In',
                        onPress: () => navigation.navigate('SignIn')
                    }
                ]
            );
            return;
        }

        if (isWishlisted) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: product.image }} style={styles.image} />
                <TouchableOpacity
                    style={styles.wishlistButton}
                    onPress={handleWishlistPress}
                >
                    <Ionicons
                        name={isWishlisted ? "heart" : "heart-outline"}
                        size={20}
                        color={isWishlisted ? "#FF6B6B" : "#666"}
                    />
                </TouchableOpacity>
                {product.originalPrice > product.price && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <Text style={styles.brand}>{product.brand}</Text>
                <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.rating}>{product.rating}</Text>
                    <Text style={styles.reviewCount}>({product.reviewCount})</Text>
                </View>

                <View style={styles.priceContainer}>
                    <Text style={styles.price}>${product.price}</Text>
                    {product.originalPrice > product.price && (
                        <Text style={styles.originalPrice}>${product.originalPrice}</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 8,
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    image: {
        width: '100%',
        height: 140,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    wishlistButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    discountText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    brand: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 4,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
        lineHeight: 18,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    rating: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
        marginRight: 4,
        color: '#1F2937',
    },
    reviewCount: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2563EB',
    },
    originalPrice: {
        fontSize: 12,
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
        marginLeft: 8,
    },
});

export default ProductCard;