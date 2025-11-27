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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const Compare = () => {
    const { compareItems, removeFromCompare, clearCompare, loading } = useCompare();
    const { addToCart, bulkAddToCart } = useCart();
    const { user } = useAuth();
    const navigation = useNavigation();

    // Get the first image from images array or use item.image as fallback
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
                    onPress: () => navigation.navigate('SignIn')
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
            const result = await addToCart(item, navigation);
            if (result && result.success) {
                Alert.alert('Success', `${item.name} added to cart!`);
            }
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
            Alert.alert('Success', 'All compared items added to cart!');
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

    const CompareItem = ({ item }) => (
        <View style={styles.compareItem}>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromCompare(item.id)}
            >
                <Ionicons name="close-circle" size={20} color="#FF6B6B" />
            </TouchableOpacity>
            <Image
                source={{ uri: getProductImage(item) }}
                style={styles.itemImage}
                resizeMode="cover"
            />
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.itemBrand}>{item.brand}</Text>
            <Text style={styles.itemPrice}>${item.price}</Text>
            <TouchableOpacity
                style={[
                    styles.addToCartButton,
                    !user && styles.disabledButton
                ]}
                onPress={() => handleAddToCart(item)}
                disabled={!user}
            >
                <Text style={[
                    styles.addToCartText,
                    !user && styles.disabledButtonText
                ]}>
                    Add to Cart
                </Text>
            </TouchableOpacity>
        </View>
    );

    const SpecificationRow = ({ title, product1, product2, isHeader = false }) => (
        <View style={[
            styles.specRow,
            isHeader && styles.specRowHeader
        ]}>
            <Text style={[
                styles.specTitle,
                isHeader && styles.specTitleHeader
            ]}>{title}</Text>
            <Text style={[
                styles.specValue,
                isHeader && styles.specValueHeader
            ]}>{product1 || '-'}</Text>
            <Text style={[
                styles.specValue,
                isHeader && styles.specValueHeader
            ]}>{product2 || '-'}</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading compare list...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (compareItems.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="swap-horizontal-outline" size={80} color="#E5E7EB" />
                    <Text style={styles.emptyTitle}>Compare Products</Text>
                    <Text style={styles.emptySubtitle}>
                        {user
                            ? 'Add up to 2 products to compare their features and specifications'
                            : 'Sign in to compare products and make better purchase decisions'
                        }
                    </Text>
                    {!user ? (
                        <TouchableOpacity
                            style={styles.signInButton}
                            onPress={() => navigation.navigate('SignIn')}
                        >
                            <Text style={styles.signInButtonText}>Sign In to Compare</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.continueShoppingButton}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.continueShoppingText}>Browse Products</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Compare Products</Text>
                <TouchableOpacity onPress={handleClearCompare}>
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            </View>

            {/* Login Prompt for Non-Logged In Users */}
            {!user && (
                <View style={styles.loginPrompt}>
                    <Ionicons name="information-circle" size={20} color="#2563EB" />
                    <Text style={styles.loginPromptText}>
                        Sign in to add compared items to cart
                    </Text>
                    <TouchableOpacity
                        style={styles.loginPromptButton}
                        onPress={() => navigation.navigate('SignIn')}
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
                >
                    <Ionicons name="cart" size={20} color="white" />
                    <Text style={styles.addAllText}>
                        Add All to Cart ({compareItems.length})
                    </Text>
                </TouchableOpacity>
            )}

            {/* Comparison Table */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                style={styles.comparisonScroll}
            >
                <View style={styles.compareContainer}>
                    {/* Specification Labels */}
                    <View style={styles.specLabels}>
                        <View style={styles.specLabelHeader} />
                        <SpecificationRow
                            title="Price"
                            product1={compareItems[0] ? `$${compareItems[0].price}` : '-'}
                            product2={compareItems[1] ? `$${compareItems[1].price}` : '-'}
                            isHeader={true}
                        />
                        <SpecificationRow title="Brand"
                                          product1={compareItems[0]?.brand || '-'}
                                          product2={compareItems[1]?.brand || '-'}
                        />
                        <SpecificationRow title="Rating"
                                          product1={compareItems[0] ? `${compareItems[0].rating}/5` : '-'}
                                          product2={compareItems[1] ? `${compareItems[1].rating}/5` : '-'}
                        />
                        <SpecificationRow title="Category"
                                          product1={compareItems[0]?.category || '-'}
                                          product2={compareItems[1]?.category || '-'}
                        />
                        <SpecificationRow title="Stock"
                                          product1={compareItems[0]?.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                          product2={compareItems[1]?.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        />
                        {/* Dynamic specifications */}
                        {compareItems[0]?.specifications && Object.entries(compareItems[0].specifications).map(([key, value]) => (
                            <SpecificationRow
                                key={key}
                                title={key.charAt(0).toUpperCase() + key.slice(1)}
                                product1={Array.isArray(value) ? value.join(', ') : String(value)}
                                product2={compareItems[1]?.specifications?.[key] ?
                                    (Array.isArray(compareItems[1].specifications[key]) ?
                                        compareItems[1].specifications[key].join(', ') :
                                        String(compareItems[1].specifications[key])) :
                                    '-'}
                            />
                        ))}
                    </View>

                    {/* Product Columns */}
                    <View style={styles.productColumns}>
                        {/* Product 1 */}
                        {compareItems[0] && (
                            <View style={styles.productColumn}>
                                <View style={styles.productHeader}>
                                    <Image
                                        source={{ uri: getProductImage(compareItems[0]) }}
                                        style={styles.productImage}
                                        resizeMode="cover"
                                    />
                                    <Text style={styles.productName} numberOfLines={2}>
                                        {compareItems[0].name}
                                    </Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.productAddToCart,
                                            !user && styles.disabledButton
                                        ]}
                                        onPress={() => handleAddToCart(compareItems[0])}
                                        disabled={!user}
                                    >
                                        <Ionicons
                                            name="cart-outline"
                                            size={16}
                                            color={user ? "white" : "#9CA3AF"}
                                        />
                                        <Text style={[
                                            styles.productAddToCartText,
                                            !user && styles.disabledButtonText
                                        ]}>
                                            Add to Cart
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Product 2 */}
                        {compareItems[1] && (
                            <View style={styles.productColumn}>
                                <View style={styles.productHeader}>
                                    <Image
                                        source={{ uri: getProductImage(compareItems[1]) }}
                                        style={styles.productImage}
                                        resizeMode="cover"
                                    />
                                    <Text style={styles.productName} numberOfLines={2}>
                                        {compareItems[1].name}
                                    </Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.productAddToCart,
                                            !user && styles.disabledButton
                                        ]}
                                        onPress={() => handleAddToCart(compareItems[1])}
                                        disabled={!user}
                                    >
                                        <Ionicons
                                            name="cart-outline"
                                            size={16}
                                            color={user ? "white" : "#9CA3AF"}
                                        />
                                        <Text style={[
                                            styles.productAddToCartText,
                                            !user && styles.disabledButtonText
                                        ]}>
                                            Add to Cart
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Products List */}
            <View style={styles.productsList}>
                <View style={styles.productsHeader}>
                    <Text style={styles.productsTitle}>
                        Products to Compare ({compareItems.length}/2)
                    </Text>
                    {compareItems.length < 2 && (
                        <TouchableOpacity
                            style={styles.addMoreButton}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Ionicons name="add" size={16} color="#2563EB" />
                            <Text style={styles.addMoreText}>Add More</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <FlatList
                    data={compareItems}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <CompareItem item={item} />}
                    contentContainerStyle={styles.productsContent}
                />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    clearText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    loginPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 16,
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
    comparisonScroll: {
        flex: 1,
    },
    compareContainer: {
        flexDirection: 'row',
        padding: 16,
        minWidth: '100%',
    },
    specLabels: {
        width: 120,
        marginRight: 16,
    },
    specLabelHeader: {
        height: 180,
        marginBottom: 8,
    },
    specRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    specRowHeader: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingVertical: 12,
    },
    specTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
        width: 120,
    },
    specTitleHeader: {
        fontWeight: '600',
        color: '#374151',
    },
    specValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        width: 200,
        marginLeft: 16,
        textAlign: 'center',
    },
    specValueHeader: {
        fontWeight: '600',
        color: '#1F2937',
    },
    productColumns: {
        flexDirection: 'row',
    },
    productColumn: {
        width: 200,
        marginRight: 16,
    },
    productHeader: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        alignItems: 'center',
        height: 180,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        marginVertical: 8,
    },
    productAddToCart: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563EB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        width: '100%',
        justifyContent: 'center',
    },
    productAddToCartText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    productsList: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        padding: 16,
        backgroundColor: 'white',
    },
    productsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    productsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    addMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#2563EB',
    },
    addMoreText: {
        color: '#2563EB',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    productsContent: {
        paddingBottom: 8,
    },
    compareItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        width: 150,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginBottom: 8,
    },
    itemName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 4,
    },
    itemBrand: {
        fontSize: 10,
        color: '#666',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563EB',
        marginBottom: 8,
    },
    addToCartButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        width: '100%',
    },
    addToCartText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    disabledButton: {
        backgroundColor: '#F3F4F6',
        borderColor: '#D1D5DB',
    },
    disabledButtonText: {
        color: '#9CA3AF',
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
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6B7280',
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
    addAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    addAllText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Compare;