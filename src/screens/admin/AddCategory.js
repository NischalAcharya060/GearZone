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

// Firebase imports - UPDATED
import { firestore } from '../../firebase/config';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

const AddCategory = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [showIconModal, setShowIconModal] = useState(false);
    const [existingCategories, setExistingCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        icon: '',
    });

    // Common icons for categories
    const availableIcons = [
        'headset-outline', 'watch-outline', 'laptop-outline', 'phone-portrait-outline',
        'camera-outline', 'tablet-portrait-outline', 'game-controller-outline',
        'musical-notes-outline', 'tv-outline', 'car-outline', 'home-outline',
        'shirt-outline', 'football-outline', 'book-outline', 'basket-outline',
        'heart-outline', 'star-outline', 'flash-outline', 'hardware-chip-outline',
        'bag-outline', 'glasses-outline', 'fitness-outline', 'restaurant-outline',
        'cutlery-outline', 'wine-outline', 'flower-outline', 'paw-outline',
        'airplane-outline', 'train-outline', 'boat-outline', 'bed-outline'
    ];

    // Fetch categories from Firebase on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const categoriesQuery = query(
                collection(firestore, 'categories'), // UPDATED: firestore instead of db
                orderBy('createdAt', 'desc')
            );
            const categoriesSnapshot = await getDocs(categoriesQuery);
            const categoriesList = categoriesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setExistingCategories(categoriesList);
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

    const selectIcon = (iconName) => {
        setFormData(prev => ({
            ...prev,
            icon: iconName
        }));
        setShowIconModal(false);
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Please enter category name');
            return false;
        }
        if (!formData.icon) {
            Alert.alert('Error', 'Please select an icon');
            return false;
        }

        // Check if category name already exists
        const existingCategory = existingCategories.find(
            cat => cat.name.toLowerCase() === formData.name.toLowerCase().trim()
        );
        if (existingCategory) {
            Alert.alert('Error', 'Category name already exists');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Create new category object
            const newCategory = {
                name: formData.name.trim(),
                icon: formData.icon,
                createdAt: new Date(),
                productCount: 0, // Initialize product count
            };

            // Save to Firestore - UPDATED: firestore instead of db
            const docRef = await addDoc(collection(firestore, 'categories'), newCategory);

            console.log('Category added with ID: ', docRef.id);

            // Refresh the categories list
            await fetchCategories();

            Alert.alert(
                'Success',
                'Category added successfully!',
                [
                    {
                        text: 'Add Another',
                        style: 'cancel',
                        onPress: () => resetForm()
                    },
                    {
                        text: 'Done',
                        onPress: () => navigation.goBack()
                    }
                ]
            );

        } catch (error) {
            console.error('Error adding category:', error);
            Alert.alert('Error', 'Failed to add category. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            icon: '',
        });
    };

    const IconModal = () => (
        <Modal
            visible={showIconModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowIconModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Icon</Text>
                        <TouchableOpacity onPress={() => setShowIconModal(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={availableIcons}
                        keyExtractor={(item) => item}
                        numColumns={4}
                        contentContainerStyle={styles.iconsGrid}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.iconItem,
                                    formData.icon === item && styles.iconItemSelected
                                ]}
                                onPress={() => selectIcon(item)}
                            >
                                <Ionicons
                                    name={item}
                                    size={24}
                                    color={formData.icon === item ? '#2563EB' : '#666'}
                                />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    const ExistingCategories = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Existing Categories</Text>
            <Text style={styles.sectionSubtitle}>
                {existingCategories.length} categories already exist
            </Text>

            {existingCategories.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="folder-open-outline" size={32} color="#CCC" />
                    <Text style={styles.emptyStateText}>No categories yet</Text>
                    <Text style={styles.emptyStateSubtext}>
                        Start by adding your first category
                    </Text>
                </View>
            ) : (
                <View style={styles.categoriesList}>
                    {existingCategories.map((category) => (
                        <View key={category.id} style={styles.categoryChip}>
                            <Ionicons name={category.icon} size={16} color="#666" />
                            <Text style={styles.categoryChipText}>{category.name}</Text>
                            {category.productCount > 0 && (
                                <Text style={styles.productCount}>
                                    {category.productCount}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            )}
        </View>
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
                <Text style={styles.headerTitle}>Add Category</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Category Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Category Information</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Category Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter category name"
                            value={formData.name}
                            onChangeText={(text) => handleInputChange('name', text)}
                            placeholderTextColor="#999"
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Icon *</Text>
                        <TouchableOpacity
                            style={styles.iconSelector}
                            onPress={() => setShowIconModal(true)}
                        >
                            {formData.icon ? (
                                <View style={styles.iconSelected}>
                                    <Ionicons name={formData.icon} size={20} color="#2563EB" />
                                    <Text style={styles.iconSelectedText}>
                                        {formData.icon.replace('-outline', '')}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.iconPlaceholder}>Select Icon</Text>
                            )}
                            <Ionicons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Preview */}
                    {formData.name && formData.icon && (
                        <View style={styles.previewSection}>
                            <Text style={styles.previewTitle}>Preview</Text>
                            <View style={styles.previewContent}>
                                <View style={styles.previewIcon}>
                                    <Ionicons name={formData.icon} size={32} color="#2563EB" />
                                </View>
                                <View>
                                    <Text style={styles.previewName}>{formData.name}</Text>
                                    <Text style={styles.previewSubtext}>
                                        This is how the category will appear in the app
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Existing Categories */}
                <ExistingCategories />

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (!formData.name || !formData.icon) && styles.submitButtonDisabled,
                        loading && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={!formData.name || !formData.icon || loading}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Ionicons name="refresh" size={20} color="white" style={styles.spinner} />
                            <Text style={styles.submitButtonText}>Adding Category...</Text>
                        </View>
                    ) : (
                        <Text style={styles.submitButtonText}>Add Category</Text>
                    )}
                </TouchableOpacity>

                {/* Clear Form Button */}
                {(formData.name || formData.icon) && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={resetForm}
                    >
                        <Text style={styles.clearButtonText}>Clear Form</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            <IconModal />
        </SafeAreaView>
    );
};

// Styles remain exactly the same...
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
    inputGroup: {
        marginBottom: 20,
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
    iconSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
    },
    iconPlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    iconSelected: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconSelectedText: {
        fontSize: 16,
        color: '#1F2937',
        marginLeft: 8,
        textTransform: 'capitalize',
    },
    previewSection: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#F0F9FF',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#2563EB',
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563EB',
        marginBottom: 8,
    },
    previewContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    previewIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    previewName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    previewSubtext: {
        fontSize: 12,
        color: '#6B7280',
    },
    categoriesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 8,
        position: 'relative',
    },
    categoryChipText: {
        fontSize: 12,
        color: '#374151',
        marginLeft: 4,
        marginRight: 8,
    },
    productCount: {
        fontSize: 10,
        color: '#2563EB',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 8,
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
    clearButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: 'white',
        marginVertical: 8,
    },
    clearButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '500',
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
        maxHeight: '60%',
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
    iconsGrid: {
        padding: 16,
    },
    iconItem: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    iconItemSelected: {
        backgroundColor: '#EFF6FF',
        borderColor: '#2563EB',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});

export default AddCategory;