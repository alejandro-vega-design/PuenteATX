import React from 'react';

export default function AboutPage({ content }) {
  return <main className="about-page">
    <article className="about-page-container">
      <header>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
      </header>
      <div className="about-page-sections">
        {content.sections.map(section => <section key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        </section>)}
      </div>
    </article>
  </main>;
}
