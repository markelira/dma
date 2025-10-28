/**
 * Remove Team Member Cloud Function
 *
 * Allows team owner to remove members from the team.
 * Revokes subscription access immediately.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import {
  Team,
  TeamMember,
  RemoveTeamMemberInput,
  RemoveTeamMemberResponse,
  isTeamOwner,
} from '../types/team';

const firestore = admin.firestore();

/**
 * Remove a team member
 * Callable function - requires authentication
 */
export const removeTeamMember = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<RemoveTeamMemberResponse> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
    }

    const { teamId, memberId } = request.data as { teamId: string; memberId: string };
    const userId = request.auth.uid;

    logger.info('[removeTeamMember] Removing member', { teamId, memberId, removedBy: userId });

    // 2. Validate input
    if (!teamId || !memberId) {
      throw new HttpsError('invalid-argument', 'Team ID és member ID szükséges');
    }

    // 3. Get team and verify permissions
    const teamDoc = await firestore.collection('teams').doc(teamId).get();

    if (!teamDoc.exists) {
      throw new HttpsError('not-found', 'Csapat nem található');
    }

    const team = { id: teamDoc.id, ...teamDoc.data() } as Team;

    // Check if user is team owner
    if (!isTeamOwner(team, userId)) {
      throw new HttpsError('permission-denied', 'Csak a csapat tulajdonosa távolíthat el tagokat');
    }

    // 4. Get team member
    const memberDoc = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('members')
      .doc(memberId)
      .get();

    if (!memberDoc.exists) {
      throw new HttpsError('not-found', 'Csapattag nem található');
    }

    const member = { id: memberDoc.id, ...memberDoc.data() } as TeamMember;

    // 5. Cannot remove team owner
    if (member.userId === team.ownerId) {
      throw new HttpsError('failed-precondition', 'A csapat tulajdonosát nem lehet eltávolítani');
    }

    // 6. Update member status
    await memberDoc.ref.update({
      status: 'removed',
      removedAt: admin.firestore.FieldValue.serverTimestamp(),
      hasSubscriptionAccess: false,
    });

    // 7. Update user document if member has accepted invite
    if (member.userId) {
      await firestore.collection('users').doc(member.userId).update({
        teamId: admin.firestore.FieldValue.delete(),
        subscriptionStatus: 'none',
        updatedAt: new Date().toISOString(),
      });
    }

    // 8. Decrement team member count
    await firestore.collection('teams').doc(teamId).update({
      memberCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('[removeTeamMember] Member removed successfully', {
      teamId,
      memberId,
      memberEmail: member.email,
    });

    return {
      success: true,
      message: `Csapattag eltávolítva: ${member.email}`,
    };

  } catch (error: any) {
    logger.error('[removeTeamMember] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    return {
      success: false,
      error: error.message || 'Csapattag eltávolítása sikertelen',
    };
  }
});

/**
 * Resend team invitation
 * Callable function - requires authentication
 */
export const resendTeamInvite = onCall({
  cors: true,
  region: 'us-central1',
}, async (request): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Hitelesítés szükséges');
    }

    const { teamId, memberId } = request.data as { teamId: string; memberId: string };
    const userId = request.auth.uid;

    logger.info('[resendTeamInvite] Resending invite', { teamId, memberId });

    // 2. Validate input
    if (!teamId || !memberId) {
      throw new HttpsError('invalid-argument', 'Team ID és member ID szükséges');
    }

    // 3. Get team and verify permissions
    const teamDoc = await firestore.collection('teams').doc(teamId).get();

    if (!teamDoc.exists) {
      throw new HttpsError('not-found', 'Csapat nem található');
    }

    const team = { id: teamDoc.id, ...teamDoc.data() } as Team;

    if (!isTeamOwner(team, userId)) {
      throw new HttpsError('permission-denied', 'Csak a csapat tulajdonosa küldhet meghívót');
    }

    // 4. Get team member
    const memberDoc = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('members')
      .doc(memberId)
      .get();

    if (!memberDoc.exists) {
      throw new HttpsError('not-found', 'Csapattag nem található');
    }

    const member = { id: memberDoc.id, ...memberDoc.data() } as TeamMember;

    // 5. Check if member is invited (not active)
    if (member.status !== 'invited') {
      throw new HttpsError('failed-precondition', 'Ez a tag már elfogadta a meghívást');
    }

    // 6. Extend invitation expiry
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 7);

    await memberDoc.ref.update({
      inviteExpiresAt: admin.firestore.Timestamp.fromDate(newExpiryDate),
    });

    // 7. TODO: Resend invitation email
    // Implementation depends on email service setup

    logger.info('[resendTeamInvite] Invite resent successfully', {
      teamId,
      memberId,
      email: member.email,
    });

    return {
      success: true,
      message: `Meghívó újraküldve: ${member.email}`,
    };

  } catch (error: any) {
    logger.error('[resendTeamInvite] Error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    return {
      success: false,
      error: error.message || 'Meghívó újraküldése sikertelen',
    };
  }
});
