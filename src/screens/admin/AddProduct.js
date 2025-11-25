import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Alert,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Firebase imports
import { firestore } from '../../firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const AddProduct = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        brand: '',
        sku: '',
        specifications: {
            battery: '',
            connectivity: '',
            weight: '',
            features: []
        }
    });

    // Fetch categories from Firebase on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const categoriesCollection = collection(firestore, 'categories');
            const categoriesSnapshot = await getDocs(categoriesCollection);
            const categoriesList = categoriesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCategories(categoriesList);
        } catch (error) {
            console.error('Error fetching categories:', error);
            Alert.alert('Error', 'Failed to load categories');
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSpecificationChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            specifications: {
                ...prev.specifications,
                [field]: value
            }
        }));
    };

    const selectCategory = (category) => {
        setFormData(prev => ({
            ...prev,
            category: category.name
        }));
        setShowCategoryModal(false);
    };

    const generateSKU = () => {
        const brandPrefix = formData.brand ? formData.brand.substring(0, 3).toUpperCase() : 'PRO';
        const categoryPrefix = formData.category ? formData.category.substring(0, 3).toUpperCase() : 'DEF';
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `${brandPrefix}-${categoryPrefix}-${randomNum}`;
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Please enter product name');
            return false;
        }
        if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
            Alert.alert('Error', 'Please enter a valid price');
            return false;
        }
        if (!formData.category) {
            Alert.alert('Error', 'Please select a category');
            return false;
        }
        if (!formData.stock || isNaN(formData.stock) || parseInt(formData.stock) < 0) {
            Alert.alert('Error', 'Please enter valid stock quantity');
            return false;
        }
        return true;
    };

    // Generate placeholder image URLs based on product category
    const generatePlaceholderImages = () => {
        const categoryImages = {
            // Laptop images
            'laptop': [
                'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=500&fit=crop'
            ],
            'laptops': [
                'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=500&fit=crop'
            ],

            // Headphone images
            'headphone': [
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop'
            ],
            'headphones': [
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop'
            ],

            // Phone images
            'phone': [
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500&h=500&fit=crop'
            ],
            'phones': [
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500&h=500&fit=crop'
            ],

            // Camera images
            'camera': [
                'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500&h=500&fit=crop'
            ],
            'cameras': [
                'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500&h=500&fit=crop'
            ],

            // Tablet images
            'tablet': [
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop'
            ],
            'tablets': [
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop'
            ],

            // Default/Electronics images
            'electronics': [
                'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1560769624-6a4f57aae2c2?w=500&h=500&fit=crop',
                'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&h=500&fit=crop'
            ]
        };

        const defaultImages = [
            'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&h=500&fit=crop',
            'https://images.unsplash.com/photo-1560769624-6a4f57aae2c2?w=500&h=500&fit=crop',
            'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&h=500&fit=crop'
        ];

        if (!formData.category) {
            return defaultImages;
        }

        const categoryKey = formData.category.toLowerCase().trim();

        // Direct match
        if (categoryImages[categoryKey]) {
            return categoryImages[categoryKey];
        }

        return defaultImages;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Use placeholder images from Unsplash
            const imageUrls = generatePlaceholderImages();

            // Create new product object with placeholder images
            const newProduct = {
                name: formData.name.trim(),
                category: formData.category,
                price: parseFloat(formData.price),
                originalPrice: parseFloat(formData.price) * 1.2,
                images: imageUrls,
                description: formData.description.trim() || `High-quality ${formData.category || 'electronic'} product with excellent features and performance.`,
                specifications: {
                    battery: formData.specifications.battery || 'Up to 24 hours',
                    connectivity: formData.specifications.connectivity || 'Bluetooth 5.0, USB-C',
                    weight: formData.specifications.weight || '250g',
                    features: formData.specifications.features.length > 0 ?
                        formData.specifications.features : ['Premium Quality', 'Latest Technology', 'Wireless', 'Fast Charging']
                },
                rating: 4.0 + (Math.random() * 1.0),
                reviewCount: Math.floor(Math.random() * 100) + 10,
                inStock: parseInt(formData.stock) > 0,
                stock: parseInt(formData.stock) || 50,
                brand: formData.brand.trim() || 'TechBrand',
                sku: formData.sku || generateSKU(),
                createdAt: new Date(),
                updatedAt: new Date(),
                hasImages: true,
                imageCount: imageUrls.length,
                imageStorage: 'external',
            };

            // Save to Firestore
            const docRef = await addDoc(collection(firestore, 'products'), newProduct);

            Alert.alert(
                'Success',
                'Product added successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );

            // Reset form
            resetForm();

        } catch (error) {
            console.error('Error adding product:', error);
            Alert.alert('Error', 'Failed to add product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            category: '',
            stock: '',
            brand: '',
            sku: '',
            specifications: {
                battery: '',
                connectivity: '',
                weight: '',
                features: []
            }
        });
    };

    const CategoryModal = () => (
        <Modal
            visible={showCategoryModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowCategoryModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Category</Text>
                        <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    {categories.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="folder-open-outline" size={48} color="#CCC" />
                            <Text style={styles.emptyStateText}>No categories found</Text>
                            <Text style={styles.emptyStateSubtext}>
                                Add categories first from the admin panel
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={categories}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.categoryItem}
                                    onPress={() => selectCategory(item)}
                                >
                                    <Ionicons name={item.icon || 'cube-outline'} size={20} color="#666" />
                                    <Text style={styles.categoryName}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );

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
                <Text style={styles.headerTitle}>Add Product</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Product Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Product Information</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Product Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter product name"
                            value={formData.name}
                            onChangeText={(text) => handleInputChange('name', text)}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Enter product description"
                            value={formData.description}
                            onChangeText={(text) => handleInputChange('description', text)}
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.inputLabel}>Price ($) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                value={formData.price}
                                onChangeText={(text) => handleInputChange('price', text)}
                                placeholderTextColor="#999"
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.inputLabel}>Stock *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                value={formData.stock}
                                onChangeText={(text) => handleInputChange('stock', text)}
                                placeholderTextColor="#999"
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Category *</Text>
                        <TouchableOpacity
                            style={styles.categorySelector}
                            onPress={() => setShowCategoryModal(true)}
                        >
                            <Text style={formData.category ? styles.categorySelected : styles.categoryPlaceholder}>
                                {formData.category || 'Select Category'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.inputLabel}>Brand</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Brand name"
                                value={formData.brand}
                                onChangeText={(text) => handleInputChange('brand', text)}
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.inputLabel}>SKU</Text>
                            <View style={styles.skuContainer}>
                                <TextInput
                                    style={[styles.input, styles.skuInput]}
                                    placeholder="Auto-generated"
                                    value={formData.sku}
                                    onChangeText={(text) => handleInputChange('sku', text)}
                                    placeholderTextColor="#999"
                                />
                                <TouchableOpacity
                                    style={styles.generateButton}
                                    onPress={() => handleInputChange('sku', generateSKU())}
                                >
                                    <Text style={styles.generateButtonText}>Generate</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Specifications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Specifications (Optional)</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Battery</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 30 hours"
                            value={formData.specifications.battery}
                            onChangeText={(text) => handleSpecificationChange('battery', text)}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Connectivity</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Bluetooth 5.0"
                            value={formData.specifications.connectivity}
                            onChangeText={(text) => handleSpecificationChange('connectivity', text)}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Weight</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 254g"
                            value={formData.specifications.weight}
                            onChangeText={(text) => handleSpecificationChange('weight', text)}
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        loading && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Ionicons name="refresh" size={20} color="white" style={styles.spinner} />
                            <Text style={styles.submitButtonText}>Adding Product...</Text>
                        </View>
                    ) : (
                        <Text style={styles.submitButtonText}>Add Product</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            <CategoryModal />
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
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    placeholder: {
        width: 32,
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    section: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    categorySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
    },
    categoryPlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    categorySelected: {
        fontSize: 16,
        color: '#1F2937',
    },
    skuContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    skuInput: {
        flex: 1,
        marginRight: 8,
    },
    generateButton: {
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    generateButtonText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 20,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    spinner: {
        marginRight: 8,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    categoryName: {
        fontSize: 16,
        color: '#374151',
        marginLeft: 12,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});

export default AddProduct;