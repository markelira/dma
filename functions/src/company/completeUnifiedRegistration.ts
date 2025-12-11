import * as admin from 'firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { https } from 'firebase-functions/v2';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { Company, CompanyAdmin } from '../types/company';
import { linkEmployeeByEmail } from './linkEmployeeByEmail';

interface UnifiedRegistrationInput {
  // Required fields
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Optional company fields
  companyName?: string;
  billingEmail?: string;
  industry?: string;
  companySize?: string;
}

interface UnifiedRegistrationResponse {
  success: boolean;
  companyId: string;
  userId: string;
  linkedToInvite?: boolean;
  message?: string;
}

/**
 * Complete unified registration - creates company and user for all new registrations
 * Everyone gets COMPANY_ADMIN role with a Company document
 * Falls back to user's name if company name not provided
 */
export const completeUnifiedRegistration = https.onCall(
  {
    region: 'us-central1',
    memory: '512MiB',
    cors: [
      'https://masterclass.dma.hu',
      'https://academion.hu',
      'https://dmaapp-477d4.web.app',
      'https://dmaapp-477d4.firebaseapp.com',
      'http://localhost:3000'
    ]
  },
  async (request: CallableRequest<UnifiedRegistrationInput>): Promise<UnifiedRegistrationResponse> => {
    const db = admin.firestore();
    const auth = admin.auth();

    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = request.auth.uid;
    const { firstName, lastName, email, phone, companyName, billingEmail, industry, companySize } = request.data;

    // Validate required fields
    if (!firstName?.trim()) {
      throw new HttpsError('invalid-argument', 'First name is required');
    }

    if (!lastName?.trim()) {
      throw new HttpsError('invalid-argument', 'Last name is required');
    }

    if (!email?.trim()) {
      throw new HttpsError('invalid-argument', 'Email is required');
    }

    if (!phone?.trim()) {
      throw new HttpsError('invalid-argument', 'Phone number is required');
    }

    try {
      // Apply fallbacks for optional fields
      const finalCompanyName = companyName?.trim() || `${firstName.trim()} ${lastName.trim()}`;
      const finalBillingEmail = billingEmail?.trim()?.toLowerCase() || email.trim().toLowerCase();

      console.log('📝 [completeUnifiedRegistration] Processing registration:', {
        userId,
        email: email.substring(0, 5) + '...',
        companyName: finalCompanyName,
        billingEmail: finalBillingEmail
      });

      // Generate company slug from name
      const slug = finalCompanyName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim()
        .substring(0, 50);

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
        console.log(`⚠️ [completeUnifiedRegistration] Slug collision detected, using: ${finalSlug}`);
      }

      // Step 1: Create company document
      const companyData: any = {
        name: finalCompanyName,
        slug: finalSlug,
        billingEmail: finalBillingEmail,
        plan: 'basic',
        status: 'active',
        subscriptionStatus: 'none', // Will be set to 'active' or 'trialing' after Stripe checkout
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Only add optional fields if they have values
      if (industry) {
        companyData.industry = industry;
      }
      if (companySize) {
        companyData.companySize = companySize;
      }

      const companyRef = await db.collection('companies').add(companyData);
      const companyId = companyRef.id;

      console.log('✅ [completeUnifiedRegistration] Company document created:', companyId);

      // Step 2: Create company admin document
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const adminData: Omit<CompanyAdmin, 'id'> = {
        userId,
        companyId,
        email: email.trim().toLowerCase(),
        name: fullName,
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

      console.log('✅ [completeUnifiedRegistration] Company admin document created');

      // Step 3: Create user document in users collection
      const userDocData = {
        id: userId,
        uid: userId,
        email: email.trim().toLowerCase(),
        emailVerified: false, // Will be updated after email verification
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        role: 'company_admin',
        companyId: companyId,
        companyRole: 'owner',
        profilePictureUrl: null,
        title: 'Owner',
        bio: `Owner of ${finalCompanyName}`,
        institution: finalCompanyName,
        credentials: [],
        specialties: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      console.log('🔍 [completeUnifiedRegistration] Writing user document to Firestore:', {
        path: `users/${userId}`,
        companyId: companyId,
        role: 'COMPANY_ADMIN',
        companyRole: 'owner',
        phone: phone.trim()
      });

      await db.collection('users').doc(userId).set(userDocData);

      console.log('✅ [completeUnifiedRegistration] User document written successfully');

      // Step 4: Set custom claims
      const customClaims = {
        role: 'company_admin',
        companyId: companyId,
        companyRole: 'owner',
      };

      console.log('🔍 [completeUnifiedRegistration] Setting custom claims:', customClaims);

      await auth.setCustomUserClaims(userId, customClaims);

      console.log('✅ [completeUnifiedRegistration] Custom claims set successfully');

      // Verify claims were set by reading them back
      const userRecordVerify = await auth.getUser(userId);
      console.log('🔍 [completeUnifiedRegistration] Verified custom claims from Firebase Auth:', userRecordVerify.customClaims);

      // Step 5: Check for pending employee invite
      let linkedToInvite = false;
      try {
        const linkResult = await linkEmployeeByEmail(userId, email.trim().toLowerCase());
        if (linkResult.linked) {
          linkedToInvite = true;
          console.log('🎉 [completeUnifiedRegistration] User auto-linked to company invite:', {
            companyId: linkResult.companyId,
            companyName: linkResult.companyName
          });

          // Note: linkEmployeeByEmail already sets COMPANY_EMPLOYEE claims and updates user doc
          // This overrides the COMPANY_ADMIN role we just set, which is correct behavior
        }
      } catch (linkError: any) {
        console.warn('⚠️ [completeUnifiedRegistration] Error checking employee invite:', linkError.message);
        // Don't throw - user registration was successful
      }

      console.log(`✅ Registration completed for ${fullName} (${companyId})`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Company: ${finalCompanyName}`);
      console.log(`   Linked to invite: ${linkedToInvite}`);

      return {
        success: true,
        companyId,
        userId,
        linkedToInvite,
        message: 'Registration successful',
      };
    } catch (error: any) {
      console.error('❌ Error in completeUnifiedRegistration:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to complete registration: ${error.message}`);
    }
  }
);
