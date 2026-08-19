import React, { useEffect, useRef, useState } from 'react';
import { getCategoryById } from '../data/categories';
import { getResourceBySlug } from '../data/repository';
import { localized } from '../data/resourceUtils';
import { canonicalResourceUrl, openWhatsApp, shareLink } from '../services/share';
import { BookmarkIcon, CategoryIcon, ChevronLeftIcon, PhoneIcon, WhatsAppIcon } from './Icons';
import ImportantNotice from './ImportantNotice';
import SeoHead, { SITE_URL } from './SeoHead';
import { trackPuenteEvent } from '../analytics/client';

const Section = ({ title, children }) => children ? <section className="detail-section"><h2>{title}</h2>{typeof children === 'string' ? <p>{children}</p> : children}</section> : null;

export default function ResourceDetailPage({ slug, lang, t, legalTitle, legalText, saved, onToggleSaved, navigate, printRequested }) {
  const [resource, setResource] = useState(null); const [loading, setLoading] = useState(true); const [status, setStatus] = useState('');
  const viewedResourceId = useRef(null);
  useEffect(() => { let active = true; setLoading(true); getResourceBySlug(slug).then(value => active && setResource(value)).catch(() => active && setResource(null)).finally(() => active && setLoading(false)); return () => { active = false; }; }, [slug]);
  useEffect(() => {
    if (!resource || viewedResourceId.current === resource.id) return;
    viewedResourceId.current = resource.id;
    trackPuenteEvent('resource_viewed', { resource_id: resource.id, category_slug: getCategoryById(resource.primary_category_id)?.slug });
  }, [resource]);
  useEffect(() => { if (resource && printRequested) window.setTimeout(() => { trackPuenteEvent('resource_printed', { resource_id: resource.id, category_slug: getCategoryById(resource.primary_category_id)?.slug }); window.print(); }, 250); }, [resource, printRequested]);
  if (loading) return <main className="detail-page"><div className="narrow-container loading-state">{t.loading}</div></main>;
  if (!resource) return <><SeoHead title={`${t.notFound} | Puente ATX`} description={t.notFoundHelp} path={`/recursos/${encodeURIComponent(slug)}`} lang={lang} noindex/><main className="detail-page"><div className="narrow-container public-state"><h1>{t.notFound}</h1><p>{t.notFoundHelp}</p><button className="primary-button" onClick={() => navigate('/recursos')}>{t.browse}</button></div></main></>;
  const category = getCategoryById(resource.primary_category_id); const title = localized(resource, 'title', lang); const summary = localized(resource, 'summary', lang); const address = [resource.address_line_1, resource.address_line_2, resource.city, resource.state, resource.postal_code].filter(Boolean).join(', '); const url = canonicalResourceUrl(resource.slug);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: title,
    description: summary,
    url: `${SITE_URL}/recursos/${resource.slug}`,
    provider: { '@type': 'Organization', name: resource.organization_name },
    ...(localized(resource, 'service_area', lang) && { areaServed: localized(resource, 'service_area', lang) }),
    ...(resource.phone && { telephone: resource.phone }),
    ...(resource.website_url && { sameAs: resource.website_url }),
    ...(address && { availableAtOrFrom: { '@type': 'Place', address } })
  };
  const share = async () => { const result = await shareLink({ title, text: summary, url }); if (result === 'copied') setStatus(t.copied); };
  const whatsapp = () => { trackPuenteEvent('whatsapp_clicked', { resource_id: resource.id, category_slug: category?.slug }); openWhatsApp([lang === 'es' ? 'Te comparto este recurso de Puente ATX:' : 'Here is a Puente ATX resource:', title, summary, localized(resource, 'service_area', lang), resource.phone, url].filter(Boolean).join('\n')); };
  return <><SeoHead title={`${title} | Puente ATX`} description={summary} path={`/recursos/${resource.slug}`} lang={lang} type="article" structuredData={structuredData}/><main className="detail-page print-root"><article className="narrow-container detail-article">
    <button className="back-link no-print" onClick={() => window.history.state?.puente ? window.history.back() : navigate('/recursos')}><ChevronLeftIcon/>{t.back}</button>
    <header className="detail-header">{category && <div className="resource-category"><CategoryIcon name={category.icon_path.split('/').pop().replace('.svg','')}/>{localized(category, 'label', lang)}</div>}<h1>{title}</h1><p className="detail-org">{resource.organization_name}</p><p className="detail-summary">{summary}</p></header>
    <div className="detail-actions no-print"><button className={`card-action${saved ? ' is-saved' : ''}`} onClick={() => onToggleSaved(resource)} aria-pressed={saved}><BookmarkIcon/>{saved ? t.saved : t.save}</button>{resource.phone && <a className="card-action primary-card-action" href={`tel:${resource.phone}`} onClick={() => trackPuenteEvent('call_clicked', { resource_id: resource.id, category_slug: category?.slug })}><PhoneIcon/>{t.call}</a>}{resource.website_url && <a className="card-action" href={resource.website_url} target="_blank" rel="noreferrer" onClick={() => trackPuenteEvent('website_clicked', { resource_id: resource.id, category_slug: category?.slug })}>{t.website}</a>}{address && <a className="card-action" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer" onClick={() => trackPuenteEvent('directions_clicked', { resource_id: resource.id, category_slug: category?.slug })}>{t.directions}</a>}{resource.whatsapp_phone && <button className="card-action" onClick={whatsapp}><WhatsAppIcon/>{t.whatsapp}</button>}<button className="card-action" onClick={share}>{t.share}</button><button className="card-action" onClick={() => { trackPuenteEvent('resource_printed', { resource_id: resource.id, category_slug: category?.slug }); window.print(); }}>{t.print}</button></div><p className="share-status" aria-live="polite">{status}</p>
    <Section title={t.services}>{localized(resource, 'description', lang)}</Section><Section title={t.eligibility}>{localized(resource, 'eligibility', lang)}</Section><Section title={t.documents}>{localized(resource, 'required_documents', lang)}</Section><Section title={t.steps}>{localized(resource, 'application_steps', lang)}</Section><Section title={t.hours}>{localized(resource, 'hours', lang)}</Section>
    <Section title={t.languages}>{resource.languages.length ? <p>{resource.languages.map(value => value === 'es' ? t.spanish : t.english).join(', ')}</p> : null}</Section><Section title={t.cost}>{resource.cost_type ? <p>{t[resource.cost_type]}</p> : null}</Section><Section title={t.area}>{localized(resource, 'service_area', lang)}</Section><Section title={t.accessibility}>{localized(resource, 'accessibility_notes', lang)}</Section>
    <Section title={t.contact}>{resource.phone || resource.email || resource.website_url ? <dl className="detail-list">{resource.phone && <div><dt>{t.call}</dt><dd><a href={`tel:${resource.phone}`}>{resource.phone}</a></dd></div>}{resource.email && <div><dt>Email</dt><dd><a href={`mailto:${resource.email}`}>{resource.email}</a></dd></div>}{resource.website_url && <div><dt>{t.website}</dt><dd><a href={resource.website_url}>{resource.website_url}</a></dd></div>}</dl> : null}</Section><Section title={t.location}>{address}</Section><Section title={t.source}>{resource.source_url ? <p><a href={resource.source_url}>{resource.source_url}</a></p> : null}</Section>
    {resource.last_verified_at && <p className="verified-date">{t.verified} {new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'long' }).format(new Date(`${resource.last_verified_at}T12:00:00`))}</p>}
    <ImportantNotice title={legalTitle} text={legalText}/><p className="print-date">{t.printed} {new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'long' }).format(new Date())}</p>
  </article></main></>;
}
