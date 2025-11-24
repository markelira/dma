import * as admin from 'firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as crypto from 'crypto';
import { Company, CompanyAdmin, CompanyEmployee } from '../types/company';
import { sendInvitationEmail } from './employeeInvite';

interface OnboardingInput {
  companyName: string;
  billingEmail: string;
  industry: string;
  companySize: string;
  employees: {
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
  }[];
}

interface OnboardingResponse {
  success: boolean;
  companyId: string;
  employeesInvited: number;
}

/**
 * Complete company onboarding - creates company, sets up admin, and invites employees
 * Called after Firebase Auth account creation
 */
export const completeCompanyOnboarding = https.onCall(
  {
    region: 'us-central1',
    memory: '512MiB',
    cors: [
      'https://www.academion.hu',
      'https://academion.hu',
      'https://dmaapp-477d4.web.app',
      'https://dmaapp-477d4.firebaseapp.com'
    ]
  },
  async (request: CallableRequest<OnboardingInput>): Promise<OnboardingResponse> => {
    const db = admin.firestore();
    const auth = admin.auth();

    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const { companyName, billingEmail, industry, companySize, employees } = request.data;

    // Validate required fields
    if (!companyName?.trim()) {
      throw new HttpsError('invalid-argument', 'Company name is required');
    }

    if (!billingEmail?.trim()) {
      throw new HttpsError('invalid-argument', 'Billing email is required');
    }

    if (!industry) {
      throw new HttpsError('invalid-argument', 'Industry is required');
    }

    if (!companySize) {
      throw new HttpsError('invalid-argument', 'Company size is required');
    }

    try {
      // Generate company slug from name
      const slug = companyName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();

      // Check if slug already exists
      const existingCompanyQuery = await db
        .collection('companies')
        .where('slug', '==', slug)
        .limit(1)
        .get();

      let finalSlug = slug;
      if (!existingCompanyQuery.empty) {
        // Append timestamp to make unique
        finalSlug = `${slug}-${Date.now()}`;
      }

      // Step 1: Create company document
      const companyData: Omit<Company, 'id'> = {
        name: companyName.trim(),
        slug: finalSlug,
        billingEmail: billingEmail.trim().toLowerCase(),
        plan: 'trial',
        status: 'active',
        industry,
        companySize,
        trialEndsAt: Timestamp.fromDate(
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
        ),
        createdAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
        updatedAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      };

      const companyRef = await db.collection('companies').add(companyData);
      const companyId = companyRef.id;

      // Get user details from Firebase Auth
      const userRecord = await auth.getUser(userId);
      const userEmail = userRecord.email || '';
      const userName = userRecord.displayName || '';

      // Step 2: Create company admin document
      const adminData: Omit<CompanyAdmin, 'id'> = {
        userId,
        companyId,
        email: userEmail,
        name: userName,
        role: 'owner',
        permissions: {
          canManageEmployees: true,
          canViewReports: true,
          canManageBilling: true,
          canManageMasterclasses: true,
        },
        status: 'active',
        addedBy: userId,
        addedAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      };

      await db
        .collection('companies')
        .doc(companyId)
        .collection('admins')
        .doc(userId)
        .set(adminData);

      // Step 3: Create user document in users collection
      const nameParts = userName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const userDocData = {
        id: userId,
        email: userEmail,
        emailVerified: false, // Will be updated after email verification
        firstName: firstName,
        lastName: lastName,
        role: 'COMPANY_ADMIN',
        companyId: companyId,
        companyRole: 'owner',
        profilePictureUrl: null,
        title: 'Company Owner',
        bio: `Owner of ${companyName}`,
        institution: companyName,
        credentials: [],
        specialties: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      console.log('🔍 [RESEARCH] Writing user document to Firestore:', {
        path: `users/${userId}`,
        companyId: companyId,
        role: 'COMPANY_ADMIN',
        companyRole: 'owner'
      });

      await db.collection('users').doc(userId).set(userDocData);

      console.log('✅ [RESEARCH] User document written successfully');

      // Step 4: Set custom claims for the owner
      const customClaims = {
        role: 'COMPANY_ADMIN',
        companyId: companyId,
        companyRole: 'owner',
      };

      console.log('🔍 [RESEARCH] Setting custom claims:', customClaims);

      await auth.setCustomUserClaims(userId, customClaims);

      console.log('✅ [RESEARCH] Custom claims set successfully');

      // Verify claims were set by reading them back
      const userRecordVerify = await auth.getUser(userId);
      console.log('🔍 [RESEARCH] Verified custom claims from Firebase Auth:', userRecordVerify.customClaims);

      // Step 5: Invite employees (if any)
      let employeesInvited = 0;
      if (employees && employees.length > 0) {
        const batch = db.batch();

        for (const employee of employees) {
          // Validate employee data
          if (!employee.firstName?.trim() || !employee.lastName?.trim()) {
            continue; // Skip invalid entries
          }

          if (!employee.email?.trim()) {
            continue; // Skip invalid entries
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(employee.email)) {
            continue; // Skip invalid emails
          }

          // Generate secure invitation token (same as addEmployee)
          const inviteToken = crypto.randomBytes(32).toString('hex');

          // Create employee document
          const fullName = `${employee.firstName.trim()} ${employee.lastName.trim()}`;
          const employeeData: Omit<CompanyEmployee, 'id'> = {
            firstName: employee.firstName.trim(),
            lastName: employee.lastName.trim(),
            fullName,
            email: employee.email.trim().toLowerCase(),
            jobTitle: employee.jobTitle?.trim() || '',
            status: 'invited',
            inviteToken,
            inviteExpiresAt: Timestamp.fromDate(
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days to accept
            ),
            companyId,
            enrolledMasterclasses: [],
            invitedBy: userId,
            invitedAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
          };

          const employeeRef = db
            .collection('companies')
            .doc(companyId)
            .collection('employees')
            .doc();

          batch.set(employeeRef, employeeData);
          employeesInvited++;

          // Send invitation email (non-blocking)
          const inviteUrl = `${process.env.APP_URL || 'https://academion.hu'}/company/invite/${inviteToken}`;
          try {
            await sendInvitationEmail(employee.email.trim().toLowerCase(), {
              firstName: employee.firstName.trim(),
              companyName: companyName.trim(),
              inviteUrl,
            });
            console.log(`Invitation email sent to ${employee.email}`);
          } catch (emailError: any) {
            console.warn(`Failed to send invitation email to ${employee.email}:`, emailError.message);
            // Don't throw - employee was still added successfully
          }
        }

        await batch.commit();
      }

      console.log(`✅ Company onboarding completed for ${companyName} (${companyId})`);
      console.log(`   Owner: ${userId}`);
      console.log(`   Employees invited: ${employeesInvited}`);

      return {
        success: true,
        companyId,
        employeesInvited,
      };
    } catch (error: any) {
      console.error('Error in completeCompanyOnboarding:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to complete onboarding: ${error.message}`);
    }
  }
);
