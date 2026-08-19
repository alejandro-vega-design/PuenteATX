import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const SITE_URL = 'https://puenteatx.org';

const loadLocalEnv = () => {
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach(line => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) return;
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  });
};

loadLocalEnv();

const escapeHtml = value => String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const escapeXml = escapeHtml;
const baseHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

const replaceHead = (html, { title, description, canonical, robots = 'index, follow', type = 'website', schema }) => {
  let output = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`)
    .replace(/<meta name="robots"[^>]*>/i, `<meta name="robots" content="${robots}">`)
    .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}">`)
    .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}">`)
    .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}">`)
    .replace(/<meta property="og:type"[^>]*>/i, `<meta property="og:type" content="${type}">`)
    .replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}">`)
    .replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(title)}">`)
    .replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(description)}">`);
  if (schema) output = output.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script></head>`);
  return output;
};

const writePage = (route, metadata, fallback = '') => {
  const filename = route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, `${route.replace(/^\//, '')}.html`);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const html = replaceHead(baseHtml, metadata).replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
  fs.writeFileSync(filename, html);
};

const staticPages = [
  ['/', 'Puente ATX | Recursos comunitarios en Austin', 'Encuentra recursos comunitarios de comida, vivienda, salud, transporte, educación y ayuda legal para familias del Centro de Texas.'],
  ['/recursos', 'Recursos para ti | Puente ATX', 'Busca y filtra recursos comunitarios disponibles para familias de Austin y el Centro de Texas.'],
  ['/buscador', 'Buscador de Recursos | Puente ATX', 'Encuentra recursos comunitarios cercanos por código postal y tipo de ayuda en el Centro de Texas.'],
  ['/quienes-somos', 'Quiénes somos | Puente ATX', 'Conoce el propósito de Puente ATX y cómo conectamos a familias de Austin y comunidades cercanas con recursos comunitarios.'],
  ['/privacidad', 'Política de privacidad | Puente ATX', 'Conoce cómo Puente ATX trata la información y protege la privacidad de sus visitantes.'],
  ['/terminos', 'Términos de uso | Puente ATX', 'Consulta los términos de uso del directorio comunitario Puente ATX.']
];

staticPages.forEach(([route, title, description]) => writePage(route, {
  title,
  description,
  canonical: `${SITE_URL}${route === '/' ? '' : route}`,
  schema: route === '/' ? { '@context': 'https://schema.org', '@type': 'Organization', name: 'Puente ATX', url: SITE_URL, logo: `${SITE_URL}/assets/puenteatx-logo-horizontal.svg`, areaServed: 'Central Texas' } : undefined
}));

[
  ['/conversacion', 'Hablemos | Puente ATX', 'Solicita una conversación gratuita y confidencial con el equipo de Puente ATX.'],
  ['/mi-lista', 'Mi lista de recursos | Puente ATX', 'Tu lista privada de recursos guardados en este navegador.'],
  ['/admin', 'Administración | Puente ATX', 'Acceso administrativo de Puente ATX.'],
  ['/admin/login', 'Acceso administrativo | Puente ATX', 'Inicio de sesión para el equipo administrativo de Puente ATX.']
].forEach(([route, title, description]) => writePage(route, {
  title,
  description,
  canonical: `${SITE_URL}${route}`,
  robots: 'noindex, nofollow'
}));

const fetchResources = async () => {
  const url = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const select = 'slug,organization_name,title_es,summary_es,description_es,service_area_es,phone,website_url,address_line_1,address_line_2,city,state,postal_code,updated_at';
  const response = await fetch(`${url}/rest/v1/resources?status=eq.published&select=${select}&order=updated_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
  return response.json();
};

let resources = [];
try {
  resources = await fetchResources();
} catch (error) {
  console.warn(`SEO resource generation skipped: ${error.message}`);
}

resources.forEach(resource => {
  const canonical = `${SITE_URL}/recursos/${encodeURIComponent(resource.slug)}`;
  const address = [resource.address_line_1, resource.address_line_2, resource.city, resource.state, resource.postal_code].filter(Boolean).join(', ');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: resource.title_es,
    description: resource.summary_es,
    url: canonical,
    provider: { '@type': 'Organization', name: resource.organization_name },
    ...(resource.service_area_es && { areaServed: resource.service_area_es }),
    ...(resource.phone && { telephone: resource.phone }),
    ...(resource.website_url && { sameAs: resource.website_url }),
    ...(address && { availableAtOrFrom: { '@type': 'Place', address } })
  };
  const fallback = `<main><article><h1>${escapeHtml(resource.title_es)}</h1><p>${escapeHtml(resource.organization_name)}</p><p>${escapeHtml(resource.summary_es)}</p>${resource.description_es ? `<p>${escapeHtml(resource.description_es)}</p>` : ''}</article></main>`;
  writePage(`/recursos/${resource.slug}`, {
    title: `${resource.title_es} | Puente ATX`,
    description: resource.summary_es,
    canonical,
    type: 'article',
    schema
  }, fallback);
});

const sitemapRoutes = [
  ...staticPages.map(([route]) => ({ route })),
  ...resources.map(resource => ({ route: `/recursos/${resource.slug}`, lastmod: resource.updated_at }))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes.map(({ route, lastmod }) => `  <url><loc>${escapeXml(`${SITE_URL}${route === '/' ? '' : route}`)}</loc>${lastmod ? `<lastmod>${escapeXml(new Date(lastmod).toISOString())}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /mi-lista\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`✓ SEO generated for ${resources.length} published resources`);
