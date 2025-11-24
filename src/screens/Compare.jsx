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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';

const Compare = () => {
    const { compareItems, removeFromCompare, clearCompare } = useCompare();
    const { addToCart } = useCart();
    const navigation = useNavigation();

    const CompareItem = ({ item }) => (
        <View style={styles.compareItem}>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromCompare(item.id)}
            >
                <Ionicons name="close" size={20} color="#FF6B6B" />
            </TouchableOpacity>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemBrand}>{item.brand}</Text>
            <Text style={styles.itemPrice}>${item.price}</Text>
            <TouchableOpacity
                style={styles.addToCartButton}
                onPress={() => addToCart(item)}
            >
                <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
        </View>
    );

    const SpecificationRow = ({ title, product1, product2 }) => (
        <View style={styles.specRow}>
            <Text style={styles.specTitle}>{title}</Text>
            <Text style={styles.specValue}>{product1 || '-'}</Text>
            <Text style={styles.specValue}>{product2 || '-'}</Text>
        </View>
    );

    if (compareItems.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="swap-horizontal-outline" size={80} color="#CCC" />
                    <Text style={styles.emptyTitle}>Compare Products</Text>
                    <Text style={styles.emptySubtitle}>
                        Add up to 2 products to compare their features and specifications
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
                <Text style={styles.title}>Compare Products</Text>
                <TouchableOpacity onPress={clearCompare}>
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.compareContainer}>
                    {/* Specification Labels */}
                    <View style={styles.specLabels}>
                        <View style={styles.specLabelHeader} />
                        <Text style={styles.specLabel}>Price</Text>
                        <Text style={styles.specLabel}>Brand</Text>
                        <Text style={styles.specLabel}>Rating</Text>
                        <Text style={styles.specLabel}>Battery</Text>
                        <Text style={styles.specLabel}>Connectivity</Text>
                        <Text style={styles.specLabel}>Features</Text>
                    </View>

                    {/* Product 1 */}
                    {compareItems[0] && (
                        <View style={styles.productColumn}>
                            <View style={styles.productHeader}>
                                <Image source={{ uri: compareItems[0].image }} style={styles.productImage} />
                                <Text style={styles.productName}>{compareItems[0].name}</Text>
                            </View>
                            <Text style={styles.specValue}>${compareItems[0].price}</Text>
                            <Text style={styles.specValue}>{compareItems[0].brand}</Text>
                            <Text style={styles.specValue}>{compareItems[0].rating}/5</Text>
                            <Text style={styles.specValue}>{compareItems[0].specifications.battery || '-'}</Text>
                            <Text style={styles.specValue}>{compareItems[0].specifications.connectivity || '-'}</Text>
                            <Text style={styles.specValue}>
                                {compareItems[0].specifications.features?.join(', ') || '-'}
                            </Text>
                        </View>
                    )}

                    {/* Product 2 */}
                    {compareItems[1] && (
                        <View style={styles.productColumn}>
                            <View style={styles.productHeader}>
                                <Image source={{ uri: compareItems[1].image }} style={styles.productImage} />
                                <Text style={styles.productName}>{compareItems[1].name}</Text>
                            </View>
                            <Text style={styles.specValue}>${compareItems[1].price}</Text>
                            <Text style={styles.specValue}>{compareItems[1].brand}</Text>
                            <Text style={styles.specValue}>{compareItems[1].rating}/5</Text>
                            <Text style={styles.specValue}>{compareItems[1].specifications.battery || '-'}</Text>
                            <Text style={styles.specValue}>{compareItems[1].specifications.connectivity || '-'}</Text>
                            <Text style={styles.specValue}>
                                {compareItems[1].specifications.features?.join(', ') || '-'}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.productsList}>
                <Text style={styles.productsTitle}>Products to Compare</Text>
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
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    clearText: {
        color: '#FF6B6B',
        fontSize: 16,
        fontWeight: '600',
    },
    compareContainer: {
        flexDirection: 'row',
        padding: 16,
    },
    specLabels: {
        width: 120,
        marginRight: 16,
    },
    specLabelHeader: {
        height: 150,
        marginBottom: 8,
    },
    specLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 16,
        paddingVertical: 8,
        backgroundColor: 'white',
        paddingHorizontal: 8,
        borderRadius: 6,
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
        height: 150,
        justifyContent: 'center',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginBottom: 8,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    specValue: {
        fontSize: 14,
        color: '#333',
        marginBottom: 16,
        paddingVertical: 8,
        backgroundColor: 'white',
        paddingHorizontal: 8,
        borderRadius: 6,
        textAlign: 'center',
    },
    productsList: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        padding: 16,
    },
    productsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
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
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
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
    },
    addToCartText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
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

export default Compare;