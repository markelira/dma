"use strict";
/**
 * Create Team Cloud Function
 *
 * Called by Stripe webhook after successful subscription creation.
 * Creates a team document and updates the user to be the team owner.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeam = createTeam;
exports.updateTeamSubscription = updateTeamSubscription;
exports.deleteTeam = deleteTeam;
const admin = __importStar(require("firebase-admin"));
const v2_1 = require("firebase-functions/v2");
const firestore = admin.firestore();
/**
 * Create a new team for a subscribing user
 */
async function createTeam(input) {
    try {
        v2_1.logger.info('[createTeam] Creating team', {
            ownerId: input.ownerId,
            plan: input.subscriptionPlan,
        });
        const teamRef = firestore.collection('teams').doc();
        const teamData = {
            id: teamRef.id,
            name: input.name,
            // Owner details
            ownerId: input.ownerId,
            ownerEmail: input.ownerEmail,
            ownerName: input.ownerName,
            // Subscription details
            subscriptionStatus: 'active',
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
        v2_1.logger.info('[createTeam] Team created successfully', { teamId: teamRef.id });
        // Update user to be team owner
        await updateUserAsTeamOwner(input.ownerId, teamRef.id, input.stripeCustomerId, input.stripeSubscriptionId);
        return { ...teamData, id: teamRef.id };
    }
    catch (error) {
        v2_1.logger.error('[createTeam] Error creating team:', error);
        throw new Error(`Failed to create team: ${error.message}`);
    }
}
/**
 * Update user document to set them as team owner
 */
async function updateUserAsTeamOwner(userId, teamId, stripeCustomerId, stripeSubscriptionId) {
    try {
        await firestore.collection('users').doc(userId).update({
            teamId,
            isTeamOwner: true,
            subscriptionStatus: 'active',
            stripeCustomerId,
            stripeSubscriptionId,
            updatedAt: new Date().toISOString(),
        });
        v2_1.logger.info('[updateUserAsTeamOwner] User updated as team owner', { userId, teamId });
    }
    catch (error) {
        v2_1.logger.error('[updateUserAsTeamOwner] Error updating user:', error);
        throw error;
    }
}
/**
 * Update team subscription status
 * Called by Stripe webhooks when subscription status changes
 */
async function updateTeamSubscription(stripeSubscriptionId, subscriptionStatus, subscriptionEndDate) {
    try {
        v2_1.logger.info('[updateTeamSubscription] Updating team subscription', {
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
        const teamData = teamDoc.data();
        const updateData = {
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
        }
        else if (subscriptionStatus === 'active') {
            await updateTeamMembersAccess(teamDoc.id, true);
        }
        v2_1.logger.info('[updateTeamSubscription] Team subscription updated successfully', {
            teamId: teamDoc.id,
            status: subscriptionStatus,
        });
    }
    catch (error) {
        v2_1.logger.error('[updateTeamSubscription] Error updating team subscription:', error);
        throw error;
    }
}
/**
 * Update hasSubscriptionAccess for all team members
 */
async function updateTeamMembersAccess(teamId, hasAccess) {
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
        v2_1.logger.info('[updateTeamMembersAccess] Updated access for team members', {
            teamId,
            memberCount: membersSnapshot.size,
            hasAccess,
        });
    }
    catch (error) {
        v2_1.logger.error('[updateTeamMembersAccess] Error updating members access:', error);
        throw error;
    }
}
/**
 * Delete a team (for testing only - not exposed in production)
 */
async function deleteTeam(teamId) {
    try {
        v2_1.logger.info('[deleteTeam] Deleting team', { teamId });
        const teamRef = firestore.collection('teams').doc(teamId);
        const teamDoc = await teamRef.get();
        if (!teamDoc.exists) {
            throw new Error(`Team not found: ${teamId}`);
        }
        const teamData = teamDoc.data();
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
        v2_1.logger.info('[deleteTeam] Team deleted successfully', { teamId });
    }
    catch (error) {
        v2_1.logger.error('[deleteTeam] Error deleting team:', error);
        throw error;
    }
}
//# sourceMappingURL=createTeam.js.map