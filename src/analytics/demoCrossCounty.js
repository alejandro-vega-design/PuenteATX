// Fictional sample for the cross-county heatmap, shown ONLY by the local demo
// admin (no Supabase config) when the Environment filter is set to "preview" —
// the same convention as supabase/demo/seed_insights_preview.sql, which seeds
// fictional events under environment = 'preview' in the real database.
// Real numbers never come from here.
export const demoCrossCounty = {
  min_sessions: 10,
  suppressed_pair_count: 40,
  pairs: [
    { origin_county: 'Williamson', resource_county: 'Travis', sessions: 156 },
    { origin_county: 'Hays', resource_county: 'Travis', sessions: 98 },
    { origin_county: 'Bastrop', resource_county: 'Travis', sessions: 87 },
    { origin_county: 'Caldwell', resource_county: 'Travis', sessions: 64 },
    { origin_county: 'Burnet', resource_county: 'Travis', sessions: 45 },
    { origin_county: 'Travis', resource_county: 'Williamson', sessions: 42 },
    { origin_county: 'Burnet', resource_county: 'Williamson', sessions: 38 },
    { origin_county: 'Travis', resource_county: 'Hays', sessions: 35 },
    { origin_county: 'Williamson', resource_county: 'Burnet', sessions: 31 },
    { origin_county: 'Gonzales', resource_county: 'Guadalupe', sessions: 31 },
    { origin_county: 'Caldwell', resource_county: 'Hays', sessions: 29 },
    { origin_county: 'Guadalupe', resource_county: 'Gonzales', sessions: 28 },
    { origin_county: 'Hays', resource_county: 'Williamson', sessions: 27 },
    { origin_county: 'Guadalupe', resource_county: 'Caldwell', sessions: 26 },
    { origin_county: 'Lee', resource_county: 'Bastrop', sessions: 24 },
    { origin_county: 'Williamson', resource_county: 'Hays', sessions: 22 },
    { origin_county: 'Caldwell', resource_county: 'Guadalupe', sessions: 22 },
    { origin_county: 'Bastrop', resource_county: 'Lee', sessions: 21 },
    { origin_county: 'Lee', resource_county: 'Travis', sessions: 19 },
    { origin_county: 'Hays', resource_county: 'Caldwell', sessions: 19 },
    { origin_county: 'Travis', resource_county: 'Bastrop', sessions: 18 },
    { origin_county: 'Caldwell', resource_county: 'Gonzales', sessions: 18 },
    { origin_county: 'Lee', resource_county: 'Fayette', sessions: 17 },
    { origin_county: 'Guadalupe', resource_county: 'Hays', sessions: 17 },
    { origin_county: 'Bastrop', resource_county: 'Caldwell', sessions: 16 },
    { origin_county: 'Fayette', resource_county: 'Bastrop', sessions: 15 },
    { origin_county: 'Hays', resource_county: 'Bastrop', sessions: 14 },
    { origin_county: 'Gonzales', resource_county: 'Caldwell', sessions: 14 },
    { origin_county: 'Bastrop', resource_county: 'Fayette', sessions: 13 },
    { origin_county: 'Fayette', resource_county: 'Lee', sessions: 13 },
    { origin_county: 'Guadalupe', resource_county: 'Travis', sessions: 13 },
    { origin_county: 'Bastrop', resource_county: 'Williamson', sessions: 12 },
    { origin_county: 'Hays', resource_county: 'Guadalupe', sessions: 11 },
    { origin_county: 'Fayette', resource_county: 'Travis', sessions: 11 },
    { origin_county: 'Caldwell', resource_county: 'Bastrop', sessions: 11 }
  ]
};

// Fictional ZIP-level searches so the county map has something to draw in demo.
export const demoAreas = {
  visible: [{"area_code":"78744","event_count":95,"session_count":57},{"area_code":"78753","event_count":88,"session_count":53},{"area_code":"78758","event_count":70,"session_count":42},{"area_code":"78741","event_count":52,"session_count":31},{"area_code":"78723","event_count":40,"session_count":24},{"area_code":"78702","event_count":34,"session_count":20},{"area_code":"78745","event_count":27,"session_count":16},{"area_code":"78752","event_count":22,"session_count":13},{"area_code":"76511","event_count":96,"session_count":58},{"area_code":"76527","event_count":64,"session_count":38},{"area_code":"76530","event_count":48,"session_count":29},{"area_code":"76537","event_count":34,"session_count":20},{"area_code":"76573","event_count":25,"session_count":15},{"area_code":"78602","event_count":93,"session_count":56},{"area_code":"78612","event_count":61,"session_count":37},{"area_code":"78621","event_count":45,"session_count":27},{"area_code":"78650","event_count":31,"session_count":19},{"area_code":"78659","event_count":22,"session_count":13},{"area_code":"78610","event_count":90,"session_count":54},{"area_code":"78619","event_count":58,"session_count":35},{"area_code":"78620","event_count":42,"session_count":25},{"area_code":"78623","event_count":28,"session_count":17},{"area_code":"78640","event_count":19,"session_count":11},{"area_code":"78616","event_count":96,"session_count":58},{"area_code":"78622","event_count":64,"session_count":38},{"area_code":"78644","event_count":48,"session_count":29},{"area_code":"78648","event_count":34,"session_count":20},{"area_code":"78655","event_count":25,"session_count":15},{"area_code":"76539","event_count":93,"session_count":56},{"area_code":"76549","event_count":61,"session_count":37},{"area_code":"76550","event_count":45,"session_count":27},{"area_code":"78605","event_count":31,"session_count":19},{"area_code":"78608","event_count":22,"session_count":13},{"area_code":"77853","event_count":90,"session_count":54},{"area_code":"78942","event_count":58,"session_count":35},{"area_code":"78946","event_count":42,"session_count":25},{"area_code":"78947","event_count":28,"session_count":17},{"area_code":"78948","event_count":19,"session_count":11},{"area_code":"78932","event_count":96,"session_count":58},{"area_code":"78938","event_count":64,"session_count":38},{"area_code":"78940","event_count":48,"session_count":29},{"area_code":"78941","event_count":34,"session_count":20},{"area_code":"78945","event_count":25,"session_count":15},{"area_code":"77954","event_count":93,"session_count":56},{"area_code":"77984","event_count":61,"session_count":37},{"area_code":"77994","event_count":45,"session_count":27},{"area_code":"78122","event_count":31,"session_count":19},{"area_code":"78140","event_count":22,"session_count":13},{"area_code":"78108","event_count":90,"session_count":54},{"area_code":"78121","event_count":58,"session_count":35},{"area_code":"78123","event_count":42,"session_count":25},{"area_code":"78124","event_count":28,"session_count":17},{"area_code":"78130","event_count":19,"session_count":11}],
  visible_total: 2696,
  suppressed_area_count: 12
};
