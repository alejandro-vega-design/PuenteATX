import React from 'react';
import { CategoryIcon, ChevronRightIcon } from './Icons';

export default function Categories({ categories, lang, title, hasQuery, onSelect, viewAllLabel, onViewAll }) {
  return <section className="categories-section site-container" id="categories" aria-labelledby="category-title">
    <h2 id="category-title">{hasQuery ? `${title}:` : title}</h2>
    {hasQuery && categories.length === 0 ? <p className="no-results">{lang === 'es' ? 'No hay categorías relacionadas. Prueba con otra palabra.' : 'No related categories. Try another word.'}</p> : null}
    <div className="category-grid">
      {categories.map(category => <button className="category-card" key={category.id} onClick={() => onSelect?.(category)}>
        <CategoryIcon name={category.icon}/><span>{category.label[lang]}</span>
      </button>)}
    </div>
    {!hasQuery && viewAllLabel && <a className="view-all-resources-link" href="/recursos" onClick={event => { event.preventDefault(); onViewAll?.(); }}>{viewAllLabel}<ChevronRightIcon/></a>}
  </section>;
}
