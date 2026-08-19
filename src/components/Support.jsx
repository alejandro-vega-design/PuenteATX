import React from 'react';
import { ChatIcon } from './Icons';

export default function Support({ t, onReserve }) {
  return <section className="support-section" aria-labelledby="support-title"><div className="narrow-container">
    <ChatIcon/><p className="eyebrow">{t.confidential}</p><h2 id="support-title">{t.supportTitle}</h2><p>{t.supportBody}</p>
    <button className="primary-button" onClick={onReserve}>{t.reserve}</button>
  </div></section>;
}
