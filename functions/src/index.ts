/**
 * Minimal Firebase Functions for Development
 */
import * as admin from 'firebase-admin';
import { onRequest, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
// import * as sgMail from '@sendgrid/mail';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const auth = admin.auth();
const firestore = admin.firestore();

// Email configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@dma.hu';

// Initialize SendGrid if API key is available
// if (SENDGRID_API_KEY) {
//   sgMail.setApiKey(SENDGRID_API_KEY);
//   console.log('SendGrid initialized for email sending');
// }

// Email transporter configuration
const createTransporter = async () => {
  // Check for Brevo/SendinBlue credentials first (easiest to set up)
  const brevoUser = process.env.BREVO_SMTP_USER;
  const brevoKey = process.env.BREVO_SMTP_KEY;
  
  if (brevoUser && brevoKey) {
    console.log('Using Brevo/SendinBlue for email sending');
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: brevoUser,
        pass: brevoKey,
      },
    });
  }
  
  // Check if we have Gmail credentials
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  
  if (gmailUser && gmailAppPassword) {
    console.log('Using Gmail for email sending');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });
  }
  
  // Fallback to Ethereal Email for development
  console.log('Using Ethereal Email for development (no credentials found)');
  const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

export const healthCheck = onRequest({
  cors: true,
  region: 'us-central1',
}, (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

export const echo = onCall({
  cors: true,
  region: 'us-central1',
}, (request) => {
  return {
    success: true,
    data: request.data,
    timestamp: new Date().toISOString()
  };
});

/**
 * Firebase login - exchange Firebase ID token for user data
 */
export const firebaseLogin = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    const { idToken } = request.data;
    
    if (!idToken) {
      throw new Error('ID token kötelező.');
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user data from Firestore
    const userDoc = await firestore.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // Create a new user document if it doesn't exist
      const authUser = await auth.getUser(uid);
      const newUserData = {
        id: uid,
        email: authUser.email || '',
        firstName: authUser.displayName?.split(' ')[0] || '',
        lastName: authUser.displayName?.split(' ').slice(1).join(' ') || '',
        role: 'STUDENT',
        profilePictureUrl: authUser.photoURL || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await firestore.collection('users').doc(uid).set(newUserData);
      
      return {
        success: true,
        user: newUserData,
        token: idToken
      };
    }

    const userData = userDoc.data();
    
    if (!userData) {
      throw new Error('Felhasználói adatok nem találhatók.');
    }

    return {
      success: true,
      user: {
        id: uid,
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'STUDENT',
        profilePictureUrl: userData.profilePictureUrl || null,
        bio: userData.bio || null,
        title: userData.title || null,
        institution: userData.institution || null,
        createdAt: userData.createdAt || null,
        updatedAt: userData.updatedAt || null,
      },
      token: idToken
    };
  } catch (error: any) {
    logger.error('Firebase login error:', error);
    throw new Error(error.message || 'Bejelentkezési hiba történt.');
  }
});

/**
 * Request password reset - sends email with reset link
 */
