import { supabaseRequest } from '../data/supabaseClient.js';
import { getAdminSession } from '../services/adminAuth.js';
import { insightDateRange } from './filters.js';

export async function getInsightsSnapshot(filters) {
  const session = getAdminSession();
  if (!session?.access_token || session.profile?.role !== 'admin') throw new Error('not_authorized');
  if (session.access_token === 'demo-admin') {
    return {
      generated_at: new Date().toISOString(),
      filters,
      overview: {
        current: { active_sessions: 0, searches: 0, resource_views: 0, resource_saves: 0, contact_actions: 0, no_results: 0, lists_shared: 0, lists_printed: 0 },
        previous: { active_sessions: 0, searches: 0, resource_views: 0, resource_saves: 0, contact_actions: 0, no_results: 0, lists_shared: 0, lists_printed: 0 },
        no_result_rate: 0,
        previous_no_result_rate: 0
      },
      categories: [],
      areas: { visible: [], visible_total: 0, suppressed_area_count: 0 },
      no_results: { terms: [], low_volume_occurrences: 0 },
      resources: [],
      quality: null,
      contact_channels: { calls: 0, whatsapp: 0, websites: 0, directions: 0, resource_prints: 0, list_shares: 0, conversations: 0, total: 0 },
      timeline: { granularity: 'day', points: [] }
    };
  }
  const range = insightDateRange(filters.period);
  const request = {
    method: 'POST',
    token: session.access_token,
    body: {
      p_start_date: range.start,
      p_end_date: range.end,
      p_environment: filters.environment,
      p_language: filters.language === 'all' ? null : filters.language,
      p_device_type: filters.device === 'all' ? null : filters.device
    }
  };
  const snapshot = await supabaseRequest('/rest/v1/rpc/get_insights_snapshot', request);
  const [timelineResult, contactChannelsResult] = await Promise.allSettled([
    supabaseRequest('/rest/v1/rpc/get_insights_time_series', request),
    supabaseRequest('/rest/v1/rpc/get_insights_contact_channels', request)
  ]);
  snapshot.timeline = timelineResult.status === 'fulfilled'
    ? timelineResult.value
    : { granularity: 'day', points: [] };
  const resourceChannelFallback = (snapshot.resources || []).reduce((totals, resource) => ({
    calls: totals.calls + Number(resource.calls || 0),
    whatsapp: totals.whatsapp + Number(resource.whatsapp || 0),
    websites: totals.websites + Number(resource.website || 0),
    directions: totals.directions + Number(resource.directions || 0),
    resource_prints: totals.resource_prints,
    list_shares: totals.list_shares,
    conversations: totals.conversations,
    total: totals.total + Number(resource.calls || 0) + Number(resource.whatsapp || 0) + Number(resource.website || 0) + Number(resource.directions || 0)
  }), { calls: 0, whatsapp: 0, websites: 0, directions: 0, resource_prints: 0, list_shares: 0, conversations: 0, total: 0 });
  snapshot.contact_channels = contactChannelsResult.status === 'fulfilled' && Number(contactChannelsResult.value?.total || 0) > 0
    ? contactChannelsResult.value
    : resourceChannelFallback;
  return snapshot;
}
