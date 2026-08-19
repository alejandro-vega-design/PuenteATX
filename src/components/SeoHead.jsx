import { useEffect } from 'react';

export const SITE_URL = 'https://puenteatx.org';
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/assets/puenteatx-social-share-v2.png`;

const upsertMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
};

const upsertLink = (rel, href) => {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
};

export default function SeoHead({
  title,
  description,
  path = '/',
  lang = 'es',
  noindex = false,
  type = 'website',
  image = DEFAULT_SOCIAL_IMAGE,
  structuredData
}) {
  useEffect(() => {
    const canonical = `${SITE_URL}${path === '/' ? '' : path}`;
    document.title = title;
    document.documentElement.lang = lang;
    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
    upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width', content: '1200' });
    upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height', content: '630' });
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: lang === 'es' ? 'Logo de Puente ATX' : 'Puente ATX logo' });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: lang === 'es' ? 'es_US' : 'en_US' });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });
    upsertLink('canonical', canonical);

    let script = document.head.querySelector('script[data-puente-seo]');
    if (structuredData) {
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.dataset.puenteSeo = 'true';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData).replace(/</g, '\\u003c');
    } else if (script) {
      script.remove();
    }
  }, [description, image, lang, noindex, path, structuredData, title, type]);

  return null;
}
