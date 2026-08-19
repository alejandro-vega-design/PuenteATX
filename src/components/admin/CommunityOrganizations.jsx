import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addOrganizationUser, getActiveOrganizations, getOrganizationUsers } from '../../services/communityPassportRepository';

const roleLabels = {
  es: { admin: 'Administrador', navigator: 'Navegador', case_worker: 'Trabajador de casos', viewer: 'Lectura' },
  en: { admin: 'Administrator', navigator: 'Navigator', case_worker: 'Case worker', viewer: 'View only' }
};

const shortUserId = value => value ? `${value.slice(0, 8)}…` : '—';

function AddOrganizationUserDrawer({ open, organizations, lang, onClose, onSubmit, triggerRef }) {
  const es = lang === 'es';
  const [userId, setUserId] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [role, setRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const closeTimer = useRef(null);
  const drawerRef = useRef(null);
  const firstFieldRef = useRef(null);
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const valid = uuidPattern.test(userId.trim()) && organizationId && role;

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setClosing(false);
      closingRef.current = false;
      onClose();
      triggerRef.current?.focus();
    }, 280);
  }, [onClose, triggerRef]);

  useEffect(() => {
    if (!open) return undefined;
    closingRef.current = false;
    setUserId(''); setOrganizationId(''); setRole(''); setSubmitError(''); setClosing(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    const key = event => {
      if (event.key === 'Escape') requestClose();
      if (event.key !== 'Tab') return;
      const controls = [...drawerRef.current.querySelectorAll('button,input,select')].filter(item => !item.disabled);
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', key);
      window.clearTimeout(closeTimer.current);
    };
  }, [open, requestClose]);

  const submit = async event => {
    event.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true); setSubmitError('');
    try {
      await onSubmit({ organization_id: organizationId, user_id: userId.trim(), role, status: 'active' });
      requestClose();
    } catch {
      setSubmitError(es ? 'No pudimos añadir el usuario. Revisa el UID y vuelve a intentarlo.' : 'We could not add the user. Check the UID and try again.');
    } finally { setSubmitting(false); }
  };

  if (!open) return null;
  return <div className={`organization-drawer-overlay${closing ? ' is-closing' : ''}`} onMouseDown={event => event.target === event.currentTarget && requestClose()}>
    <aside ref={drawerRef} className="organization-drawer" role="dialog" aria-modal="true" aria-labelledby="organization-drawer-title">
      <header><div><h2 id="organization-drawer-title">{es ? 'Añadir usuario' : 'Add user'}</h2><p>{es ? 'Asigna una cuenta existente a una organización.' : 'Assign an existing account to an organization.'}</p></div><button type="button" className="organization-drawer-close" aria-label={es ? 'Cerrar' : 'Close'} onClick={requestClose}>×</button></header>
      <form onSubmit={submit}>
        <div className="organization-drawer-fields">
          <label>User UID <b aria-hidden="true">*</b><input ref={firstFieldRef} autoComplete="off" value={userId} onChange={event => setUserId(event.target.value)} placeholder="00000000-0000-0000-0000-000000000000" required/></label>
          <small>{es ? 'Crea primero la cuenta en Supabase Auth y copia aquí su UID.' : 'Create the account in Supabase Auth first and paste its UID here.'}</small>
          <label>{es ? 'Organización' : 'Organization'} <b aria-hidden="true">*</b><select value={organizationId} onChange={event => setOrganizationId(event.target.value)} required><option value="">{es ? 'Selecciona una organización' : 'Select an organization'}</option>{organizations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <small>{es ? 'El usuario tendrá acceso solamente según su organización y rol.' : 'The user will have access only according to their organization and role.'}</small>
          <label>{es ? 'Rol' : 'Role'} <b aria-hidden="true">*</b><select value={role} onChange={event => setRole(event.target.value)} required><option value="">{es ? 'Selecciona un rol' : 'Select a role'}</option>{Object.entries(roleLabels[lang]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <small>{es ? 'Usa el rol con los permisos mínimos que la persona necesita.' : 'Use the role with the minimum permissions the person needs.'}</small>
          <div className="organization-drawer-note"><span className="material-symbols-outlined" aria-hidden="true">info</span><p>{es ? 'Esta acción no crea una cuenta ni envía una invitación. La persona debe existir primero en Supabase Auth y configurar MFA antes de acceder a Pasaporte Digital.' : 'This action does not create an account or send an invitation. The person must already exist in Supabase Auth and configure MFA before accessing Community Passport.'}</p></div>
          {submitError && <p className="organization-drawer-error" role="status">{submitError}</p>}
        </div>
        <footer><button type="button" className="secondary-button" onClick={requestClose}>{es ? 'Cancelar' : 'Cancel'}</button><button className="primary-button" disabled={!valid || submitting}>{submitting ? (es ? 'Añadiendo…' : 'Adding…') : (es ? 'Añadir usuario' : 'Add user')}</button></footer>
      </form>
    </aside>
  </div>;
}

function EmptyState({ filtered, es, mobile = false }) {
  return <div className={mobile ? 'organization-access-empty-mobile' : 'organization-access-empty'}><span className="material-symbols-outlined" aria-hidden="true">group</span><h2>{filtered ? (es ? 'No encontramos usuarios' : 'No users found') : (es ? 'No hay usuarios' : 'No users yet')}</h2><p>{filtered ? (es ? 'Prueba otra búsqueda o selecciona otra organización.' : 'Try another search or select a different organization.') : (es ? 'Haz clic en “Añadir usuario” para agregar una persona al piloto.' : 'Click “Add user” to add someone to the pilot.')}</p></div>;
}

export default function CommunityOrganizations({ session, lang, notify }) {
  const es = lang === 'es';
  const [organizations, setOrganizations] = useState([]); const [members, setMembers] = useState([]);
  const [query, setQuery] = useState(''); const [organizationFilter, setOrganizationFilter] = useState('all');
  const [expanded, setExpanded] = useState({}); const [drawerOpen, setDrawerOpen] = useState(false);
  const [state, setState] = useState('loading'); const [error, setError] = useState('');
  const addUserTriggerRef = useRef(null);

  const load = useCallback(async () => {
    setState('loading'); setError('');
    try {
      const [orgs, users] = await Promise.all([getActiveOrganizations(session.access_token), getOrganizationUsers(session.access_token)]);
      setOrganizations(orgs); setMembers(users);
      setExpanded(current => orgs.reduce((result, item) => ({ ...result, [item.id]: current[item.id] ?? true }), {}));
      setState('ready');
    } catch { setError(es ? 'No pudimos cargar las organizaciones.' : 'We could not load organizations.'); setState('error'); }
  }, [es, session.access_token]);
  useEffect(() => { load(); }, [load]);

  const addUser = async values => {
    try { await addOrganizationUser(session.access_token, values); notify(es ? 'Usuario añadido a la organización.' : 'User added to organization.'); await load(); }
    catch (requestError) { setError(es ? 'No pudimos añadir el usuario. Confirma el UID y que no esté asignado a esa organización.' : 'We could not add the user. Confirm the UID and that it is not already assigned to that organization.'); throw requestError; }
  };

  const grouped = useMemo(() => organizations.filter(item => organizationFilter === 'all' || item.id === organizationFilter).map(organization => ({ organization, members: members.filter(member => member.organization_id === organization.id) })).filter(group => {
    const term = query.trim().toLowerCase();
    return !term || group.organization.name.toLowerCase().includes(term) || group.members.some(member => member.user_id.toLowerCase().includes(term) || roleLabels[lang][member.role]?.toLowerCase().includes(term));
  }).map(group => query.trim() && !group.organization.name.toLowerCase().includes(query.trim().toLowerCase()) ? { ...group, members: group.members.filter(member => member.user_id.toLowerCase().includes(query.trim().toLowerCase()) || roleLabels[lang][member.role]?.toLowerCase().includes(query.trim().toLowerCase())) } : group), [organizations, members, organizationFilter, query, lang]);
  const visibleMemberCount = grouped.reduce((total, group) => total + group.members.length, 0);
  const filtered = Boolean(query.trim()) || organizationFilter !== 'all';
  const toggleGroup = id => setExpanded(current => ({ ...current, [id]: !current[id] }));
  const memberRows = group => expanded[group.organization.id] && group.members.map(member => <tr className="organization-member-row" key={member.id}><td><span className="organization-member-indent"/><span className="sr-only">{group.organization.name}</span></td><td><span className="organization-user-avatar" aria-hidden="true">{member.user_id.slice(0, 2).toUpperCase()}</span><span><strong>{shortUserId(member.user_id)}</strong><small title={member.user_id}>{member.user_id}</small></span></td><td><span className={`organization-role${member.role === 'admin' ? ' organization-role-admin' : ''}`}>{roleLabels[lang][member.role] || member.role}</span></td><td><span className={`organization-member-status${member.status === 'active' ? ' is-active' : ''}`}><i aria-hidden="true"/>{member.status === 'active' ? (es ? 'Activo' : 'Active') : (es ? 'Inactivo' : 'Inactive')}</span></td></tr>);

  return <section className="community-page organization-access-page">
    <header className="admin-resource-header"><div><h1>{es ? 'Acceso de organizaciones' : 'Organization access'}</h1><p>{es ? 'Administra quién puede acceder al piloto de Pasaporte Digital.' : 'Manage who can access the Community Passport pilot.'}</p></div><button ref={addUserTriggerRef} className="primary-button admin-add-resource-button" onClick={() => setDrawerOpen(true)}><span aria-hidden="true">＋</span>{es ? 'Añadir usuario' : 'Add user'}</button></header>
    {error && <p className="admin-error" role="status">{error}</p>}
    <div className="organization-access-filters"><label><span className="sr-only">{es ? 'Buscar usuario u organización' : 'Search user or organization'}</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder={es ? 'Buscar por organización, rol o UID' : 'Search by organization, role, or UID'}/></label><label><span className="sr-only">{es ? 'Filtrar por organización' : 'Filter by organization'}</span><select value={organizationFilter} onChange={event => setOrganizationFilter(event.target.value)}><option value="all">{es ? 'Todas las organizaciones' : 'All organizations'}</option>{organizations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
    {state === 'loading' && <div className="organization-access-loading" aria-live="polite">{es ? 'Cargando usuarios…' : 'Loading users…'}</div>}
    {state === 'ready' && <><div className="organization-access-table-wrap"><table className="organization-access-table"><caption className="sr-only">{es ? 'Usuarios con acceso por organización' : 'Users with access by organization'}</caption><thead><tr><th>{es ? 'Organización' : 'Organization'}</th><th>User UID</th><th>{es ? 'Rol' : 'Role'}</th><th>{es ? 'Estado' : 'Status'}</th></tr></thead>{visibleMemberCount === 0 ? <tbody><tr className="organization-empty-row"><td colSpan="4"><EmptyState filtered={filtered} es={es}/></td></tr></tbody> : grouped.map(group => <tbody key={group.organization.id}><tr className="organization-group-row"><th colSpan="4"><button type="button" onClick={() => toggleGroup(group.organization.id)} aria-expanded={expanded[group.organization.id]}><span className="organization-building-icon material-symbols-outlined" aria-hidden="true">corporate_fare</span><span><strong>{group.organization.name}</strong><small>{group.members.length === 1 ? (es ? '1 usuario' : '1 user') : `${group.members.length} ${es ? 'usuarios' : 'users'}`}</small></span><span className="organization-group-chevron material-symbols-rounded" aria-hidden="true">expand_more</span></button></th></tr>{memberRows(group)}</tbody>)}</table></div>
      <div className="organization-access-mobile">{visibleMemberCount === 0 ? <EmptyState filtered={filtered} es={es} mobile/> : grouped.map(group => <article key={group.organization.id}><button className="organization-mobile-group" type="button" onClick={() => toggleGroup(group.organization.id)} aria-expanded={expanded[group.organization.id]}><span className="organization-building-icon material-symbols-outlined" aria-hidden="true">corporate_fare</span><span><strong>{group.organization.name}</strong><small>{group.members.length} {es ? 'usuarios' : 'users'}</small></span><span className="material-symbols-rounded" aria-hidden="true">expand_more</span></button>{expanded[group.organization.id] && <div>{group.members.map(member => <section key={member.id}><header><span className="organization-user-avatar" aria-hidden="true">{member.user_id.slice(0, 2).toUpperCase()}</span><span><strong>{shortUserId(member.user_id)}</strong><small>{member.user_id}</small></span></header><dl><div><dt>{es ? 'Rol' : 'Role'}</dt><dd>{roleLabels[lang][member.role]}</dd></div><div><dt>{es ? 'Estado' : 'Status'}</dt><dd>{member.status === 'active' ? (es ? 'Activo' : 'Active') : (es ? 'Inactivo' : 'Inactive')}</dd></div></dl></section>)}</div>}</article>)}</div></>}
    <AddOrganizationUserDrawer open={drawerOpen} organizations={organizations} lang={lang} triggerRef={addUserTriggerRef} onClose={() => setDrawerOpen(false)} onSubmit={addUser}/>
  </section>;
}
