import React from 'react';
import { SearchIcon } from './Icons';

export default function Hero({ t, query, setQuery, onSearch }) {
  return <section className="hero" id="top" aria-labelledby="hero-title">
    <div className="hero-shade" />
    <div className="hero-copy site-container">
      <h1 id="hero-title">{t.hero}</h1><p>{t.subhero}</p>
    </div>
    <form className="search-box" role="search" onSubmit={e => { e.preventDefault(); onSearch(); }}>
      <label className="sr-only" htmlFor="resource-search">{t.search}</label>
      <span className="search-icon"><SearchIcon /></span>
      <input id="resource-search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t.placeholder} />
      <button type="submit">{t.search}</button>
    </form>
  </section>;
}
