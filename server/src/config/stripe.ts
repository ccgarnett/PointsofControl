import Stripe from 'stripe';

const stripeSK = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

const stripe = new Stripe(stripeSK, {
  apiVersion: '2026-03-25.dahlia',
});

export default stripe;
