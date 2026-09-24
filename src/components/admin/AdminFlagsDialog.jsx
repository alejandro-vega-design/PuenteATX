import React, { useEffect, useState } from 'react';
import { getResourceFlags, updateResourceFlagStatus } from '../../data/repository';
import { CloseIcon } from '../Icons';

const STATUS_OPTIONS = ['open', 'reviewing', 'resolved', 'dismissed'];

export default function AdminFlagsDialog({ resource, t, lang, onClose, onChanged }) {
  const [flags, setFlags] = useState(null);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let active = true;
    setFlags(null);
    getResourceFlags(resource.id).then(rows => active && setFlags(rows)).catch(() => active && setFlags([]));
    return () => { active = false; };
  }, [resource.id]);

  const changeStatus = async (flagId, status) => {
    setSavingId(flagId);
    setError('');
    try {
      await updateResourceFlagStatus(flagId, status);
      setFlags(current => current.map(flag => flag.id === flagId ? { ...flag, status } : flag));
      onChanged?.();
    } catch {
      setError(t.flagStatusUpdateError);
    } finally {
      setSavingId(null);
    }
  };

  return <div className="confirm-dialog-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="report-dialog admin-flags-dialog" role="dialog" aria-modal="true">
      <button className="close-button" onClick={onClose} aria-label={t.flagsClose}><CloseIcon/></button>
      <h2>{t.flagsListTitle}</h2>
      {flags === null && <p>…</p>}
      {flags?.length === 0 && <p>{t.flagsListEmpty}</p>}
      {flags?.length > 0 && <ul className="admin-flags-list">{flags.map(flag => <li key={flag.id}>
        <p className="admin-flags-reasons">{flag.reasons.map(reason => t.flagReasonLabel(reason)).join(' · ')}</p>
        {flag.note && <p className="admin-flags-note"><strong>{t.flagNote}:</strong> {flag.note}</p>}
        {flag.area_code && <p className="admin-flags-area">{t.flagArea}: {flag.area_code}</p>}
        <p className="admin-flags-date">{t.flagReported(new Intl.DateTimeFormat(lang === 'es' ? 'es-US' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(flag.created_at)))}</p>
        <label className="admin-flags-status"><span className="sr-only">{t.flagChangeStatus}</span>
          <select value={flag.status} disabled={savingId === flag.id} onChange={event => changeStatus(flag.id, event.target.value)}>
            {STATUS_OPTIONS.map(status => <option key={status} value={status}>{t[`flagStatus${status[0].toUpperCase()}${status.slice(1)}`]}</option>)}
          </select>
        </label>
      </li>)}</ul>}
      {error && <p className="field-error" role="alert"><b aria-hidden="true">!</b><span>{error}</span></p>}
    </section>
  </div>;
}
