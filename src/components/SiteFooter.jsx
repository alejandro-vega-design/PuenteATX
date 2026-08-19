import React from 'react';

export default function SiteFooter({ t, navigate }) {
  const link = path => event => { event.preventDefault(); navigate(path); };
  const year = new Date().getFullYear();
  return <footer className="site-footer"><nav aria-label={t.footerLinksLabel}><a href="/quienes-somos" onClick={link('/quienes-somos')}>{t.aboutUs}</a><a href="/privacidad" onClick={link('/privacidad')}>{t.privacyPolicy}</a><a href="/terminos" onClick={link('/terminos')}>{t.termsOfUse}</a></nav><p>{t.copyright(year)}</p></footer>;
}
