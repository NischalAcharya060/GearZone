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
import Logo from "../components/Logo";

const { width: screenWidth } = Dimensions.get('window');

const COLORS = {
    primary: '#4F46E5',
    secondary: '#818CF8',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#1F2937',
    subText: '#6B7280',
    border: '#E5E7EB',
    danger: '#EF4444',
};

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

    const [productRatings, setProductRatings] = useState({});

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

    useEffect(() => {
        if (products.length > 0) {
            fetchProductRatings();
        }
    }, [products]);

    const fetchProductRatings = async () => {
        try {
            const ratingsMap = {};
            const ratingPromises = products.map(async (product) => {
                const reviewsRef = collection(firestore, 'reviews');
                const q = query(reviewsRef, where('productId', '==', product.id));
                const querySnapshot = await getDocs(q);

                let totalRating = 0;
                let reviewCount = 0;

                querySnapshot.forEach((doc) => {
                    const review = doc.data();
                    totalRating += review.rating || 0;
                    reviewCount++;
                });

                const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

                ratingsMap[product.id] = {
                    rating: averageRating,
                    reviewCount: reviewCount
                };
            });

            await Promise.all(ratingPromises);
            setProductRatings(ratingsMap);
        } catch (error) {
            console.error('Error fetching product ratings:', error);
        }
    };

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
            Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
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
            const catsList = catsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                icon: doc.data().icon || 'cube-outline'
            }));
            setCategories(catsList);

            const featured = productsList.filter(p => p.featured).slice(0, 3);
            const bannerSource = featured.length > 0 ? featured : productsList.slice(0, 3);

            const bannerData = bannerSource.map((p, i) => ({
                id: `banner-${i}`,
                image: p.images?.[0] || 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=800',
                title: p.name,
                subtitle: p.price > 100 ? `Get it for only $${(p.price * 0.7).toFixed(0)}` : `Limited Time Deal`,
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

    const getProductRating = (productId) => {
        const ratingData = productRatings[productId];
        if (ratingData) {
            return {
                rating: ratingData.rating,
                reviewCount: ratingData.reviewCount
            };
        }
        return {
            rating: 0,
            reviewCount: 0
        };
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

        if (minRating > 0) {
            list = list.filter(p => {
                const ratingData = getProductRating(p.id);
                return ratingData.rating >= minRating;
            });
        }

        if (inStockOnly) list = list.filter(p => p.stock > 0);

        const sortedList = [...list];
        switch (sortBy) {
            case 'price-low':
                sortedList.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                sortedList.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                sortedList.sort((a, b) => {
                    const ratingA = getProductRating(a.id).rating;
                    const ratingB = getProductRating(b.id).rating;
                    return ratingB - ratingA;
                });
                break;
            case 'newest':
                sortedList.sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                    return dateB - dateA;
                });
                break;
            case 'featured':
            default:
                sortedList.sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                    return dateB - dateA;
                });
                break;
        }

        return sortedList;
    }, [products, selectedCategory, searchQuery, priceRange, minRating, inStockOnly, sortBy, productRatings]);

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
            if (product) navigation.navigate('ProductDetail', {
                product: {
                    ...product,
                    ...getProductRating(product.id)
                }
            });
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
        const opacity = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });
        const scale = scrollX.interpolate({ inputRange, outputRange: [0.95, 1, 0.95], extrapolate: 'clamp' });

        return (
            <TouchableOpacity onPress={() => handleBannerPress(banner)} activeOpacity={0.8} style={{ width: screenWidth }}>
                <Animated.View style={[styles.banner, { opacity, transform: [{ scale }] }]}>
                    <Image source={{ uri: banner.image }} style={styles.bannerImage} resizeMode="cover" />
                    <View style={styles.bannerOverlay}>
                        <View style={styles.bannerContent}>
                            <Text style={styles.bannerTitle}>{banner.title}</Text>
                            <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                            <TouchableOpacity style={styles.bannerButton}>
                                <Text style={styles.bannerButtonText}>Shop Now</Text>
                                <Ionicons name="arrow-forward-outline" size={16} color={COLORS.primary} style={{marginLeft: 4}} />
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
            <Ionicons
                name={item.icon}
                size={22}
                color={selectedCategory === (item.id === 'all' ? 'All' : item.name) ? COLORS.primary : COLORS.subText}
            />
            <Text
                style={[
                    styles.categoryText,
                    selectedCategory === (item.id === 'all' ? 'All' : item.name) && styles.categoryTextSelected
                ]}
            >
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    const onBannerScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading products...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

            <Modal
                visible={showFilters}
                animationType="slide"
                transparent={false}
                presentationStyle="pageSheet"
                onRequestClose={() => setShowFilters(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Filter & Sort</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowFilters(false)}>
                            <Ionicons name="close" size={26} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Sort By</Text>
                            {[
                                { id: 'featured', label: 'Featured', icon: 'star-outline' },
                                { id: 'newest', label: 'Newest Arrivals', icon: 'time-outline' },
                                { id: 'price-low', label: 'Price: Low to High', icon: 'arrow-up-circle-outline' },
                                { id: 'price-high', label: 'Price: High to Low', icon: 'arrow-down-circle-outline' },
                                { id: 'rating', label: 'Highest Rated', icon: 'trending-up-outline' },
                            ].map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.sortOption, sortBy === item.id && styles.sortOptionSelected]}
                                    onPress={() => setSortBy(item.id)}
                                >
                                    <Ionicons name={item.icon} size={20} color={sortBy === item.id ? COLORS.primary : COLORS.subText} />
                                    <Text style={[styles.sortOptionText, sortBy === item.id && styles.sortOptionTextSelected]}>{item.label}</Text>
                                    {sortBy === item.id && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>
                                Price Range: <Text style={{fontWeight: '700', color: COLORS.primary}}>${priceRange[0]} - ${priceRange[1]}</Text>
                            </Text>
                            <View style={styles.sliderContainer}>
                                <Slider
                                    value={priceRange}
                                    onValueChange={setPriceRange}
                                    minimumValue={0}
                                    maximumValue={1000}
                                    step={10}
                                    minimumTrackTintColor={COLORS.primary}
                                    maximumTrackTintColor={COLORS.border}
                                    thumbTintColor={COLORS.primary}
                                    thumbStyle={styles.sliderThumb}
                                />
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                            <View style={styles.ratingOptions}>
                                {[5, 4, 3, 2, 1, 0].map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.ratingOption, minRating === r && styles.ratingOptionSelected]}
                                        onPress={() => setMinRating(r)}
                                    >
                                        <Ionicons name="star" size={16} color={minRating === r ? COLORS.surface : '#FFC107'} />
                                        <Text style={[styles.ratingOptionText, minRating === r && styles.ratingOptionTextSelected]}>
                                            {r === 0 ? 'Any' : `${r}+`}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterSectionTitle}>Availability</Text>
                            <View style={styles.switchOption}>
                                <Text style={styles.switchLabel}>In Stock Only</Text>
                                <Switch
                                    value={inStockOnly}
                                    onValueChange={setInStockOnly}
                                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                    thumbColor={COLORS.surface}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.clearButton} onPress={clearAllFilters}>
                            <Text style={styles.clearButtonText}>Clear All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
                            <Text style={styles.applyButtonText}>Show {filteredProducts.length} Results</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoContainer}>
                        <Logo
                            width={32}
                            height={32}
                            animated={true}
                            speed={5000}
                            showSparkles={true}
                        />
                        <Text style={styles.logoText}>GearZone</Text>
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleNotificationPress}>
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <Ionicons
                                name={unreadCount > 0 ? "notifications" : "notifications-outline"}
                                size={24}
                                color={unreadCount > 0 ? COLORS.danger : COLORS.text}
                            />
                        </Animated.View>
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconButton} onPress={handleCartPress}>
                        <Ionicons name="cart-outline" size={24} color={COLORS.text} />
                        {user && getCartItemsCount() > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{getCartItemsCount() > 99 ? '99+' : getCartItemsCount()}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            >
                <View style={styles.searchSection}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={22} color={COLORS.subText} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search thousands of products..."
                            placeholderTextColor={COLORS.subText}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')} style={{padding: 4}}>
                                <Ionicons name="close-circle" size={22} color={COLORS.border} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
                        <Ionicons name="options-outline" size={24} color={COLORS.text} />
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
                            contentContainerStyle={styles.bannerListContainer}
                        />
                        <View style={styles.bannerIndicators}>
                            {banners.map((_, i) => {
                                const inputRange = [(i - 1) * screenWidth, i * screenWidth, (i + 1) * screenWidth];
                                const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 20, 8], extrapolate: 'clamp' });
                                const backgroundColor = scrollX.interpolate({ inputRange, outputRange: ['rgba(255,255,255,0.5)', COLORS.surface, 'rgba(255,255,255,0.5)'], extrapolate: 'clamp' });

                                return <Animated.View key={i} style={[styles.bannerDot, { width: dotWidth, backgroundColor }]} />;
                            })}
                        </View>
                    </View>
                )}

                <View style={styles.categoriesSection}>
                    <Text style={styles.sectionTitleSmall}>Shop By Category</Text>
                    <FlatList
                        data={[{ id: 'all', name: 'All', icon: 'apps-outline' }, ...categories]}
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
                                {getActiveFiltersCount() > 0 && <Text style={{color: COLORS.primary}}> • {getActiveFiltersCount()} filter{getActiveFiltersCount() === 1 ? '' : 's'} active</Text>}
                            </Text>
                        </View>
                    </View>

                    {filteredProducts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="sad-outline" size={80} color={COLORS.border} />
                            <Text style={styles.emptyStateTitle}>No products found</Text>
                            <Text style={styles.emptyStateText}>
                                {searchQuery ? `No results for "${searchQuery}".` : 'Try adjusting your filters or browse different categories.'}
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
                        <FlatList
                            data={filteredProducts}
                            keyExtractor={item => item.id}
                            numColumns={2}
                            scrollEnabled={false}
                            columnWrapperStyle={styles.productsGridRow}
                            contentContainerStyle={styles.productsGridContainer}
                            renderItem={({ item }) => {
                                const ratingData = getProductRating(item.id);
                                const productWithRating = {
                                    ...item,
                                    rating: ratingData.rating,
                                    reviewCount: ratingData.reviewCount
                                };

                                return (
                                    <View style={styles.productItem}>
                                        <ProductCard
                                            product={productWithRating}
                                            onPress={() => navigation.navigate('ProductDetail', {
                                                product: productWithRating
                                            })}
                                        />
                                    </View>
                                );
                            }}
                        />
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
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.subText,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoText: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.8,
    },
    iconButton: {
        padding: 10,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        marginHorizontal: 4,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.danger,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.surface,
    },
    badgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
    },
    cartBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.danger,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.surface,
    },
    cartBadgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: '700',
    },
    searchSection: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.surface,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
        padding: 0,
        marginHorizontal: 8,
        includeFontPadding: false,
    },
    filterButton: {
        padding: 10,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        position: 'relative',
    },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: COLORS.primary,
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
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
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
        borderTopColor: COLORS.border,
    },
    filterSection: {
        marginBottom: 30,
    },
    filterSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 16,
    },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
    },
    sortOptionSelected: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    sortOptionText: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    sortOptionTextSelected: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    sliderContainer: {
        paddingHorizontal: 0,
    },
    sliderThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
        borderWidth: 4,
        borderColor: COLORS.primary,
    },
    ratingOptions: {
        flexDirection: 'row',
        gap: 10,
    },
    ratingOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
    },
    ratingOptionSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    ratingOptionText: {
        fontSize: 15,
        color: COLORS.subText,
        fontWeight: '600',
    },
    ratingOptionTextSelected: {
        color: COLORS.surface,
    },
    switchOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    switchLabel: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    clearButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    clearButtonText: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
    },
    applyButton: {
        flex: 2,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    applyButtonText: {
        fontSize: 16,
        color: COLORS.surface,
        fontWeight: '700',
    },
    bannerSection: {
        marginBottom: 20,
        backgroundColor: COLORS.surface,
        paddingVertical: 10,
    },
    bannerListContainer: {
        paddingHorizontal: 20,
        paddingRight: 40,
    },
    banner: {
        width: screenWidth - 40,
        height: 180,
        borderRadius: 24,
        marginRight: 20,
        overflow: 'hidden',
        backgroundColor: COLORS.background,
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
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    bannerContent: {
        padding: 24,
    },
    bannerTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    bannerSubtitle: {
        color: 'white',
        fontSize: 16,
        opacity: 0.9,
        marginBottom: 16,
        fontWeight: '500',
    },
    bannerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    bannerButtonText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    bannerIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    bannerDot: {
        height: 6,
        borderRadius: 3,
        marginHorizontal: 3,
    },
    categoriesSection: {
        marginBottom: 32,
        paddingVertical: 10,
    },
    sectionTitleSmall: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    categoriesContent: {
        paddingHorizontal: 20,
        paddingVertical: 4,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 10,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
    },
    categoryItemSelected: {
        backgroundColor: '#EEF2FF',
        borderColor: COLORS.primary,
    },
    categoryText: {
        fontSize: 14,
        color: COLORS.subText,
        fontWeight: '600',
    },
    categoryTextSelected: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    productsSection: {
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    productCount: {
        fontSize: 14,
        color: COLORS.subText,
        marginTop: 4,
        fontWeight: '500',
    },
    productsGridContainer: {
        paddingHorizontal: 10,
    },
    productsGridRow: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    productItem: {
        width: '50%',
        paddingHorizontal: 5,
        marginBottom: 10,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 15,
        color: COLORS.subText,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    resetButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    resetButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 30,
    },
});

export default Home;