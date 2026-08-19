import React from 'react';
import { localized } from '../../data/resourceUtils';

export default function FinderPrintSheet({ resources, categories, zip, lang, t }) {
  const locale = lang === 'es' ? 'es-US' : 'en-US';
  return <section className="finder-print-sheet" aria-hidden="true">
    <header className="finder-print-brand"><img src="/assets/puenteatx-logo-horizontal.svg" alt="Puente ATX"/><h1>{t.shareTitle(zip)}</h1><p>{t.printDate}: {new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date())}</p></header>
    <div className="finder-print-resources">{resources.map(resource => {
      const category = categories.find(item => item.id === resource.primary_category_id);
      const address = resource.address_line_1?.trim()
        ? [resource.address_line_1, resource.address_line_2, resource.city, resource.state, resource.postal_code].filter(Boolean).join(', ')
        : '';
      return <article className="finder-print-card" key={resource.id}>
        {category && <p className="finder-print-category">{localized(category, 'label', lang)}</p>}
        <h2>{localized(resource, 'title', lang)}</h2>
        <strong>{resource.organization_name}</strong>
        <p>{localized(resource, 'summary', lang)}</p>
        <div className="finder-print-links">
          {address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}>{address}</a>}
          {resource.phone && <a href={`tel:${resource.phone}`}>{resource.phone}</a>}
          {resource.website_url && <a href={resource.website_url}>{t.officialWebsite}: {resource.website_url}</a>}
        </div>
      </article>;
    })}</div>
  </section>;
}
