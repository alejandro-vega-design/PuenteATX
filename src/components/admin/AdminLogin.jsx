import React, { useState } from 'react';
import { saveAdminSession, signInAdmin } from '../../services/adminAuth';

export default function AdminLogin({ t, onSuccess, onPublic }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const submit = async event => { event.preventDefault(); setLoading(true); setError(''); try { const session = await signInAdmin(email, password); saveAdminSession(session); onSuccess(session); } catch { setError(t.invalidLogin); } finally { setLoading(false); } };
  return <main className="admin-login"><form onSubmit={submit}><img src="/assets/puenteatx-logo-horizontal.svg" alt="Puente ATX"/><h1>{t.loginTitle}</h1>{error && <p className="admin-error" role="alert">{error}</p>}<label>{t.email}<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)}/></label><label>{t.password}<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)}/></label><button className="primary-button" disabled={loading}>{loading ? t.signingIn : t.signIn}</button><button type="button" className="text-button" onClick={onPublic}>{t.publicSite}</button></form></main>;
}
