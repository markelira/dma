const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

async function checkAllSubscriptions() {
  const customerId = 'cus_TNZpvPu6nlye7x';

  console.log('\n🔍 Checking ALL subscriptions for customer:', customerId);
  console.log('='.repeat(80));

  try {
    // Get ALL subscriptions (no status filter)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100
    });

    console.log(`\nFound ${subscriptions.data.length} total subscription(s):\n`);

    subscriptions.data.forEach((sub, index) => {
      console.log(`Subscription ${index + 1}:`);
      console.log(`  ID: ${sub.id}`);
      console.log(`  Status: ${sub.status}`);
      console.log(`  Created: ${new Date(sub.created * 1000).toISOString()}`);
      console.log(`  Current Period: ${new Date(sub.current_period_start * 1000).toISOString()} to ${new Date(sub.current_period_end * 1000).toISOString()}`);
      console.log(`  Price ID: ${sub.items.data[0]?.price?.id || 'N/A'}`);
      console.log(`  Interval: ${sub.items.data[0]?.price?.recurring?.interval || 'N/A'}`);
      console.log(`  Cancel at period end: ${sub.cancel_at_period_end}`);
      if (sub.canceled_at) {
        console.log(`  Canceled at: ${new Date(sub.canceled_at * 1000).toISOString()}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAllSubscriptions()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
