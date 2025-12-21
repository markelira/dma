/**
 * Admin Analytics Cloud Function
 * Provides comprehensive analytics data for the admin dashboard
 * Fetches from Firestore and Stripe API for real-time revenue data
 */

import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import Stripe from 'stripe';

const firestore = admin.firestore();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});

// Price mapping for MRR calculation (HUF)
const PLAN_PRICES = {
  'price_1QWPDjRvOWrujGVHxdaSOcJZ': { name: 'monthly', price: 14990, monthlyEquivalent: 14990 },
  'price_1QWPFQRvOWrujGVHHd8gxLzx': { name: '6-month', price: 81000, monthlyEquivalent: 13500 },
  'price_1QWPFqRvOWrujGVHcDUG2Y9W': { name: '12-month', price: 158400, monthlyEquivalent: 13200 },
};

interface AnalyticsResponse {
  success: boolean;
  data?: {
    users: {
      total: number;
      byRole: { students: number; instructors: number; admins: number };
      activeToday: number;
      newThisMonth: number;
      verified: number;
      unverified: number;
      growth: number;
    };
    subscriptions: {
      individual: { count: number; mrr: number };
      team: { count: number; avgSize: number; mrr: number };
      company: { count: number; employees: number; mrr: number };
      trial: { count: number };
      churn: { thisMonth: number; rate: number };
      total: number;
    };
    revenue: {
      mrr: number;
      arr: number;
      thisMonth: number;
      lastMonth: number;
      growth: number;
      byPlan: { monthly: number; sixMonth: number; yearly: number };
    };
    companies: {
      total: number;
      active: number;
      suspended: number;
      totalEmployees: number;
      avgEmployees: number;
      seats: { purchased: number; used: number };
    };
    trends: {
      userGrowth: Array<{ date: string; count: number }>;
      revenueGrowth: Array<{ date: string; amount: number }>;
    };
    conversionRate: number;
  };
  error?: string;
}

export const getAdminAnalytics = onCall({
  cors: true,
  region: 'europe-west1',
  memory: '512MiB',
  timeoutSeconds: 60,
}, async (request): Promise<AnalyticsResponse> => {
  try {
    // Authentication check
    if (!request.auth) {
      return { success: false, error: 'Authentication required' };
    }

    // Check admin role (accept both 'admin' and 'ADMIN')
    const userDoc = await firestore.collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();
    const userRole = userData?.role?.toLowerCase();
    if (!userData || userRole !== 'admin') {
      return { success: false, error: 'Admin access required' };
    }

    logger.info('[getAdminAnalytics] Fetching analytics data');

    // Fetch all data in parallel
    const [
      usersData,
      subscriptionsData,
      teamsData,
      companiesData,
      stripeData,
    ] = await Promise.all([
      fetchUserAnalytics(),
      fetchSubscriptionAnalytics(),
      fetchTeamAnalytics(),
      fetchCompanyAnalytics(),
      fetchStripeAnalytics(),
    ]);

    // Calculate totals
    const totalSubscribers =
      subscriptionsData.individual.count +
      teamsData.count +
      companiesData.activeCompaniesWithSub;

    const totalMRR = stripeData.mrr;
    const conversionRate = usersData.total > 0
      ? Math.round((totalSubscribers / usersData.total) * 100 * 10) / 10
      : 0;

    const response: AnalyticsResponse = {
      success: true,
      data: {
        users: usersData,
        subscriptions: {
          individual: subscriptionsData.individual,
          team: teamsData,
          company: {
            count: companiesData.activeCompaniesWithSub,
            employees: companiesData.totalEmployees,
            mrr: stripeData.byPlan.company || 0,
          },
          trial: { count: subscriptionsData.trial },
          churn: stripeData.churn,
          total: totalSubscribers,
        },
        revenue: {
          mrr: totalMRR,
          arr: totalMRR * 12,
          thisMonth: stripeData.thisMonth,
          lastMonth: stripeData.lastMonth,
          growth: stripeData.growth,
          byPlan: stripeData.byPlan,
        },
        companies: companiesData,
        trends: {
          userGrowth: await fetchUserGrowthTrend(),
          revenueGrowth: stripeData.monthlyRevenue,
        },
        conversionRate,
      },
    };

    logger.info('[getAdminAnalytics] Success', {
      totalUsers: usersData.total,
      totalSubscribers,
      mrr: totalMRR,
    });

    return response;

  } catch (error: any) {
    logger.error('[getAdminAnalytics] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch analytics',
    };
  }
});

