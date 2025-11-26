import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { firestore } from '../firebase/config';
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc, query, where } from 'firebase/firestore';

// --- MOVED OUTSIDE: InputField Component ---
const InputField = ({ label, placeholder, value, onChangeText, keyboardType = 'default', required = false, onFocus, editable = true }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
            {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <TextInput
            style={[styles.input, !editable && styles.disabledInput]}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholderTextColor="#999"
            returnKeyType="next"
            blurOnSubmit={false}
            onFocus={onFocus}
            editable={editable}
        />
    </View>
);

// --- MOVED OUTSIDE: AddressCard Component ---
const AddressCard = ({ address, onEdit, onDelete, onSetDefault }) => (
    <View style={[
        styles.addressCard,
        address.isDefault && styles.defaultAddressCard
    ]}>
        <View style={styles.addressHeader}>
            <View style={styles.addressTitleRow}>
                <Text style={styles.addressName}>{address.fullName}</Text>
                {address.isDefault && (
                    <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                )}
            </View>
            <View style={styles.addressActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onEdit(address)}
                >
                    <Ionicons name="create-outline" size={18} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onDelete(address.id)}
                >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>

        <Text style={styles.addressText}>{address.address}</Text>
        <Text style={styles.addressText}>
            {address.city}, {address.state} {address.zipCode}
        </Text>
        <Text style={styles.addressText}>{address.country}</Text>
        <Text style={styles.addressPhone}>{address.phone}</Text>

        {!address.isDefault && (
            <TouchableOpacity
                style={styles.setDefaultButton}
                onPress={() => onSetDefault(address.id)}
            >
                <Text style={styles.setDefaultText}>Set as Default</Text>
            </TouchableOpacity>
        )}
    </View>
);

// Comprehensive list of countries
const ALL_COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
    'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas',
    'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin',
    'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei',
    'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon',
    'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia',
    'Comoros', 'Congo (Democratic Republic of the)', 'Congo (Republic of the)',
    'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark',
    'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt',
    'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana',
    'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
    'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
    'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon',
    'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands',
    'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia',
    'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
    'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
    'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama',
    'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
    'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
    'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
    'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
    'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
    'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga',
    'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
    'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
    'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
    'Zambia', 'Zimbabwe'
];

