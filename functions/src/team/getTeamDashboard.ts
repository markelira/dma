/**
 * Get Team Dashboard Cloud Function
 *
 * Fetches complete team data including members, stats, and subscription info
 * for display in the team management dashboard.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import {
  Team,
  TeamMember,
  TeamDashboardData,
  GetTeamDashboardResponse,
} from '../types/team';

const firestore = admin.firestore();

/**
 * Get team dashboard data
 * Callable function - requires authentication
 */
export const getTeamDashboard = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<GetTeamDashboardResponse> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
    }

    const userId = request.auth.uid;

    logger.info('[getTeamDashboard] Fetching dashboard', { userId });

    // 2. Get user's team
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.teamId) {
      throw new HttpsError('failed-precondition', 'Nem vagy tag egy csapatban');
    }

    const teamId = userData.teamId;

    // 3. Get team data
    const teamDoc = await firestore.collection('teams').doc(teamId).get();

    if (!teamDoc.exists) {
      throw new HttpsError('not-found', 'Csapat nem található');
    }

    const team = { id: teamDoc.id, ...teamDoc.data() } as Team;

    // 4. Check if user is team owner or member
    const isOwner = team.ownerId === userId;

    // 5. Get team members
    const membersSnapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('members')
      .where('status', 'in', ['invited', 'active'])
      .orderBy('invitedAt', 'desc')
      .get();

    const members: TeamMember[] = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TeamMember[];

    // 6. Get owner details
    const ownerDoc = await firestore.collection('users').doc(team.ownerId).get();
    const ownerData = ownerDoc.data();

    const owner = {
      id: team.ownerId,
      name: ownerData
        ? `${ownerData.firstName || ''} ${ownerData.lastName || ''}`.trim()
        : team.ownerName,
      email: team.ownerEmail,
    };

    // 7. Calculate stats
    const activeMembers = members.filter((m) => m.status === 'active').length;
    const invitedMembers = members.filter((m) => m.status === 'invited').length;

    const stats = {
      totalMembers: members.length,
      activeMembers,
      invitedMembers,
    };

    // 8. Format subscription data
    const subscription = {
      status: team.subscriptionStatus,
      plan: team.subscriptionPlan,
      startDate: team.subscriptionStartDate.toDate().toISOString(),
      endDate: team.subscriptionEndDate.toDate().toISOString(),
      isActive: team.subscriptionStatus === 'active' || team.subscriptionStatus === 'trialing',
    };

    // 9. Build dashboard data
    const dashboardData: TeamDashboardData = {
      team,
      members,
      owner,
      stats,
      subscription,
    };

    logger.info('[getTeamDashboard] Dashboard fetched successfully', {
      teamId,
      memberCount: members.length,
    });

    return {
      success: true,
      data: dashboardData,
    };

  } catch (error: any) {
    logger.error('[getTeamDashboard] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    return {
      success: false,
      error: error.message || 'Csapat dashboard betöltése sikertelen',
    };
  }
});

/**
 * Check if user has subscription access
 * Callable function - requires authentication
 */
export const checkSubscriptionAccess = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<{
  success: boolean;
  hasAccess: boolean;
  reason?: string;
  teamName?: string;
  subscriptionStatus?: string;
}> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      return {
        success: true,
        hasAccess: false,
        reason: 'not_authenticated',
      };
    }

    const userId = request.auth.uid;

    logger.info('[checkSubscriptionAccess] Checking access', { userId });

    // 2. Get user data
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return {
        success: true,
        hasAccess: false,
        reason: 'user_not_found',
      };
    }

    // 3. Check if user is team owner with active subscription
    if (userData.isTeamOwner && userData.subscriptionStatus === 'active') {
      logger.info('[checkSubscriptionAccess] Team owner with active subscription', { userId });

      return {
        success: true,
        hasAccess: true,
        reason: 'team_owner',
        subscriptionStatus: userData.subscriptionStatus,
      };
    }

    // 4. Check if user is team member with inherited access
    if (userData.teamId) {
      const teamDoc = await firestore.collection('teams').doc(userData.teamId).get();

      if (teamDoc.exists) {
        const team = teamDoc.data() as Team;
        const hasAccess = team.subscriptionStatus === 'active' || team.subscriptionStatus === 'trialing';

        logger.info('[checkSubscriptionAccess] Team member', {
          userId,
          teamId: userData.teamId,
          hasAccess,
          teamStatus: team.subscriptionStatus,
        });

        return {
          success: true,
          hasAccess,
          reason: hasAccess ? 'team_member' : 'subscription_inactive',
          teamName: team.name,
          subscriptionStatus: team.subscriptionStatus,
        };
      }
    }

    // 5. No subscription access
    logger.info('[checkSubscriptionAccess] No subscription access', { userId });

    return {
      success: true,
      hasAccess: false,
      reason: 'no_subscription',
    };

  } catch (error: any) {
    logger.error('[checkSubscriptionAccess] Error:', error);

    return {
      success: false,
      hasAccess: false,
      reason: 'error',
    };
  }
});

/**
 * Get team members (simplified version for non-owners)
 * Returns basic member info without sensitive data
 */
export const getTeamMembers = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<{
  success: boolean;
  members?: Array<{
    id: string;
    name?: string;
    joinedAt?: string;
    isActive: boolean;
  }>;
  error?: string;
}> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
    }

    const userId = request.auth.uid;

    // 2. Get user's team
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.teamId) {
      throw new HttpsError('failed-precondition', 'Nem vagy tag egy csapatban');
    }

    const teamId = userData.teamId;

    // 3. Get active team members only
    const membersSnapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('members')
      .where('status', '==', 'active')
      .get();

    const members = membersSnapshot.docs.map((doc) => {
      const data = doc.data() as TeamMember;
      return {
        id: doc.id,
        name: data.name,
        joinedAt: data.joinedAt?.toDate().toISOString(),
        isActive: data.status === 'active',
      };
    });

    return {
      success: true,
      members,
    };

  } catch (error: any) {
    logger.error('[getTeamMembers] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    return {
      success: false,
      error: error.message || 'Csapattagok betöltése sikertelen',
    };
  }
});
