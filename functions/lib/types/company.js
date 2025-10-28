"use strict";
/**
 * Company Admin Dashboard - Type Definitions
 * MVP Version - Simplified schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_PERMISSIONS = exports.OWNER_PERMISSIONS = void 0;
// Permission constants
exports.OWNER_PERMISSIONS = {
    canManageEmployees: true,
    canViewReports: true,
    canManageBilling: true,
    canManageMasterclasses: true,
};
exports.ADMIN_PERMISSIONS = {
    canManageEmployees: true,
    canViewReports: true,
    canManageBilling: false,
    canManageMasterclasses: true,
};
//# sourceMappingURL=company.js.map