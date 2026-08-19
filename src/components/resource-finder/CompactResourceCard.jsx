import React from 'react';
import { CategoryIcon, MapIcon, PhoneIcon } from '../Icons';
import { localized } from '../../data/resourceUtils';
import { formatMiles } from '../../utils/geo';
import { trackPuenteEvent } from '../../analytics/client';

export default function CompactResourceCard({ resource, category, lang, t, selected, hovered, included, onSelect, onHover, onToggleIncluded }) {
  const title = localized(resource, 'title', lang);
  const categoryLabel = category ? localized(category, 'label', lang) : '';
  const hasStreetAddress = Boolean(resource.address_line_1?.trim());
  const address = hasStreetAddress
    ? [resource.address_line_1, resource.address_line_2, resource.city, resource.state, resource.postal_code].filter(Boolean).join(', ')
    : '';
  const badges = [resource.languages?.includes('es') && (lang === 'es' ? 'Español' : 'Spanish'), resource.cost_type === 'free' && (lang === 'es' ? 'Gratis' : 'Free'), resource.service_methods?.includes('phone') && t.phoneAvailable, resource.service_methods?.includes('online') && t.onlineAvailable].filter(Boolean).slice(0, 3);
  return <article className={`compact-resource-card${selected ? ' is-selected' : ''}${hovered ? ' is-hovered' : ''}`} tabIndex="0" aria-current={selected ? 'true' : undefined} onClick={onSelect} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onSelect(); } }} onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
    <div className="compact-resource-heading">
      <div className="resource-category">{category && <CategoryIcon name={category.icon_path.split('/').pop().replace('.svg', '')}/>}<span>{categoryLabel}</span></div>
      <div className="compact-resource-tools">
        {Number.isFinite(resource.distance_miles) && <strong className="compact-distance">{formatMiles(resource.distance_miles, lang)}</strong>}
        <button className={`compact-include-button${included ? ' is-included' : ''}`} type="button" aria-pressed={included} aria-label={included ? t.excludeResource : t.includeResource} onClick={event => { event.stopPropagation(); onToggleIncluded(); }}>
          <span className="material-symbols-rounded" aria-hidden="true">{included ? 'check' : ''}</span>
        </button>
      </div>
    </div>
    <h2>{title}</h2>
    <p className="resource-organization">{resource.organization_name}</p>
    {badges.length > 0 && <ul className="compact-resource-badges">{badges.map(badge => <li key={badge}>{badge}</li>)}</ul>}
    {address && <p className="compact-resource-line"><MapIcon/><span>{address}</span></p>}
    {resource.phone && <a className="compact-resource-line" href={`tel:${resource.phone}`} onClick={event => { event.stopPropagation(); trackPuenteEvent('call_clicked', { resource_id: resource.id, category_slug: category?.slug }); }}><PhoneIcon/><span>{resource.phone}</span></a>}
    {selected && <span className="sr-only">{t.selected}</span>}
  </article>;
}