export const requestPasswordReset = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    const { email } = request.data;
    
    if (!email) {
      throw new Error('Email cím kötelező.');
    }

    // Check if user exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error) {
      // Don't reveal if email exists or not for security
      return {
        success: true,
        message: 'Ha a megadott email cím regisztrálva van, küldtünk egy jelszó-visszaállítási linket.'
      };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1); // Token expires in 1 hour

    // Store reset token in Firestore
    await firestore.collection('passwordResets').doc(resetToken).set({
      userId: userRecord.uid,
      email: email,
      createdAt: new Date().toISOString(),
      expiresAt: resetExpiry.toISOString(),
      used: false
    });

    // Prepare reset link
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    // HTML email template
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Jelszó visszaállítás</h1>
            </div>
            <div class="content">
              <p>Kedves Felhasználó!</p>
              <p>Jelszó visszaállítási kérelmet kaptunk az Ön DMA fiókjához.</p>
              <p>A jelszó visszaállításához kattintson az alábbi gombra:</p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Új jelszó beállítása</a>
              </div>
              <p><small>Vagy másold be ezt a linket a böngészőbe:</small></p>
              <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
                <small>${resetLink}</small>
              </p>
              <p><strong>Ez a link 1 óráig érvényes.</strong></p>
              <p>Ha nem Ön kérte a jelszó visszaállítást, hagyja figyelmen kívül ezt az emailt.</p>
              <p>Üdvözlettel,<br>Az DMA csapata</p>
            </div>
            <div class="footer">
              <p>Ez egy automatikus üzenet, kérjük ne válaszoljon rá.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    // Try SendGrid first if available
    // if (SENDGRID_API_KEY) {
    //   try {
    //     const msg = {
    //       to: email,
    //       from: FROM_EMAIL,
    //       subject: 'Jelszó visszaállítás - DMA',
    //       html: htmlContent,
    //     };
    //
    //     await sgMail.send(msg);
    //     logger.info('Email sent via SendGrid to:', email);
    //
    //     return {
    //       success: true,
    //       message: 'Ha a megadott email cím regisztrálva van, küldtünk egy jelszó visszaállítási linket.'
    //     };
    //   } catch (error: any) {
    //     logger.error('SendGrid error, falling back to SMTP:', error);
    //   }
    // }

    // Use nodemailer (Brevo, Gmail, or Ethereal)
    const transporter = await createTransporter();
    const fromEmail = process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@dma.hu';
    
    const mailOptions = {
      from: `"DMA Platform" <${fromEmail}>`,
      to: email,
      subject: 'Jelszó visszaállítás - DMA',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    
    // For development, log the preview URL
    logger.info('Email sent:', {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    });

    return {
      success: true,
      message: 'Ha a megadott email cím regisztrálva van, küldtünk egy jelszó-visszaállítási linket.',
      // In development, return the preview URL
      previewUrl: nodemailer.getTestMessageUrl(info)
    };

  } catch (error: any) {
    logger.error('Password reset request error:', error);
    throw new Error(error.message || 'Hiba történt a jelszó visszaállítási kérelem során.');
  }
});

/**
 * Reset password with token
 */
export const resetPassword = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    const { token, newPassword } = request.data;
    
    if (!token || !newPassword) {
      throw new Error('Token és új jelszó kötelező.');
    }

    if (newPassword.length < 6) {
      throw new Error('A jelszónak legalább 6 karakternek kell lennie.');
    }

    // Get reset token from Firestore
    const resetDoc = await firestore.collection('passwordResets').doc(token).get();
    
    if (!resetDoc.exists) {
      throw new Error('Érvénytelen vagy lejárt token.');
    }

    const resetData = resetDoc.data();
    
    if (!resetData) {
      throw new Error('Érvénytelen token adat.');
    }

    // Check if token is already used
    if (resetData.used) {
      throw new Error('Ez a token már fel lett használva.');
    }

    // Check if token is expired
    const expiresAt = new Date(resetData.expiresAt);
    if (expiresAt < new Date()) {
      throw new Error('A token lejárt.');
    }

    // Update user password
    await auth.updateUser(resetData.userId, {
      password: newPassword
    });

    // Mark token as used
    await firestore.collection('passwordResets').doc(token).update({
      used: true,
      usedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'A jelszó sikeresen megváltozott.'
    };

  } catch (error: any) {
    logger.error('Password reset error:', error);
    throw new Error(error.message || 'Hiba történt a jelszó visszaállítása során.');
  }
});

/**
 * Validate reset token
 */
export const validateResetToken = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    const { token } = request.data;
    
    if (!token) {
      throw new Error('Token kötelező.');
    }

    // Get reset token from Firestore
    const resetDoc = await firestore.collection('passwordResets').doc(token).get();
    
    if (!resetDoc.exists) {
      return {
        success: false,
        valid: false,
        message: 'Érvénytelen token.'
      };
    }

    const resetData = resetDoc.data();
    
    if (!resetData) {
      return {
        success: false,
        valid: false,
        message: 'Érvénytelen token adat.'
      };
    }

    // Check if token is already used
    if (resetData.used) {
      return {
        success: false,
        valid: false,
        message: 'Ez a token már fel lett használva.'
      };
    }

    // Check if token is expired
    const expiresAt = new Date(resetData.expiresAt);
    if (expiresAt < new Date()) {
      return {
        success: false,
        valid: false,
        message: 'A token lejárt.'
      };
    }

    return {
      success: true,
      valid: true,
      email: resetData.email,
      message: 'Token érvényes.'
    };

  } catch (error: any) {
    logger.error('Token validation error:', error);
    return {
      success: false,
      valid: false,
      message: error.message || 'Hiba történt a token ellenőrzése során.'
    };
  }
});

