import { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';
import { getDb, setupDatabase } from '../../utils/db';

const handler: Handler = async (event: HandlerEvent) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return { statusCode: 400, body: 'Webhook secret not found.' };
  }

  // Lazy init so a missing key returns a clean error instead of a
  // module-scope crash (502 with a stack trace).
  // STRIPE_SK accepted as an alternate name for STRIPE_SECRET_KEY.
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SK;
  if (!stripeSecretKey) {
    console.error('Stripe secret key is not configured');
    return { statusCode: 500, body: 'Payments are not configured.' };
  }
  // Omit apiVersion to use the version pinned by the installed Stripe SDK
  const stripe = new Stripe(stripeSecretKey);

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body!, sig, webhookSecret);
  } catch (err) {
    console.error(`Error verifying webhook signature: ${err.message}`);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    await setupDatabase();
    const db = getDb();

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        // Plan recorded in metadata by create-checkout-session; default to premium
        const plan = session.metadata?.plan === 'pro' ? 'pro' : 'premium';

        await db.query(
          'UPDATE users SET subscription_status = $1 WHERE stripe_customer_id = $2',
          [plan, customerId]
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await db.query(
          "UPDATE users SET subscription_status = 'free' WHERE stripe_customer_id = $1",
          [customerId]
        );
        break;
      }
      // You can add more event types to handle here, e.g., 'customer.subscription.updated'
      default:
        console.log(`Unhandled event type ${stripeEvent.type}`);
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (error) {
    console.error('Webhook handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

export { handler };
