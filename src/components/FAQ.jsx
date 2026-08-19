import React, { useState } from 'react';
import ImportantNotice from './ImportantNotice';

export default function FAQ({ t, faqs, lang, noticeTitle, noticeText }) {
  const [openItems, setOpenItems] = useState(() => new Set([0]));
  const toggleItem = index => {
    const scrollPosition = window.scrollY;
    setOpenItems(current => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    requestAnimationFrame(() => window.scrollTo({ top: scrollPosition, behavior: 'auto' }));
  };
  return <section className="faq-section" aria-labelledby="faq-title">
    <div className="narrow-container">
      <h2 id="faq-title">{t.faqTitle}</h2><p className="faq-intro">{t.faqIntro}</p>
      <div className="accordion">
        {faqs.map((faq, index) => { const expanded = openItems.has(index); const id = `faq-panel-${index}`; return <div className="faq-item" key={faq.q.es}>
          <h3><button aria-expanded={expanded} aria-controls={id} onClick={() => toggleItem(index)}><span>{faq.q[lang]}</span><span className="plus" aria-hidden="true">{expanded ? '−' : '+'}</span></button></h3>
          <div className="faq-answer" id={id} hidden={!expanded}><p>{faq.a[lang]}</p></div>
        </div>; })}
      </div>
    </div>
    <ImportantNotice title={noticeTitle} text={noticeText}/>
  </section>;
}