/**
 * Fetch user analytics from Firestore
 */
async function fetchUserAnalytics() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Get all users
  const usersSnapshot = await firestore.collection('users').get();

  let students = 0;
  let instructors = 0;
  let admins = 0;
  let activeToday = 0;
  let newThisMonth = 0;
  let newLastMonth = 0;
  let verified = 0;
  let unverified = 0;

  usersSnapshot.docs.forEach(doc => {
    const data = doc.data();

    // Count by role
    switch (data.role) {
      case 'student': students++; break;
      case 'instructor': instructors++; break;
      case 'admin': admins++; break;
      default: students++; // Default to student
    }

    // Active today (last 24 hours)
    const lastLogin = data.lastLoginAt?.toDate?.() || new Date(data.lastLoginAt);
    if (lastLogin && lastLogin >= today) {
      activeToday++;
    }

    // New this month
    const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
    if (createdAt && createdAt >= monthStart) {
      newThisMonth++;
    }
    if (createdAt && createdAt >= lastMonthStart && createdAt < monthStart) {
      newLastMonth++;
    }

    // Email verified
    if (data.emailVerified) {
      verified++;
    } else {
      unverified++;
    }
  });

  const growth = newLastMonth > 0
    ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
    : 100;

  return {
    total: usersSnapshot.size,
    byRole: { students, instructors, admins },
    activeToday,
    newThisMonth,
    verified,
    unverified,
    growth,
  };
}

/**
 * Fetch subscription analytics from Firestore
 */
async function fetchSubscriptionAnalytics() {
  const subscriptionsSnapshot = await firestore
    .collection('subscriptions')
    .where('status', 'in', ['active', 'trialing'])
    .get();

  let activeCount = 0;
  let trialCount = 0;
  let mrr = 0;

  subscriptionsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.status === 'trialing') {
      trialCount++;
    } else if (data.status === 'active') {
      activeCount++;
      // Calculate MRR based on plan
      const planInfo = Object.values(PLAN_PRICES).find(p => p.name === data.planName);
      if (planInfo) {
        mrr += planInfo.monthlyEquivalent;
      }
    }
  });

  return {
    individual: { count: activeCount, mrr },
    trial: trialCount,
  };
}

/**
 * Fetch team analytics from Firestore
 */
async function fetchTeamAnalytics() {
  const teamsSnapshot = await firestore
    .collection('teams')
    .where('subscriptionStatus', 'in', ['active', 'trialing'])
    .get();

  let totalMembers = 0;
  let mrr = 0;

  teamsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    totalMembers += data.memberCount || 0;

    // Calculate MRR based on price ID
    const priceId = data.stripePriceId;
    const planInfo = PLAN_PRICES[priceId as keyof typeof PLAN_PRICES];
    if (planInfo) {
      mrr += planInfo.monthlyEquivalent;
    }
  });

  const count = teamsSnapshot.size;
  const avgSize = count > 0 ? Math.round(totalMembers / count * 10) / 10 : 0;

  return { count, avgSize, mrr };
}

/**
 * Fetch company analytics from Firestore
 */
async function fetchCompanyAnalytics() {
  const companiesSnapshot = await firestore.collection('companies').get();

  let active = 0;
  let suspended = 0;
  let activeCompaniesWithSub = 0;
  let totalEmployees = 0;
  let seatsPurchased = 0;
  let seatsUsed = 0;

  // Process companies
  for (const doc of companiesSnapshot.docs) {
    const data = doc.data();

    if (data.status === 'active') {
      active++;
      if (data.subscriptionStatus === 'active') {
        activeCompaniesWithSub++;
      }
    } else if (data.status === 'suspended') {
      suspended++;
    }

    // Get employees count
    const employeesSnapshot = await firestore
      .collection('companies')
      .doc(doc.id)
      .collection('employees')
      .where('status', '==', 'active')
      .get();
    totalEmployees += employeesSnapshot.size;

    // Get masterclass seats
    const masterclassesSnapshot = await firestore
      .collection('companies')
      .doc(doc.id)
      .collection('masterclasses')
      .get();

    masterclassesSnapshot.docs.forEach(mcDoc => {
      const mcData = mcDoc.data();
      seatsPurchased += mcData.seats?.purchased || 0;
      seatsUsed += mcData.seats?.used || 0;
    });
  }

  const avgEmployees = active > 0 ? Math.round(totalEmployees / active * 10) / 10 : 0;

  return {
    total: companiesSnapshot.size,
    active,
    suspended,
    activeCompaniesWithSub,
    totalEmployees,
    avgEmployees,
    seats: { purchased: seatsPurchased, used: seatsUsed },
  };
}

