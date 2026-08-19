import React from 'react';
import { ChevronRightIcon } from './Icons';

export default function AboutOverview({ t, onLearnMore }) {
  return <section className="about-overview" aria-labelledby="about-overview-title">
    <div className="about-overview-inner site-container">
      <div className="about-overview-intro">
        <span className="about-overview-mark" aria-hidden="true"/>
        <h2 id="about-overview-title">{t.aboutTitle}</h2>
        <p>{t.aboutIntro}</p>
      </div>
      <a className="about-overview-link" href="/quienes-somos" onClick={event => { event.preventDefault(); onLearnMore?.(); }}>
        {t.aboutLink}<ChevronRightIcon/>
      </a>
    </div>
  </section>;
}
