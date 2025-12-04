// screens/CODConfirmation.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const CODConfirmation = ({ route, navigation }) => {
    const { orderNumber, orderTotal, cashToCollect, deliveryAddress } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="cash" size={80} color="#10B981" />
                </View>
                <Text style={styles.title}>COD Order Confirmed!</Text>
                <Text style={styles.subtitle}>
                    Your order #{orderNumber} has been placed successfully.
                </Text>

                <View style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>Payment Details</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount to Pay:</Text>
                        <Text style={styles.detailValue}>${cashToCollect.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment Method:</Text>
                        <Text style={styles.detailValue}>Cash on Delivery</Text>
                    </View>
                </View>

                <View style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>Delivery Information</Text>
                    <Text style={styles.addressText}>{deliveryAddress.name}</Text>
                    <Text style={styles.addressText}>{deliveryAddress.address}</Text>
                    <Text style={styles.addressText}>
                        {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zipCode}
                    </Text>
                    <Text style={styles.addressText}>Phone: {deliveryAddress.phone}</Text>
                </View>

                <View style={styles.noteCard}>
                    <Ionicons name="information-circle" size={24} color="#F59E0B" />
                    <Text style={styles.noteText}>
                        Please have the exact amount ready when the delivery arrives.
                        Our delivery person will collect the payment.
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Text style={styles.buttonText}>Continue Shopping</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.outlineButton]}
                    onPress={() => navigation.navigate('Orders')}
                >
                    <Text style={styles.outlineButtonText}>View Orders</Text>
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
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    iconContainer: {
        marginVertical: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    detailsCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 16,
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    addressText: {
        fontSize: 16,
        color: '#374151',
        marginBottom: 4,
    },
    noteCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 8,
        marginTop: 20,
        width: '100%',
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    noteText: {
        fontSize: 14,
        color: '#92400E',
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },
    footer: {
        padding: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    button: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#10B981',
    },
    outlineButtonText: {
        color: '#10B981',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default CODConfirmation;