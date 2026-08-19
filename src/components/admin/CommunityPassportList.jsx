import React, { useCallback, useEffect, useState } from 'react';
import { listCommunityPassports } from '../../services/communityPassportRepository';

const c = {
  es: { title: 'Pasaportes comunitarios', intro: 'Personas, necesidades y referidos activos.', active: 'Activos', closed: 'Cerrados', search: 'Buscar por nombre, teléfono o ID', add: 'Crear pasaporte', empty: 'No hay pasaportes para mostrar.', needs: 'Necesidades activas', referrals: 'Referidos', activity: 'Última actividad', open: 'Abrir pasaporte', retry: 'Intenta nuevamente.' },
  en: { title: 'Community Passports', intro: 'People, needs, and active referrals.', active: 'Active', closed: 'Closed', search: 'Search by name, phone, or ID', add: 'Create passport', empty: 'There are no passports to show.', needs: 'Active needs', referrals: 'Referrals', activity: 'Last activity', open: 'Open passport', retry: 'Try again.' }
};

export default function CommunityPassportList({ session, lang, navigate }) {
  const t = c[lang] || c.es; const [status, setStatus] = useState('active'); const [search, setSearch] = useState(''); const [items, setItems] = useState([]); const [state, setState] = useState('loading');
  const load = useCallback(() => { setState('loading'); listCommunityPassports(session.access_token, status, search).then(value => { setItems(value || []); setState('ready'); }).catch(() => setState('error')); }, [session.access_token, status, search]);
  useEffect(() => { setState('loading'); listCommunityPassports(session.access_token, status, '').then(value => { setItems(value || []); setState('ready'); }).catch(() => setState('error')); }, [session.access_token, status]);
  return <section className="community-page">
    <header className="admin-page-heading"><div><h1>{t.title}</h1><p>{t.intro}</p></div><button className="primary-button" onClick={() => navigate('/admin/pasaportes/nuevo')}><span aria-hidden="true">+</span> {t.add}</button></header>
    <div className="community-toolbar"><div className="admin-tabs"><button className={status === 'active' ? 'is-active' : ''} onClick={() => setStatus('active')}>{t.active}</button><button className={status === 'closed' ? 'is-active' : ''} onClick={() => setStatus('closed')}>{t.closed}</button></div><form onSubmit={event => { event.preventDefault(); load(); }}><label className="sr-only" htmlFor="passport-search">{t.search}</label><input id="passport-search" value={search} placeholder={t.search} onChange={event => setSearch(event.target.value)}/><button type="submit" className="secondary-button"><span className="material-symbols-rounded" aria-hidden="true">search</span></button></form></div>
    {state === 'loading' && <p aria-live="polite">Loading…</p>}{state === 'error' && <div className="admin-error-state"><p>{t.retry}</p><button onClick={load}>{t.retry}</button></div>}
    {state === 'ready' && items.length === 0 && <div className="admin-empty-state"><p>{t.empty}</p></div>}
    {state === 'ready' && items.length > 0 && <div className="community-table-wrap"><table className="community-table"><caption className="sr-only">{t.title}</caption><thead><tr><th>{lang === 'es' ? 'Persona' : 'Person'}</th><th>ZIP</th><th>{t.needs}</th><th>{t.referrals}</th><th>{t.activity}</th><th><span className="sr-only">{t.open}</span></th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.person.preferred_name || [item.person.first_name, item.person.last_name].filter(Boolean).join(' ')}</strong><small>{item.organization.name}</small></td><td>{item.person.zip_code || '—'}</td><td>{item.active_need_count}</td><td>{item.referral_count}</td><td>{new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(new Date(item.updated_at))}</td><td><button className="table-link" onClick={() => navigate(`/admin/pasaportes/${item.id}`)}>{t.open}</button></td></tr>)}</tbody></table></div>}
  </section>;
}
