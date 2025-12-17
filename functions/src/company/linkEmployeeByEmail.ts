/**
 * Link Employee By Email
 *
 * Automatically links a newly registered user to a company if they were invited.
 * Called during user registration to seamlessly onboard company employees.
 */

import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { CompanyEmployee } from '../types/company';

const db = admin.firestore();

interface LinkEmployeeResult {
  linked: boolean;
  companyId?: string;
  companyName?: string;
  employeeId?: string;
  message: string;
}

/**
 * Link a newly registered user to a company if they have a pending invite
 *
 * @param userId - The Firebase Auth UID of the newly registered user
 * @param email - The email address of the user
 * @returns Result indicating if linking was successful
 */
export async function linkEmployeeByEmail(
  userId: string,
  email: string
): Promise<LinkEmployeeResult> {
  console.log('🔗 [linkEmployeeByEmail] Checking for pending invite...', {
    userId,
    email: email.substring(0, 5) + '...',
  });

  try {
    // 1. Query employees collection group for matching email with status='invited'
    const employeeQuery = await db
      .collectionGroup('employees')
      .where('email', '==', email.toLowerCase())
      .where('status', '==', 'invited')
      .limit(1)
      .get();

    if (employeeQuery.empty) {
      console.log('ℹ️ [linkEmployeeByEmail] No pending invite found for email');
      return {
        linked: false,
        message: 'No pending invite found',
      };
    }

    const employeeDoc = employeeQuery.docs[0];
    const employeeData = employeeDoc.data() as CompanyEmployee;
    const employeeRef = employeeDoc.ref;
    const employeeId = employeeDoc.id;
    const companyId = employeeData.companyId;

    console.log('✅ [linkEmployeeByEmail] Found pending invite:', {
      employeeId,
      companyId,
      invitedAt: employeeData.invitedAt,
    });

    // 2. Check if invite has expired
    const now = new Date();
    const expiresAt = employeeData.inviteExpiresAt?.toDate();

    if (expiresAt && expiresAt < now) {
      console.log('⚠️ [linkEmployeeByEmail] Invite has expired');
      return {
        linked: false,
        message: 'Invite has expired',
      };
    }

    // 3. Get company name for response
    const companyDoc = await db.collection('companies').doc(companyId).get();
    const companyData = companyDoc.data();
    const companyName = companyData?.name || 'Unknown Company';
    const purchasedMasterclasses = companyData?.purchasedMasterclasses || [];

    // 4. Prepare all Firestore updates in a single batch (reduces network round-trips)
    const batch = db.batch();
    const userRef = db.collection('users').doc(userId);

    // Employee document update
    batch.update(employeeRef, {
      userId,
      status: 'active',
      inviteAcceptedAt: FieldValue.serverTimestamp(),
      inviteToken: FieldValue.delete(),
      inviteExpiresAt: FieldValue.delete(),
      ...(purchasedMasterclasses.length > 0 && { enrolledMasterclasses: purchasedMasterclasses }),
    });

    // User document update
    batch.update(userRef, {
      companyId: companyId,
      companyRole: 'employee',
      role: 'COMPANY_EMPLOYEE',
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Auto-enroll in company-purchased masterclasses (progress records)
    for (const masterclassId of purchasedMasterclasses) {
      const progressId = `${userId}_${masterclassId}`;
      const progressRef = db.collection('userProgress').doc(progressId);
      batch.set(progressRef, {
        userId,
        masterclassId,
        companyId,
        currentModule: 1,
        completedModules: [],
        status: 'active',
        enrolledAt: FieldValue.serverTimestamp(),
        lastActivityAt: FieldValue.serverTimestamp(),
      });
    }

    // 5. Run batch commit and custom claims in parallel
    const claimsPromise = admin.auth().setCustomUserClaims(userId, {
      role: 'COMPANY_EMPLOYEE',
      companyId: companyId,
      companyRole: 'employee',
    }).catch((err: any) => {
      console.error('❌ [linkEmployeeByEmail] Error setting custom claims:', err.message);
    });

    await Promise.all([batch.commit(), claimsPromise]);

    console.log('✅ [linkEmployeeByEmail] Batch updates + custom claims completed');
    if (purchasedMasterclasses.length > 0) {
      console.log(`✅ [linkEmployeeByEmail] Auto-enrolled in ${purchasedMasterclasses.length} masterclasses`);
    }

    // 6. Log activity (fire-and-forget, non-blocking)
    db.collection('companies').doc(companyId).collection('activity').add({
      type: 'employee_joined',
      employeeId,
      userId,
      employeeName: employeeData.fullName || `${employeeData.firstName} ${employeeData.lastName}`,
      joinedVia: 'registration',
      timestamp: FieldValue.serverTimestamp(),
    }).catch(() => { /* Non-critical */ });

    console.log('🎉 [linkEmployeeByEmail] Employee successfully linked to company');

    return {
      linked: true,
      companyId,
      companyName,
      employeeId,
      message: `Successfully joined ${companyName}`,
    };

  } catch (error: any) {
    console.error('❌ [linkEmployeeByEmail] Error:', error);
    return {
      linked: false,
      message: error.message || 'Error linking employee',
    };
  }
}
