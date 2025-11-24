import React, { useState, useMemo, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Animated,
    StatusBar,
    Dimensions,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ProductCard from '../components/ProductCard';
import { categories, products, banners } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

const Home = () => {
    const navigation = useNavigation();
    const { getCartItemsCount } = useCart();
    const { user } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeBanner, setActiveBanner] = useState(0);

    const scrollX = useRef(new Animated.Value(0)).current;

    const filteredProducts = useMemo(() => {
        let filtered = products;

        if (selectedCategory !== 'All') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        if (searchQuery) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }, [selectedCategory, searchQuery]);

    const handleCartPress = () => {
        if (!user) {
            Alert.alert(
                'Sign In Required',
                'Please sign in to view your cart',
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
        navigation.navigate('Cart');
    };

    const handleSearchPress = () => {
        navigation.navigate('Search');
    };

    const handleBannerPress = () => {
        // Navigate to all products when banner is pressed
        setSelectedCategory('All');
    };

    const BannerItem = ({ banner, index }) => {
        const inputRange = [
            (index - 1) * screenWidth,
            index * screenWidth,
            (index + 1) * screenWidth,
        ];

        const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
        });

        return (
            <TouchableOpacity onPress={handleBannerPress}>
                <Animated.View style={[styles.banner, { opacity }]}>
                    <Image
                        source={{ uri: banner.image }}
                        style={styles.bannerImage}
                        resizeMode="cover"
                    />
                    <View style={styles.bannerGradient}>
                        <View style={styles.bannerContent}>
                            <Text style={styles.bannerTitle}>{banner.title}</Text>
                            <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                            <TouchableOpacity style={styles.bannerButton}>
                                <Text style={styles.bannerButtonText}>Shop Now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    const CategoryItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.categoryItem,
                selectedCategory === (item.id === 'all' ? 'All' : item.name) && styles.categoryItemSelected,
            ]}
            onPress={() => setSelectedCategory(item.id === 'all' ? 'All' : item.name)}
        >
            <View style={[
                styles.categoryIcon,
                selectedCategory === (item.id === 'all' ? 'All' : item.name) && styles.categoryIconSelected
            ]}>
                <Ionicons
                    name={item.icon}
                    size={22}
                    color={selectedCategory === (item.id === 'all' ? 'All' : item.name) ? '#2563EB' : '#666'}
                />
            </View>
            <Text
                style={[
                    styles.categoryText,
                    selectedCategory === (item.id === 'all' ? 'All' : item.name) && styles.categoryTextSelected,
                ]}
                numberOfLines={1}
            >
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    const onBannerScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.greetingContainer}>
                        <Text style={styles.greeting}>
                            {user ? `Hello, ${user.fullName || 'User'}! 👋` : 'Welcome! 👋'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {user ? 'Find amazing tech deals' : 'Browse our electronics collection'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={handleCartPress}
                >
                    <View style={styles.cartIcon}>
                        <Ionicons name="cart-outline" size={22} color="#2563EB" />
                        {user && getCartItemsCount() > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>
                                    {getCartItemsCount() > 99 ? '99+' : getCartItemsCount()}
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Search Bar */}
                <View style={styles.searchSection}>
                    <TouchableOpacity
                        style={styles.searchContainer}
                        onPress={handleSearchPress}
                    >
                        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
                        <Text style={styles.searchPlaceholder}>
                            Search headphones, watches, laptops...
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Banners Section */}
                <View style={styles.bannerSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Special Offers</Text>
                        <TouchableOpacity onPress={() => setSelectedCategory('All')}>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.bannerWrapper}>
                        <Animated.FlatList
                            data={banners}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item, index }) => <BannerItem banner={item} index={index} />}
                            contentContainerStyle={styles.bannerContent}
                            onScroll={onBannerScroll}
                            scrollEventThrottle={16}
                        />
                        <View style={styles.bannerIndicators}>
                            {banners.map((_, index) => {
                                const inputRange = [
                                    (index - 1) * screenWidth,
                                    index * screenWidth,
                                    (index + 1) * screenWidth,
                                ];

                                const dotWidth = scrollX.interpolate({
                                    inputRange,
                                    outputRange: [8, 20, 8],
                                    extrapolate: 'clamp',
                                });

                                const opacity = scrollX.interpolate({
                                    inputRange,
                                    outputRange: [0.3, 1, 0.3],
                                    extrapolate: 'clamp',
                                });

                                return (
                                    <Animated.View
                                        key={index}
                                        style={[
                                            styles.bannerDot,
                                            {
                                                width: dotWidth,
                                                opacity: opacity,
                                            },
                                        ]}
                                    />
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Categories Section */}
                <View style={styles.categoriesSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Categories</Text>
                    </View>
                    <FlatList
                        data={[{ id: 'all', name: 'All', icon: 'apps' }, ...categories]}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <CategoryItem item={item} />}
                        contentContainerStyle={styles.categoriesContent}
                        scrollEnabled={true}
                    />
                </View>

                {/* Products Section */}
                <View style={styles.productsSection}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>
                                {selectedCategory === 'All' ? 'Featured Products' : selectedCategory}
                            </Text>
                            <Text style={styles.productCount}>{filteredProducts.length} products</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => {
                                // Reset filters
                                setSearchQuery('');
                                setSelectedCategory('All');
                            }}
                        >
                            <Ionicons name="refresh" size={18} color="#666" />
                            <Text style={styles.filterText}>Reset</Text>
                        </TouchableOpacity>
                    </View>

                    {filteredProducts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={80} color="#E5E7EB" />
                            <Text style={styles.emptyStateTitle}>No products found</Text>
                            <Text style={styles.emptyStateText}>
                                {searchQuery ? `No results for "${searchQuery}"` : 'Try selecting a different category'}
                            </Text>
                            {(searchQuery || selectedCategory !== 'All') && (
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={() => {
                                        setSearchQuery('');
                                        setSelectedCategory('All');
                                    }}
                                >
                                    <Text style={styles.resetButtonText}>Reset Filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.productsGrid}>
                            {filteredProducts.map((item, index) => (
                                <View
                                    key={item.id}
                                    style={[
                                        styles.productItem,
                                        index % 2 === 0 ? styles.productItemLeft : styles.productItemRight
                                    ]}
                                >
                                    <ProductCard
                                        product={item}
                                        onPress={() => navigation.navigate('ProductDetail', { product: item })}
                                    />
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Bottom Spacer */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    headerContent: {
        flex: 1,
    },
    greetingContainer: {
        marginTop: 8,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    cartButton: {
        padding: 8,
        marginTop: 8,
    },
    cartIcon: {
        position: 'relative',
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    cartBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    searchSection: {
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 14,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchPlaceholder: {
        flex: 1,
        fontSize: 16,
        color: '#999',
        fontWeight: '500',
    },
    loginPrompt: {
        backgroundColor: '#EFF6FF',
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        padding: 16,
    },
    loginPromptContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginPromptTexts: {
        flex: 1,
        marginLeft: 12,
        marginRight: 16,
    },
    loginPromptTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E40AF',
        marginBottom: 2,
    },
    loginPromptSubtitle: {
        fontSize: 14,
        color: '#3B82F6',
    },
    loginPromptButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    loginPromptButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    bannerSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    seeAllText: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: '600',
    },
    bannerWrapper: {
        position: 'relative',
    },
    banner: {
        width: screenWidth - 40,
        height: 160,
        borderRadius: 20,
        marginRight: 12,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerGradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end',
    },
    bannerContent: {
        padding: 20,
    },
    bannerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    bannerSubtitle: {
        color: 'white',
        fontSize: 14,
        opacity: 0.9,
        marginBottom: 12,
    },
    bannerButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    bannerButtonText: {
        color: '#2563EB',
        fontSize: 14,
        fontWeight: '600',
    },
    bannerIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
    },
    bannerDot: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 3,
    },
    categoriesSection: {
        marginBottom: 24,
    },
    categoriesContent: {
        paddingHorizontal: 20,
    },
    categoryItem: {
        alignItems: 'center',
        padding: 12,
        marginRight: 12,
        minWidth: 70,
    },
    categoryItemSelected: {
        // Selection handled by icon and text
    },
    categoryIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryIconSelected: {
        backgroundColor: '#EFF6FF',
        borderWidth: 2,
        borderColor: '#2563EB',
    },
    categoryText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center',
    },
    categoryTextSelected: {
        color: '#2563EB',
        fontWeight: '600',
    },
    productsSection: {
        marginBottom: 8,
    },
    productCount: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    filterText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        marginLeft: 6,
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    productItem: {
        width: '48%',
        marginBottom: 16,
    },
    productItemLeft: {
        marginRight: '1%',
    },
    productItemRight: {
        marginLeft: '1%',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6B7280',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    resetButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    resetButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 30,
    },
});

export default Home;