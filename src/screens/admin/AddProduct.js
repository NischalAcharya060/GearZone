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
    Image,
    Platform,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

// Firebase imports
import { firestore } from '../../firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const AddProduct = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
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

    const pickImage = async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload images.');
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                // FIXED: Use the correct mediaTypes format
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                aspect: [4, 3],
                quality: 0.7,
                allowsMultipleSelection: true,
                selectionLimit: 5,
            });

            console.log('Image picker result:', result);

            if (!result.canceled && result.assets) {
                const newImages = result.assets.map(asset => asset.uri);
                console.log('Selected images:', newImages);
                setImages(prev => [...prev, ...newImages]);
            } else {
                console.log('Image selection canceled');
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
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
        if (images.length === 0) {
            Alert.alert('Error', 'Please add at least one product image');
            return false;
        }
        return true;
    };

    // Generate placeholder image paths based on product name
    const generateImagePaths = () => {
        const productName = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const imagePaths = [];

        // Generate multiple placeholder image paths
        for (let i = 0; i < images.length; i++) {
            const path = `products/${productName}-${i + 1}.jpg`;
            imagePaths.push(path);
        }

        return imagePaths;
    };

    // Use local image URIs directly (for demo purposes)
    const getImageReferences = () => {
        return images;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            console.log('Starting product submission process...');

            // Generate image paths for Firestore
            const imagePaths = generateImagePaths();
            console.log('Generated image paths:', imagePaths);

            // Create new product object
            const newProduct = {
                name: formData.name.trim(),
                category: formData.category,
                price: parseFloat(formData.price),
                originalPrice: parseFloat(formData.price) * 1.2,
                images: imagePaths, // Store paths instead of uploaded URLs
                imageUrls: getImageReferences(), // Store local URIs for demo
                description: formData.description.trim(),
                specifications: {
                    battery: formData.specifications.battery || 'Not specified',
                    connectivity: formData.specifications.connectivity || 'Not specified',
                    weight: formData.specifications.weight || 'Not specified',
                    features: formData.specifications.features.length > 0 ?
                        formData.specifications.features : ['Premium Quality', 'Latest Technology']
                },
                rating: 4.0,
                reviewCount: 0,
                inStock: parseInt(formData.stock) > 0,
                stock: parseInt(formData.stock),
                brand: formData.brand.trim() || 'Generic',
                sku: formData.sku || generateSKU(),
                createdAt: new Date(),
                updatedAt: new Date(),
                hasImages: images.length > 0,
                imageCount: images.length,
                imagePlaceholder: true, // Flag to indicate these are placeholder paths
            };

            console.log('Saving product to Firestore:', newProduct);

            // Save to Firestore
            const docRef = await addDoc(collection(firestore, 'products'), newProduct);

            console.log('Product added with ID: ', docRef.id);

            Alert.alert(
                'Success',
                'Product added successfully!\n\nNote: Images are stored as local references. For production, upload images to a cloud service.',
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
        setImages([]);
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
                {/* Image Upload Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Product Images *</Text>
                    <Text style={styles.sectionSubtitle}>
                        Add at least one image (max 5) - Stored as local references
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                        <TouchableOpacity
                            style={styles.imageUploadButton}
                            onPress={pickImage}
                            disabled={images.length >= 5}
                        >
                            <Ionicons name="camera-outline" size={32} color="#666" />
                            <Text style={styles.imageUploadText}>
                                {images.length >= 5 ? 'Max 5 Images' : 'Add Images'}
                            </Text>
                            <Text style={styles.imageCount}>({images.length}/5)</Text>
                        </TouchableOpacity>

                        {images.map((image, index) => (
                            <View key={index} style={styles.imageContainer}>
                                <Image source={{ uri: image }} style={styles.image} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => removeImage(index)}
                                >
                                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>

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
    sectionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    imageScroll: {
        marginBottom: 8,
    },
    imageUploadButton: {
        width: 120,
        height: 120,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: '#F9FAFB',
    },
    imageUploadText: {
        marginTop: 8,
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    imageCount: {
        fontSize: 10,
        color: '#999',
        marginTop: 4,
    },
    imageContainer: {
        position: 'relative',
        marginRight: 12,
    },
    image: {
        width: 120,
        height: 120,
        borderRadius: 12,
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'white',
        borderRadius: 12,
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