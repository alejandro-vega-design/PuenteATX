import React from 'react';

export default function ImportantNotice({ title, text }) {
  return <aside className="important-notice narrow-container" aria-labelledby="important-notice-title">
    <img src="/assets/icons/info.svg" alt="" aria-hidden="true"/>
    <div><h2 id="important-notice-title">{title}</h2><p>{text}</p></div>
  </aside>;
}
