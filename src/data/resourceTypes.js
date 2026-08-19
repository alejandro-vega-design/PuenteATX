/** @typedef {'draft'|'published'|'archived'} ResourceStatus */
/** @typedef {'in_person'|'phone'|'online'|'home_visit'} ServiceMethod */
/** @typedef {'free'|'sliding_scale'|'paid'|'unknown'} CostType */
/** @typedef {'admin'|'editor'} AdminRole */
/** @typedef {'pending'|'success'|'failed'|'needs_review'|'not_applicable'} GeocodeStatus */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} slug
 * @property {string} label_es
 * @property {string} label_en
 * @property {string} description_es
 * @property {string} description_en
 * @property {string} icon_path
 * @property {number} sort_order
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} Resource
 * @property {string} id
 * @property {string} slug
 * @property {ResourceStatus} status
 * @property {string} organization_name
 * @property {string} title_es
 * @property {string} title_en
 * @property {string} summary_es
 * @property {string} summary_en
 * @property {string} description_es
 * @property {string} description_en
 * @property {string} primary_category_id
 * @property {string[]} additional_category_ids
 * @property {string[]} keywords_es
 * @property {string[]} keywords_en
 * @property {string[]} languages
 * @property {ServiceMethod[]} service_methods
 * @property {CostType} cost_type
 * @property {string} [eligibility_es]
 * @property {string} [eligibility_en]
 * @property {string} [required_documents_es]
 * @property {string} [required_documents_en]
 * @property {string} [application_steps_es]
 * @property {string} [application_steps_en]
 * @property {string} [hours_es]
 * @property {string} [hours_en]
 * @property {string} [accessibility_notes_es]
 * @property {string} [accessibility_notes_en]
 * @property {string} [service_area_es]
 * @property {string} [service_area_en]
 * @property {string} [phone]
 * @property {string} [sms_phone]
 * @property {string} [whatsapp_phone]
 * @property {string} [email]
 * @property {string} [website_url]
 * @property {string} [address_line_1]
 * @property {string} [address_line_2]
 * @property {string} [city]
 * @property {string} [state]
 * @property {string} [postal_code]
 * @property {string} [county]
 * @property {number} [latitude]
 * @property {number} [longitude]
 * @property {string} [geocoded_at]
 * @property {GeocodeStatus} [geocode_status]
 * @property {string} [source_url]
 * @property {string} [logo_url]
 * @property {boolean} is_featured
 * @property {boolean} is_emergency
 * @property {string} [last_verified_at]
 * @property {string} [verification_notes]
 * @property {string} [published_at]
 * @property {string} [archived_at]
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [created_by]
 * @property {string} [updated_by]
 */

export const RESOURCE_STATUSES = ['draft', 'published', 'archived'];
export const SERVICE_METHODS = ['in_person', 'phone', 'online', 'home_visit'];
export const COST_TYPES = ['free', 'sliding_scale', 'paid', 'unknown'];
export const ADMIN_ROLES = ['admin', 'editor'];
export const GEOCODE_STATUSES = ['pending', 'success', 'failed', 'needs_review', 'not_applicable'];
export const VERIFICATION_REVIEW_DAYS = 180;
