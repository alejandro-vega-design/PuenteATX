import React, { useEffect, useRef } from 'react';
import { metricDefinitions } from '../../analytics/metrics';

export default function InsightsMethodology({ open, onClose, lang, t }) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const key = event => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const controls = [...dialogRef.current.querySelectorAll('button,[href]')];
        if (!controls.length) return;
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    closeRef.current?.focus();
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="admin-dialog-overlay insights-methodology-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section ref={dialogRef} className="admin-dialog insights-methodology" role="dialog" aria-modal="true" aria-labelledby="insights-methodology-title">
      <header><h2 id="insights-methodology-title">{t.methodologyTitle}</h2><button ref={closeRef} onClick={onClose} aria-label={t.close}>×</button></header>
      <p>{t.methodologyIntro}</p>
      <dl>{Object.values(metricDefinitions).map(metric => <div key={metric.en}><dt>{metric[lang]}</dt><dd><strong>{lang === 'es' ? 'Fórmula: ' : 'Formula: '}</strong>{metric.formula}<br/><strong>{lang === 'es' ? 'Limitación: ' : 'Limitation: '}</strong>{metric.limitation}</dd></div>)}</dl>
      <p>{t.contactLimitation}</p><p>{t.methodologyPrivacy}</p><p>{t.methodologyVercel}</p>
    </section>
  </div>;
}

