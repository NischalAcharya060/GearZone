import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';

const Checkout = () => {
    const navigation = useNavigation();
    const { cartItems, getCartTotal, clearCart } = useCart();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardName: '',
    });

    const [isProcessing, setIsProcessing] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCheckout = async () => {
        // Basic validation
        if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (!formData.cardNumber || !formData.expiryDate || !formData.cvv) {
            Alert.alert('Error', 'Please fill in all payment details');
            return;
        }

        setIsProcessing(true);

        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false);
            Alert.alert(
                'Payment Successful!',
                'Your order has been placed successfully.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            clearCart();
                            navigation.navigate('Home');
                        }
                    }
                ]
            );
        }, 3000);
    };

    const subtotal = getCartTotal();
    const shipping = subtotal > 0 ? 9.99 : 0;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

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

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* Header */}
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
                {/* Order Summary */}
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

                {/* Shipping Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Shipping Information</Text>
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
                        label="Address"
                        placeholder="123 Main Street"
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
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <InputField
                                label="ZIP Code"
                                placeholder="10001"
                                value={formData.zipCode}
                                onChangeText={(text) => handleInputChange('zipCode', text)}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>

                {/* Payment Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <View style={styles.paymentCard}>
                        <Ionicons name="card-outline" size={24} color="#666" style={styles.cardIcon} />
                        <Text style={styles.paymentTitle}>Credit/Debit Card</Text>
                    </View>

                    <InputField
                        label="Name on Card"
                        placeholder="John Doe"
                        value={formData.cardName}
                        onChangeText={(text) => handleInputChange('cardName', text)}
                        required
                    />
                    <InputField
                        label="Card Number"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChangeText={(text) => handleInputChange('cardNumber', text)}
                        keyboardType="numeric"
                        required
                    />
                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <InputField
                                label="Expiry Date"
                                placeholder="MM/YY"
                                value={formData.expiryDate}
                                onChangeText={(text) => handleInputChange('expiryDate', text)}
                                required
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <InputField
                                label="CVV"
                                placeholder="123"
                                value={formData.cvv}
                                onChangeText={(text) => handleInputChange('cvv', text)}
                                keyboardType="numeric"
                                required
                            />
                        </View>
                    </View>
                </View>

                {/* Security Notice */}
                <View style={styles.securitySection}>
                    <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                    <Text style={styles.securityText}>
                        Your payment information is secure and encrypted
                    </Text>
                </View>

                {/* Bottom Spacer */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Checkout Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.checkoutButton,
                        isProcessing && styles.checkoutButtonDisabled
                    ]}
                    onPress={handleCheckout}
                    disabled={isProcessing || cartItems.length === 0}
                >
                    {isProcessing ? (
                        <View style={styles.processingContainer}>
                            <Ionicons name="refresh" size={20} color="white" style={styles.spinner} />
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
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    cardIcon: {
        marginRight: 12,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
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
    spinner: {
        marginRight: 8,
    },
});

export default Checkout;