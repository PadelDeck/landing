#!/usr/bin/env node
'use strict'

const fs   = require('fs')
const path = require('path')

const BASE_URL = 'https://padeldeck.app'
const LANGS    = ['en', 'es']
const ROOT     = __dirname

const template = fs.readFileSync(path.join(ROOT, 'template.html'), 'utf8')

for (const lang of LANGS) {
  const t = JSON.parse(fs.readFileSync(path.join(ROOT, 'translations', `${lang}.json`), 'utf8'))

  let html = template

  // Replace all {{KEY}} placeholders with translated values
  for (const [key, val] of Object.entries(t)) {
    html = html.replaceAll(`{{${key}}}`, val)
  }

  // Constants not in translation files
  html = html.replaceAll('{{BASE_URL}}', BASE_URL)

  // Inject structured data
  html = html.replaceAll('{{META_JSONLD}}', buildJsonLd(t, lang))

  // Write output
  const outDir = lang === 'en' ? ROOT : path.join(ROOT, lang)
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8')
  console.log(`✓  ${lang === 'en' ? 'index.html' : `${lang}/index.html`}`)
}

// Sitemap
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), buildSitemap(), 'utf8')
console.log('✓  sitemap.xml')

// ── JSON-LD builder ──────────────────────────────────────────────────────────

function buildJsonLd(t, lang) {
  const featureLists = {
    en: [
      'Offline padel score tracking',
      'All official padel formats: best of 1, 3 or 5 sets',
      'Ventajas and Golden Point at deuce',
      'Tie-break and Super Tie-break',
      'Up to 20 undo levels per match',
      'Match history saved on watch',
      'Automatic serve rotation indicator',
      'Haptic feedback per point',
    ],
    es: [
      'Marcador de pádel offline',
      'Todos los formatos oficiales: al mejor de 1, 3 o 5 sets',
      'Ventajas y Golden Point en el deuce',
      'Tie-break y Super Tie-break',
      'Hasta 20 niveles de deshacer por partido',
      'Historial de partidos guardado en el reloj',
      'Indicador de rotación de saque automático',
      'Vibración táctil por punto',
    ],
  }

  const faqEntities = []
  for (let i = 1; i <= 6; i++) {
    faqEntities.push({
      '@type': 'Question',
      'name': t[`FAQ_${i}_Q`],
      'acceptedAnswer': { '@type': 'Answer', 'text': t[`FAQ_${i}_A`] },
    })
  }

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      'name': 'PadelDeck',
      'applicationCategory': 'SportsApplication',
      'applicationSubCategory': 'Sports & Fitness',
      'operatingSystem': 'Zepp OS 3',
      'description': t['META_DESCRIPTION'],
      'url': BASE_URL,
      'inLanguage': lang,
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'EUR',
        'availability': 'https://schema.org/ComingSoon',
      },
      'screenshot': [
        `${BASE_URL}/screenshots/padeldeck_home.png`,
        `${BASE_URL}/screenshots/padeldeck_score.png`,
        `${BASE_URL}/screenshots/padeldeck_gameWin.png`,
        `${BASE_URL}/screenshots/padeldeck_history.png`,
      ],
      'featureList': featureLists[lang],
      'softwareVersion': '1.0',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'PadelDeck',
      'url': BASE_URL,
      'logo': {
        '@type': 'ImageObject',
        'url': `${BASE_URL}/og-image.png`,
        'width': '1200',
        'height': '630',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqEntities,
    },
  ]

  return schemas
    .map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
    .join('\n  ')
}

// ── Sitemap builder ──────────────────────────────────────────────────────────

function buildSitemap() {
  const today = new Date().toISOString().split('T')[0]
  const alt = (hrefEn, hrefEs) => [
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${hrefEn}"/>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${hrefEn}"/>`,
    `    <xhtml:link rel="alternate" hreflang="es" href="${hrefEs}"/>`,
  ].join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${BASE_URL}/</loc>
${alt(`${BASE_URL}/`, `${BASE_URL}/es/`)}
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/es/</loc>
${alt(`${BASE_URL}/`, `${BASE_URL}/es/`)}
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`
}
