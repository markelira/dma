/**
 * Create Team Cloud Function
 *
 * Called by Stripe webhook after successful subscription creation.
 * Creates a team document and updates the user to be the team owner.
 */

import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import {
  Team,
  CreateTeamInput,
  SubscriptionStatus,
  calculateSubscriptionEndDate,
  calculateTrialEndDate,
} from '../types/team';

const firestore = admin.firestore();

/**
 * Create a new team for a subscribing user
 */
export async function createTeam(input: CreateTeamInput): Promise<Team> {
  try {
    logger.info('[createTeam] Creating team', {
      ownerId: input.ownerId,
      plan: input.subscriptionPlan,
    });

    const teamRef = firestore.collection('teams').doc();

    const teamData: Team = {
      id: teamRef.id,
      name: input.name,

      // Owner details
      ownerId: input.ownerId,
      ownerEmail: input.ownerEmail,
      ownerName: input.ownerName,

      // Subscription details
      subscriptionStatus: 'active' as SubscriptionStatus,
      subscriptionPlan: input.subscriptionPlan,
      subscriptionStartDate: admin.firestore.Timestamp.fromDate(input.subscriptionStartDate),
      subscriptionEndDate: admin.firestore.Timestamp.fromDate(input.subscriptionEndDate),

      // Stripe references
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
      stripePriceId: input.stripePriceId,

      // Team stats
      memberCount: 0,

      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add trial end date if provided
    if (input.trialEndDate) {
      teamData.trialEndDate = admin.firestore.Timestamp.fromDate(input.trialEndDate);
    }

    // Create team document
    await teamRef.set(teamData);

    logger.info('[createTeam] Team created successfully', { teamId: teamRef.id });

    // Update user to be team owner
    await updateUserAsTeamOwner(input.ownerId, teamRef.id, input.stripeCustomerId, input.stripeSubscriptionId);

    return { ...teamData, id: teamRef.id } as Team;

  } catch (error: any) {
    logger.error('[createTeam] Error creating team:', error);
    throw new Error(`Failed to create team: ${error.message}`);
  }
}

/**
 * Update user document to set them as team owner
 */
async function updateUserAsTeamOwner(
  userId: string,
  teamId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string
): Promise<void> {
  try {
    await firestore.collection('users').doc(userId).update({
      teamId,
      isTeamOwner: true,
      subscriptionStatus: 'active',
      stripeCustomerId,
      stripeSubscriptionId,
      updatedAt: new Date().toISOString(),
    });

    logger.info('[updateUserAsTeamOwner] User updated as team owner', { userId, teamId });
  } catch (error: any) {
    logger.error('[updateUserAsTeamOwner] Error updating user:', error);
    throw error;
  }
}

/**
 * Update team subscription status
 * Called by Stripe webhooks when subscription status changes
 */
export async function updateTeamSubscription(
  stripeSubscriptionId: string,
  subscriptionStatus: SubscriptionStatus,
  subscriptionEndDate?: Date
): Promise<void> {
  try {
    logger.info('[updateTeamSubscription] Updating team subscription', {
      stripeSubscriptionId,
      subscriptionStatus,
    });

    // Find team by Stripe subscription ID
    const teamsSnapshot = await firestore
      .collection('teams')
      .where('stripeSubscriptionId', '==', stripeSubscriptionId)
      .limit(1)
      .get();

    if (teamsSnapshot.empty) {
      throw new Error(`No team found with Stripe subscription ID: ${stripeSubscriptionId}`);
    }

    const teamDoc = teamsSnapshot.docs[0];
    const teamData = teamDoc.data() as Team;

    const updateData: Partial<Team> = {
      subscriptionStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (subscriptionEndDate) {
      updateData.subscriptionEndDate = admin.firestore.Timestamp.fromDate(subscriptionEndDate);
    }

    // Update team
    await teamDoc.ref.update(updateData);

    // Update team owner
    await firestore.collection('users').doc(teamData.ownerId).update({
      subscriptionStatus,
      updatedAt: new Date().toISOString(),
    });

    // If subscription cancelled or expired, update all members' access
    if (subscriptionStatus === 'canceled' || subscriptionStatus === 'past_due') {
      await updateTeamMembersAccess(teamDoc.id, false);
    } else if (subscriptionStatus === 'active') {
      await updateTeamMembersAccess(teamDoc.id, true);
    }

    logger.info('[updateTeamSubscription] Team subscription updated successfully', {
      teamId: teamDoc.id,
      status: subscriptionStatus,
    });

  } catch (error: any) {
    logger.error('[updateTeamSubscription] Error updating team subscription:', error);
    throw error;
  }
}

/**
 * Update hasSubscriptionAccess for all team members
 */
async function updateTeamMembersAccess(teamId: string, hasAccess: boolean): Promise<void> {
  try {
    const membersSnapshot = await firestore
      .collection('teams')
      .doc(teamId)
      .collection('members')
      .where('status', '==', 'active')
      .get();

    const batch = firestore.batch();

    membersSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        hasSubscriptionAccess: hasAccess,
      });

      // Also update the user's subscription status
      const memberData = doc.data();
      if (memberData.userId) {
        const userRef = firestore.collection('users').doc(memberData.userId);
        batch.update(userRef, {
          subscriptionStatus: hasAccess ? 'active' : 'canceled',
        });
      }
    });

    await batch.commit();

    logger.info('[updateTeamMembersAccess] Updated access for team members', {
      teamId,
      memberCount: membersSnapshot.size,
      hasAccess,
    });

  } catch (error: any) {
    logger.error('[updateTeamMembersAccess] Error updating members access:', error);
    throw error;
  }
}

/**
 * Delete a team (for testing only - not exposed in production)
 */
export async function deleteTeam(teamId: string): Promise<void> {
  try {
    logger.info('[deleteTeam] Deleting team', { teamId });

    const teamRef = firestore.collection('teams').doc(teamId);
    const teamDoc = await teamRef.get();

    if (!teamDoc.exists) {
      throw new Error(`Team not found: ${teamId}`);
    }

    const teamData = teamDoc.data() as Team;

    // Delete all team members
    const membersSnapshot = await teamRef.collection('members').get();
    const batch = firestore.batch();

    membersSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Update owner
    await firestore.collection('users').doc(teamData.ownerId).update({
      teamId: admin.firestore.FieldValue.delete(),
      isTeamOwner: false,
      subscriptionStatus: 'none',
      stripeCustomerId: admin.firestore.FieldValue.delete(),
      stripeSubscriptionId: admin.firestore.FieldValue.delete(),
    });

    // Delete team
    await teamRef.delete();

    logger.info('[deleteTeam] Team deleted successfully', { teamId });

  } catch (error: any) {
    logger.error('[deleteTeam] Error deleting team:', error);
    throw error;
  }
}
