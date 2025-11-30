export const PERMISSIONS = {
  ManageUsers: "manage_users",
  ManageRoles: "manage_roles",
  ManageGovernorApplications: "manage_governor_applications",
  ReviewGovernorApplications: "review_governor_applications",
  ManagePresidentApplications: "manage_president_applications",
  ReviewPresidentApplications: "review_president_applications",
  ManageMemberApplications: "manage_member_applications",
  ReviewMemberApplications: "review_member_applications",
  ManageInvites: "manage_invites",
  ViewAuditLogs: "view_audit_logs",
  ManageSecurityEvents: "manage_security_events",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const permissionValues = new Set<string>(Object.values(PERMISSIONS));

export const isPermissionKey = (value: string): value is PermissionKey => permissionValues.has(value);

