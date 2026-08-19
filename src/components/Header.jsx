import React from 'react';
import { BookmarkIcon, GlobeIcon } from './Icons';

export default function Header({ lang, onLanguage, onSaved, onHome, savedCount = 0, finder = false, showSaved = true }) {
  return <header className={`site-header${finder ? ' is-finder-header' : ''}`}>
    <div className="site-container header-inner">
      <a className="brand" href="/" onClick={e => { if (onHome) { e.preventDefault(); onHome(); } }} aria-label="Puente ATX, inicio">
        <picture>
          <source media="(max-width: 480px)" srcSet="/assets/puenteatx-icon.svg"/>
          <img src="/assets/puenteatx-logo-horizontal.svg" alt="Puente ATX"/>
        </picture>
      </a>
      <nav aria-label={lang === 'es' ? 'Acciones principales' : 'Primary actions'}>
        {showSaved && <button className="header-action saved-action" onClick={onSaved}><span className="saved-label-full">{lang === 'es' ? 'Mi lista de recursos' : 'My resource list'}</span><span className="saved-label-short">{lang === 'es' ? 'Mi lista' : 'My list'}</span><BookmarkIcon/>{savedCount > 0 && <b aria-label={`${savedCount} ${lang === 'es' ? 'recursos guardados' : 'saved resources'}`}>{savedCount}</b>}</button>}
        <button className="header-action language-action" onClick={onLanguage} aria-label={lang === 'es' ? 'Change language to English' : 'Cambiar idioma a español'}><GlobeIcon/><span className={lang === 'es' ? 'active-language' : 'inactive-language'}>Español</span><span className="language-divider"> | </span><span className={lang === 'en' ? 'active-language' : 'inactive-language'}>English</span></button>
      </nav>
    </div>
  </header>;
}