/**
 * Send email verification
 */
export const sendEmailVerification = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    const { email, userId } = request.data;
    
    if (!email || !userId) {
      throw new Error('Email és userId kötelező.');
    }

    // Generate verification token
    const verificationToken = uuidv4();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token expires in 24 hours

    // Store verification token in Firestore
    await firestore.collection('emailVerifications').doc(verificationToken).set({
      userId: userId,
      email: email,
      createdAt: new Date().toISOString(),
      expiresAt: tokenExpiry.toISOString(),
      used: false
    });

    // Prepare verification link
    const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;

    // HTML email template
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email cím megerősítése</h1>
            </div>
            <div class="content">
              <p>Kedves Felhasználó!</p>
              <p>Köszönjük, hogy regisztrált az DMA platformon!</p>
              <p>Kérjük, erősítse meg az email címét az alábbi gombra kattintva:</p>
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Email cím megerősítése</a>
              </div>
              <p><small>Vagy másold be ezt a linket a böngészőbe:</small></p>
              <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
                <small>${verificationLink}</small>
              </p>
              <p><strong>Ez a link 24 óráig érvényes.</strong></p>
              <p>Ha nem Ön regisztrált az DMA platformon, hagyja figyelmen kívül ezt az emailt.</p>
              <p>Üdvözlettel,<br>Az DMA csapata</p>
            </div>
            <div class="footer">
              <p>Ez egy automatikus üzenet, kérjük ne válaszoljon rá.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    // Try SendGrid first if available
    // if (SENDGRID_API_KEY) {
    //   try {
    //     const msg = {
    //       to: email,
    //       from: FROM_EMAIL,
    //       subject: 'Email cím megerősítése - DMA',
    //       html: htmlContent,
    //     };
    //
    //     await sgMail.send(msg);
    //     logger.info('Verification email sent via SendGrid to:', email);
    //
    //     return {
    //       success: true,
    //       message: 'Megerősítő email elküldve.'
    //     };
    //   } catch (error: any) {
    //     logger.error('SendGrid error, falling back to SMTP:', error);
    //   }
    // }

    // Use nodemailer (Brevo, Gmail, or Ethereal)
    const transporter = await createTransporter();
    const fromEmail = process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@dma.hu';
    
    const mailOptions = {
      from: `"DMA Platform" <${fromEmail}>`,
      to: email,
      subject: 'Email cím megerősítése - DMA',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Verification email sent:', {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    });

    return {
      success: true,
      message: 'Megerősítő email elküldve.',
      previewUrl: nodemailer.getTestMessageUrl(info)
    };

  } catch (error: any) {
    logger.error('Send verification email error:', error);
    throw new Error(error.message || 'Hiba történt az email küldése során.');
  }
});

/**
 * Get all users (Admin only)
 */
export const getUsers = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Check if user is admin
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.')
    }
    
    // Get requesting user data to check if admin
    const requestingUserDoc = await firestore.collection('users').doc(request.auth.uid).get()
    const requestingUserData = requestingUserDoc.data()
    
    if (!requestingUserData || requestingUserData.role !== 'ADMIN') {
      throw new Error('Adminisztrátori jogosultság szükséges.')
    }
    
    // Get all users from Firestore
    const usersSnapshot = await firestore.collection('users').get()
    const users: any[] = []
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data()
      users.push({
        id: doc.id,
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'STUDENT',
        createdAt: userData.createdAt || new Date().toISOString(),
        lastLoginAt: userData.lastLoginAt || null,
        isActive: userData.isActive !== false, // Default to true
        profilePictureUrl: userData.profilePictureUrl || null,
        emailVerified: userData.emailVerified || false,
        institution: userData.institution || null,
        bio: userData.bio || null,
      })
    })
    
    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return {
      success: true,
      users: users
    }
  } catch (error: any) {
    logger.error('Get users error:', error)
    throw new Error(error.message || 'Hiba történt a felhasználók lekérdezése során.')
  }
})

/**
 * Get platform statistics (Admin only)
 */
