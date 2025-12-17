import { Handler, HandlerContext } from '@netlify/functions';
import { getDb, setupDatabase } from '../../utils/db';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const { user } = context.clientContext!;

  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    await setupDatabase();
    const db = getDb();

    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [user.sub]);

    if (rows.length === 0) {
      // This is a new user, create an entry for them
      const newUser = {
        id: user.sub,
        email: user.email,
        stripe_customer_id: null,
        subscription_status: 'free',
      };
      await db.query('INSERT INTO users (id, email, stripe_customer_id, subscription_status) VALUES ($1, $2, $3, $4)', [newUser.id, newUser.email, newUser.stripe_customer_id, newUser.subscription_status]);
      return {
        statusCode: 200,
        body: JSON.stringify(newUser),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(rows[0]),
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

export { handler };
