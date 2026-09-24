import React, { useEffect, useId, useRef, useState } from 'react';
import { reportCopy } from '../data';
import { submitResourceFlag } from '../services/resourceFlags';
import { trackPuenteEvent } from '../analytics/client';
import { CloseIcon } from './Icons';

const REASON_KEYS = ['wrong_contact', 'closed', 'wrong_hours', 'outdated', 'other'];

export default function ReportResourceDialog({ open, resource, categorySlug, lang, onClose, onSubmitted }) {
  const t = reportCopy[lang];
  const titleId = useId();
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const [reasons, setReasons] = useState([]);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setReasons([]); setNote(''); setSending(false); setError(''); }
  }, [open, resource?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKeyDown = event => {
      if (event.key === 'Escape' && !sending) onClose();
      if (event.key !== 'Tab') return;
      const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    cancelRef.current?.focus();
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.isConnected && previous.focus(); };
  }, [open, sending, onClose]);

  if (!open || !resource) return null;

  const toggleReason = key => setReasons(current => { setError(''); return current.includes(key) ? current.filter(value => value !== key) : [...current, key]; });

  const submit = async () => {
    if (reasons.length === 0) { setError(t.errorReasons); return; }
    setSending(true); setError('');
    try {
      await submitResourceFlag({ resourceId: resource.id, reasons, note, lang });
      trackPuenteEvent('resource_flag_submitted', { resource_id: resource.id, category_slug: categorySlug });
      onSubmitted(t.confirmation);
      onClose();
    } catch {
      setError(t.sendError);
      setSending(false);
    }
  };

  return <div className="confirm-dialog-overlay" onMouseDown={event => event.target === event.currentTarget && !sending && onClose()}>
    <section ref={dialogRef} className="report-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button ref={cancelRef} className="close-button" disabled={sending} onClick={onClose} aria-label={t.close}><CloseIcon/></button>
      <h2 id={titleId}>{t.title}</h2>
      <fieldset className="form-section">
        <legend>{t.reasonsLegend}</legend>
        <p className="field-hint">{t.multiple}</p>
        <div className="report-reasons">{REASON_KEYS.map(key => <label key={key} className={`form-choice${reasons.includes(key) ? ' is-selected' : ''}`}>
          <input type="checkbox" checked={reasons.includes(key)} onChange={() => toggleReason(key)}/><span>{t.reasons[key]}</span>
        </label>)}</div>
        {error && <p className="field-error" role="alert"><b aria-hidden="true">!</b><span>{error}</span></p>}
      </fieldset>
      <div className="form-section">
        <label htmlFor="report-note">{t.noteLabel}</label>
        <textarea id="report-note" rows="3" placeholder={t.notePlaceholder} value={note} onChange={event => setNote(event.target.value)}/>
      </div>
      <div className="report-dialog-actions">
        <button className="secondary-button" disabled={sending} onClick={onClose}>{t.cancel}</button>
        <button className="primary-button" disabled={sending} onClick={submit}>{sending ? t.submitting : t.submit}</button>
      </div>
    </section>
  </div>;
}
