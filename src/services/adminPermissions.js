export const canViewInsights = profile => profile?.role === 'admin';

export const getOrganizationMemberships = profile => profile?.organization_memberships || [];
export const hasCommunityAccess = profile => getOrganizationMemberships(profile).length > 0;
export const canManageOrganization = profile => profile?.role === 'admin' || getOrganizationMemberships(profile).some(item => item.role === 'admin');
export const canCreatePassport = profile => profile?.role === 'admin' || getOrganizationMemberships(profile).some(item => ['admin', 'navigator'].includes(item.role));
export const canWorkReferrals = profile => profile?.role === 'admin' || getOrganizationMemberships(profile).some(item => ['admin', 'navigator', 'case_worker'].includes(item.role));