const Addresses = () => {
    const { user } = useAuth();
    const navigation = useNavigation();
    const [addresses, setAddresses] = useState([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [countrySearchTerm, setCountrySearchTerm] = useState(''); // New state for search term

    const [addressForm, setAddressForm] = useState({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        isDefault: false
    });

    useEffect(() => {
        loadAddresses();
    }, []);

    // Memoized and filtered list of countries for the search feature
    const filteredCountries = useMemo(() => {
        if (!countrySearchTerm) {
            return ALL_COUNTRIES;
        }
        const lowerCaseSearch = countrySearchTerm.toLowerCase();
        return ALL_COUNTRIES.filter(country =>
            country.toLowerCase().includes(lowerCaseSearch)
        );
    }, [countrySearchTerm]);

    const loadAddresses = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const addressesRef = collection(firestore, 'addresses');
            const q = query(addressesRef, where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);

            const addressesData = [];
            querySnapshot.forEach((doc) => {
                addressesData.push({ id: doc.id, ...doc.data() });
            });

            setAddresses(addressesData);
        } catch (error) {
            console.error('Error loading addresses:', error);
            Alert.alert('Error', 'Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    const saveAddressToFirebase = async (addressData) => {
        if (!user) return null;

        try {
            const addressesRef = collection(firestore, 'addresses');
            const newDocRef = doc(addressesRef);
            const addressWithUser = {
                ...addressData,
                userId: user.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await setDoc(newDocRef, addressWithUser);
            return newDocRef.id;
        } catch (error) {
            console.error('Error saving address:', error);
            throw error;
        }
    };

    const updateAddressInFirebase = async (addressId, addressData) => {
        try {
            const addressRef = doc(firestore, 'addresses', addressId);
            await updateDoc(addressRef, {
                ...addressData,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating address:', error);
            throw error;
        }
    };

    const deleteAddressFromFirebase = async (addressId) => {
        try {
            const addressRef = doc(firestore, 'addresses', addressId);
            await deleteDoc(addressRef);
        } catch (error) {
            console.error('Error deleting address:', error);
            throw error;
        }
    };

    const handleAddAddress = () => {
        setEditingAddress(null);
        setAddressForm({
            fullName: user?.fullName || '',
            phone: user?.phone || '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States',
            isDefault: addresses.length === 0
        });
        setShowAddressModal(true);
    };

    const handleEditAddress = (address) => {
        setEditingAddress(address);
        setAddressForm({ ...address });
        setShowAddressModal(true);
    };

    const handleSaveAddress = async () => {
        if (!addressForm.fullName || !addressForm.phone || !addressForm.address || !addressForm.city || !addressForm.state || !addressForm.zipCode) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            // Logic to handle default address setting across all addresses
            let addressDataToSave = addressForm;
            let addressesToUpdate = [...addresses];

            if (addressForm.isDefault) {
                // If setting to default, unset default for all others
                addressesToUpdate = addressesToUpdate.map(addr => {
                    if (addr.isDefault) {
                        updateAddressInFirebase(addr.id, { isDefault: false });
                        return { ...addr, isDefault: false };
                    }
                    return addr;
                });
            } else if (!editingAddress && addresses.length === 0) {
                // First address must be default
                addressDataToSave = { ...addressForm, isDefault: true };
            }


            if (editingAddress) {
                await updateAddressInFirebase(editingAddress.id, addressDataToSave);

                const updatedAddresses = addressesToUpdate.map(addr =>
                    addr.id === editingAddress.id
                        ? { ...addressDataToSave, id: editingAddress.id }
                        : addr
                );
                setAddresses(updatedAddresses);
                Alert.alert('Success', 'Address updated successfully');
            } else {
                const newAddressId = await saveAddressToFirebase(addressDataToSave);
                const newAddress = {
                    ...addressDataToSave,
                    id: newAddressId
                };

                const updatedAddresses = addressesToUpdate.concat([newAddress]);
                setAddresses(updatedAddresses);
                Alert.alert('Success', 'Address added successfully');
            }

            setShowAddressModal(false);
            resetForm();
        } catch (error) {
            Alert.alert('Error', 'Failed to save address. Please try again.');
        }
    };

    const handleDeleteAddress = async (addressId) => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAddressFromFirebase(addressId);
                            const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
                            setAddresses(updatedAddresses);

                            const deletedAddress = addresses.find(addr => addr.id === addressId);
                            if (deletedAddress?.isDefault && updatedAddresses.length > 0) {
                                // Set the next address as default
                                const newDefaultAddress = { ...updatedAddresses[0], isDefault: true };
                                const updatedWithNewDefault = updatedAddresses.map((addr, index) =>
                                    index === 0 ? newDefaultAddress : addr
                                );
                                setAddresses(updatedWithNewDefault);
                                await updateAddressInFirebase(newDefaultAddress.id, { isDefault: true });
                            } else {
                                setAddresses(updatedAddresses);
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete address. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleSetDefaultAddress = async (addressId) => {
        try {
            const updatedAddresses = addresses.map(addr => ({
                ...addr,
                isDefault: addr.id === addressId
            }));

            await Promise.all(
                updatedAddresses.map(addr =>
                    updateAddressInFirebase(addr.id, { isDefault: addr.isDefault })
                )
            );

            setAddresses(updatedAddresses);
            Alert.alert('Success', 'Default address updated');
        } catch (error) {
            Alert.alert('Error', 'Failed to update default address. Please try again.');
        }
    };

    const resetForm = () => {
        setAddressForm({
            fullName: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States',
            isDefault: false
        });
        setEditingAddress(null);
        setShowCountryDropdown(false);
        setCountrySearchTerm(''); // Reset search term
    };

    const handleCountrySelect = (country) => {
        setAddressForm(prev => ({ ...prev, country }));
        setShowCountryDropdown(false);
        setCountrySearchTerm(''); // Reset search term after selection
    };

    // Function to handle opening the modal and resetting the search
    const openCountryDropdown = () => {
        setCountrySearchTerm('');
        setShowCountryDropdown(true);
    };


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Addresses</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
                    <Ionicons name="add-circle-outline" size={24} color="#2563EB" />
                    <Text style={styles.addButtonText}>Add New Address</Text>
                </TouchableOpacity>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading addresses...</Text>
                    </View>
                ) : addresses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="location-outline" size={80} color="#E5E7EB" />
                        <Text style={styles.emptyStateTitle}>No Addresses</Text>
                        <Text style={styles.emptyStateText}>
                            You haven't added any addresses yet. Add your first address to get started.
                        </Text>
                        <TouchableOpacity
                            style={styles.addFirstAddressButton}
                            onPress={handleAddAddress}
                        >
                            <Text style={styles.addFirstAddressText}>Add Your First Address</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.addressesList}>
                        <Text style={styles.sectionTitle}>Saved Addresses ({addresses.length})</Text>
                        {addresses.map((address) => (
                            <AddressCard
                                key={address.id}
                                address={address}
                                onEdit={handleEditAddress}
                                onDelete={handleDeleteAddress}
                                onSetDefault={handleSetDefaultAddress}
                            />
                        ))}
                    </View>
                )}

                {addresses.length > 0 && (
                    <View style={styles.infoSection}>
                        <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
                        <Text style={styles.infoText}>
                            Your default address will be automatically used as shipping address during checkout.
                        </Text>
                    </View>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>

            <Modal
                visible={showAddressModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => {
                    setShowAddressModal(false);
                    resetForm();
                }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingAddress ? 'Edit Address' : 'Add New Address'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowAddressModal(false);
                                    resetForm();
                                }}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <KeyboardAvoidingView
                            style={styles.modalContent}
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
                        >
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                <InputField
                                    label="Full Name"
                                    placeholder="John Doe"
                                    value={addressForm.fullName}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, fullName: text }))}
                                    required
                                />
                                <InputField
                                    label="Phone Number"
                                    placeholder="+1 (555) 123-4567"
                                    value={addressForm.phone}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, phone: text }))}
                                    keyboardType="phone-pad"
                                    required
                                />
                                <InputField
                                    label="Street Address"
                                    placeholder="123 Main Street"
                                    value={addressForm.address}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, address: text }))}
                                    required
                                />
                                <View style={styles.row}>
                                    <View style={styles.halfInput}>
                                        <InputField
                                            label="City"
                                            placeholder="New York"
                                            value={addressForm.city}
                                            onChangeText={(text) => setAddressForm(prev => ({ ...prev, city: text }))}
                                            required
                                        />
                                    </View>
                                    <View style={styles.halfInput}>
                                        <InputField
                                            label="State"
                                            placeholder="NY"
                                            value={addressForm.state}
                                            onChangeText={(text) => setAddressForm(prev => ({ ...prev, state: text }))}
                                            required
                                        />
                                    </View>
                                </View>
                                <InputField
                                    label="ZIP Code"
                                    placeholder="10001"
                                    value={addressForm.zipCode}
                                    onChangeText={(text) => setAddressForm(prev => ({ ...prev, zipCode: text }))}
                                    keyboardType="numeric"
                                    required
                                />

                                {/* Country Dropdown */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>
                                        Country
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.countrySelector}
                                        onPress={openCountryDropdown} // Use new function
                                    >
                                        <Text style={styles.countryText}>
                                            {addressForm.country}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                {/* Country Dropdown Modal */}
                                <Modal
                                    visible={showCountryDropdown}
                                    transparent={true}
                                    animationType="fade"
                                    onRequestClose={() => setShowCountryDropdown(false)}
                                >
                                    <TouchableWithoutFeedback onPress={() => setShowCountryDropdown(false)}>
                                        <View style={styles.countryDropdownOverlay}>
                                            <View style={styles.countryDropdown}>
                                                <Text style={styles.countryDropdownTitle}>Select Country</Text>

                                                {/* -------------------- NEW SEARCH INPUT -------------------- */}
                                                <View style={styles.searchContainer}>
                                                    <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                                                    <TextInput
                                                        style={styles.searchInput}
                                                        placeholder="Search countries..."
                                                        placeholderTextColor="#9CA3AF"
                                                        value={countrySearchTerm}
                                                        onChangeText={setCountrySearchTerm}
                                                    />
                                                </View>
                                                {/* ---------------------------------------------------------- */}

                                                <ScrollView style={styles.countryList}>
                                                    {filteredCountries.length > 0 ? (
                                                        filteredCountries.map((country) => (
                                                            <TouchableOpacity
                                                                key={country}
                                                                style={[
                                                                    styles.countryItem,
                                                                    addressForm.country === country && styles.countryItemSelected
                                                                ]}
                                                                onPress={() => handleCountrySelect(country)}
                                                            >
                                                                <Text style={[
                                                                    styles.countryItemText,
                                                                    addressForm.country === country && styles.countryItemTextSelected
                                                                ]}>
                                                                    {country}
                                                                </Text>
                                                                {addressForm.country === country && (
                                                                    <Ionicons name="checkmark" size={20} color="#2563EB" />
                                                                )}
                                                            </TouchableOpacity>
                                                        ))
                                                    ) : (
                                                        <Text style={styles.noResultsText}>No countries found matching "{countrySearchTerm}"</Text>
                                                    )}
                                                </ScrollView>
                                            </View>
                                        </View>
                                    </TouchableWithoutFeedback>
                                </Modal>

                                {(editingAddress || addresses.length === 0) && (
                                    <TouchableOpacity
                                        style={styles.defaultToggle}
                                        onPress={() => setAddressForm(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                                    >
                                        <View style={styles.toggleContainer}>
                                            <View style={[
                                                styles.toggleCircle,
                                                addressForm.isDefault && styles.toggleCircleActive
                                            ]}>
                                                {addressForm.isDefault && (
                                                    <Ionicons name="checkmark" size={16} color="white" />
                                                )}
                                            </View>
                                            <Text style={styles.toggleText}>Set as default address</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </KeyboardAvoidingView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowAddressModal(false);
                                    resetForm();
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveAddress}
                            >
                                <Text style={styles.saveButtonText}>
                                    {editingAddress ? 'Update Address' : 'Save Address'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </TouchableWithoutFeedback>
            </Modal>
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
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2563EB',
        borderStyle: 'dashed',
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2563EB',
        marginLeft: 12,
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        margin: 16,
        backgroundColor: 'white',
        borderRadius: 12,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
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
    addFirstAddressButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    addFirstAddressText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    addressesList: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    addressCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    defaultAddressCard: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    addressTitleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    addressName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginRight: 8,
    },
    defaultBadge: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    defaultBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    addressActions: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 4,
        marginLeft: 8,
    },
    addressText: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 2,
    },
    addressPhone: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    setDefaultButton: {
        marginTop: 12,
        paddingVertical: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2563EB',
        borderRadius: 6,
    },
    setDefaultText: {
        color: '#2563EB',
        fontSize: 14,
        fontWeight: '500',
    },
    infoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1E40AF',
        marginLeft: 8,
        lineHeight: 18,
    },
    bottomSpacer: {
        height: 20,
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
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6,
    },
    required: {
        color: '#EF4444',
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: 'white',
    },
    disabledInput: {
        backgroundColor: '#F9FAFB',
        color: '#6B7280',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    countrySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: 'white',
    },
    countryText: {
        fontSize: 16,
        color: '#374151',
    },
    countryDropdownOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    countryDropdown: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
        padding: 16,
    },
    countryDropdownTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
        backgroundColor: '#F9FAFB',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1F2937',
    },
    countryList: {
        maxHeight: 400,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    countryItemSelected: {
        backgroundColor: '#EFF6FF',
    },
    countryItemText: {
        fontSize: 16,
        color: '#374151',
    },
    countryItemTextSelected: {
        color: '#2563EB',
        fontWeight: '600',
    },
    noResultsText: {
        padding: 16,
        textAlign: 'center',
        color: '#6B7280',
        fontStyle: 'italic',
    },
    defaultToggle: {
        marginTop: 8,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleCircleActive: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    toggleText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    saveButton: {
        flex: 2,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: '#2563EB',
        borderRadius: 12,
    },
    saveButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default Addresses;