export const getStats = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    // Check if user is admin
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.')
    }
    
    // Get requesting user data to check if admin
    const requestingUserDoc = await firestore.collection('users').doc(request.auth.uid).get()
    const requestingUserData = requestingUserDoc.data()
    
    if (!requestingUserData || requestingUserData.role !== 'ADMIN') {
      throw new Error('Adminisztrátori jogosultság szükséges.')
    }
    
    // Get all users from Firestore for statistics
    const usersSnapshot = await firestore.collection('users').get()
    
    let totalUsers = 0
    let activeUsers = 0
    let students = 0
    let instructors = 0
    let admins = 0
    let newUsersThisMonth = 0
    
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data()
      totalUsers++
      
      // Count by role
      if (userData.role === 'STUDENT') students++
      else if (userData.role === 'INSTRUCTOR') instructors++
      else if (userData.role === 'ADMIN') admins++
      
      // Count active users (logged in within last 30 days)
      if (userData.lastLoginAt) {
        const lastLogin = new Date(userData.lastLoginAt)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        if (lastLogin > thirtyDaysAgo) {
          activeUsers++
        }
      }
      
      // Count new users this month
      if (userData.createdAt) {
        const createdDate = new Date(userData.createdAt)
        if (createdDate >= thisMonthStart) {
          newUsersThisMonth++
        }
      }
    })
    
    // Get courses count
    const coursesSnapshot = await firestore.collection('courses').get()
    const courseCount = coursesSnapshot.size
    
    return {
      success: true,
      stats: {
        userCount: totalUsers,
        activeUsers: activeUsers,
        newUsersThisMonth: newUsersThisMonth,
        students: students,
        instructors: instructors,
        admins: admins,
        courseCount: courseCount,
      }
    }
  } catch (error: any) {
    logger.error('Get stats error:', error)
    throw new Error(error.message || 'Hiba történt a statisztikák lekérdezése során.')
  }
})

/**
 * Update user role (Admin only)
 */
export const updateUserRole = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    const { userId, role } = request.data
    
    if (!userId || !role) {
      throw new Error('UserId és role kötelező.')
    }
    
    // Check if user is admin
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges.')
    }
    
    // Get requesting user data to check if admin
    const requestingUserDoc = await firestore.collection('users').doc(request.auth.uid).get()
    const requestingUserData = requestingUserDoc.data()
    
    if (!requestingUserData || requestingUserData.role !== 'ADMIN') {
      throw new Error('Adminisztrátori jogosultság szükséges.')
    }
    
    // Validate role
    if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) {
      throw new Error('Érvénytelen szerepkör.')
    }
    
    // Update user role in Firestore
    await firestore.collection('users').doc(userId).update({
      role: role,
      updatedAt: new Date().toISOString()
    })
    
    logger.info(`User role updated: ${userId} -> ${role}`)
    
    return {
      success: true,
      message: 'Felhasználói szerepkör sikeresen frissítve.'
    }
  } catch (error: any) {
    logger.error('Update user role error:', error)
    throw new Error(error.message || 'Hiba történt a szerepkör frissítése során.')
  }
})

/**
 * Get course by ID or slug
 */
