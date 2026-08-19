import React from 'react';

export default function LegalPage({ content, updated, review }) {
  return <main className="legal-page"><article className="legal-container"><header><h1>{content.title}</h1><p className="legal-intro">{content.intro}</p><p className="legal-updated">{updated}</p></header>{review && <aside className="legal-review-note">{review}</aside>}<div className="legal-sections">{content.sections.map(section => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}</div></article></main>;
}
