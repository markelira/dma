/**
 * Team Management Cloud Functions
 *
 * Export all team-related functions
 */

// Team creation and subscription management
export { createTeam, updateTeamSubscription, deleteTeam } from './createTeam';

// Team member invitation
export { inviteTeamMember } from './inviteTeamMember';

// Team invite acceptance and leaving
export {
  acceptTeamInvite,
  declineTeamInvite,
  leaveTeam,
} from './acceptTeamInvite';

// Team member removal and management
export {
  removeTeamMember,
  resendTeamInvite,
} from './removeTeamMember';

// Team dashboard and data fetching
export {
  getTeamDashboard,
  checkSubscriptionAccess,
  getTeamMembers,
} from './getTeamDashboard';

// Team course enrollment
export {
  enrollTeamInCourse,
  getTeamEnrolledCourses,
} from './enrollTeamInCourse';