/**
 * Fetch revenue analytics from Stripe
 */
async function fetchStripeAnalytics() {
  const now = new Date();
  const thisMonthStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
  const lastMonthStart = Math.floor(new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime() / 1000);
  const lastMonthEnd = thisMonthStart - 1;

  try {
    // Get active subscriptions for MRR
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.items.data.price'],
    });

    let mrr = 0;
    const byPlan = { monthly: 0, sixMonth: 0, yearly: 0, company: 0 };

    subscriptions.data.forEach(sub => {
      sub.items.data.forEach(item => {
        const priceId = item.price.id;
        const planInfo = PLAN_PRICES[priceId as keyof typeof PLAN_PRICES];

        if (planInfo) {
          mrr += planInfo.monthlyEquivalent;
          switch (planInfo.name) {
            case 'monthly': byPlan.monthly += planInfo.monthlyEquivalent; break;
            case '6-month': byPlan.sixMonth += planInfo.monthlyEquivalent; break;
            case '12-month': byPlan.yearly += planInfo.monthlyEquivalent; break;
          }
        } else {
          // Assume company subscription
          const amount = (item.price.unit_amount || 0) / 100;
          mrr += amount;
          byPlan.company += amount;
        }
      });
    });

    // Get this month's revenue
    const thisMonthCharges = await stripe.charges.list({
      created: { gte: thisMonthStart },
      limit: 100,
    });
    const thisMonth = thisMonthCharges.data
      .filter(c => c.status === 'succeeded')
      .reduce((sum, c) => sum + c.amount, 0) / 100;

    // Get last month's revenue
    const lastMonthCharges = await stripe.charges.list({
      created: { gte: lastMonthStart, lte: lastMonthEnd },
      limit: 100,
    });
    const lastMonth = lastMonthCharges.data
      .filter(c => c.status === 'succeeded')
      .reduce((sum, c) => sum + c.amount, 0) / 100;

    const growth = lastMonth > 0
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      : 100;

    // Get churned subscriptions this month
    const canceledSubs = await stripe.subscriptions.list({
      status: 'canceled',
      created: { gte: thisMonthStart },
      limit: 100,
    });
    const churnThisMonth = canceledSubs.data.length;
    const totalActiveSubs = subscriptions.data.length;
    const churnRate = totalActiveSubs > 0
      ? Math.round((churnThisMonth / (totalActiveSubs + churnThisMonth)) * 100 * 10) / 10
      : 0;

    // Get monthly revenue trend (last 12 months)
    const monthlyRevenue: Array<{ date: string; amount: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthKey = monthDate.toISOString().slice(0, 7); // YYYY-MM format

      const charges = await stripe.charges.list({
        created: {
          gte: Math.floor(monthDate.getTime() / 1000),
          lte: Math.floor(monthEnd.getTime() / 1000),
        },
        limit: 100,
      });

      const amount = charges.data
        .filter(c => c.status === 'succeeded')
        .reduce((sum, c) => sum + c.amount, 0) / 100;

      monthlyRevenue.push({ date: monthKey, amount });
    }

    return {
      mrr,
      thisMonth,
      lastMonth,
      growth,
      byPlan,
      churn: { thisMonth: churnThisMonth, rate: churnRate },
      monthlyRevenue,
    };

  } catch (error) {
    logger.error('[fetchStripeAnalytics] Error:', error);
    // Return zeros if Stripe fails
    return {
      mrr: 0,
      thisMonth: 0,
      lastMonth: 0,
      growth: 0,
      byPlan: { monthly: 0, sixMonth: 0, yearly: 0, company: 0 },
      churn: { thisMonth: 0, rate: 0 },
      monthlyRevenue: [],
    };
  }
}

/**
 * Fetch user growth trend (last 30 days)
 */
async function fetchUserGrowthTrend() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const usersSnapshot = await firestore
    .collection('users')
    .where('createdAt', '>=', thirtyDaysAgo)
    .orderBy('createdAt', 'asc')
    .get();

  // Group by date
  const dailyCounts: Record<string, number> = {};

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().slice(0, 10);
    dailyCounts[dateKey] = 0;
  }

  usersSnapshot.docs.forEach(doc => {
    const createdAt = doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt);
    const dateKey = createdAt.toISOString().slice(0, 10);
    if (dailyCounts[dateKey] !== undefined) {
      dailyCounts[dateKey]++;
    }
  });

  return Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));
}