export const getCourse = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    const { courseId: inputCourseId } = request.data || {};
    let courseId = inputCourseId;
    
    logger.info('[getCourse] Called with courseId:', courseId);
    
    if (!courseId) {
      throw new Error('Kurzus azonosító kötelező');
    }
    
    // Attempt to fetch by ID
    let courseDoc = await firestore.collection('courses').doc(courseId).get();
    
    // Fallback: if not found, query by slug field
    if (!courseDoc.exists) {
      logger.info('[getCourse] Trying slug fallback for:', courseId);
      const slugQuery = await firestore
        .collection('courses')
        .where('slug', '==', courseId)
        .limit(1)
        .get();
      
      if (!slugQuery.empty) {
        courseDoc = slugQuery.docs[0];
        courseId = courseDoc.id;
        logger.info('[getCourse] Found by slug, using document ID:', courseId);
      } else {
        logger.error('[getCourse] Course not found by ID or slug:', courseId);
        throw new Error('Kurzus nem található');
      }
    }
    
    const courseData = courseDoc.data();
    
    // Get instructor data
    let instructor = null;
    if (courseData?.instructorId) {
      const instructorDoc = await firestore.collection('users').doc(courseData.instructorId).get();
      if (instructorDoc.exists) {
        const instructorData = instructorDoc.data();
        instructor = {
          id: instructorDoc.id,
          firstName: instructorData?.firstName || 'Ismeretlen',
          lastName: instructorData?.lastName || 'Oktató',
          title: instructorData?.title || null,
          bio: instructorData?.bio || null,
          profilePictureUrl: instructorData?.profilePictureUrl || null,
        };
      }
    }
    
    // Get category data
    let category = null;
    if (courseData?.categoryId) {
      const categoryDoc = await firestore.collection('categories').doc(courseData.categoryId).get();
      if (categoryDoc.exists) {
        const categoryData = categoryDoc.data();
        category = {
          id: categoryDoc.id,
          name: categoryData?.name || 'Ismeretlen kategória',
        };
      }
    }
    
    // Get modules and lessons
    let modules = [];
    try {
      const modulesSnapshot = await firestore
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .orderBy('order', 'asc')
        .get();
      
      for (const moduleDoc of modulesSnapshot.docs) {
        const moduleData = moduleDoc.data();
        
        // Get lessons for this module
        const lessonsSnapshot = await firestore
          .collection('courses')
          .doc(courseId)
          .collection('modules')
          .doc(moduleDoc.id)
          .collection('lessons')
          .orderBy('order', 'asc')
          .get();
        
        const lessons = lessonsSnapshot.docs.map(lessonDoc => ({
          id: lessonDoc.id,
          ...lessonDoc.data()
        }));
        
        modules.push({
          id: moduleDoc.id,
          ...moduleData,
          lessons
        });
      }
    } catch (error: any) {
      logger.warn('[getCourse] Error loading modules:', error);
      // Continue without modules
    }
    
    // Build course object
    const course = {
      id: courseDoc.id,
      ...courseData,
      instructor,
      category,
      modules
    };
    
    logger.info('[getCourse] Successfully returning course:', courseData?.title || 'Unknown');
    
    return {
      success: true,
      course
    };
    
  } catch (error: any) {
    logger.error('[getCourse] Error:', error);
    return {
      success: false,
      error: error.message || 'Kurzus betöltése sikertelen'
    };
  }
});

/**
 * Get all courses with optional filters
 */
export const getCoursesCallable = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    logger.info('[getCoursesCallable] Called');
    
    // Simple query - get all courses
    const snapshot = await firestore.collection('courses').get();
    const courses: any[] = [];
    
    for (const doc of snapshot.docs) {
      const courseData = doc.data();
      
      // Get instructor data
      let instructor = null;
      if (courseData?.instructorId) {
        const instructorDoc = await firestore.collection('users').doc(courseData.instructorId).get();
        if (instructorDoc.exists) {
          const instructorData = instructorDoc.data();
          instructor = {
            id: instructorDoc.id,
            firstName: instructorData?.firstName || 'Ismeretlen',
            lastName: instructorData?.lastName || 'Oktató',
            profilePictureUrl: instructorData?.profilePictureUrl || null,
          };
        }
      }
      
      // Get category data
      let category = null;
      if (courseData?.categoryId) {
        const categoryDoc = await firestore.collection('categories').doc(courseData.categoryId).get();
        if (categoryDoc.exists) {
          const categoryData = categoryDoc.data();
          category = {
            id: categoryDoc.id,
            name: categoryData?.name || 'Ismeretlen kategória',
          };
        }
      }
      
      courses.push({
        id: doc.id,
        ...courseData,
        instructor,
        category
      });
    }
    
    logger.info(`[getCoursesCallable] Found ${courses.length} courses`);
    
    return {
      success: true,
      courses,
      total: courses.length
    };
    
  } catch (error: any) {
    logger.error('[getCoursesCallable] Error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
});

/**
 * Enroll in course (free enrollment)
 */
