import React, { useCallback, useEffect, useRef, useState } from 'react';
import { adminCopy } from '../../data';
import { getAdminResources, isDemoMode } from '../../data/repository';
import { ADMIN_SESSION_EXPIRED_EVENT, clearAdminSession, expireAdminSession, getAdminSession, validateAdminSession } from '../../services/adminAuth';
import AdminCategories from './AdminCategories';
import AdminDashboard from './AdminDashboard';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import AdminResourceForm from './AdminResourceForm';
import AdminResourceImport from './AdminResourceImport';
import AdminResources from './AdminResources';
import AdminInsights from './AdminInsights';
import AdminMfaGate from './AdminMfaGate';
import CommunityPassportList from './CommunityPassportList';
import CommunityPassportCreate from './CommunityPassportCreate';
import CommunityPassportDetail from './CommunityPassportDetail';
import CommunityReferralList from './CommunityReferralList';
import CommunityReferralDetail from './CommunityReferralDetail';
import CommunityOrganizations from './CommunityOrganizations';
import StatusToast from '../StatusToast';
import { canCreatePassport, canManageOrganization, canViewInsights, canWorkReferrals, hasCommunityAccess } from '../../services/adminPermissions';
import { requiresAdminMfa } from '../../services/adminMfa';

export default function AdminApp({ path, locationSearch, lang, setLang, navigate }) {
  const [session, setSession] = useState(null); const [sessionReady, setSessionReady] = useState(false); const [resources, setResources] = useState([]); const [loading, setLoading] = useState(true); const [toast, setToast] = useState(null); const t = adminCopy[lang];
  const hasLoadedResources = useRef(false); const refreshInFlight = useRef(null); const sessionValidationInFlight = useRef(null);
  const notify = useCallback(message => setToast({ id: Date.now(), message }), []);
  const closeToast = useCallback(() => setToast(null), []);
  const refresh = useCallback(() => {
    if (!session || requiresAdminMfa(session) || !['admin', 'editor'].includes(session.profile?.role)) { setLoading(false); return Promise.resolve(); }
    if (refreshInFlight.current) return refreshInFlight.current;
    if (!hasLoadedResources.current) setLoading(true);
    const request = getAdminResources().then(setResources).finally(() => {
      hasLoadedResources.current = true;
      setLoading(false);
      if (refreshInFlight.current === request) refreshInFlight.current = null;
    });
    refreshInFlight.current = request;
    return request;
  }, [session]);
  useEffect(() => { let active = true; validateAdminSession(getAdminSession()).then(value => active && setSession(value)).catch(() => { clearAdminSession(); }).finally(() => active && setSessionReady(true)); return () => { active = false; }; }, []);
  const revalidateCurrentSession = useCallback(() => {
    if (sessionValidationInFlight.current) return sessionValidationInFlight.current;
    const stored = getAdminSession();
    if (!stored) {
      setSession(null);
      return Promise.resolve(null);
    }
    const request = validateAdminSession(stored, {
      forceRefresh: Boolean(stored.refresh_token && stored.expires_at && stored.expires_at * 1000 <= Date.now() + 60000)
    }).then(value => {
      setSession(value);
      return value;
    }).catch(() => {
      expireAdminSession();
      setSession(null);
      return null;
    }).finally(() => {
      if (sessionValidationInFlight.current === request) sessionValidationInFlight.current = null;
    });
    sessionValidationInFlight.current = request;
    return request;
  }, []);
  useEffect(() => {
    if (!session?.refresh_token || !session.expires_at) return undefined;
    const delay = Math.max(1000, session.expires_at * 1000 - Date.now() - 60000);
    const timer = window.setTimeout(revalidateCurrentSession, delay);
    return () => window.clearTimeout(timer);
  }, [session, revalidateCurrentSession]);
  useEffect(() => {
    const onReturn = () => { if (document.visibilityState !== 'hidden') revalidateCurrentSession(); };
    const onExpired = () => setSession(null);
    window.addEventListener('focus', onReturn);
    window.addEventListener('pageshow', onReturn);
    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, onExpired);
    document.addEventListener('visibilitychange', onReturn);
    return () => {
      window.removeEventListener('focus', onReturn);
      window.removeEventListener('pageshow', onReturn);
      window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, onExpired);
      document.removeEventListener('visibilitychange', onReturn);
    };
  }, [revalidateCurrentSession]);
  useEffect(() => { refresh(); }, [refresh, path]);
  useEffect(() => { if (!sessionReady) return; if (path === '/admin/login' && session) navigate('/admin', { replace: true }); else if (path !== '/admin/login' && !session) navigate('/admin/login', { replace: true }); }, [path, session, sessionReady, navigate]);
  if (!sessionReady) return <main className="admin-loading">{lang === 'es' ? 'Comprobando sesión…' : 'Checking session…'}</main>;
  if (path === '/admin/login') return session ? null : <AdminLogin t={t} onSuccess={value => { setSession(value); navigate('/admin'); }} onPublic={() => navigate('/')}/>;
  if (!session) return null;
  const logout = () => { clearAdminSession(); setSession(null); navigate('/admin/login', { replace: true }); };
  if (requiresAdminMfa(session)) return <AdminMfaGate session={session} lang={lang} onVerified={setSession} onLogout={logout}/>;
  const canAdmin = session.profile?.role === 'admin';
  let page;
  if (loading) page = <p>{lang === 'es' ? 'Cargando…' : 'Loading…'}</p>;
  else if (path === '/admin' && ['admin', 'editor'].includes(session.profile?.role)) page = <AdminDashboard t={t} resources={resources} demo={isDemoMode} navigate={navigate}/>;
  else if (path === '/admin' && hasCommunityAccess(session.profile)) page = <CommunityPassportList session={session} lang={lang} navigate={navigate}/>;
  else if (path === '/admin/recursos') page = <AdminResources t={t} lang={lang} resources={resources} refresh={refresh} navigate={navigate} notify={notify} canDeletePermanently={canAdmin} initialReview={new URLSearchParams(locationSearch).get('revision') === '1'} locationSearch={locationSearch}/>;
  else if (path === '/admin/recursos/importar') page = <AdminResourceImport t={t} existingResources={resources} refresh={refresh} navigate={navigate} notify={notify}/>;
  else if (path === '/admin/recursos/nuevo') page = <AdminResourceForm t={t} navigate={navigate} notify={notify}/>;
  else if (/^\/admin\/recursos\/[^/]+\/editar$/.test(path)) { const id = path.split('/')[3]; page = <AdminResourceForm key={id} t={t} resource={resources.find(item => item.id === id)} resources={resources} navigate={navigate} notify={notify} locationSearch={locationSearch}/>; }
  else if (path === '/admin/categorias' && canAdmin) page = <AdminCategories t={t} notify={notify}/>;
  else if (path === '/admin/insights' && canViewInsights(session.profile)) page = <AdminInsights lang={lang} locationSearch={locationSearch} navigate={navigate}/>;
  else if (path === '/admin/insights') page = <section className="admin-error-state"><h1>{lang === 'es' ? 'Acceso denegado' : 'Access denied'}</h1><p>{lang === 'es' ? 'Tu cuenta no tiene permiso para ver Insights.' : 'Your account does not have permission to view Insights.'}</p></section>;
  else if (path === '/admin/pasaportes' && hasCommunityAccess(session.profile)) page = <CommunityPassportList session={session} lang={lang} navigate={navigate}/>;
  else if (path === '/admin/pasaportes/nuevo' && canCreatePassport(session.profile)) page = <CommunityPassportCreate session={session} lang={lang} navigate={navigate} notify={notify}/>;
  else if (/^\/admin\/pasaportes\/[^/]+$/.test(path) && hasCommunityAccess(session.profile)) page = <CommunityPassportDetail id={path.split('/')[3]} session={session} lang={lang} navigate={navigate} notify={notify}/>;
  else if (path === '/admin/referidos' && canWorkReferrals(session.profile)) page = <CommunityReferralList session={session} lang={lang} navigate={navigate}/>;
  else if (/^\/admin\/referidos\/[^/]+$/.test(path) && canWorkReferrals(session.profile)) page = <CommunityReferralDetail id={path.split('/')[3]} session={session} lang={lang} navigate={navigate} notify={notify}/>;
  else if (path === '/admin/organizaciones' && canManageOrganization(session.profile)) page = <CommunityOrganizations session={session} lang={lang} notify={notify}/>;
  else if (path.startsWith('/admin/pasaportes') || path.startsWith('/admin/referidos')) page = <section className="admin-error-state"><h1>{lang === 'es' ? 'Acceso denegado' : 'Access denied'}</h1><p>{lang === 'es' ? 'Tu cuenta no pertenece a una organización autorizada.' : 'Your account does not belong to an authorized organization.'}</p></section>;
  else page = <AdminDashboard t={t} resources={resources} demo={isDemoMode} navigate={navigate}/>;
  return <AdminLayout t={t} lang={lang} path={path} onLanguage={() => setLang(lang === 'es' ? 'en' : 'es')} onNavigate={navigate} onLogout={logout} canAdmin={canAdmin} canViewInsights={canViewInsights(session.profile)} canCommunity={hasCommunityAccess(session.profile)} canManageCommunity={canManageOrganization(session.profile)}>{page}<StatusToast toast={toast} onClose={closeToast} closeLabel={t.closeNotification}/></AdminLayout>;
}
