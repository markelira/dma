"use strict";
/**
 * Team Management Cloud Functions
 *
 * Export all team-related functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamEnrolledCourses = exports.enrollTeamInCourse = exports.getTeamMembers = exports.checkSubscriptionAccess = exports.getTeamDashboard = exports.resendTeamInvite = exports.removeTeamMember = exports.leaveTeam = exports.declineTeamInvite = exports.acceptTeamInvite = exports.inviteTeamMember = exports.deleteTeam = exports.updateTeamSubscription = exports.createTeam = void 0;
// Team creation and subscription management
var createTeam_1 = require("./createTeam");
Object.defineProperty(exports, "createTeam", { enumerable: true, get: function () { return createTeam_1.createTeam; } });
Object.defineProperty(exports, "updateTeamSubscription", { enumerable: true, get: function () { return createTeam_1.updateTeamSubscription; } });
Object.defineProperty(exports, "deleteTeam", { enumerable: true, get: function () { return createTeam_1.deleteTeam; } });
// Team member invitation
var inviteTeamMember_1 = require("./inviteTeamMember");
Object.defineProperty(exports, "inviteTeamMember", { enumerable: true, get: function () { return inviteTeamMember_1.inviteTeamMember; } });
// Team invite acceptance and leaving
var acceptTeamInvite_1 = require("./acceptTeamInvite");
Object.defineProperty(exports, "acceptTeamInvite", { enumerable: true, get: function () { return acceptTeamInvite_1.acceptTeamInvite; } });
Object.defineProperty(exports, "declineTeamInvite", { enumerable: true, get: function () { return acceptTeamInvite_1.declineTeamInvite; } });
Object.defineProperty(exports, "leaveTeam", { enumerable: true, get: function () { return acceptTeamInvite_1.leaveTeam; } });
// Team member removal and management
var removeTeamMember_1 = require("./removeTeamMember");
Object.defineProperty(exports, "removeTeamMember", { enumerable: true, get: function () { return removeTeamMember_1.removeTeamMember; } });
Object.defineProperty(exports, "resendTeamInvite", { enumerable: true, get: function () { return removeTeamMember_1.resendTeamInvite; } });
// Team dashboard and data fetching
var getTeamDashboard_1 = require("./getTeamDashboard");
Object.defineProperty(exports, "getTeamDashboard", { enumerable: true, get: function () { return getTeamDashboard_1.getTeamDashboard; } });
Object.defineProperty(exports, "checkSubscriptionAccess", { enumerable: true, get: function () { return getTeamDashboard_1.checkSubscriptionAccess; } });
Object.defineProperty(exports, "getTeamMembers", { enumerable: true, get: function () { return getTeamDashboard_1.getTeamMembers; } });
// Team course enrollment
var enrollTeamInCourse_1 = require("./enrollTeamInCourse");
Object.defineProperty(exports, "enrollTeamInCourse", { enumerable: true, get: function () { return enrollTeamInCourse_1.enrollTeamInCourse; } });
Object.defineProperty(exports, "getTeamEnrolledCourses", { enumerable: true, get: function () { return enrollTeamInCourse_1.getTeamEnrolledCourses; } });
//# sourceMappingURL=index.js.map