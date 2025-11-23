import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProductCard = ({ product, onPress }) => {
    const handleAddToCart = () => {
        console.log('Added to cart:', product.name);
    };

    const handleWishlist = () => {
        console.log('Added to wishlist:', product.name);
    };

    const handleCompare = () => {
        console.log('Added to compare:', product.name);
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: product.image }} style={styles.image} />
                <TouchableOpacity
                    style={styles.wishlistButton}
                    onPress={handleWishlist}
                >
                    <Ionicons name="heart-outline" size={20} color="#666" />
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
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.rating}>{product.rating}</Text>
                    <Text style={styles.reviewCount}>({product.reviewCount})</Text>
                </View>

                <View style={styles.priceContainer}>
                    <Text style={styles.price}>${product.price}</Text>
                    {product.originalPrice > product.price && (
                        <Text style={styles.originalPrice}>${product.originalPrice}</Text>
                    )}
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.compareButton}
                        onPress={handleCompare}
                    >
                        <Ionicons name="swap-horizontal-outline" size={18} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.addToCartButton}
                        onPress={handleAddToCart}
                    >
                        <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        margin: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: 160,
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 120,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    wishlistButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 4,
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
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    discountText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    content: {
        padding: 12,
    },
    brand: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
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
    },
    reviewCount: {
        fontSize: 12,
        color: '#666',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    originalPrice: {
        fontSize: 12,
        color: '#999',
        textDecorationLine: 'line-through',
        marginLeft: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    compareButton: {
        padding: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    addToCartButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        flex: 1,
        marginLeft: 8,
    },
    addToCartText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default ProductCard;