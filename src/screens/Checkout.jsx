import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

import { useAuth } from '../context/AuthContext';
import { firestore } from '../firebase/config';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

// Fix environment variable access for React Native
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here';

const InputField = ({ label, placeholder, value, onChangeText, keyboardType = 'default', required = false }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
            {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            value={value}
            onChangeText={(text) => onChangeText(text)}
            keyboardType={keyboardType}
            placeholderTextColor="#999"
        />
    </View>
);

const getApiUrl = () => {
    if (__DEV__) {
        // For physical devices and simulators
        const baseUrl = 'http://192.168.1.66:4242';
        const url = `${baseUrl}/api/payment-sheet`;
        console.log('🌐 Using server URL:', url);
        return url;
    }
    return 'https://your-production-server.com/api/payment-sheet';
};

// URL Handler Component for iOS
const StripeURLHandler = () => {
    const { handleURLCallback } = useStripe();

    const handleDeepLink = async (url) => {
        if (url) {
            const stripeHandled = await handleURLCallback(url);
            if (stripeHandled) {
                console.log('Stripe handled the URL:', url);
            }
        }
    };

    useEffect(() => {
        const getUrlAsync = async () => {
            const initialUrl = await Linking.getInitialURL();
            handleDeepLink(initialUrl);
        };

        getUrlAsync();

        const deepLinkListener = Linking.addEventListener(
            'url',
            (event) => {
                handleDeepLink(event.url);
            }
        );

        return () => deepLinkListener.remove();
    }, []);

    return null;
};

const Checkout = () => {
    useEffect(() => {
        console.log("Stripe Publishable Key in use:", STRIPE_PUBLISHABLE_KEY);
    }, []);

    const navigation = useNavigation();
    const { cartItems, getCartTotal, clearCart } = useCart();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const { user } = useAuth();

    const [defaultAddress, setDefaultAddress] = useState(null);
    const [isUsingDefaultAddress, setIsUsingDefaultAddress] = useState(true);
    const [addressLoading, setAddressLoading] = useState(true);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
    });

    const [isProcessing, setIsProcessing] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    useEffect(() => {
        if (user?.uid) {
            fetchDefaultAddress();
        } else {
            setAddressLoading(false);
            setIsUsingDefaultAddress(false);
        }
    }, [user?.uid]);

    const fetchDefaultAddress = async () => {
        setAddressLoading(true);
        try {
            const addressesRef = collection(firestore, 'addresses');
            const q = query(
                addressesRef,
                where('userId', '==', user.uid),
                where('isDefault', '==', true)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const defaultAddr = querySnapshot.docs[0].data();
                setDefaultAddress(defaultAddr);
                setIsUsingDefaultAddress(true);

                setFormData({
                    fullName: defaultAddr.fullName || user?.fullName || '',
                    email: user?.email || '',
                    phone: defaultAddr.phone || '',
                    address: defaultAddr.address || '',
                    city: defaultAddr.city || '',
                    state: defaultAddr.state || '',
                    zipCode: defaultAddr.zipCode || '',
                    country: defaultAddr.country || 'United States',
                });
            } else {
                setIsUsingDefaultAddress(false);
                setFormData(prev => ({
                    ...prev,
                    fullName: user?.fullName || '',
                    email: user?.email || '',
                }));
            }
        } catch (error) {
            console.error('Error fetching default address:', error);
            setIsUsingDefaultAddress(false);
        } finally {
            setAddressLoading(false);
        }
    };

    const toggleUseDefaultAddress = () => {
        if (!defaultAddress) return;

        setIsUsingDefaultAddress(true);
        setFormData({
            fullName: defaultAddress.fullName || user?.fullName || '',
            email: user?.email || '',
            phone: defaultAddress.phone || '',
            address: defaultAddress.address || '',
            city: defaultAddress.city || '',
            state: defaultAddress.state || '',
            zipCode: defaultAddress.zipCode || '',
            country: defaultAddress.country || 'United States',
        });
    };

    const fetchPaymentSheetParams = async (totalAmount) => {
        const url = getApiUrl();

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    totalInCents: Math.round(totalAmount * 100),
                    currency: 'usd',
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server failed to create Payment Intent (HTTP Error):', errorText);
                Alert.alert('Payment Initialization Error', 'Could not start payment. Check your backend server logs.');
                throw new Error('Server error');
            }

            const data = await response.json();

            return {
                paymentIntent: data.paymentIntent,
                ephemeralKey: data.ephemeralKey,
                customer: data.customer,
            };

        } catch (error) {
            console.error('Network or Server Issue:', error);
            Alert.alert('Connection Error', 'Failed to connect to the payment server. Ensure your Node.js server is running.');
            throw error;
        }
    };

    const saveOrderToFirestore = async () => {
        try {
            const subtotal = getCartTotal();
            const shipping = subtotal > 0 ? 9.99 : 0;
            const tax = subtotal * 0.08;
            const total = subtotal + shipping + tax;

            const orderData = {
                userId: user.uid,
                orderNumber: `ORD-${Date.now()}`,
                items: cartItems.map(item => ({
                    productId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.images?.[0] || '📦'
                })),
                total: total,
                subtotal: subtotal,
                shippingCost: shipping,
                tax: tax,
                shippingInfo: {
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    country: formData.country
                },
                paymentMethod: 'Credit Card',
                status: 'processing',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const ordersRef = collection(firestore, 'orders');
            const docRef = await addDoc(ordersRef, orderData);

            console.log('Order saved with ID:', docRef.id);
            return {
                ...orderData,
                id: docRef.id
            };
        } catch (error) {
            console.error('Error saving order to Firestore:', error);
            throw error;
        }
    };

    const initializePaymentSheet = async () => {
        try {
            const totalAmount = getCartTotal() + 9.99 + (getCartTotal() * 0.08);

            const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams(totalAmount);

            const { error } = await initPaymentSheet({
                merchantDisplayName: "TechStore Inc.",
                paymentIntentClientSecret: paymentIntent,
                customerEphemeralKeySecret: ephemeralKey,
                customerId: customer,
                allowsDelayedPaymentMethods: true,
                returnURL: 'yourapp://stripe-redirect',
                defaultBillingDetails: {
                    name: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    address: {
                        line1: formData.address,
                        city: formData.city,
                        state: formData.state,
                        postalCode: formData.zipCode,
                        country: formData.country,
                    }
                }
            });

            if (!error) {
                return true;
            } else {
                console.error('Error initializing payment sheet:', error);
                Alert.alert('Payment Setup Error', error.message || 'Failed to initialize payment sheet.');
                return false;
            }
        } catch (error) {
            console.error('Error in initializePaymentSheet:', error);
            Alert.alert('Error', 'Failed to initialize payment system. Please try again.');
            return false;
        }
    };

    const openPaymentSheet = async () => {
        const { error } = await presentPaymentSheet();

        if (error) {
            if (error.code === 'Canceled') {
                console.log('Payment canceled by user');
            } else {
                Alert.alert(`Payment Error`, error.message);
            }
            setIsProcessing(false);
        } else {
            await handlePaymentSuccess();
        }
    };

    const handleCheckout = async () => {
        // Validate required fields
        const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            Alert.alert('Error', 'Please fill in all required shipping fields.');
            return;
        }

        if (cartItems.length === 0) {
            Alert.alert('Error', 'Your cart is empty');
            return;
        }

        setIsProcessing(true);

        try {
            const initialized = await initializePaymentSheet();
            if (initialized) {
                await openPaymentSheet();
            } else {
                setIsProcessing(false);
            }
        } catch (error) {
            console.error('Checkout process failed:', error);
            Alert.alert('Checkout Error', 'Something went wrong. Please try again.');
            setIsProcessing(false);
        }
    };

    const handlePaymentSuccess = async () => {
        try {
            // Save order to Firestore
            const savedOrder = await saveOrderToFirestore();

            // Calculate total for order confirmation
            const subtotal = getCartTotal();
            const shipping = subtotal > 0 ? 9.99 : 0;
            const tax = subtotal * 0.08;
            const total = subtotal + shipping + tax;

            // Navigate to order confirmation
            navigation.navigate('OrderConfirmation', {
                orderTotal: total,
                orderNumber: savedOrder.orderNumber,
                orderId: savedOrder.id,
                paymentMethod: 'Credit Card'
            });

            // Clear cart after navigation
            clearCart();

        } catch (error) {
            console.error('Error handling payment success:', error);
            Alert.alert('Error', 'Payment was successful but there was an issue saving your order. Please contact support.');
        } finally {
            setIsProcessing(false);
        }
    };

    const subtotal = getCartTotal();
    const shipping = subtotal > 0 ? 9.99 : 0;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    const DefaultAddressDisplay = ({ address, onEdit }) => (
        <View style={styles.addressDisplayCard}>
            <View style={styles.addressHeaderRow}>
                <Text style={styles.addressNameText}>{address.fullName}</Text>
                <TouchableOpacity onPress={onEdit} style={styles.changeAddressButton}>
                    <Text style={styles.changeAddressText}>Change</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.addressLineText}>{address.address}</Text>
            <Text style={styles.addressLineText}>{address.city}, {address.state} {address.zipCode}</Text>
            <Text style={styles.addressLineText}>{address.country}</Text>
            <Text style={styles.addressLineTextPhone}>{address.phone}</Text>
        </View>
    );

    return (
        <StripeProvider
            publishableKey={STRIPE_PUBLISHABLE_KEY}
            merchantIdentifier="merchant.com.yourapp.identifier"
            urlScheme="yourapp"
        >
            <StripeURLHandler />
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Checkout</Text>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Order Summary</Text>
                        <View style={styles.orderItems}>
                            {cartItems.map((item) => (
                                <View key={item.id} style={styles.orderItem}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemDetails}>
                                            ${item.price} × {item.quantity}
                                        </Text>
                                    </View>
                                    <Text style={styles.itemTotal}>
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Shipping</Text>
                            <Text style={styles.summaryValue}>${shipping.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax</Text>
                            <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Shipping Information</Text>

                        {addressLoading ? (
                            <View style={styles.addressLoadingContainer}>
                                <ActivityIndicator size="small" color="#2563EB" />
                                <Text style={styles.addressLoadingText}>Loading address...</Text>
                            </View>
                        ) : defaultAddress && isUsingDefaultAddress ? (
                            <>
                                <View style={styles.addressNotice}>
                                    <Ionicons name="location-outline" size={20} color="#2563EB" />
                                    <Text style={styles.addressNoticeText}>Shipping to Default Address:</Text>
                                </View>

                                <DefaultAddressDisplay
                                    address={defaultAddress}
                                    onEdit={() => setIsUsingDefaultAddress(false)}
                                />

                                <TouchableOpacity
                                    style={styles.changeAddressButtonLink}
                                    onPress={() => navigation.navigate('Addresses')}
                                >
                                    <Text style={styles.changeAddressLinkText}>Manage Saved Addresses</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {defaultAddress && (
                                    <View style={styles.switchAddressContainer}>
                                        <TouchableOpacity
                                            onPress={toggleUseDefaultAddress}
                                            style={styles.switchButton}
                                        >
                                            <Ionicons name="arrow-undo-circle-outline" size={20} color="#2563EB" />
                                            <Text style={styles.switchButtonText}>Use Saved Default Address</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <InputField
                                    label="Full Name"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChangeText={(text) => handleInputChange('fullName', text)}
                                    required
                                />
                                <InputField
                                    label="Email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChangeText={(text) => handleInputChange('email', text)}
                                    keyboardType="email-address"
                                    required
                                />
                                <InputField
                                    label="Phone"
                                    placeholder="+1 (555) 123-4567"
                                    value={formData.phone}
                                    onChangeText={(text) => handleInputChange('phone', text)}
                                    keyboardType="phone-pad"
                                    required
                                />
                                <InputField
                                    label="Street Address"
                                    placeholder="123 Main Street, Apt B"
                                    value={formData.address}
                                    onChangeText={(text) => handleInputChange('address', text)}
                                    required
                                />
                                <View style={styles.row}>
                                    <View style={styles.halfInput}>
                                        <InputField
                                            label="City"
                                            placeholder="New York"
                                            value={formData.city}
                                            onChangeText={(text) => handleInputChange('city', text)}
                                            required
                                        />
                                    </View>
                                    <View style={styles.halfInput}>
                                        <InputField
                                            label="State"
                                            placeholder="NY"
                                            value={formData.state}
                                            onChangeText={(text) => handleInputChange('state', text)}
                                            required
                                        />
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <View style={styles.halfInput}>
                                        <InputField
                                            label="ZIP Code"
                                            placeholder="10001"
                                            value={formData.zipCode}
                                            onChangeText={(text) => handleInputChange('zipCode', text)}
                                            keyboardType="numeric"
                                            required
                                        />
                                    </View>
                                    <View style={styles.halfInput}>
                                        <InputField
                                            label="Country"
                                            placeholder="United States"
                                            value={formData.country}
                                            onChangeText={(text) => handleInputChange('country', text)}
                                            required
                                        />
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment Method</Text>

                        <View
                            style={[
                                styles.paymentOption,
                                styles.paymentOptionSelected
                            ]}
                        >
                            <View style={styles.paymentOptionContent}>
                                <Ionicons
                                    name="card-outline"
                                    size={24}
                                    color="#2563EB"
                                />
                                <View style={styles.paymentText}>
                                    <Text style={styles.paymentTitle}>Credit/Debit Card</Text>
                                    <Text style={styles.paymentSubtitle}>Pay securely with your card</Text>
                                </View>
                            </View>
                            <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
                        </View>

                        <View style={styles.paymentNote}>
                            <Ionicons name="lock-closed" size={16} color="#6B7280" />
                            <Text style={styles.paymentNoteText}>
                                Your payment details are secure and encrypted
                            </Text>
                        </View>
                    </View>

                    <View style={styles.securitySection}>
                        <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                        <Text style={styles.securityText}>
                            Your payment information is secure and encrypted with Stripe
                        </Text>
                    </View>

                    <View style={styles.stripeSection}>
                        <Text style={styles.stripeText}>Secured by</Text>
                        <Ionicons name="card" size={24} color="#635BFF" />
                        <Text style={styles.stripeBrand}>Stripe</Text>
                    </View>

                    <View style={styles.bottomSpacer} />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.checkoutButton,
                            (isProcessing || cartItems.length === 0) && styles.checkoutButtonDisabled
                        ]}
                        onPress={handleCheckout}
                        disabled={isProcessing || cartItems.length === 0}
                    >
                        {isProcessing ? (
                            <View style={styles.processingContainer}>
                                <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                                <Text style={styles.checkoutButtonText}>Processing...</Text>
                            </View>
                        ) : (
                            <Text style={styles.checkoutButtonText}>
                                Pay ${total.toFixed(2)}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </StripeProvider>
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
    section: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    orderItems: {
        marginBottom: 16,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 2,
    },
    itemDetails: {
        fontSize: 12,
        color: '#6B7280',
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginTop: 8,
        paddingTop: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    summaryValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563EB',
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    addressLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    addressLoadingText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#6B7280',
    },
    addressNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    addressNoticeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2563EB',
        marginLeft: 8,
    },
    addressDisplayCard: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    addressHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    addressNameText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    changeAddressButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#DBEAFE',
    },
    changeAddressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF',
    },
    addressLineText: {
        fontSize: 16,
        color: '#374151',
        marginBottom: 2,
    },
    addressLineTextPhone: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 4,
    },
    changeAddressButtonLink: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
    },
    changeAddressLinkText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2563EB',
    },
    switchAddressContainer: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 12,
    },
    switchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 8,
    },
    switchButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563EB',
        marginLeft: 8,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginBottom: 12,
    },
    paymentOptionSelected: {
        borderColor: '#2563EB',
        backgroundColor: '#EFF6FF',
    },
    paymentOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    paymentText: {
        marginLeft: 12,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    paymentSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    paymentNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
    },
    paymentNoteText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 8,
    },
    securitySection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#F0FDF4',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    securityText: {
        fontSize: 14,
        color: '#065F46',
        marginLeft: 8,
        fontWeight: '500',
    },
    stripeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 8,
    },
    stripeText: {
        fontSize: 12,
        color: '#6B7280',
        marginRight: 8,
    },
    stripeBrand: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#635BFF',
        marginLeft: 4,
    },
    bottomSpacer: {
        height: 100,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
    },
    checkoutButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    checkoutButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    checkoutButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    processingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default Checkout;