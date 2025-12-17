import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';
import { getDb, setupDatabase } from '../../utils/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { priceId } = JSON.parse(event.body || '{}');
  const { user } = context.clientContext!;

  if (!priceId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing priceId' }) };
  }

  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    await setupDatabase();
    const db = getDb();

    let { data: userData, error } = await db.query('SELECT stripe_customer_id FROM users WHERE id = $1', [user.sub]);
    
    if (error) throw error;

    let stripeCustomerId: string;

    if (userData.rows.length > 0 && userData.rows[0].stripe_customer_id) {
      stripeCustomerId = userData.rows[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          netlify_user_id: user.sub,
        },
      });
      stripeCustomerId = customer.id;

      await db.query(
        'INSERT INTO users (id, email, stripe_customer_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET stripe_customer_id = $3',
        [user.sub, user.email, stripeCustomerId]
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer: stripeCustomerId,
      success_url: `${process.env.URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/cancel`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

export { handler };
