import { supabaseRequest } from '../data/supabaseClient';

const rpc = (name, token, body = {}) => supabaseRequest(`/rest/v1/rpc/${name}`, { method: 'POST', token, body });

export const listCommunityPassports = (token, status = 'active', search = '') => rpc('list_community_passports', token, { p_status: status, p_search: search || null });
export const getCommunityPassport = (token, id) => rpc('get_community_passport_detail', token, { p_passport_id: id });
export const listCommunityReferrals = (token, group = 'new') => rpc('list_community_referrals', token, { p_group: group });
export const getCommunityReferral = (token, id) => rpc('get_passport_referral_detail', token, { p_referral_id: id });
export const createPersonAndPassport = (token, values) => rpc('create_person_and_passport', token, values);
export const addPassportNeed = (token, values) => rpc('add_passport_need', token, values);
export const grantPassportConsent = (token, values) => rpc('grant_passport_consent', token, values);
export const createPassportReferral = (token, values) => rpc('create_passport_referral', token, values);
export const acceptPassportReferral = (token, id, note = null) => rpc('accept_passport_referral', token, { p_referral_id: id, p_assign_to_user_id: null, p_note: note });
export const updatePassportReferral = (token, id, status, note = null, closedReason = null) => rpc('update_passport_referral_status', token, { p_referral_id: id, p_status: status, p_note: note, p_closed_reason: closedReason });
export const revokePassportConsent = (token, id) => rpc('revoke_passport_consent', token, { p_consent_id: id });
export const recordCommunityView = (token, type, id) => rpc('record_community_record_view', token, { p_record_type: type, p_record_id: id });

export const getActiveOrganizations = token => supabaseRequest('/rest/v1/organizations?status=eq.active&select=id,name,slug&order=name', { token });
export const createOrganization = (token, values) => supabaseRequest('/rest/v1/organizations', { method: 'POST', token, body: values, headers: { Prefer: 'return=representation' } });
export const addOrganizationUser = (token, values) => supabaseRequest('/rest/v1/organization_users', { method: 'POST', token, body: values, headers: { Prefer: 'return=representation' } });
export const getOrganizationUsers = token => supabaseRequest('/rest/v1/organization_users?select=id,user_id,role,status,organization_id,organizations(name)&order=created_at', { token });
