import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';
import { getDb, setupDatabase } from '../../utils/db';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Lazy init so a missing key returns a clean error instead of a
  // module-scope crash (502 with a stack trace).
  if (!process.env.STRIPE_SECRET_KEY) {
    // TEMP diagnostic while payments are being configured: report which
    // STRIPE* variable NAMES are visible to the function (never values).
    const visibleStripeVars = Object.keys(process.env)
      .filter((k) => k.toUpperCase().includes('STRIPE'))
      .sort();
    console.error('STRIPE_SECRET_KEY is not configured. Visible:', visibleStripeVars);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Payments are not configured. Please try again later.',
        visibleStripeVars,
      }),
    };
  }
  // Omit apiVersion to use the version pinned by the installed Stripe SDK
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { priceId: rawPriceId, plan } = JSON.parse(event.body || '{}');
  const { user } = context.clientContext!;

  // Accept either an explicit Stripe priceId (web) or a plan key (mobile),
  // resolving plan keys server-side so price IDs never live in clients.
  // Multiple env spellings accepted to match existing site config.
  const PLAN_PRICE_IDS: Record<string, string | undefined> = {
    premium: process.env.STRIPE_PRICE_PREMIUM ||
        process.env.STRIPE_PRICE_PREM ||
        process.env.STRIPE_PRICE_ID_PREMIUM,
    pro: process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_ID_PRO,
  };
  const priceId = rawPriceId || (typeof plan === 'string' ? PLAN_PRICE_IDS[plan] : undefined);

  if (!priceId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing or unrecognized priceId/plan' }) };
  }

  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    await setupDatabase();
    const db = getDb();

    const userData = await db.query('SELECT stripe_customer_id FROM users WHERE id = $1', [user.sub]);

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
      // Recorded so the webhook knows which plan was purchased
      metadata: {
        plan: (typeof plan === 'string' && PLAN_PRICE_IDS[plan]) ? plan
          : (priceId === PLAN_PRICE_IDS.pro ? 'pro' : 'premium'),
      },
      success_url: `${process.env.URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/?checkout=cancelled`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
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
