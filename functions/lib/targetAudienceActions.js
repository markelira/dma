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
exports.deleteTargetAudience = exports.updateTargetAudience = exports.createTargetAudience = exports.getTargetAudiences = void 0;
/**
 * Target Audience CRUD Operations
 * Target Audiences are entities managed through admin dashboard (like categories)
 * Used for multi-select course targeting
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const zod_1 = require("zod");
const firestore = admin.firestore();
// Zod schema for target audience creation
const createTargetAudienceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'A név kötelező.'),
    description: zod_1.z.string().optional(),
});
// Zod schema for target audience update
const updateTargetAudienceSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'A célközönség azonosító kötelező.'),
    name: zod_1.z.string().min(1, 'A név kötelező.'),
    description: zod_1.z.string().optional(),
});
// Zod schema for target audience deletion
const deleteTargetAudienceSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'A célközönség azonosító kötelező.'),
});
/**
 * Get all target audiences (Public - no authentication required)
 */
exports.getTargetAudiences = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async () => {
    try {
        v2_1.logger.info('[getTargetAudiences] Called');
        // Get all target audiences ordered by name
        const snapshot = await firestore
            .collection('targetAudiences')
            .orderBy('name', 'asc')
            .get();
        const targetAudiences = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        v2_1.logger.info(`[getTargetAudiences] Found ${targetAudiences.length} target audiences`);
        return {
            success: true,
            targetAudiences,
        };
    }
    catch (error) {
        v2_1.logger.error('[getTargetAudiences] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt a célközönségek lekérésekor.';
        throw new Error(errorMessage);
    }
});
/**
 * Create a new target audience (Admin only)
 */
exports.createTargetAudience = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        v2_1.logger.info('[createTargetAudience] Called');
        // Verify authentication
        if (!request.auth) {
            throw new Error('Bejelentkezés szükséges célközönség létrehozásához.');
        }
        const userId = request.auth.uid;
        // Get user data to check role
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('Felhasználó nem található.');
        }
        const userData = userDoc.data();
        if (userData?.role !== 'ADMIN') {
            throw new Error('Nincs jogosultságod célközönség létrehozásához. Csak adminisztrátorok hozhatnak létre célközönségeket.');
        }
        // Validate input data
        const data = createTargetAudienceSchema.parse(request.data);
        // Check if target audience with same name already exists
        const existingQuery = await firestore
            .collection('targetAudiences')
            .where('name', '==', data.name)
            .limit(1)
            .get();
        if (!existingQuery.empty) {
            throw new Error('Már létezik célközönség ezzel a névvel.');
        }
        // Create target audience
        const targetAudienceData = {
            name: data.name,
            description: data.description || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const targetAudienceRef = await firestore.collection('targetAudiences').add(targetAudienceData);
        v2_1.logger.info(`[createTargetAudience] Created target audience: ${targetAudienceRef.id}`);
        return {
            success: true,
            message: 'Célközönség sikeresen létrehozva.',
            targetAudience: { id: targetAudienceRef.id, ...targetAudienceData }
        };
    }
    catch (error) {
        v2_1.logger.error('[createTargetAudience] Error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Validációs hiba',
                details: error.errors
            };
        }
        const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt a célközönség létrehozásakor.';
        return {
            success: false,
            error: errorMessage
        };
    }
});
/**
 * Update an existing target audience (Admin only)
 */
exports.updateTargetAudience = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        v2_1.logger.info('[updateTargetAudience] Called');
        // Verify authentication
        if (!request.auth) {
            throw new Error('Bejelentkezés szükséges célközönség frissítéséhez.');
        }
        const userId = request.auth.uid;
        // Get user data to check role
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('Felhasználó nem található.');
        }
        const userData = userDoc.data();
        if (userData?.role !== 'ADMIN') {
            throw new Error('Nincs jogosultságod célközönség frissítéséhez.');
        }
        // Validate input data
        const data = updateTargetAudienceSchema.parse(request.data);
        // Check if target audience exists
        const targetAudienceRef = firestore.collection('targetAudiences').doc(data.id);
        const targetAudienceDoc = await targetAudienceRef.get();
        if (!targetAudienceDoc.exists) {
            throw new Error('A célközönség nem található.');
        }
        // Check if another target audience with same name exists (excluding current one)
        const existingQuery = await firestore
            .collection('targetAudiences')
            .where('name', '==', data.name)
            .limit(2)
            .get();
        const duplicates = existingQuery.docs.filter(doc => doc.id !== data.id);
        if (duplicates.length > 0) {
            throw new Error('Már létezik másik célközönség ezzel a névvel.');
        }
        // Update target audience
        const updateData = {
            name: data.name,
            description: data.description || null,
            updatedAt: new Date().toISOString(),
        };
        await targetAudienceRef.update(updateData);
        const updatedDoc = await targetAudienceRef.get();
        v2_1.logger.info(`[updateTargetAudience] Updated target audience: ${data.id}`);
        return {
            success: true,
            message: 'Célközönség sikeresen frissítve.',
            targetAudience: { id: data.id, ...updatedDoc.data() }
        };
    }
    catch (error) {
        v2_1.logger.error('[updateTargetAudience] Error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Validációs hiba',
                details: error.errors
            };
        }
        const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt a célközönség frissítésekor.';
        return {
            success: false,
            error: errorMessage
        };
    }
});
/**
 * Delete a target audience (Admin only)
 * Prevents deletion if target audience is assigned to any courses
 */
exports.deleteTargetAudience = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        v2_1.logger.info('[deleteTargetAudience] Called');
        // Verify authentication
        if (!request.auth) {
            throw new Error('Bejelentkezés szükséges célközönség törléséhez.');
        }
        const userId = request.auth.uid;
        // Get user data to check role
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('Felhasználó nem található.');
        }
        const userData = userDoc.data();
        if (userData?.role !== 'ADMIN') {
            throw new Error('Nincs jogosultságod célközönség törléséhez.');
        }
        // Validate input data
        const data = deleteTargetAudienceSchema.parse(request.data);
        // Check if target audience exists
        const targetAudienceRef = firestore.collection('targetAudiences').doc(data.id);
        const targetAudienceDoc = await targetAudienceRef.get();
        if (!targetAudienceDoc.exists) {
            throw new Error('A célközönség nem található.');
        }
        // Check if target audience is assigned to any courses
        const coursesSnapshot = await firestore
            .collection('courses')
            .where('targetAudienceIds', 'array-contains', data.id)
            .limit(1)
            .get();
        if (!coursesSnapshot.empty) {
            throw new Error('Ez a célközönség tartalmakhoz van hozzárendelve. ' +
                'Először távolítsa el a hozzárendeléseket a tartalmakból.');
        }
        // Delete target audience
        await targetAudienceRef.delete();
        v2_1.logger.info(`[deleteTargetAudience] Deleted target audience: ${data.id}`);
        return {
            success: true,
            message: 'Célközönség sikeresen törölve.'
        };
    }
    catch (error) {
        v2_1.logger.error('[deleteTargetAudience] Error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return {
                success: false,
                error: 'Validációs hiba',
                details: error.errors
            };
        }
        const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt a célközönség törlésekor.';
        return {
            success: false,
            error: errorMessage
        };
    }
});
//# sourceMappingURL=targetAudienceActions.js.map