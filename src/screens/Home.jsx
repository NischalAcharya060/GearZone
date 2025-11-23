import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ProductCard from '../components/ProductCard';
import { categories, products, banners } from '../data/mockData';
import { useCart } from '../context/CartContext';

const Home = () => {
    const navigation = useNavigation();
    const { getCartItemsCount } = useCart();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = useMemo(() => {
        let filtered = products;

        if (selectedCategory !== 'All') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        if (searchQuery) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.brand.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }, [selectedCategory, searchQuery]);

    const BannerItem = ({ banner }) => (
        <View style={styles.banner}>
            <Image source={{ uri: banner.image }} style={styles.bannerImage} />
            <View style={styles.bannerOverlay}>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
            </View>
        </View>
    );

    const CategoryItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.categoryItem,
                selectedCategory === (item.id === 'all' ? 'All' : item.name) && styles.categoryItemSelected,
            ]}
            onPress={() => setSelectedCategory(item.id === 'all' ? 'All' : item.name)}
        >
            <Ionicons
                name={item.icon}
                size={24}
                color={selectedCategory === (item.id === 'all' ? 'All' : item.name) ? '#2563EB' : '#666'}
            />
            <Text
                style={[
                    styles.categoryText,
                    selectedCategory === (item.id === 'all' ? 'All' : item.name) && styles.categoryTextSelected,
                ]}
            >
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    const renderProductItem = ({ item }) => (
        <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
        />
    );

    const renderBannerItem = ({ item }) => <BannerItem banner={item} />;

    const renderCategoryItem = ({ item }) => <CategoryItem item={item} />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.greeting}>Hello, User!</Text>
                    <Text style={styles.subtitle}>Find your perfect electronics</Text>
                </View>
                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <Ionicons name="cart-outline" size={24} color="#333" />
                    {getCartItemsCount() > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{getCartItemsCount()}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Banners Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Special Offers</Text>
                <FlatList
                    data={banners}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    renderItem={renderBannerItem}
                    contentContainerStyle={styles.bannerContent}
                />
            </View>

            {/* Categories Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <FlatList
                    data={[{ id: 'all', name: 'All', icon: 'grid-outline' }, ...categories]}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCategoryItem}
                    contentContainerStyle={styles.categoriesContent}
                />
            </View>

            {/* Products Section */}
            <View style={styles.section}>
                <View style={styles.productsHeader}>
                    <Text style={styles.sectionTitle}>
                        {selectedCategory === 'All' ? 'All Products' : selectedCategory}
                    </Text>
                    <Text style={styles.productCount}>({filteredProducts.length})</Text>
                </View>

                {filteredProducts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyStateTitle}>No products found</Text>
                        <Text style={styles.emptyStateText}>
                            Try adjusting your search or filter criteria
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        renderItem={renderProductItem}
                        contentContainerStyle={styles.productsGrid}
                    />
                )}
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
    headerContent: {
        flex: 1,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    cartButton: {
        position: 'relative',
        padding: 8,
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    cartBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
    },
    section: {
        marginBottom: 24,
        flex: 1,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        marginHorizontal: 16,
        color: '#333',
    },
    bannerContent: {
        paddingHorizontal: 16,
    },
    banner: {
        width: 300,
        height: 150,
        borderRadius: 12,
        marginRight: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 16,
    },
    bannerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    bannerSubtitle: {
        color: 'white',
        fontSize: 14,
    },
    categoriesContent: {
        paddingHorizontal: 16,
    },
    categoryItem: {
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        marginRight: 12,
        minWidth: 80,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    categoryItemSelected: {
        backgroundColor: '#2563EB',
        shadowColor: '#2563EB',
        shadowOpacity: 0.3,
    },
    categoryText: {
        marginTop: 8,
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    categoryTextSelected: {
        color: 'white',
    },
    productsHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    productCount: {
        fontSize: 16,
        color: '#666',
        marginLeft: 8,
    },
    productsGrid: {
        paddingHorizontal: 8,
        paddingBottom: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default Home;