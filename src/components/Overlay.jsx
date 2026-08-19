import React from 'react';
import { CloseIcon } from './Icons';

export function Modal({ t, onClose }) {
  return <div className="overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <button className="close-button" onClick={onClose} aria-label={t.close}><CloseIcon/></button><h2 id="modal-title">{t.modalTitle}</h2><p>{t.modalBody}</p><button className="primary-button" autoFocus onClick={onClose}>{t.confirm}</button>
  </section></div>;
}

export function Drawer({ t, onClose }) {
  return <div className="overlay drawer-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
    <button className="close-button" onClick={onClose} aria-label={t.close}><CloseIcon/></button><h2 id="drawer-title">{t.saved}</h2><div className="empty-state"><strong>{t.emptyTitle}</strong><p>{t.emptyBody}</p></div>
  </aside></div>;
}
