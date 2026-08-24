import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getDb, setupDatabase } from '../../utils/db';

/**
 * Admin-only: lists every account and its subscription status/source.
 * Used by the hidden /admin page so the owner can check plan state without
 * opening the database console.
 *
 * Authorization: the caller must present a valid Identity JWT AND their
 * email must be in the ADMIN_EMAILS env var (comma-separated allowlist,
 * e.g. "b52graphx@gmail.com"). Everyone else gets 403 — the endpoint's
 * existence reveals nothing.
 */
const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const { user } = (context.clientContext ?? {}) as { user?: { sub: string; email: string } };
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const allowlist = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowlist.includes((user.email ?? '').toLowerCase())) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
  }

  try {
    await setupDatabase();
    const db = getDb();
    const { rows } = await db.query('SELECT * FROM users ORDER BY email');

    // Return only what the admin view needs — never raw tokens/ids.
    const accounts = rows.map((r: any) => ({
      id: r.id,
      email: r.email,
      plan: r.subscription_status ?? 'free',
      source: r.subscription_source ?? (r.stripe_customer_id ? 'stripe' : null),
      hasStripeCustomer: !!r.stripe_customer_id,
    }));

    return { statusCode: 200, body: JSON.stringify({ accounts }) };
  } catch (error) {
    console.error('admin-accounts error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};

export { handler };
