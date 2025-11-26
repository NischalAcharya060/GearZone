require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SK_KEY);
const app = express();
const PORT = 4242;

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

app.post('/api/payment-sheet', async (req, res) => {
    const { totalInCents, currency } = req.body;

    if (!totalInCents || totalInCents < 50) {
        return res.status(400).send({ error: 'Invalid or missing amount (minimum is 50 cents).' });
    }
    if (!currency) {
        return res.status(400).send({ error: 'Missing currency.' });
    }

    try {
        const customer = await stripe.customers.create();

        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customer.id },
            { apiVersion: '2022-11-15' }
        );

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalInCents,
            currency: currency,
            customer: customer.id,
            automatic_payment_methods: { enabled: true },
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customerId: customer.id,
        });

    } catch (error) {
        console.error("Stripe API Error:", error);
        res.status(500).send({ error: error.message || 'Internal server error.' });
    }
});


app.listen(PORT, () => {
    console.log(`✅ Stripe server running on http://localhost:${PORT}`);
    console.log(`Endpoint: http://localhost:${PORT}/api/payment-sheet`);
});