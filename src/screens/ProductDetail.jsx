import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    FlatList,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useAuth } from '../context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

const ProductDetail = ({ route, navigation }) => {
    const { product } = route.params;
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);

    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { addToCompare, canAddToCompare } = useCompare();
    const { user } = useAuth();

    const isWishlisted = isInWishlist(product.id);

    // --- MODIFIED IMAGE LOGIC ---
    // Use product.images array if available, or fall back to product.image in an array.
    const productImages = product.images && Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [product.image];

    // Fallback URL if no image is present (same as in ProductCard for consistency)
    const fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop';

    const showLoginAlert = (action) => {
        Alert.alert(
            'Sign In Required',
            `Please sign in to ${action}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign In',
                    onPress: () => navigation.navigate('SignIn')
                }
            ]
        );
    };

    const handleAddToCart = () => {
        if (!user) {
            showLoginAlert('add items to cart');
            return;
        }

        for (let i = 0; i < quantity; i++) {
            addToCart(product);
        }
        Alert.alert('Success', `${quantity} ${product.name} added to cart!`);
    };

    const handleWishlistToggle = () => {
        if (!user) {
            showLoginAlert('add items to wishlist');
            return;
        }

        if (isWishlisted) {
            removeFromWishlist(product.id);
            Alert.alert('Removed', 'Product removed from wishlist');
        } else {
            addToWishlist(product);
            Alert.alert('Added', 'Product added to wishlist');
        }
    };

    const handleAddToCompare = () => {
        if (!user) {
            showLoginAlert('compare products');
            return;
        }

        if (canAddToCompare()) {
            addToCompare(product);
            Alert.alert('Success', 'Product added to compare!');
        } else {
            Alert.alert(
                'Limit Reached',
                'You can only compare 2 products at a time. Remove one to add another.',
                [
                    { text: 'OK', style: 'default' },
                    {
                        text: 'View Compare',
                        onPress: () => navigation.navigate('CompareTab')
                    }
                ]
            );
        }
    };

    const handleBuyNow = () => {
        if (!user) {
            showLoginAlert('proceed with purchase');
            return;
        }

        // 1. Prepare the single item for direct checkout
        const directItem = {
            ...product,
            quantity: quantity,
        };

        Alert.alert('Success', `Proceeding to Checkout with ${quantity} x ${product.name}.`);

        // 2. Navigate directly to the 'Checkout' screen in the 'CartTab' stack,
        //    passing the direct purchase item.
        navigation.navigate('CartTab', {
            screen: 'Checkout',
            params: {
                directPurchaseItem: directItem,
            }
        });
    };

    const increaseQuantity = () => setQuantity(prev => prev + 1);
    const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

    const renderImageThumbnail = ({ item, index }) => (
        <TouchableOpacity
            style={[
                styles.thumbnail,
                selectedImageIndex === index && styles.thumbnailSelected,
            ]}
            onPress={() => setSelectedImageIndex(index)}
        >
            <Image source={{ uri: item || fallbackImage }} style={styles.thumbnailImage} />
        </TouchableOpacity>
    );

    const renderSpecification = ({ item }) => (
        <View style={styles.specItem}>
            <Text style={styles.specLabel}>{item.label}</Text>
            <Text style={styles.specValue}>{item.value}</Text>
        </View>
    );

    const specifications = [
        { label: 'Brand', value: product.brand },
        { label: 'Category', value: product.category },
        { label: 'Rating', value: `${product.rating}/5 (${product.reviewCount} reviews)` },
        ...Object.entries(product.specifications || {}).map(([key, value]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: Array.isArray(value) ? value.join(', ') : value,
        })),
    ];

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Details</Text>
                <TouchableOpacity
                    style={styles.wishlistButton}
                    onPress={handleWishlistToggle}
                >
                    <Ionicons
                        name={isWishlisted ? "heart" : "heart-outline"}
                        size={24}
                        color={isWishlisted ? "#FF6B6B" : "#333"}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.imageSection}>
                    {/* Main Image Display */}
                    <Image
                        source={{ uri: productImages[selectedImageIndex] || fallbackImage }}
                        style={styles.mainImage}
                    />

                    {/* Image Indicators */}
                    {productImages.length > 1 && (
                        <View style={styles.imageIndicators}>
                            {productImages.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.imageDot,
                                        selectedImageIndex === index && styles.imageDotActive,
                                    ]}
                                />
                            ))}
                        </View>
                    )}

                    {/* Thumbnails */}
                    {productImages.length > 1 && (
                        <FlatList
                            data={productImages}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(_, index) => index.toString()}
                            renderItem={renderImageThumbnail}
                            contentContainerStyle={styles.thumbnailsContainer}
                        />
                    )}
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.brandContainer}>
                        <Text style={styles.brand}>{product.brand}</Text>
                        {product.originalPrice > product.price && (
                            <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>
                                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.productName}>{product.name}</Text>

                    <View style={styles.ratingContainer}>
                        <View style={styles.ratingStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name="star"
                                    size={16}
                                    color={star <= Math.floor(product.rating) ? "#FFD700" : "#E5E7EB"}
                                />
                            ))}
                        </View>
                        <Text style={styles.ratingText}>
                            {product.rating} ({product.reviewCount} reviews)
                        </Text>
                    </View>

                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>${product.price}</Text>
                        {product.originalPrice > product.price && (
                            <Text style={styles.originalPrice}>${product.originalPrice}</Text>
                        )}
                    </View>

                    <Text style={styles.description}>{product.description}</Text>

                    {!user && (
                        <View style={styles.loginPrompt}>
                            <Ionicons name="log-in-outline" size={20} color="#2563EB" />
                            <Text style={styles.loginPromptText}>
                                Sign in to add to cart, wishlist, or compare
                            </Text>
                            <TouchableOpacity
                                style={styles.loginPromptButton}
                                onPress={() => navigation.navigate('SignIn')}
                            >
                                <Text style={styles.loginPromptButtonText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {user && (
                    <View style={styles.quantitySection}>
                        <Text style={styles.sectionTitle}>Quantity</Text>
                        <View style={styles.quantitySelector}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={decreaseQuantity}
                            >
                                <Ionicons name="remove" size={20} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{quantity}</Text>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={increaseQuantity}
                            >
                                <Ionicons name="add" size={20} color="#333" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={styles.specsSection}>
                    <Text style={styles.sectionTitle}>Specifications</Text>
                    <FlatList
                        data={specifications}
                        scrollEnabled={false}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderSpecification}
                    />
                </View>

                {product.specifications && product.specifications.features && (
                    <View style={styles.featuresSection}>
                        <Text style={styles.sectionTitle}>Key Features</Text>
                        {product.specifications.features.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.spacer} />
            </ScrollView>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[
                        styles.compareButton,
                        !user && styles.disabledButton
                    ]}
                    onPress={handleAddToCompare}
                    disabled={!user}
                >
                    <Ionicons
                        name="swap-horizontal"
                        size={20}
                        color={user ? "#2563EB" : "#9CA3AF"}
                    />
                    <Text style={[
                        styles.compareButtonText,
                        !user && styles.disabledButtonText
                    ]}>
                        Compare
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.addToCartButton,
                        !user && styles.disabledButton
                    ]}
                    onPress={handleAddToCart}
                    disabled={!user}
                >
                    <Ionicons
                        name="cart-outline"
                        size={20}
                        color={user ? "white" : "#9CA3AF"}
                    />
                    <Text style={[
                        styles.addToCartButtonText,
                        !user && styles.disabledButtonText
                    ]}>
                        Add to Cart
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.buyNowButton,
                        !user && styles.disabledButton
                    ]}
                    onPress={handleBuyNow}
                    disabled={!user}
                >
                    <Text style={[
                        styles.buyNowButtonText,
                        !user && styles.disabledButtonText
                    ]}>
                        Buy Now
                    </Text>
                </TouchableOpacity>
            </View>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    wishlistButton: {
        padding: 4,
    },
    imageSection: {
        backgroundColor: 'white',
        paddingBottom: 16,
    },
    mainImage: {
        width: screenWidth,
        height: 300,
        resizeMode: 'contain',
    },
    imageIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    imageDot: {
        height: 8,
        width: 8,
        borderRadius: 4,
        backgroundColor: '#D1D5DB',
        marginHorizontal: 4,
    },
    imageDotActive: {
        backgroundColor: '#2563EB',
        width: 24,
    },
    thumbnailsContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    thumbnailSelected: {
        borderColor: '#2563EB',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        borderRadius: 6,
    },
    infoSection: {
        backgroundColor: 'white',
        padding: 16,
        marginTop: 8,
    },
    brandContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    brand: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    discountBadge: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    discountText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ratingStars: {
        flexDirection: 'row',
        marginRight: 8,
    },
    ratingText: {
        fontSize: 14,
        color: '#666',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    price: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2563EB',
        marginRight: 12,
    },
    originalPrice: {
        fontSize: 18,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#666',
        marginBottom: 16,
    },
    loginPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    loginPromptText: {
        flex: 1,
        fontSize: 14,
        color: '#1E40AF',
        marginLeft: 8,
        marginRight: 12,
    },
    loginPromptButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    loginPromptButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    quantitySection: {
        backgroundColor: 'white',
        padding: 16,
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 4,
    },
    quantityButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    quantityText: {
        fontSize: 18,
        fontWeight: '600',
        marginHorizontal: 16,
        minWidth: 30,
        textAlign: 'center',
    },
    specsSection: {
        backgroundColor: 'white',
        padding: 16,
        marginTop: 8,
    },
    specItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    specLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    specValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    featuresSection: {
        backgroundColor: 'white',
        padding: 16,
        marginTop: 8,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    featureText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 12,
    },
    spacer: {
        height: 100,
    },
    actionButtons: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
    },
    compareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#2563EB',
        borderRadius: 8,
        marginRight: 12,
        flex: 1,
    },
    compareButtonText: {
        color: '#2563EB',
        fontWeight: '600',
        marginLeft: 8,
    },
    addToCartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2563EB',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginRight: 12,
        flex: 2,
    },
    addToCartButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 8,
    },
    buyNowButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buyNowButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#F3F4F6',
        borderColor: '#D1D5DB',
    },
    disabledButtonText: {
        color: '#9CA3AF',
    },
});

export default ProductDetail;