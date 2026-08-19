import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getPublishedResources } from '../data/repository';
import { parseSharedList } from '../services/savedResources';
import { shareLink, sharedListUrl } from '../services/share';
import ResourceCard from './ResourceCard';
import StatusToast from './StatusToast';
import { ShareIcon } from './Icons';
import { trackPuenteEvent } from '../analytics/client';
import ConfirmDialog from './ConfirmDialog';

export default function SavedListPage({ lang, t, resourceT, locationSearch, saved, onToggle, onClear, onImport, navigate }) {
  const [allResources, setAllResources] = useState([]); const [loading, setLoading] = useState(true); const [shareStatus, setShareStatus] = useState(null); const [showSharedPrompt, setShowSharedPrompt] = useState(true); const [viewShared, setViewShared] = useState(true); const [confirmClear, setConfirmClear] = useState(false);
  const shared = useMemo(() => parseSharedList(new URLSearchParams(locationSearch).get('recursos')), [locationSearch]);
  useEffect(() => { getPublishedResources({}, lang).then(setAllResources).finally(() => setLoading(false)); }, [lang]);
  const sharedOpenTracked = useRef(false);
  useEffect(() => {
    if (shared.length && !sharedOpenTracked.current) {
      sharedOpenTracked.current = true;
      trackPuenteEvent('shared_list_opened');
    }
  }, [shared]);
  const displaySlugs = shared.length && viewShared ? shared : saved;
  const resources = displaySlugs.map(slug => allResources.find(resource => resource.slug === slug)).filter(Boolean);
  const unavailable = displaySlugs.filter(slug => !allResources.some(resource => resource.slug === slug));
  const url = sharedListUrl(displaySlugs);
  const listIntro = shared.length && viewShared ? t.sharedCount(displaySlugs.length) : t.intro(displaySlugs.length);
  const showStatus = message => setShareStatus({ id: Date.now(), message });
  const share = async () => { trackPuenteEvent('list_shared'); const result = await shareLink({ title: t.title, text: listIntro, url }); if (result === 'copied') showStatus(t.copied); if (result === 'failed') showStatus(t.shareError); };
  return <main className="saved-list-page print-root"><div className="site-container saved-list-container"><header><h1>{t.title}</h1>{displaySlugs.length > 0 && <p>{listIntro}</p>}</header>
    {shared.length > 0 && showSharedPrompt && <section className="shared-list-notice"><h2>{t.sharedTitle}</h2><p>{t.sharedText}</p><div><button className="primary-button" onClick={() => { onImport(shared); showStatus(t.imported); setShowSharedPrompt(false); setViewShared(false); }}>{t.import}</button><button className="secondary-button" onClick={() => setShowSharedPrompt(false)}>{t.viewOnly}</button></div></section>}
    {loading ? <p className="loading-state">{resourceT.loading}</p> : displaySlugs.length === 0 ? <section className="public-state saved-empty"><h2>{t.emptyTitle}</h2><p>{t.emptyText}</p><button className="primary-button" onClick={() => navigate('/recursos')}>{t.browse}</button></section> : <>
      <div className="list-actions no-print"><button className="primary-button" onClick={share}><ShareIcon/><span>{t.share}</span></button><button className="secondary-button" onClick={() => { trackPuenteEvent('list_printed'); window.print(); }}><span className="material-symbols-rounded" aria-hidden="true">print</span><span>{t.print}</span></button><button className="text-danger" onClick={() => setConfirmClear(true)}>{t.clear}</button></div>
      <ConfirmDialog open={confirmClear} title={t.confirmClear} cancelLabel={t.cancel} confirmLabel={t.confirm} onCancel={() => setConfirmClear(false)} onConfirm={() => { onClear(); setConfirmClear(false); }}/>
      <section className="saved-resources">{resources.map(resource => <ResourceCard key={resource.id} resource={resource} lang={lang} t={resourceT} saved={saved.includes(resource.slug)} onSave={() => onToggle(resource)} listMode/>)}</section>{unavailable.map(slug => <div className="unavailable-resource" key={slug}><p>{t.unavailable}</p><button onClick={() => onToggle(slug)}>{t.remove}</button></div>)}</>}
    <p className="storage-note">{t.storage}</p><p className="print-date">{t.printed} {new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'long' }).format(new Date())}</p></div><StatusToast toast={shareStatus} onClose={() => setShareStatus(null)} closeLabel={t.closeNotification}/></main>;
}