export const enrollInCourse = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    const { courseId } = request.data || {};
    
    if (!courseId) {
      throw new Error('Kurzus azonosító kötelező');
    }
    
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges a kurzusra való feliratkozáshoz');
    }
    
    const userId = request.auth.uid;
    
    // Check if course exists
    const courseDoc = await firestore.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      throw new Error('Kurzus nem található');
    }
    
    // Check if already enrolled
    const enrollmentId = `${userId}_${courseId}`;
    const existingEnrollment = await firestore.collection('enrollments').doc(enrollmentId).get();
    
    if (existingEnrollment.exists) {
      return {
        success: true,
        message: 'Már beiratkozott erre a kurzusra',
        enrollmentId,
        alreadyEnrolled: true
      };
    }
    
    // Create enrollment
    const enrollmentData = {
      userId,
      courseId,
      enrolledAt: new Date().toISOString(),
      progress: 0,
      status: 'ACTIVE',
      completedLessons: [],
      lastAccessedAt: new Date().toISOString()
    };
    
    await firestore.collection('enrollments').doc(enrollmentId).set(enrollmentData);
    
    // Update course enrollment count
    await firestore.collection('courses').doc(courseId).update({
      enrollmentCount: admin.firestore.FieldValue.increment(1)
    });
    
    logger.info(`User ${userId} enrolled in course ${courseId}`);
    
    return {
      success: true,
      message: 'Sikeres beiratkozás!',
      enrollmentId,
      courseId,
      userId,
      alreadyEnrolled: false
    };
    
  } catch (error: any) {
    logger.error('[enrollInCourse] Error:', error);
    throw new Error(error.message || 'Beiratkozás sikertelen');
  }
});

/**
 * Verify email with token
 */
export const verifyEmail = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    const { token } = request.data;
    
    if (!token) {
      throw new Error('Token kötelező.');
    }

    // Get verification token from Firestore
    const verificationDoc = await firestore.collection('emailVerifications').doc(token).get();
    
    if (!verificationDoc.exists) {
      throw new Error('Érvénytelen vagy lejárt token.');
    }

    const verificationData = verificationDoc.data();
    
    if (!verificationData) {
      throw new Error('Érvénytelen token adat.');
    }

    // Check if token is already used - if yes, still return success
    if (verificationData.used) {
      // Check if user is already verified
      const userDoc = await firestore.collection('users').doc(verificationData.userId).get();
      const userData = userDoc.data();
      
      if (userData && userData.emailVerified === true) {
        // Already verified, return success
        return {
          success: true,
          message: 'Az email cím már meg volt erősítve.',
          alreadyVerified: true
        };
      }
      
      throw new Error('Ez a token már fel lett használva.');
    }

    // Check if token is expired
    const expiresAt = new Date(verificationData.expiresAt);
    if (expiresAt < new Date()) {
      throw new Error('A token lejárt.');
    }

    // Update user's emailVerified status in Firestore
    await firestore.collection('users').doc(verificationData.userId).update({
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Mark token as used
    await firestore.collection('emailVerifications').doc(token).update({
      used: true,
      usedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Az email cím sikeresen megerősítve.',
      alreadyVerified: false
    };

  } catch (error: any) {
    logger.error('Email verification error:', error);
    throw new Error(error.message || 'Hiba történt az email megerősítése során.');
  }
});

// Export audit log functions
export { getAuditLogs, getAuditLogStats } from './auditLog';

// Export support functions
export { createSupportTicket, respondToSupportTicket } from './support';

// Export Company Admin Dashboard functions
export { createCompany } from './company/createCompany';
export {
  addEmployee,
  verifyEmployeeInvite,
  acceptEmployeeInvite,
} from './company/employeeInvite';
export { enrollEmployeesInMasterclass } from './company/enrollEmployees';
export { createCompanyMasterclass } from './company/createMasterclass';
export { completeCompanyOnboarding } from './company/completeOnboarding';
export {
  assignEmployeeToMasterclass,
  unassignEmployeeFromMasterclass,
  getCompanyMasterclasses,
} from './company/masterclassEnrollment';
export {
  purchaseCompanyMasterclass,
  getCompanyPurchases,
} from './company/purchaseMasterclass';
export {
  getCompanyDashboard,
  getEmployeeProgressDetail,
} from './company/progressTracking';
export { generateCSVReport } from './company/generateCSVReport';
export { sendEmployeeReminder } from './company/sendReminder';

// Export Mux video functions
export { getMuxUploadUrl, getMuxAssetStatus, testVideoUpload } from './muxActions';
export { muxWebhook } from './muxWebhook';

// Export course management functions
export { createCourse, updateCourse, publishCourse, deleteCourse } from './courseManagement';

// Export file actions
export { getSignedUploadUrl } from './fileActions';

/**
 * Get all categories
 * Auto-creates default categories if none exist
 */
