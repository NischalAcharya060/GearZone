import React, { useState, useMemo, useRef, useEffect } from 'react';
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
    ActivityIndicator,
    RefreshControl,
    Modal,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Slider } from '@miblanchard/react-native-slider';

import { firestore } from '../firebase/config';
import { collection, getDocs, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';

import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

const Home = () => {
    const navigation = useNavigation();
    const { getCartItemsCount } = useCart();
    const { user } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [banners, setBanners] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [unreadCount, setUnreadCount] = useState(0);

    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [minRating, setMinRating] = useState(0);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [sortBy, setSortBy] = useState('featured');

    const scrollX = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const unsubscribeRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (user?.uid) {
            setupNotificationListener();
        } else {
            setUnreadCount(0);
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        }

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [user?.uid]);

    const setupNotificationListener = () => {
        if (unsubscribeRef.current) unsubscribeRef.current();

        const q = query(
            collection(firestore, 'notifications'),
            where('userId', '==', user.uid),
            where('read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newCount = snapshot.size;
            if (newCount > unreadCount) animateIcon();
            setUnreadCount(newCount);
        });

        unsubscribeRef.current = unsubscribe;
    };

    const animateIcon = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
    };

    const handleNotificationPress = () => {
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to view notifications', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: () => navigation.navigate('ProfileTab', { screen: 'SignIn' }) },
            ]);
            return;
        }
        navigation.navigate('Notifications');
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            const productsSnap = await getDocs(query(collection(firestore, 'products'), orderBy('createdAt', 'desc'), limit(50)));
            const productsList = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsList);

            const catsSnap = await getDocs(query(collection(firestore, 'categories'), orderBy('createdAt', 'desc')));
            const catsList = catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(catsList);

            const featured = productsList.filter(p => p.featured).slice(0, 3);
            const bannerSource = featured.length > 0 ? featured : productsList.slice(0, 3);

            const bannerData = bannerSource.map((p, i) => ({
                id: `banner-${i}`,
                image: p.images?.[0] || 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=800',
                title: p.name,
                subtitle: `Up to ${Math.floor(Math.random() * 50) + 10}% off`,
                productId: p.id,
            }));
            setBanners(bannerData);
        } catch (e) {
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const filteredProducts = useMemo(() => {
        let list = products;

        if (selectedCategory !== 'All') list = list.filter(p => p.category === selectedCategory);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.brand?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q)
            );
        }

        list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

        if (minRating > 0) list = list.filter(p => (p.rating || 0) >= minRating);
        if (inStockOnly) list = list.filter(p => p.stock > 0);

        switch (sortBy) {
            case 'price-low': list.sort((a, b) => a.price - b.price); break;
            case 'price-high': list.sort((a, b) => b.price - a.price); break;
            case 'rating': list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
            case 'newest': list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
        }

        return list;
    }, [products, selectedCategory, searchQuery, priceRange, minRating, inStockOnly, sortBy]);

    const handleCartPress = () => {
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to view your cart', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: () => navigation.navigate('ProfileTab', { screen: 'SignIn' }) },
            ]);
            return;
        }
        navigation.navigate('CartTab');
    };

    const handleBannerPress = (banner) => {
        if (banner.productId) {
            const product = products.find(p => p.id === banner.productId);
            if (product) navigation.navigate('ProductDetail', { product });
        }
    };

    const clearAllFilters = () => {
        setSelectedCategory('All');
        setSearchQuery('');
        setPriceRange([0, 1000]);
        setMinRating(0);
        setInStockOnly(false);
        setSortBy('featured');
    };

    const getActiveFiltersCount = () => {
        let c = 0;
        if (selectedCategory !== 'All') c++;
        if (searchQuery) c++;
        if (priceRange[0] > 0 || priceRange[1] < 1000) c++;
        if (minRating > 0) c++;
        if (inStockOnly) c++;
        if (sortBy !== 'featured') c++;
        return c;
    };

    const BannerItem = ({ banner, index }) => {
        const inputRange = [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth];
        const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });

        return (
            <TouchableOpacity onPress={() => handleBannerPress(banner)} activeOpacity={0.9}>
                <Animated.View style={[styles.banner, { opacity }]}>
                    <Image source={{ uri: banner.image }} style={styles.bannerImage} resizeMode="cover" />
                    <View style={styles.bannerOverlay}>
                        <View style={styles.bannerContent}>
                            <Text style={styles.bannerTitle}>{banner.title}</Text>
                            <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                            <TouchableOpacity style={styles.bannerButton}>
                                <Text style={styles.bannerButtonText}>Shop Now</Text>
                                <Ionicons name="arrow-forward" size={16} color="#2563EB" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    const CategoryItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.categoryItem, selectedCategory === (item.id === 'all' ? 'All' : item.name) && styles.categoryItemSelected]}
            onPress={() => setSelectedCategory(item.id === 'all' ? 'All' : item.name)}
        >
            <View style={[styles.categoryIcon, selectedCategory === (item.id === 'all' ? 'All' : item.name) && styles.categoryIconSelected]}>
                <Ionicons name={item.icon || 'cube-outline'} size={22} color={selectedCategory === (item.id === 'all' ? 'All' : item.name) ? '#2563EB' : '#666'} />
            </View>
            <Text style={[styles.categoryText, selectedCategory === (item.id === 'all' ? 'All' : item.name) && styles.categoryTextSelected]}>{item.name}</Text>
        </TouchableOpacity>
    );

    const onBannerScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading products...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <Modal
                visible={showFilters}
                animationType="slide"
                transparent={false}
                presentationStyle="pageSheet"
                onRequestClose={() => setShowFilters(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Filters & Sort</Text>
                        <TouchableOpacity onPress={() => setShowFilters(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Sort By</Text>
                            {[
                                { id: 'featured', label: 'Featured', icon: 'star' },
                                { id: 'newest', label: 'Newest', icon: 'time' },
                                { id: 'price-low', label: 'Price: Low to High', icon: 'arrow-up' },
                                { id: 'price-high', label: 'Price: High to Low', icon: 'arrow-down' },
                                { id: 'rating', label: 'Highest Rated', icon: 'trending-up' },
                            ].map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.sortOption, sortBy === item.id && styles.sortOptionSelected]}
                                    onPress={() => setSortBy(item.id)}
                                >
                                    <Ionicons name={item.icon} size={18} color={sortBy === item.id ? '#2563EB' : '#6B7280'} />
                                    <Text style={[styles.sortOptionText, sortBy === item.id && styles.sortOptionTextSelected]}>{item.label}</Text>
                                    {sortBy === item.id && <Ionicons name="checkmark" size={18} color="#2563EB" />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Price Range: ${priceRange[0]} - ${priceRange[1]}</Text>
                            <View style={styles.sliderContainer}>
                                <Slider
                                    value={priceRange}
                                    onValueChange={setPriceRange}
                                    minimumValue={0}
                                    maximumValue={1000}
                                    step={10}
                                    minimumTrackTintColor="#2563EB"
                                    maximumTrackTintColor="#E5E7EB"
                                    thumbTintColor="#2563EB"
                                    thumbStyle={styles.sliderThumb}
                                />
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                            <View style={styles.ratingOptions}>
                                {[4,3,2,1,0].map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.ratingOption, minRating === r && styles.ratingOptionSelected]}
                                        onPress={() => setMinRating(r)}
                                    >
                                        <Ionicons name="star" size={16} color={minRating === r ? "#FFFFFF" : "#F59E0B"} />
                                        <Text style={[styles.ratingOptionText, minRating === r && styles.ratingOptionTextSelected]}>
                                            {r === 0 ? 'Any' : `${r}+`}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Other Filters</Text>
                            <View style={styles.switchOption}>
                                <Text style={styles.switchLabel}>In Stock Only</Text>
                                <Switch value={inStockOnly} onValueChange={setInStockOnly} />
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.clearButton} onPress={clearAllFilters}>
                            <Text style={styles.clearButtonText}>Clear All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
                            <Text style={styles.applyButtonText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="sparkles" size={24} color="#2563EB" />
                        <Text style={styles.logoText}>GearZone</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleNotificationPress}>
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <Ionicons name={unreadCount > 0 ? "notifications" : "notifications-outline"} size={22} color={unreadCount > 0 ? "#2563EB" : "#374151"} />
                        </Animated.View>
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cartButton} onPress={handleCartPress}>
                        <View style={styles.cartIcon}>
                            <Ionicons name="cart-outline" size={22} color="#374151" />
                            {user && getCartItemsCount() > 0 && (
                                <View style={styles.cartBadge}>
                                    <Text style={styles.cartBadgeText}>{getCartItemsCount() > 99 ? '99+' : getCartItemsCount()}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
            >
                <View style={styles.searchSection}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={20} color="#666" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search products, brands, and more..."
                            placeholderTextColor="#64748B"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
                        <Ionicons name="options-outline" size={22} color="#374151" />
                        {getActiveFiltersCount() > 0 && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {banners.length > 0 && (
                    <View style={styles.bannerSection}>
                        <Animated.FlatList
                            data={banners}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={item => item.id}
                            renderItem={({ item, index }) => <BannerItem banner={item} index={index} />}
                            onScroll={onBannerScroll}
                            scrollEventThrottle={16}
                        />
                        <View style={styles.bannerIndicators}>
                            {banners.map((_, i) => {
                                const inputRange = [(i - 1) * screenWidth, i * screenWidth, (i + 1) * screenWidth];
                                const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 20, 8], extrapolate: 'clamp' });
                                const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
                                return <Animated.View key={i} style={[styles.bannerDot, { width: dotWidth, opacity }]} />;
                            })}
                        </View>
                    </View>
                )}

                <View style={styles.categoriesSection}>
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

                <View style={styles.productsSection}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>
                                {selectedCategory === 'All' ? 'Featured Products' : selectedCategory}
                            </Text>
                            <Text style={styles.productCount}>
                                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                                {getActiveFiltersCount() > 0 && ` • ${getActiveFiltersCount()} filter${getActiveFiltersCount() === 1 ? '' : 's'} active`}
                            </Text>
                        </View>
                    </View>

                    {filteredProducts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={80} color="#E5E7EB" />
                            <Text style={styles.emptyStateTitle}>No products found</Text>
                            <Text style={styles.emptyStateText}>
                                {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters or browse different categories'}
                            </Text>
                            {(searchQuery || getActiveFiltersCount() > 0) && (
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={clearAllFilters}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.resetButtonText}>Clear All Filters</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    iconButton: {
        padding: 8,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    badge: {
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 12,
    },
    cartButton: {
        padding: 8,
    },
    cartIcon: {
        position: 'relative',
        padding: 8,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingVertical: 12,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
        padding: 0,
        includeFontPadding: false,
    },
    clearSearchButton: {
        padding: 4,
    },
    filterButton: {
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative',
    },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    activeFilters: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    activeFiltersContent: {
        flexDirection: 'row',
        gap: 8,
        paddingRight: 20,
    },
    activeFilterTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    activeFilterText: {
        fontSize: 12,
        color: '#2563EB',
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    filterSection: {
        marginBottom: 24,
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
    },
    sortOptionSelected: {
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#2563EB',
    },
    sortOptionText: {
        flex: 1,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    sortOptionTextSelected: {
        color: '#2563EB',
        fontWeight: '600',
    },
    sliderContainer: {
        paddingHorizontal: 10,
    },
    sliderThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    ratingOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    ratingOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 4,
    },
    ratingOptionSelected: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    ratingOptionText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    ratingOptionTextSelected: {
        color: '#FFFFFF',
    },
    switchOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    switchLabel: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
    },
    clearButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    clearButtonText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    applyButton: {
        flex: 2,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: '#2563EB',
        borderRadius: 12,
    },
    applyButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    bannerSection: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
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
        height: 180,
        borderRadius: 20,
        marginHorizontal: 20,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end',
    },
    bannerContent: {
        padding: 24,
    },
    bannerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    bannerSubtitle: {
        color: 'white',
        fontSize: 15,
        opacity: 0.9,
        marginBottom: 16,
        fontWeight: '500',
    },
    bannerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    bannerButtonText: {
        color: '#2563EB',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 6,
    },
    bannerButtonIcon: {
        marginLeft: 2,
    },
    bannerIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 20,
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
        marginBottom: 32,
    },
    categoriesContent: {
        paddingHorizontal: 20,
    },
    categoryItem: {
        alignItems: 'center',
        padding: 12,
        marginRight: 16,
        minWidth: 76,
    },
    categoryIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#F1F5F9',
    },
    categoryIconSelected: {
        backgroundColor: '#EFF6FF',
        borderColor: '#2563EB',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    categoryText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        textAlign: 'center',
    },
    categoryTextSelected: {
        color: '#2563EB',
        fontWeight: '700',
    },
    productsSection: {
        marginBottom: 8,
    },
    productCount: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
        fontWeight: '500',
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
        color: '#475569',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    resetButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
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