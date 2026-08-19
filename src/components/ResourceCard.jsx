import React, { useEffect, useRef, useState } from 'react';
import { getCategoryById } from '../data/categories';
import { localized } from '../data/resourceUtils';
import { canonicalResourceUrl, shareLink } from '../services/share';
import { BookmarkIcon, CategoryIcon, CheckCircleIcon, MapIcon, MoreIcon, PhoneIcon, ShareIcon } from './Icons';
import { trackPuenteEvent } from '../analytics/client';
import StatusToast from './StatusToast';

export default function ResourceCard({ resource, lang, t, saved = false, onSave, listMode = false }) {
  const [shareStatus, setShareStatus] = useState(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionCanExpand, setDescriptionCanExpand] = useState(false);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const cardRef = useRef(null); const listMenuRef = useRef(null); const listMenuButtonRef = useRef(null); const summaryRef = useRef(null);
  const category = getCategoryById(resource.primary_category_id);
  const title = localized(resource, 'title', lang);
  const summary = localized(resource, 'summary', lang);
  const area = localized(resource, 'service_area', lang) || resource.city;
  const address = resource.address_line_1?.trim() ? [resource.address_line_1, resource.address_line_2, resource.city, resource.state, resource.postal_code].filter(Boolean).join(', ') : '';
  const badges = [resource.cost_type === 'free' && t.free, resource.languages.includes('es') && t.spanish, resource.service_methods.includes('online') && t.online, resource.service_methods.includes('in_person') && t.in_person].filter(Boolean).slice(0, 3);
  const share = async () => {
    const result = await shareLink({ title, text: summary, url: canonicalResourceUrl(resource.slug) });
    if (result === 'copied') setShareStatus({ id: Date.now(), message: t.copied });
    if (result === 'failed') setShareStatus({ id: Date.now(), message: t.shareError });
  };
  useEffect(() => { setDescriptionExpanded(false); setDescriptionCanExpand(false); }, [summary]);
  useEffect(() => {
    if (descriptionExpanded || !summaryRef.current) return undefined;
    const measure = () => { if (summaryRef.current) setDescriptionCanExpand(summaryRef.current.scrollHeight > summaryRef.current.clientHeight + 1); };
    const frame = window.requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener('resize', measure); };
  }, [summary, descriptionExpanded]);
  useEffect(() => {
    if (!listMenuOpen) return undefined;
    const close = event => { if (event.key === 'Escape') { setListMenuOpen(false); listMenuButtonRef.current?.focus(); } else if (event.type === 'mousedown' && !listMenuRef.current?.contains(event.target)) setListMenuOpen(false); };
    document.addEventListener('keydown', close); document.addEventListener('mousedown', close); listMenuRef.current?.querySelector('[data-menu-first]')?.focus();
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('mousedown', close); };
  }, [listMenuOpen]);
  const printCard = () => {
    if (!cardRef.current) return;
    trackPuenteEvent('resource_printed', { resource_id: resource.id, category_slug: category?.slug });
    const sheet = document.createElement('section');
    sheet.className = 'resource-card-print-sheet';
    sheet.setAttribute('aria-hidden', 'true');
    const brand = document.createElement('header');
    brand.className = 'resource-print-brand';
    const logo = document.createElement('img');
    logo.src = '/assets/puenteatx-logo-horizontal.svg';
    logo.alt = 'Puente ATX';
    brand.appendChild(logo);
    const clone = cardRef.current.cloneNode(true);
    clone.classList.remove('is-saved', 'is-list-card');
    clone.querySelectorAll('.resource-save-button, .resource-actions, .resource-card-overflow, .description-toggle').forEach(element => element.remove());
    clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    clone.querySelector('.resource-summary')?.classList.add('is-expanded');
    const links = document.createElement('div');
    links.className = 'resource-print-links';
    if (resource.website_url) {
      const website = document.createElement('p');
      website.textContent = `${t.website}: ${resource.website_url}`;
      links.appendChild(website);
    }
    if (resource.source_url && resource.source_url !== resource.website_url) {
      const source = document.createElement('p');
      source.textContent = `${t.source}: ${resource.source_url}`;
      links.appendChild(source);
    }
    const printed = document.createElement('p');
    printed.className = 'resource-print-date';
    printed.textContent = `${t.printed} ${new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'long' }).format(new Date())}`;
    sheet.append(brand, clone);
    if (links.childElementCount) sheet.appendChild(links);
    sheet.appendChild(printed);
    document.body.appendChild(sheet);
    document.body.classList.add('printing-resource-card');
    let fallback;
    const printMedia = window.matchMedia?.('print');
    const cleanup = () => {
      window.clearTimeout(fallback);
      window.removeEventListener('afterprint', cleanup);
      printMedia?.removeEventListener?.('change', handlePrintChange);
      document.body.classList.remove('printing-resource-card');
      sheet.remove();
    };
    const handlePrintChange = event => {
      if (!event.matches) cleanup();
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    printMedia?.addEventListener?.('change', handlePrintChange);
    fallback = window.setTimeout(cleanup, 300000);
    window.print();
  };
  return <article ref={cardRef} className={`resource-card${saved && !listMode ? ' is-saved' : ''}${listMode ? ' is-list-card' : ''}`}>
    <button className={`resource-save-button${saved ? ' is-saved' : ''}`} onClick={() => onSave(resource)} aria-pressed={saved} aria-label={saved ? t.removeSaved : t.save} title={saved ? t.removeSaved : t.save}><BookmarkIcon/></button>
    <div className="resource-category">{category && <CategoryIcon name={category.icon_path.split('/').pop().replace('.svg', '')}/>}<span>{category ? localized(category, 'label', lang) : ''}</span></div>
    <h2>{title}</h2><p className="resource-organization">{resource.website_url ? <a href={resource.website_url} target="_blank" rel="noreferrer" onClick={() => trackPuenteEvent('website_clicked', { resource_id: resource.id, category_slug: category?.slug })} aria-label={`${resource.organization_name} — ${lang === 'es' ? 'abre en una pestaña nueva' : 'opens in a new tab'}`}>{resource.organization_name}<span className="material-symbols-rounded" aria-hidden="true">arrow_outward</span></a> : resource.organization_name}</p>
    {badges.length > 0 && <ul className="resource-badges" aria-label={lang === 'es' ? 'Características' : 'Features'}>{badges.map(badge => <li key={badge}>{badge}</li>)}</ul>}
    {(address || resource.phone) && <div className="resource-contact-links">{address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer" onClick={() => trackPuenteEvent('directions_clicked', { resource_id: resource.id, category_slug: category?.slug })} aria-label={`${t.openMap}: ${address}`}><MapIcon/><span>{address}</span></a>}{resource.phone && <a href={`tel:${resource.phone}`} onClick={() => trackPuenteEvent('call_clicked', { resource_id: resource.id, category_slug: category?.slug })} aria-label={`${t.call}: ${resource.phone}`}><PhoneIcon/><span>{resource.phone}</span></a>}</div>}
    <div className="resource-description"><p ref={summaryRef} id={`description-${resource.id}`} className={`resource-summary${descriptionExpanded ? ' is-expanded' : ''}`}>{summary}</p>{descriptionCanExpand && <button className="description-toggle" onClick={() => setDescriptionExpanded(value => !value)} aria-expanded={descriptionExpanded} aria-controls={`description-${resource.id}`}>{descriptionExpanded ? t.showLess : t.showMore}</button>}</div>
    <dl className="resource-meta">{area && !address && <div><dt>{t.location}</dt><dd>{area}</dd></div>}</dl>
    {(resource.last_verified_at || listMode) && <div className="resource-card-footer">{resource.last_verified_at && <p className="resource-verified"><CheckCircleIcon/><span>{t.verified} {new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'medium' }).format(new Date(`${resource.last_verified_at}T12:00:00`))}</span></p>}{listMode && <div className="resource-card-overflow" ref={listMenuRef}><button ref={listMenuButtonRef} className="resource-overflow-button" onClick={() => setListMenuOpen(value => !value)} aria-label={t.resourceOptions} aria-expanded={listMenuOpen} aria-controls={`resource-menu-${resource.id}`}><MoreIcon/></button>{listMenuOpen && <div className="resource-overflow-menu" id={`resource-menu-${resource.id}`}><button data-menu-first onClick={async () => { setListMenuOpen(false); await share(); }}>{t.shareThis}</button><button onClick={() => { setListMenuOpen(false); printCard(); }}>{t.printThis}</button></div>}</div>}</div>}
    {!listMode && <div className="resource-actions">
      <button className="card-action secondary-card-action desktop-resource-action" onClick={share}><ShareIcon/><span>{t.share}</span></button>
      <button className="card-action print-card-action desktop-resource-action" onClick={printCard}><span className="material-symbols-rounded" aria-hidden="true">print</span><span>{t.print}</span></button>
    </div>}
    <StatusToast toast={shareStatus} onClose={() => setShareStatus(null)} closeLabel={t.closeNotification}/>
  </article>;
}
