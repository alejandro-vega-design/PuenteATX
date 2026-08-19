import React, { useEffect, useMemo, useState } from 'react';
import { beginTotpEnrollment, createTotpChallenge, getVerifiedTotpFactors, totpQrSource, verifyTotpChallenge } from '../../services/adminMfa';
import { validateAdminSession } from '../../services/adminAuth';

const copy = {
  es: {
    setupTitle: 'Protege tu cuenta', verifyTitle: 'Verifica tu identidad',
    setupBody: 'Escanea este código con una aplicación de autenticación. Después escribe el código de seis dígitos.',
    verifyBody: 'Escribe el código de seis dígitos de tu aplicación de autenticación para continuar.',
    manual: 'Clave para configuración manual', code: 'Código de verificación', verify: 'Continuar', logout: 'Cerrar sesión',
    loading: 'Preparando verificación…', error: 'No pudimos verificar el código. Revisa el código e intenta nuevamente.', qrAlt: 'Código QR para configurar la verificación en dos pasos', qrFallback: 'Si el código QR no aparece, añade la cuenta manualmente usando la clave de abajo.'
  },
  en: {
    setupTitle: 'Protect your account', verifyTitle: 'Verify your identity',
    setupBody: 'Scan this code with an authenticator app. Then enter the six-digit code.',
    verifyBody: 'Enter the six-digit code from your authenticator app to continue.',
    manual: 'Manual setup key', code: 'Verification code', verify: 'Continue', logout: 'Sign out',
    loading: 'Preparing verification…', error: 'We could not verify that code. Check it and try again.', qrAlt: 'QR code for setting up two-step verification', qrFallback: 'If the QR code does not appear, add the account manually using the key below.'
  }
};

export default function AdminMfaGate({ session, lang, onVerified, onLogout }) {
  const t = copy[lang] || copy.es;
  const verifiedFactor = useMemo(() => getVerifiedTotpFactors(session)[0], [session]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(!verifiedFactor);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [qrFailed, setQrFailed] = useState(false);

  useEffect(() => {
    if (verifiedFactor) return undefined;
    let active = true;
    beginTotpEnrollment(session).then(value => active && setEnrollment(value)).catch(() => active && setError(t.error)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [session, verifiedFactor, t.error]);

  const submit = async event => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) { setError(t.error); return; }
    setSubmitting(true); setError('');
    try {
      const factorId = verifiedFactor?.id || enrollment?.id;
      const challenge = await createTotpChallenge(session, factorId);
      const upgraded = await verifyTotpChallenge(session, factorId, challenge.id, code);
      onVerified(await validateAdminSession(upgraded));
    } catch {
      setError(t.error);
      setCode('');
    } finally { setSubmitting(false); }
  };

  const isSetup = !verifiedFactor;
  return <main className="admin-mfa-page">
    <section className="admin-mfa-card" aria-labelledby="mfa-title">
      <img className="admin-mfa-logo" src="/assets/puenteatx-logo-horizontal.svg" alt="Puente ATX"/>
      <h1 id="mfa-title">{isSetup ? t.setupTitle : t.verifyTitle}</h1>
      <p>{isSetup ? t.setupBody : t.verifyBody}</p>
      {loading ? <p aria-live="polite">{t.loading}</p> : <form onSubmit={submit}>
        {isSetup && enrollment?.totp && <div className="admin-mfa-setup">
          {!qrFailed && totpQrSource(enrollment.totp.qr_code) && <img src={totpQrSource(enrollment.totp.qr_code)} alt={t.qrAlt} onError={() => setQrFailed(true)}/>}
          {(qrFailed || !totpQrSource(enrollment.totp.qr_code)) && <p className="admin-mfa-qr-fallback">{t.qrFallback}</p>}
          <div><span>{t.manual}</span><code>{enrollment.totp.secret}</code></div>
        </div>}
        <label htmlFor="admin-mfa-code">{t.code}</label>
        <input id="admin-mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength="6" pattern="[0-9]{6}" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}/>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={submitting || !enrollment && isSetup}>{t.verify}</button>
      </form>}
      <button className="text-button" type="button" onClick={onLogout}>{t.logout}</button>
    </section>
  </main>;
}
