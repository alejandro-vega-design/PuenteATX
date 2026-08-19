import React from 'react';
import { FilterFields } from '../ResourceFilters';

export default function ResourceFinderFilters({ filters, setFilters, categories, lang, t, onApply, onClear, onBack }) {
  return <section className="finder-filter-view" aria-labelledby="finder-filter-title">
    <header>
      <button type="button" className="finder-filter-back" onClick={onBack} aria-label={t.close}>
        <span className="material-symbols-rounded" aria-hidden="true">chevron_left</span>
      </button>
      <h2 id="finder-filter-title">{t.filters}</h2>
    </header>
    <div className="finder-filter-scroll"><FilterFields filters={filters} onChange={setFilters} categories={categories} lang={lang} t={t}/></div>
    <footer>
      <button type="button" className="secondary-button" onClick={onClear}>{t.clear}</button>
      <button type="button" className="primary-button" onClick={onApply}>{t.apply}</button>
    </footer>
  </section>;
}
