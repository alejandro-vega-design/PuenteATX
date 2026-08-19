import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Categories from './components/Categories';
import AboutOverview from './components/AboutOverview';
import AboutPage from './components/AboutPage';
import Support from './components/Support';
import FAQ from './components/FAQ';
import ConversationPage from './components/ConversationPage';
import ResourcesPage from './components/ResourcesPage';
import ResourceDetailPage from './components/ResourceDetailPage';
import SavedListPage from './components/SavedListPage';
import SiteFooter from './components/SiteFooter';
import LegalPage from './components/LegalPage';
import SeoHead, { SITE_URL } from './components/SeoHead';
import { categories, conversationCopy, copy, detailCopy, faqs, resourceCopy, resourceFinderCopy, savedListCopy } from './data';
import { useSavedResources } from './hooks/useSavedResources';
import { legalPageCopy } from './data/legalCopy';
import { setAnalyticsLanguage, trackPuenteEvent } from './analytics/client';
import { getCategoryById } from './data/categories';

const AdminApp = lazy(() => import('./components/admin/AdminApp'));
const ResourceFinderPage = lazy(() => import('./components/resource-finder/ResourceFinderPage'));

export default function App() {
  const [lang, setLang] = useState('es');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState({ path: window.location.pathname, search: window.location.search });
  const [savedAnnouncement, setSavedAnnouncement] = useState('');
  const savedResources = useSavedResources();
  const t = copy[lang];
  const legalT = legalPageCopy[lang];
  const seo = {
    home: {
      title: lang === 'es' ? 'Puente ATX | Recursos comunitarios en Austin' : 'Puente ATX | Community resources in Austin',
      description: lang === 'es' ? 'Encuentra recursos comunitarios de comida, vivienda, salud, transporte, educación y ayuda legal para familias del Centro de Texas.' : 'Find community resources for food, housing, health, transportation, education and legal help for families in Central Texas.'
    },
    resources: {
      title: lang === 'es' ? 'Recursos para ti | Puente ATX' : 'Resources for you | Puente ATX',
      description: lang === 'es' ? 'Busca y filtra recursos comunitarios disponibles para familias de Austin y el Centro de Texas.' : 'Search and filter community resources available to families in Austin and Central Texas.'
    }
  };
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Puente ATX',
    url: SITE_URL,
    logo: `${SITE_URL}/assets/puenteatx-logo-horizontal.svg`,
    areaServed: { '@type': 'AdministrativeArea', name: 'Central Texas' }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    setAnalyticsLanguage(lang);
  }, [lang]);

  useEffect(() => {
    const updatePath = () => setLocation({ path: window.location.pathname, search: window.location.search });
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  const navigate = useCallback((nextPath, options = {}) => {
    const current = `${window.location.pathname}${window.location.search}`;
    const state = { puente: true, ...(options.analyticsSearch ? { analyticsSearch: true } : {}) };
    if (current !== nextPath || options.analyticsSearch) window.history[options.replace ? 'replaceState' : 'pushState'](state, '', nextPath);
    setLocation({ path: window.location.pathname, search: window.location.search });
    if (options.scroll !== false) window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const search = () => navigate(`/recursos?q=${encodeURIComponent(query.trim())}`, { analyticsSearch: true });
  if (location.path.startsWith('/admin')) return <><SeoHead title={lang === 'es' ? 'Administración | Puente ATX' : 'Administration | Puente ATX'} description={lang === 'es' ? 'Acceso administrativo de Puente ATX.' : 'Puente ATX administrative access.'} path={location.path} lang={lang} noindex/><Suspense fallback={<main className="admin-loading">Cargando…</main>}><AdminApp path={location.path} locationSearch={location.search} lang={lang} setLang={setLang} navigate={navigate}/></Suspense></>;
  const toggleSaved = value => {
    const slug = typeof value === 'string' ? value : value.slug;
    const adding = !savedResources.isSaved(slug);
    savedResources.toggle(slug);
    if (typeof value !== 'string' && value.id) {
      const category = getCategoryById(value.primary_category_id);
      trackPuenteEvent(adding ? 'resource_saved' : 'resource_removed', { resource_id: value.id, category_slug: category?.slug });
    }
    setSavedAnnouncement(adding ? (lang === 'es' ? 'Recurso guardado.' : 'Resource saved.') : (lang === 'es' ? 'Recurso quitado de Mi lista.' : 'Resource removed from My list.'));
  };
  const header = <><Header lang={lang} onLanguage={() => setLang(lang === 'es' ? 'en' : 'es')} onSaved={() => navigate('/mi-lista')} onHome={() => navigate('/')} savedCount={savedResources.slugs.length} finder={location.path === '/buscador'} showSaved={location.path !== '/buscador'}/><p className="sr-only" aria-live="polite">{savedAnnouncement}</p></>;
  const footer = <SiteFooter t={t} navigate={navigate}/>;
  if (location.path === '/conversacion') return <><SeoHead title={lang === 'es' ? 'Hablemos | Puente ATX' : 'Let’s talk | Puente ATX'} description={lang === 'es' ? 'Solicita una conversación gratuita y confidencial con el equipo de Puente ATX.' : 'Request a free and confidential conversation with the Puente ATX team.'} path="/conversacion" lang={lang} noindex/>{header}<ConversationPage lang={lang} t={conversationCopy[lang]} onBack={() => window.history.state?.puente ? window.history.back() : navigate('/')} onResources={() => navigate('/')} onSaved={() => navigate('/mi-lista')}/>{footer}</>;
  if (location.path === '/recursos') return <><SeoHead {...seo.resources} path="/recursos" lang={lang}/>{header}<ResourcesPage lang={lang} t={resourceCopy[lang]} locationSearch={location.search} navigate={navigate} savedSlugs={savedResources.slugs} onToggleSaved={toggleSaved}/>{footer}</>;
  if (location.path === '/buscador') return <><SeoHead title={lang === 'es' ? 'Buscador de Recursos | Puente ATX' : 'Resource Finder | Puente ATX'} description={lang === 'es' ? 'Encuentra recursos comunitarios cercanos por código postal.' : 'Find nearby community resources by ZIP code.'} path="/buscador" lang={lang}/>{header}<Suspense fallback={<main className="finder-route-loading">{resourceFinderCopy[lang].resourcesLoading}</main>}><ResourceFinderPage lang={lang} t={resourceFinderCopy[lang]} filterT={resourceCopy[lang]} locationSearch={location.search} navigate={navigate}/></Suspense></>;
  if (location.path.startsWith('/recursos/')) { const slug = decodeURIComponent(location.path.slice('/recursos/'.length)); return <>{header}<ResourceDetailPage slug={slug} lang={lang} t={detailCopy[lang]} legalTitle={t.legalTitle} legalText={t.legal} saved={savedResources.isSaved(slug)} onToggleSaved={toggleSaved} navigate={navigate} printRequested={new URLSearchParams(location.search).get('imprimir') === '1'}/>{footer}</>; }
  if (location.path === '/mi-lista') return <><SeoHead title={lang === 'es' ? 'Mi lista de recursos | Puente ATX' : 'My resource list | Puente ATX'} description={lang === 'es' ? 'Tu lista privada de recursos guardados en este navegador.' : 'Your private list of resources saved in this browser.'} path="/mi-lista" lang={lang} noindex/>{header}<SavedListPage lang={lang} t={savedListCopy[lang]} resourceT={resourceCopy[lang]} locationSearch={location.search} saved={savedResources.slugs} onToggle={toggleSaved} onClear={savedResources.clear} onImport={savedResources.importList} navigate={navigate}/>{footer}</>;
  if (location.path === '/privacidad') return <><SeoHead title={lang === 'es' ? 'Política de privacidad | Puente ATX' : 'Privacy policy | Puente ATX'} description={lang === 'es' ? 'Conoce cómo Puente ATX trata la información y protege la privacidad de sus visitantes.' : 'Learn how Puente ATX handles information and protects visitor privacy.'} path="/privacidad" lang={lang}/>{header}<LegalPage content={legalT.privacy} updated={legalT.updated}/>{footer}</>;
  if (location.path === '/terminos') return <><SeoHead title={lang === 'es' ? 'Términos de uso | Puente ATX' : 'Terms of use | Puente ATX'} description={lang === 'es' ? 'Consulta los términos de uso del directorio comunitario Puente ATX.' : 'Read the terms of use for the Puente ATX community directory.'} path="/terminos" lang={lang}/>{header}<LegalPage content={legalT.terms} updated={legalT.updated}/>{footer}</>;
  if (location.path === '/quienes-somos') return <><SeoHead title={lang === 'es' ? 'Quiénes somos | Puente ATX' : 'About us | Puente ATX'} description={t.aboutPage.intro} path="/quienes-somos" lang={lang}/>{header}<AboutPage content={t.aboutPage}/>{footer}</>;

  return <><SeoHead {...seo.home} path="/" lang={lang} structuredData={organizationSchema}/>{header}<main><Hero t={t} query={query} setQuery={setQuery} onSearch={search}/><Categories categories={categories} lang={lang} title={t.categories} hasQuery={false} onSelect={category => { trackPuenteEvent('category_selected', { category_slug: category.slug }); navigate(`/recursos?categoria=${category.slug}`, { analyticsSearch: true }); }} viewAllLabel={t.viewAllResources} onViewAll={() => navigate('/recursos')}/><AboutOverview t={t} onLearnMore={() => navigate('/quienes-somos')}/><Support t={t} onReserve={() => navigate('/conversacion')}/><FAQ t={t} faqs={faqs} lang={lang} noticeTitle={t.legalTitle} noticeText={t.legal}/></main>{footer}</>;
}