export const getCategories = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    logger.info('[getCategories] Called');

    let snapshot = await firestore.collection('categories').orderBy('name', 'asc').get();

    // If no categories exist, create default ones
    if (snapshot.empty) {
      logger.info('[getCategories] No categories found, creating defaults...');

      const defaultCategories = [
        { name: 'Üzleti és Menedzsment', slug: 'uzleti-es-menedzsment', description: 'Üzleti vezetés, stratégia, projektmenedzsment', icon: '💼', order: 1, active: true },
        { name: 'Marketing és Értékesítés', slug: 'marketing-es-ertekesites', description: 'Digitális marketing, közösségi média, értékesítési technikák', icon: '📈', order: 2, active: true },
        { name: 'Programozás és Fejlesztés', slug: 'programozas-es-fejlesztes', description: 'Webfejlesztés, mobilappok, szoftverfejlesztés', icon: '💻', order: 3, active: true },
        { name: 'Design és Kreativitás', slug: 'design-es-kreativitas', description: 'Grafikai tervezés, UX/UI, kreatív alkotás', icon: '🎨', order: 4, active: true },
        { name: 'Személyes Fejlődés', slug: 'szemelyes-fejlodes', description: 'Önismeret, kommunikáció, produktivitás', icon: '🌱', order: 5, active: true },
        { name: 'Pénzügyek és Befektetés', slug: 'penzugyek-es-befektetes', description: 'Befektetés, vagyonkezelés, pénzügyi tervezés', icon: '💰', order: 6, active: true },
        { name: 'Egészség és Wellness', slug: 'egeszseg-es-wellness', description: 'Fitness, táplálkozás, mentális egészség', icon: '💪', order: 7, active: true },
        { name: 'Nyelvek', slug: 'nyelvek', description: 'Nyelvtanulás, kommunikáció idegen nyelveken', icon: '🌍', order: 8, active: true },
        { name: 'Jog és Compliance', slug: 'jog-es-compliance', description: 'Jogszabályok, adatvédelem, megfelelőség', icon: '⚖️', order: 9, active: true },
        { name: 'Data Science és AI', slug: 'data-science-es-ai', description: 'Adatelemzés, gépi tanulás, mesterséges intelligencia', icon: '🤖', order: 10, active: true },
        { name: 'HR és Toborzás', slug: 'hr-es-toborzas', description: 'Emberi erőforrás menedzsment, toborzás, onboarding', icon: '👥', order: 11, active: true },
        { name: 'Fotózás és Videózás', slug: 'fotozas-es-videozas', description: 'Fotográfia, videókészítés, vágás', icon: '📸', order: 12, active: true }
      ];

      const batch = firestore.batch();

      for (const category of defaultCategories) {
        const docRef = firestore.collection('categories').doc();
        batch.set(docRef, {
          ...category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      await batch.commit();
      logger.info('[getCategories] Created 12 default categories');

      // Re-fetch categories
      snapshot = await firestore.collection('categories').orderBy('name', 'asc').get();
    }

    const categories: any[] = [];

    snapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });

    logger.info(`[getCategories] Returning ${categories.length} categories`);

    return {
      success: true,
      categories
    };

  } catch (error: any) {
    logger.error('[getCategories] Error:', error);
    return {
      success: false,
      error: error.message || 'Kategóriák betöltése sikertelen'
    };
  }
});

/**
 * Get all instructors (ADMIN/INSTRUCTOR only)
 */
export const getInstructors = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    logger.info('[getInstructors] Called');

    // Check authentication
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges');
    }

    const userId = request.auth.uid;

    // Check if user has permission (ADMIN or INSTRUCTOR)
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !['ADMIN', 'INSTRUCTOR'].includes(userData.role)) {
      throw new Error('Nincs jogosultságod az oktatók listázásához');
    }

    // Get all users with INSTRUCTOR or ADMIN role
    const snapshot = await firestore
      .collection('users')
      .where('role', 'in', ['INSTRUCTOR', 'ADMIN'])
      .get();

    const instructors: any[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      instructors.push({
        id: doc.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        profilePictureUrl: data.profilePictureUrl || null,
        title: data.title || null,
        bio: data.bio || null,
      });
    });

    logger.info(`[getInstructors] Found ${instructors.length} instructors`);

    return {
      success: true,
      instructors
    };

  } catch (error: any) {
    logger.error('[getInstructors] Error:', error);
    return {
      success: false,
      error: error.message || 'Oktatók betöltése sikertelen'
    };
  }
});

