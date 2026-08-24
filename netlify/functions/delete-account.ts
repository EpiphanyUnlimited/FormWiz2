import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe';
import { getDb, setupDatabase } from '../../utils/db';

/**
 * Permanently deletes the calling user's account (Google Play & privacy
 * compliance: apps that allow account creation must offer account deletion).
 *
 * Steps, in order:
 *  1. Cancel/delete the Stripe customer (stops any active subscription).
 *  2. Delete the user's row from Postgres.
 *  3. Delete the Netlify Identity (GoTrue) user via the admin API.
 *
 * Auth: requires the caller's Identity JWT. Only the authenticated user's
 * own account can be deleted — the target id always comes from the token,
 * never from the request body.
 */
const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const { user, identity } = (context.clientContext ?? {}) as {
    user?: { sub: string; email: string };
    identity?: { url: string; token: string };
  };

  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    await setupDatabase();
    const db = getDb();

    // 1. Best-effort Stripe cleanup — deleting the customer cancels any
    // active subscriptions. A Stripe failure should not strand the user in
    // a half-deleted state, so log and continue.
    try {
      const { rows } = await db.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [user.sub],
      );
      const customerId: string | null = rows[0]?.stripe_customer_id ?? null;
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SK;
      if (customerId && stripeSecretKey) {
        const stripe = new Stripe(stripeSecretKey);
        await stripe.customers.del(customerId);
      }
    } catch (stripeError) {
      console.error('Stripe cleanup failed during account deletion:', stripeError);
    }

    // 2. Remove the user's database record.
    await db.query('DELETE FROM users WHERE id = $1', [user.sub]);

    // 3. Remove the Identity (GoTrue) user so the credentials stop working.
    if (!identity?.url || !identity?.token) {
      console.error('Identity admin context unavailable; user row deleted but Identity user remains.');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Account data removed, but sign-in deletion failed. Contact info@epiphanyunltd.com.' }),
      };
    }

    const res = await fetch(`${identity.url}/admin/users/${user.sub}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${identity.token}` },
    });

    if (!res.ok && res.status !== 404) {
      const body = await res.text();
      console.error(`Identity deletion failed (${res.status}): ${body}`);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Account data removed, but sign-in deletion failed. Contact info@epiphanyunltd.com.' }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ deleted: true }) };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};

export { handler };
