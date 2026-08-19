const hasValue = value => typeof value === 'string' ? Boolean(value.trim()) : Boolean(value);

export function getPublishRequirementKeys(resource) {
  const missing = [];
  if (!hasValue(resource.organization_name)) missing.push('organization');
  if (!hasValue(resource.slug)) missing.push('slug');
  if (!hasValue(resource.title_es) && !hasValue(resource.title_en)) missing.push('title');
  if (!hasValue(resource.summary_es) && !hasValue(resource.summary_en)) missing.push('summary');
  if (!hasValue(resource.primary_category_id)) missing.push('primaryCategory');
  if (![resource.phone, resource.sms_phone, resource.whatsapp_phone, resource.email, resource.website_url].some(hasValue)) missing.push('contact');
  if (!hasValue(resource.source_url)) missing.push('source');
  if (!hasValue(resource.last_verified_at)) missing.push('verifiedDate');
  return missing;
}
