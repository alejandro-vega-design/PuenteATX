import React, { useEffect, useRef } from 'react';
import { resourceCategories } from '../data/categories';
import { CloseIcon } from './Icons';
import { RESOURCE_COUNTIES } from '../config/resourceCounties';

const toggle = (list, value) => list.includes(value) ? list.filter(item => item !== value) : [...list, value];

export function FilterFields({ filters, onChange, lang, t, categories = resourceCategories }) {
  const group = (key, values) => <div className="filter-checks">{values.map(item => <label key={item.value}><input type="checkbox" checked={filters[key].includes(item.value)} onChange={() => onChange({ ...filters, [key]: toggle(filters[key], item.value), page: 1 })}/><span>{item.label}</span></label>)}</div>;
  return <div className="filter-fields">
    <label className="area-filter"><span className="sr-only">{t.county}</span><select aria-label={t.county} value={filters.area} onChange={event => onChange({ ...filters, area: event.target.value, page: 1 })}><option value="">{t.allCounties}</option>{RESOURCE_COUNTIES.map(county => <option value={county} key={county}>{county}</option>)}</select></label>
    <fieldset><legend>{t.category}</legend>{group('categories', categories.map(category => ({ value: category.slug, label: category[`label_${lang}`] })))}</fieldset>
    <fieldset><legend>{t.availableLanguage}</legend>{group('languages', [{ value: 'es', label: t.spanish }, { value: 'en', label: t.english }])}</fieldset>
    <fieldset><legend>{t.serviceMethod}</legend>{group('methods', [{ value: 'in_person', label: t.in_person }, { value: 'phone', label: t.phoneMethod }, { value: 'online', label: t.online }, { value: 'home_visit', label: t.home_visit }])}</fieldset>
    <fieldset><legend>{t.cost}</legend>{group('costs', [{ value: 'free', label: t.free }, { value: 'sliding_scale', label: t.sliding_scale }, { value: 'paid', label: t.paid }])}</fieldset>
    <label className="recent-filter"><input type="checkbox" checked={filters.recent} onChange={event => onChange({ ...filters, recent: event.target.checked, page: 1 })}/><span>{t.recent}</span></label>
  </div>;
}

export function FilterDialog({ open, onClose, filters, setFilters, onApply, onClear, lang, t }) {
  const closeRef = useRef(null); const dialogRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const key = event => { if (event.key === 'Escape') onClose(); if (event.key === 'Tab') { const items = [...dialogRef.current.querySelectorAll('button,input,select,[href]')].filter(item => !item.disabled); const first = items[0]; const last = items[items.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } };
    document.addEventListener('keydown', key); closeRef.current?.focus();
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="filter-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}><section ref={dialogRef} className="filter-dialog" role="dialog" aria-modal="true" aria-labelledby="filter-title">
    <header><h2 id="filter-title">{t.filters}</h2><button ref={closeRef} className="close-button" onClick={onClose} aria-label={t.close}><CloseIcon/></button></header>
    <div className="filter-scroll"><FilterFields filters={filters} onChange={setFilters} lang={lang} t={t}/></div>
    <footer className="filter-footer"><button type="button" className="secondary-button" onClick={onClear}>{t.clear}</button><button type="button" className="primary-button" onClick={onApply}>{t.apply}</button></footer>
  </section></div>;
}
