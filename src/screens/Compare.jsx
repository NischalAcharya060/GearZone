import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

// Modernized Color Palette (Consistent with Home and Wishlist)
const COLORS = {
    primary: '#4F46E5', // Indigo 600
    secondary: '#818CF8', // Light Indigo
    success: '#10B981', // Green for cart actions
    danger: '#EF4444', // Red for removal/destructive actions
    background: '#F9FAFB', // Light gray background
    surface: '#FFFFFF', // White for cards/containers
    text: '#1F2937', // Dark text
    subText: '#6B7280', // Gray secondary text
    border: '#E5E7EB', // Light gray border
    accentBackground: '#EEF2FF', // Primary light background
};

// Fixed width for product columns in the comparison table
const PRODUCT_COLUMN_WIDTH = 180;
const SPEC_LABEL_WIDTH = 120;

const Compare = () => {
    const { compareItems, removeFromCompare, clearCompare, loading } = useCompare();
    const { addToCart, bulkAddToCart } = useCart();
    const { user } = useAuth();
    const navigation = useNavigation();

    const getProductImage = (item) => {
        if (item.images && item.images.length > 0) {
            return item.images[0];
        }
        return item.image || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&h=500&fit=crop';
    };

    const showLoginAlert = (action) => {
        Alert.alert(
            'Sign In Required',
            `Please sign in to ${action}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign In',
                    onPress: () => navigation.navigate('ProfileTab', { screen: 'SignIn' })
                }
            ]
        );
    };

    const handleAddToCart = async (item) => {
        if (!user) {
            showLoginAlert('add items to cart');
            return;
        }

        try {
            await addToCart(item);
            Alert.alert('Success', `${item.name} added to cart!`, [{ text: 'OK' }]);
        } catch (error) {
            Alert.alert('Error', 'Failed to add item to cart');
        }
    };

    const handleAddAllToCart = async () => {
        if (!user) {
            showLoginAlert('add items to cart');
            return;
        }

        try {
            await bulkAddToCart(compareItems);
            Alert.alert('Success', 'All compared items added to cart!', [{ text: 'OK' }]);
        } catch (error) {
            Alert.alert('Error', 'Failed to add items to cart');
        }
    };

    const handleClearCompare = () => {
        Alert.alert(
            'Clear Compare List',
            'Are you sure you want to clear your compare list?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => clearCompare()
                }
            ]
        );
    };

    const getConsolidatedSpecs = (items) => {
        if (items.length === 0) return [];

        let specKeys = [
            // Base specs
            { key: 'price', title: 'Price', isPrice: true },
            { key: 'brand', title: 'Brand' },
            { key: 'rating', title: 'Rating' },
            { key: 'category', title: 'Category' },
            { key: 'stock', title: 'Availability' },
        ];

        // Collect all unique dynamic specification keys
        const dynamicKeys = new Set();
        items.forEach(item => {
            if (item.specifications) {
                Object.keys(item.specifications).forEach(key => dynamicKeys.add(key));
            }
        });

        // Add dynamic specs
        Array.from(dynamicKeys).sort().forEach(key => {
            specKeys.push({
                key,
                // Format key to Title Case with spaces
                title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
                isDynamic: true
            });
        });

        return specKeys;
    };

    const formatSpecValue = (product, spec) => {
        if (!product) return '-';

        if (spec.key === 'price') return `$${product.price?.toFixed(2) || '0.00'}`;
        if (spec.key === 'brand') return product.brand || '-';
        if (spec.key === 'rating') return product.rating ? `${product.rating.toFixed(1)}/5` : '-';
        if (spec.key === 'category') return product.category || '-';
        if (spec.key === 'stock') return product.stock > 0 ? 'In Stock' : 'Out of Stock';

        if (spec.isDynamic) {
            const value = product.specifications?.[spec.key];
            if (value === undefined || value === null) return '-';
            if (Array.isArray(value)) return value.join(', ');
            return String(value);
        }

        return '-';
    };

    const allSpecs = getConsolidatedSpecs(compareItems);

    const ProductHeader = ({ item, index }) => (
        <View style={[styles.productHeader, index % 2 === 1 && { backgroundColor: COLORS.accentBackground }]}>
            <TouchableOpacity
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
                activeOpacity={0.8}
            >
                <Image
                    source={{ uri: getProductImage(item) }}
                    style={styles.productImage}
                    resizeMode="contain"
                />
            </TouchableOpacity>
            <Text style={styles.productName} numberOfLines={2}>
                {item.name}
            </Text>
            <TouchableOpacity
                style={[
                    styles.productAddToCart,
                    !user && styles.disabledButton
                ]}
                onPress={() => handleAddToCart(item)}
                disabled={!user}
                activeOpacity={0.8}
            >
                <Ionicons
                    name="cart-outline"
                    size={16}
                    color={user ? COLORS.surface : COLORS.subText}
                />
                <Text style={[
                    styles.productAddToCartText,
                    !user && styles.disabledButtonText
                ]}>
                    Add to Cart
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.productRemoveButton}
                onPress={() => removeFromCompare(item.id)}
            >
                <Ionicons name="close-circle" size={24} color={COLORS.danger} />
            </TouchableOpacity>
        </View>
    );

    const SpecificationRow = ({ spec, product1, product2, index }) => {
        const isOdd = index % 2 !== 0;

        return (
            <View style={[styles.specRowContainer, isOdd && styles.specRowContainerAlt]}>
                {/* Spec Label */}
                <View style={styles.specLabelCell}>
                    <Text style={styles.specLabelText}>{spec.title}</Text>
                </View>

                {/* Product 1 Value */}
                <View style={styles.specValueCell}>
                    <Text style={[
                        styles.specValueText,
                        spec.isPrice && styles.specPriceText,
                        formatSpecValue(product1, spec) === 'In Stock' && styles.specSuccess
                    ]}>
                        {formatSpecValue(product1, spec)}
                    </Text>
                </View>

                {/* Product 2 Value */}
                <View style={[styles.specValueCell, { marginRight: 0 }]}>
                    <Text style={[
                        styles.specValueText,
                        spec.isPrice && styles.specPriceText,
                        formatSpecValue(product2, spec) === 'In Stock' && styles.specSuccess
                    ]}>
                        {formatSpecValue(product2, spec)}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading compare list...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (compareItems.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Compare Products</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="swap-horizontal-outline" size={80} color={COLORS.border} />
                    <Text style={styles.emptyTitle}>Comparison Empty</Text>
                    <Text style={styles.emptySubtitle}>
                        {user
                            ? 'Add up to 2 products to compare their features side-by-side.'
                            : 'Sign in to save your comparison list and make better purchase decisions.'
                        }
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
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Compare Products</Text>
                <TouchableOpacity onPress={handleClearCompare} activeOpacity={0.7}>
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            </View>

            {/* Login Prompt for Non-Logged In Users */}
            {!user && (
                <View style={styles.loginPrompt}>
                    <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.loginPromptText}>
                        Sign in to add compared items to cart.
                    </Text>
                    <TouchableOpacity
                        style={styles.loginPromptButton}
                        onPress={() => navigation.navigate('ProfileTab', { screen: 'SignIn' })}
                    >
                        <Text style={styles.loginPromptButtonText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Add All to Cart Button */}
            {user && compareItems.length > 0 && (
                <TouchableOpacity
                    style={styles.addAllButton}
                    onPress={handleAddAllToCart}
                    activeOpacity={0.8}
                >
                    <Ionicons name="cart" size={20} color={COLORS.surface} />
                    <Text style={styles.addAllText}>
                        Add All to Cart ({compareItems.length})
                    </Text>
                </TouchableOpacity>
            )}

            {/* Comparison Table */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.comparisonScrollContent}
            >
                <View style={styles.compareTable}>
                    {/* Product Headers Row */}
                    <View style={styles.productHeaderRow}>
                        {/* Empty cell for alignment */}
                        <View style={styles.specLabelCell} />
                        {/* Product 1 Header */}
                        {compareItems[0] && (
                            <View style={styles.productHeaderCell}>
                                <ProductHeader item={compareItems[0]} index={0} />
                            </View>
                        )}
                        {/* Product 2 Header */}
                        {compareItems[1] && (
                            <View style={styles.productHeaderCell}>
                                <ProductHeader item={compareItems[1]} index={1} />
                            </View>
                        )}
                    </View>

                    {/* Specification Rows */}
                    <FlatList
                        data={allSpecs}
                        keyExtractor={item => item.key}
                        scrollEnabled={false}
                        renderItem={({ item, index }) => (
                            <SpecificationRow
                                spec={item}
                                product1={compareItems[0]}
                                product2={compareItems[1]}
                                index={index}
                            />
                        )}
                    />
                </View>
            </ScrollView>

            {/* Products List (to add more) */}
            <View style={styles.productsListContainer}>
                <View style={styles.productsHeader}>
                    <Text style={styles.productsTitle}>
                        Products ({compareItems.length}/2)
                    </Text>
                    {compareItems.length < 2 && (
                        <TouchableOpacity
                            style={styles.addMoreButton}
                            onPress={() => navigation.navigate('Home')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add" size={16} color={COLORS.primary} />
                            <Text style={styles.addMoreText}>Add More</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.subText,
    },
    // --- Header Styles ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
    },
    clearText: {
        color: COLORS.danger,
        fontSize: 16,
        fontWeight: '600',
    },
    // --- Utility Styles ---
    loginPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.accentBackground,
        padding: 12,
        marginHorizontal: 20,
        marginVertical: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    loginPromptText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        marginLeft: 12,
        fontWeight: '500',
    },
    loginPromptButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    loginPromptButtonText: {
        color: COLORS.surface,
        fontSize: 12,
        fontWeight: '600',
    },
    addAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.success,
        marginHorizontal: 20,
        marginVertical: 12,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    addAllText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: '700',
    },
    disabledButton: {
        backgroundColor: COLORS.background,
        borderColor: COLORS.border,
        borderWidth: 1,
    },
    disabledButtonText: {
        color: COLORS.subText,
    },
    // --- Comparison Table Styles ---
    comparisonScrollContent: {
        paddingVertical: 16,
        backgroundColor: COLORS.surface,
    },
    compareTable: {
        flexDirection: 'column',
    },
    productHeaderRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    specLabelCell: {
        width: SPEC_LABEL_WIDTH,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingHorizontal: 10,
        marginRight: 10,
    },
    productHeaderCell: {
        width: PRODUCT_COLUMN_WIDTH,
        marginRight: 10,
    },
    productHeader: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        height: 220, // Give it a fixed height
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
    productRemoveButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
    },
    productImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        marginBottom: 8,
    },
    productName: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
        minHeight: 36,
    },
    productAddToCart: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        width: '100%',
        gap: 6,
    },
    productAddToCartText: {
        color: COLORS.surface,
        fontSize: 13,
        fontWeight: '600',
    },
    // Specification Row Styles
    specRowContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingVertical: 14,
        alignItems: 'center',
    },
    specRowContainerAlt: {
        backgroundColor: COLORS.background,
    },
    specLabelText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    specValueCell: {
        width: PRODUCT_COLUMN_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    specValueText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 4,
    },
    specPriceText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
    specSuccess: {
        color: COLORS.success,
        fontWeight: '700',
    },
    // --- Empty State Styles ---
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: COLORS.subText,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    continueShoppingButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    continueShoppingText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: '700',
    },
    // --- Products List at Bottom (for context/adding more) ---
    productsListContainer: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: COLORS.surface,
    },
    productsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    addMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.accentBackground,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primary,
        gap: 4,
    },
    addMoreText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default Compare;