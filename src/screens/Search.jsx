import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// You'll need to import your products data or fetch it
// For now, I'll assume you pass it via navigation or context

const Search = () => {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]); // You should get this from context or props

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return [];

        return products.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, products]);

    const handleProductPress = (product) => {
        navigation.navigate('ProductDetail', { product });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Search Header */}
            <View style={styles.searchHeader}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search-outline" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search products..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={true}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Search Results */}
            <View style={styles.resultsContainer}>
                {searchQuery.length === 0 ? (
                    <View style={styles.placeholderContainer}>
                        <Ionicons name="search-outline" size={64} color="#E5E7EB" />
                        <Text style={styles.placeholderText}>
                            Search for products, brands, or categories
                        </Text>
                    </View>
                ) : filteredProducts.length === 0 ? (
                    <View style={styles.placeholderContainer}>
                        <Ionicons name="search-outline" size={64} color="#E5E7EB" />
                        <Text style={styles.placeholderText}>
                            No results found for "{searchQuery}"
                        </Text>
                        <Text style={styles.placeholderSubtext}>
                            Try different keywords or check the spelling
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.productItem}
                                onPress={() => handleProductPress(item)}
                            >
                                <Text style={styles.productName}>{item.name}</Text>
                                <Text style={styles.productCategory}>{item.category}</Text>
                            </TouchableOpacity>
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 12,
        marginRight: 12,
    },
    resultsContainer: {
        flex: 1,
        padding: 16,
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 16,
    },
    placeholderSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 8,
    },
    productItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 14,
        color: '#6B7280',
        textTransform: 'capitalize',
    },
});

export default Search;