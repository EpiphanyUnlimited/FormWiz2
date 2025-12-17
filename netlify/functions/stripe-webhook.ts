import { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';
import { getDb, setupDatabase } from '../../utils/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const handler: Handler = async (event: HandlerEvent) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return { statusCode: 400, body: 'Webhook secret not found.' };
  }

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

        await db.query(
          "UPDATE users SET subscription_status = 'premium' WHERE stripe_customer_id = $1",
          [customerId]
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
