import React, { useEffect, useId, useRef } from 'react';

export default function ConfirmDialog({ open, title, description, cancelLabel, confirmLabel, onCancel, onConfirm, busy = false }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKeyDown = event => {
      if (event.key === 'Escape' && !busy) onCancel();
      if (event.key !== 'Tab') return;
      const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled)')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.isConnected && previous.focus();
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-dialog-overlay" onMouseDown={event => event.target === event.currentTarget && !busy && onCancel()}>
      <section ref={dialogRef} className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        {description && <p>{description}</p>}
        <div className="confirm-dialog-actions">
          <button ref={cancelRef} className="secondary-button" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
          <button className="danger-button" disabled={busy} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
