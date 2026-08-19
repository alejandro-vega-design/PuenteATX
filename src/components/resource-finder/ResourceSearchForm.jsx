import React from 'react';

export default function ResourceSearchForm({ t, values, error, loading, activeFilterCount, onChange, onSubmit, onOpenFilters }) {
  return <form className="finder-search-form" onSubmit={onSubmit} noValidate>
    <button className={`secondary-button finder-filter-button${activeFilterCount ? ' has-active-filters' : ''}`} type="button" onClick={onOpenFilters}>
      <span className="material-symbols-rounded" aria-hidden="true">filter_list</span><span>{t.filter}</span>
      {activeFilterCount > 0 && <b className="filter-count" aria-label={`${activeFilterCount} ${t.activeFilters}`}>{activeFilterCount}</b>}
    </button>
    <div className="finder-zip-search">
      <label className="sr-only" htmlFor="finder-zip">{t.zipLabel}</label>
      <span className="material-symbols-rounded finder-zip-icon" aria-hidden="true">location_on</span>
      <input id="finder-zip" name="zip" type="text" inputMode="numeric" autoComplete="postal-code" maxLength="5" placeholder={t.zipPlaceholder} value={values.zip} onChange={event => onChange({ ...values, zip: event.target.value.replace(/\D/g, '').slice(0, 5) })} aria-invalid={Boolean(error)} aria-describedby={error ? 'finder-zip-error' : undefined}/>
      <button className="primary-button finder-search-button" type="submit" disabled={loading} aria-label={t.searchButton} title={t.searchButton}>
        <span className="material-symbols-rounded" aria-hidden="true">search</span>
      </button>
    </div>
    {error && <p id="finder-zip-error" className="finder-field-error">{error}</p>}
  </form>;
}
