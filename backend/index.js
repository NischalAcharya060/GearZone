require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SK_KEY);
const app = express();
const PORT = process.env.PORT || 4242;

// Middleware
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Stripe server is running',
        timestamp: new Date().toISOString()
    });
});

// Payment sheet endpoint
app.post('/api/payment-sheet', async (req, res) => {
    const { totalInCents, currency = 'usd' } = req.body;

    console.log('Received payment request:', { totalInCents, currency });

    // Input validation
    if (!totalInCents || totalInCents < 50) {
        return res.status(400).json({
            error: 'Invalid or missing amount (minimum is 50 cents).'
        });
    }

    if (typeof totalInCents !== 'number') {
        return res.status(400).json({
            error: 'Amount must be a number.'
        });
    }

    // Validate currency format
    const validCurrencies = ['usd', 'eur', 'gbp', 'cad', 'aud'];
    if (!validCurrencies.includes(currency.toLowerCase())) {
        return res.status(400).json({
            error: `Unsupported currency. Supported: ${validCurrencies.join(', ')}`
        });
    }

    try {
        // Create customer
        const customer = await stripe.customers.create();
        console.log('Created customer:', customer.id);

        // Create ephemeral key
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customer.id },
            { apiVersion: '2024-09-30.acacia' }
        );
        console.log('Created ephemeral key');

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalInCents,
            currency: currency.toLowerCase(),
            customer: customer.id,
            automatic_payment_methods: {
                enabled: true
            },
            metadata: {
                integration_check: 'accept_a_payment',
                created_at: new Date().toISOString()
            }
        });
        console.log('Created payment intent:', paymentIntent.id);

        // Send response
        res.json({
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id,
            publishableKey: process.env.STRIPE_PK_KEY
        });

    } catch (error) {
        console.error("Stripe API Error:", error);

        // More specific error handling
        let statusCode = 500;
        let errorMessage = 'Internal server error.';

        if (error.type === 'StripeInvalidRequestError') {
            statusCode = 400;
            errorMessage = error.message;
        } else if (error.type === 'StripeConnectionError') {
            statusCode = 503;
            errorMessage = 'Payment service temporarily unavailable.';
        }

        res.status(statusCode).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Simple 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Basic error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error occurred.'
    });
});

app.listen(PORT, () => {
    console.log(`✅ Stripe server running on http://localhost:${PORT}`);
    console.log(`📝 Available endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/api/health`);
    console.log(`   POST http://localhost:${PORT}/api/payment-sheet`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Check environment variables
    if (!process.env.STRIPE_SK_KEY) {
        console.error('❌ STRIPE_SK_KEY not found in environment variables');
        process.exit(1);
    } else {
        console.log('✅ Stripe secret key loaded');
    }

    if (!process.env.STRIPE_PK_KEY) {
        console.warn('⚠️  STRIPE_PK_KEY not found in environment variables');
    } else {
        console.log('✅ Stripe publishable key loaded');
    }
});