/**
 * Accept Team Invite Cloud Function
 *
 * Allows users to accept team invitation via invite token.
 * Updates team member status and grants subscription access.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import {
  Team,
  TeamMember,
  AcceptTeamInviteInput,
  AcceptTeamInviteResponse,
  isInviteExpired,
  hasActiveSubscription,
} from '../types/team';

const firestore = admin.firestore();

/**
 * Accept a team invitation
 * Callable function - requires authentication
 */
export const acceptTeamInvite = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<AcceptTeamInviteResponse> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges a meghívás elfogadásához');
    }

    const { inviteToken } = request.data as { inviteToken: string };
    const userId = request.auth.uid;

    logger.info('[acceptTeamInvite] Accepting invite', { userId, inviteToken });

    // 2. Validate input
    if (!inviteToken) {
      throw new HttpsError('invalid-argument', 'Meghívó token szükséges');
    }

    // 3. Find invitation by token
    const membersSnapshot = await firestore
      .collectionGroup('members')
      .where('inviteToken', '==', inviteToken)
      .where('status', '==', 'invited')
      .limit(1)
      .get();

    if (membersSnapshot.empty) {
      throw new HttpsError('not-found', 'Érvénytelen vagy lejárt meghívó');
    }

    const memberDoc = membersSnapshot.docs[0];
    const member = { id: memberDoc.id, ...memberDoc.data() } as TeamMember;
    const teamId = member.teamId;

    // 4. Check if invite is expired
    if (member.inviteExpiresAt && isInviteExpired(member.inviteExpiresAt)) {
      throw new HttpsError('failed-precondition', 'Ez a meghívó lejárt');
    }

    // 5. Get team and check subscription status
    const teamDoc = await firestore.collection('teams').doc(teamId).get();

    if (!teamDoc.exists) {
      throw new HttpsError('not-found', 'Csapat nem található');
    }

    const team = { id: teamDoc.id, ...teamDoc.data() } as Team;

    if (!hasActiveSubscription(team.subscriptionStatus)) {
      throw new HttpsError(
        'failed-precondition',
        'A csapat előfizetése nem aktív. Kérjük, vedd fel a kapcsolatot a csapat tulajdonosával.'
      );
    }

    // 6. Check if user is already in another team
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData?.teamId && userData.teamId !== teamId) {
      throw new HttpsError(
        'failed-precondition',
        'Már tag vagy egy másik csapatban. Előbb ki kell lépned az aktuális csapatodból.'
      );
    }

    // 7. Get user details for team member record
    const userName = userData
      ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
      : undefined;

    // 8. Update team member document
    await memberDoc.ref.update({
      userId,
      name: userName || member.email,
      status: 'active',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      hasSubscriptionAccess: hasActiveSubscription(team.subscriptionStatus),
      inviteToken: admin.firestore.FieldValue.delete(),
      inviteExpiresAt: admin.firestore.FieldValue.delete(),
    });

    // 9. Update user document
    await firestore.collection('users').doc(userId).update({
      teamId,
      subscriptionStatus: team.subscriptionStatus,
      updatedAt: new Date().toISOString(),
    });

    logger.info('[acceptTeamInvite] Invite accepted successfully', {
      userId,
      teamId,
      memberId: memberDoc.id,
    });

    return {
      success: true,
      teamId,
      teamName: team.name,
      message: `Sikeresen csatlakoztál a(z) "${team.name}" csapatához!`,
    };

  } catch (error: any) {
    logger.error('[acceptTeamInvite] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    return {
      success: false,
      error: error.message || 'Meghívás elfogadása sikertelen',
    };
  }
});

/**
 * Decline/Reject a team invitation
 * Callable function - requires authentication (optional - can be unauthenticated)
 */
export const declineTeamInvite = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const { inviteToken } = request.data as { inviteToken: string };

    logger.info('[declineTeamInvite] Declining invite', { inviteToken });

    // 1. Validate input
    if (!inviteToken) {
      throw new HttpsError('invalid-argument', 'Meghívó token szükséges');
    }

    // 2. Find invitation by token
    const membersSnapshot = await firestore
      .collectionGroup('members')
      .where('inviteToken', '==', inviteToken)
      .where('status', '==', 'invited')
      .limit(1)
      .get();

    if (membersSnapshot.empty) {
      throw new HttpsError('not-found', 'Érvénytelen vagy lejárt meghívó');
    }

    const memberDoc = membersSnapshot.docs[0];
    const member = memberDoc.data() as TeamMember;
    const teamId = member.teamId;

    // 3. Delete the invitation
    await memberDoc.ref.delete();

    // 4. Decrement team member count
    await firestore.collection('teams').doc(teamId).update({
      memberCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('[declineTeamInvite] Invite declined successfully', {
      teamId,
      memberId: memberDoc.id,
    });

    return {
      success: true,
      message: 'Meghívás elutasítva',
    };

  } catch (error: any) {
    logger.error('[declineTeamInvite] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    return {
      success: false,
      error: error.message || 'Meghívás elutasítása sikertelen',
    };
  }
});

/**
 * Leave a team
 * Callable function - requires authentication
 */
export const leaveTeam = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
    }

    const userId = request.auth.uid;

    logger.info('[leaveTeam] User leaving team', { userId });

    // 2. Get user's team
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.teamId) {
      throw new HttpsError('failed-precondition', 'Nem vagy tag egy csapatban');
    }

    const teamId = userData.teamId;

    // 3. Check if user is team owner
    const teamDoc = await firestore.collection('teams').doc(teamId).get();
    const team = teamDoc.data() as Team;

    if (team.ownerId === userId) {
      throw new HttpsError(
        'failed-precondition',
        'A csapat tulajdonosa nem hagyhatja el a csapatot. Először törölnie kell a csapatot vagy át kell adnia a tulajdonjogot.'
      );
    }

    // 4. Find member document
    const memberSnapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('members')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (memberSnapshot.empty) {
      throw new HttpsError('not-found', 'Csapattag nem található');
    }

    const memberDoc = memberSnapshot.docs[0];

    // 5. Update member status to 'removed'
    await memberDoc.ref.update({
      status: 'removed',
      removedAt: admin.firestore.FieldValue.serverTimestamp(),
      hasSubscriptionAccess: false,
    });

    // 6. Update user document
    await firestore.collection('users').doc(userId).update({
      teamId: admin.firestore.FieldValue.delete(),
      subscriptionStatus: 'none',
      updatedAt: new Date().toISOString(),
    });

    // 7. Decrement team member count
    await firestore.collection('teams').doc(teamId).update({
      memberCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('[leaveTeam] User left team successfully', { userId, teamId });

    return {
      success: true,
      message: 'Sikeresen kiléptél a csapatból',
    };

  } catch (error: any) {
    logger.error('[leaveTeam] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    return {
      success: false,
      error: error.message || 'Kilépés sikertelen',
    };
  }
});