/**
 * Seed default categories (ADMIN only)
 */
export const seedCategories = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    logger.info('[seedCategories] Called');

    // Check authentication
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges');
    }

    // Check if user is ADMIN
    const userDoc = await firestore.collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'ADMIN') {
      throw new Error('Csak ADMIN futtathatja ezt a funkciót');
    }

    const categories = [
      { name: 'Üzleti és Menedzsment', slug: 'uzleti-es-menedzsment', description: 'Üzleti vezetés, stratégia, projektmenedzsment', icon: '💼', order: 1 },
      { name: 'Marketing és Értékesítés', slug: 'marketing-es-ertekesites', description: 'Digitális marketing, közösségi média, értékesítési technikák', icon: '📈', order: 2 },
      { name: 'Programozás és Fejlesztés', slug: 'programozas-es-fejlesztes', description: 'Webfejlesztés, mobilappok, szoftverfejlesztés', icon: '💻', order: 3 },
      { name: 'Design és Kreativitás', slug: 'design-es-kreativitas', description: 'Grafikai tervezés, UX/UI, kreatív alkotás', icon: '🎨', order: 4 },
      { name: 'Személyes Fejlődés', slug: 'szemelyes-fejlodes', description: 'Önismeret, kommunikáció, produktivitás', icon: '🌱', order: 5 },
      { name: 'Pénzügyek és Befektetés', slug: 'penzugyek-es-befektetes', description: 'Befektetés, vagyonkezelés, pénzügyi tervezés', icon: '💰', order: 6 },
      { name: 'Egészség és Wellness', slug: 'egeszseg-es-wellness', description: 'Fitness, táplálkozás, mentális egészség', icon: '💪', order: 7 },
      { name: 'Nyelvek', slug: 'nyelvek', description: 'Nyelvtanulás, kommunikáció idegen nyelveken', icon: '🌍', order: 8 },
      { name: 'Jog és Compliance', slug: 'jog-es-compliance', description: 'Jogszabályok, adatvédelem, megfelelőség', icon: '⚖️', order: 9 },
      { name: 'Data Science és AI', slug: 'data-science-es-ai', description: 'Adatelemzés, gépi tanulás, mesterséges intelligencia', icon: '🤖', order: 10 },
      { name: 'HR és Toborzás', slug: 'hr-es-toborzas', description: 'Emberi erőforrás menedzsment, toborzás, onboarding', icon: '👥', order: 11 },
      { name: 'Fotózás és Videózás', slug: 'fotozas-es-videozas', description: 'Fotográfia, videókészítés, vágás', icon: '📸', order: 12 }
    ];

    let added = 0;
    let skipped = 0;

    for (const category of categories) {
      // Check if exists
      const existing = await firestore.collection('categories')
        .where('slug', '==', category.slug)
        .limit(1)
        .get();

      if (!existing.empty) {
        skipped++;
        continue;
      }

      // Add category
      await firestore.collection('categories').add({
        ...category,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      added++;
    }

    logger.info(`[seedCategories] Added ${added}, skipped ${skipped} categories`);

    return {
      success: true,
      added,
      skipped,
      message: `${added} kategória hozzáadva, ${skipped} már létezett`
    };

  } catch (error: any) {
    logger.error('[seedCategories] Error:', error);
    return {
      success: false,
      error: error.message || 'Kategóriák feltöltése sikertelen'
    };
  }
});

// ============================================
// TEAM MANAGEMENT FUNCTIONS
// ============================================

// Export all team management functions
export {
  inviteTeamMember,
  acceptTeamInvite,
  declineTeamInvite,
  leaveTeam,
  removeTeamMember,
  resendTeamInvite,
  getTeamDashboard,
  checkSubscriptionAccess,
  getTeamMembers,
} from './team';

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

// Export subscription management functions
export {
  getSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionInvoices,
  applyPromoCode,
} from './subscription';

// ============================================
// PROMO CODE MANAGEMENT
// ============================================

// Export promo code management functions
export {
  createPromoCode,
  getPromoCodes,
  deletePromoCode,
  validatePromoCode,
} from './promoCode';

// ============================================
// STRIPE WEBHOOK
// ============================================

// Export Stripe webhook handler (placeholder for now)
// export { stripeWebhook } from './stripe';
