"use strict";
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
exports.createUserProfile = void 0;
/**
 * Create User Profile Cloud Function
 *
 * Creates a user document in Firestore with initial data including emailVerified: false
 * Called during registration to ensure user has a complete profile
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const z = __importStar(require("zod"));
const firestore = admin.firestore();
// Input validation schema
const CreateUserProfileSchema = z.object({
    uid: z.string().min(1),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.string().optional(),
});
/**
 * Create user profile in Firestore
 */
exports.createUserProfile = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        // Input validation
        const validatedData = CreateUserProfileSchema.parse(request.data);
        const { uid, email, firstName, lastName, role } = validatedData;
        v2_1.logger.info(`Creating user profile for uid: ${uid}, email: ${email}`);
        // Check if user document already exists
        const existingUser = await firestore.collection('users').doc(uid).get();
        if (existingUser.exists) {
            v2_1.logger.info(`User profile already exists for uid: ${uid}`);
            return {
                success: true,
                message: 'User profile already exists',
                user: existingUser.data()
            };
        }
        // Create user document with emailVerified: false
        const userData = {
            id: uid,
            uid: uid,
            email,
            firstName: firstName || '',
            lastName: lastName || '',
            role: role || 'STUDENT',
            emailVerified: false, // CRITICAL: Set to false initially
            profilePictureUrl: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await firestore.collection('users').doc(uid).set(userData);
        v2_1.logger.info(`User profile created successfully for uid: ${uid}`);
        return {
            success: true,
            message: 'User profile created successfully',
            user: userData
        };
    }
    catch (error) {
        v2_1.logger.error('Create user profile error:', error);
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: 'Érvénytelen paraméterek',
                details: error.errors
            };
        }
        return {
            success: false,
            error: error.message || 'Felhasználói profil létrehozása sikertelen'
        };
    }
});
//# sourceMappingURL=createUserProfile.js.map