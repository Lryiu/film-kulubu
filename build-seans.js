// build-seans.js — Vercel her yayında (deploy) bunu otomatik çalıştırır.
// data/seanslar.json'daki her yayındaki seans için /seans/<film-adi>/index.html
// sayfası ve sitemap.xml üretir. Elle bir şey yapmana gerek yok:
// kulup-giris.html'den seans eklediğinde sayfalar kendiliğinden oluşur.
const fs = require('fs');
const path = require('path');

const SITE = 'https://film.lryiu.com';
const SPOTIFY = 'https://open.spotify.com/show/1GaFAqQgvZM0wSgx0Sr8Cq';
const PERSON = { '@type': 'Person', '@id': 'https://lryiu.com/#person', name: 'Gamze Güçkıran Chartrand Cossette', alternateName: 'Lryiu', url: 'https://lryiu.com/' };
const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const ROOT = __dirname;

const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonLd = (o) => JSON.stringify(o, null, 2).replace(/<\//g, '<\\/');
const fmtTarih = (iso) => { const p = String(iso || '').split('-'); return p.length === 3 ? `${parseInt(p[2], 10)} ${AY[parseInt(p[1], 10) - 1]} ${p[0]}` : (iso || ''); };
const isoDate = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d : '');

// index.html'deki seansSlug ile birebir aynı olmalı
function slugify(t) {
  return String(t || '').toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}
function slugMap(list) {
  const map = {}, used = {};
  list.slice().sort((a, b) => a.no - b.no).forEach((s) => {
    let slug = slugify(s.baslik) || ('seans-' + s.no);
    if (used[slug]) slug = slug + '-' + s.no;
    used[slug] = true; map[s.no] = slug;
  });
  return map;
}
function kisa(html, n = 155) {
  const t = String(html || '').replace(/<\/?(b|i|em|strong|a|span|u)(\s[^>]*)?>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
  if (t.length <= n) return t;
  const c = t.slice(0, n - 1), sp = c.lastIndexOf(' ');
  return (sp > 80 ? c.slice(0, sp) : c).replace(/[\s,;:.–—-]+$/, '') + '…';
}
// Google'ın küçük önizleme görselleri paylaşım kartı için çok küçük: onlarda site kartını kullan
const ogImage = (u) => (u && /^https:\/\//.test(u) && !/gstatic\.com|encrypted-tbn/.test(u) ? u : SITE + '/og-image.jpg');

const SHARE_JS = `(function(){
  var box = document.querySelector(".share"); if(!box) return;
  var url = box.getAttribute("data-url"), title = box.getAttribute("data-title");
  var st = box.querySelector(".share-status"), nat = box.querySelector("[data-act=native]");
  function say(m){ st.textContent = m; clearTimeout(say.t); say.t = setTimeout(function(){ st.textContent = ""; }, 3500); }
  if (navigator.share) nat.hidden = false;
  nat.addEventListener("click", function(){ navigator.share({ title: title, url: url }).catch(function(e){ if(e && e.name !== "AbortError") say("Paylaşılamadı, linki kopyalayabilirsin."); }); });
  function yedek(){ var ta = document.createElement("textarea"); ta.value = url; ta.setAttribute("readonly",""); ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); var ok = false; try{ ok = document.execCommand("copy"); }catch(e){} document.body.removeChild(ta); say(ok ? "Link kopyalandı." : "Kopyalanamadı — adres çubuğundan kopyalayabilirsin."); }
  box.querySelector("[data-act=copy]").addEventListener("click", function(){ if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(function(){ say("Link kopyalandı."); }, yedek); else yedek(); });
})();`;

function page(s, slug, prev, next, slugs) {
  const url = `${SITE}/seans/${slug}/`;
  const baslik = s.altBaslik ? `${s.baslik}: ${s.altBaslik}` : s.baslik;
  const title = `${baslik} — MESAFE Seans Defteri`;
  const desc = kisa(s.metin) || kisa(`${s.baslik} filmi üzerine MESAFE Film Kulübü seansı.`);
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article', headline: baslik, description: desc, url, mainEntityOfPage: url, inLanguage: 'tr',
        datePublished: isoDate(s.tarih) || undefined, image: ogImage(s.gorselUrl),
        about: { '@type': 'Movie', name: s.baslik, director: s.yonetmen ? { '@type': 'Person', name: s.yonetmen } : undefined },
        author: PERSON, publisher: { '@id': PERSON['@id'] },
        isPartOf: { '@type': 'WebSite', name: 'MESAFE Seans Defteri', url: SITE + '/' },
        associatedMedia: s.podcastUrl ? { '@type': 'PodcastEpisode', url: s.podcastUrl, partOfSeries: { '@type': 'PodcastSeries', name: 'Mesafe Film Kulübü', url: SPOTIFY } } : undefined,
      },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'MESAFE Seans Defteri', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: s.baslik, item: url },
      ] },
    ],
  };
  const nav = (prev || next) ? `<nav class="seans-nav" aria-label="Diğer seanslar">
    ${prev ? `<a href="/seans/${slugs[prev.no]}/"><span class="lbl">← Önceki seans</span><span class="ttl">№ ${String(prev.no).padStart(3, '0')} · ${esc(prev.baslik)}</span></a>` : '<span></span>'}
    ${next ? `<a class="nx" href="/seans/${slugs[next.no]}/"><span class="lbl">Sonraki seans →</span><span class="ttl">№ ${String(next.no).padStart(3, '0')} · ${esc(next.baslik)}</span></a>` : '<span></span>'}
  </nav>` : '';
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0E1417">
<meta property="og:type" content="article">
<meta property="og:site_name" content="MESAFE Seans Defteri">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(ogImage(s.gorselUrl))}">
<meta property="og:locale" content="tr_TR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(ogImage(s.gorselUrl))}">
<script type="application/ld+json">
${jsonLd(ld)}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,400;1,9..144,500&family=Newsreader:ital,wght@0,400;0,500;1,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#0E1417; --ink-2:#161F24; --cream:#EDE7D8; --cream-dim:#B9B2A0;
    --amber:#E4A23E; --moss:#5C7A67; --rule:rgba(237,231,216,0.14); --rule-strong:rgba(237,231,216,0.28);
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  body{background:var(--ink); color:var(--cream); font-family:'Newsreader', serif; -webkit-font-smoothing:antialiased;}
  a{color:var(--amber); text-decoration:none;}
  .wrap{max-width:720px; margin:0 auto; padding:0 32px;}
  nav.top{position:sticky; top:0; z-index:100; background:rgba(14,20,23,0.9); backdrop-filter:blur(10px); border-bottom:1px solid var(--rule);}
  nav.top .inner{max-width:720px; margin:0 auto; padding:0 32px; height:76px; display:flex; align-items:center; justify-content:space-between; gap:16px;}
  .wordmark{font-family:'Fraunces', serif; font-size:20px; font-weight:600; color:var(--cream);}
  .wordmark em{color:var(--amber); font-style:italic; font-weight:500;}
  .back{font-family:'Space Mono', monospace; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; white-space:nowrap;}
  main{padding:64px 0 100px;}
  .seans-no{font-family:'Space Mono', monospace; font-size:12px; letter-spacing:0.1em; color:var(--moss);}
  h1{font-family:'Fraunces', serif; font-weight:500; font-size:clamp(30px,4vw,46px); line-height:1.1; margin-top:14px;}
  .meta{display:flex; flex-wrap:wrap; gap:10px 24px; font-family:'Space Mono', monospace; font-size:12px; color:var(--cream-dim); margin-top:22px; padding:18px 0; border-top:1px solid var(--rule); border-bottom:1px solid var(--rule);}
  .meta b{color:var(--cream); font-weight:400;}
  .poster{width:100%; max-height:360px; object-fit:cover; object-position:center 20%; border-radius:2px; border:1px solid var(--rule); margin-bottom:8px; display:block;}
  .podcast{margin-top:28px; padding:18px 20px; background:var(--ink-2); border:1px solid var(--rule); border-radius:2px; font-family:'Space Mono', monospace; font-size:12px; word-break:break-all; overflow-wrap:anywhere; line-height:1.7;}
  .body-text{margin-top:36px; font-size:18px; line-height:1.8; color:var(--cream);}
  .body-text p{margin-bottom:20px;}
  .share{display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:20px; padding-top:26px; border-top:1px solid var(--rule);}
  .share-btn{font-family:'Space Mono', monospace; font-size:12px; letter-spacing:0.06em; text-transform:uppercase; min-height:44px; padding:0 20px; border-radius:2px; border:1px solid var(--rule-strong); background:none; color:var(--cream); cursor:pointer; white-space:nowrap; transition:all .2s;}
  .share-btn:hover{border-color:var(--amber); color:var(--amber);}
  .share-btn[hidden]{display:none;}
  .share-status{font-family:'Space Mono', monospace; font-size:11px; color:var(--cream-dim); min-height:1em;}
  .seans-nav{display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-top:44px;}
  .seans-nav a{flex:1 1 220px; display:flex; flex-direction:column; gap:6px; padding:16px 18px; border:1px solid var(--rule); border-radius:2px; color:var(--cream-dim); background:var(--ink-2); transition:border-color .2s;}
  .seans-nav a:hover{border-color:var(--amber);}
  .seans-nav .nx{text-align:right;}
  .seans-nav .lbl{font-family:'Space Mono', monospace; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:var(--moss);}
  .seans-nav .ttl{font-family:'Fraunces', serif; font-size:17px; color:var(--cream); overflow-wrap:anywhere;}
  footer{border-top:1px solid var(--rule); padding:36px 0 40px; font-family:'Space Mono', monospace; font-size:11px; letter-spacing:0.06em; color:var(--cream-dim);}
  footer .wrap{display:flex; justify-content:space-between; gap:12px 20px; flex-wrap:wrap;}
  footer a{color:var(--cream-dim);} footer a:hover{color:var(--amber);}
  @media (max-width:560px){ .wrap, nav.top .inner{padding:0 20px;} .wordmark{font-size:17px;} }
</style>
</head>
<body>
<nav class="top"><div class="inner">
  <a class="wordmark" href="/">MESAFE <em>Seans Defteri</em></a>
  <a class="back" href="/#arsiv">← Arşiv</a>
</div></nav>

<main class="wrap"><article>
  ${s.gorselUrl ? `<img class="poster" src="${esc(s.gorselUrl)}" alt="${esc(s.baslik)}">` : ''}
  <div class="seans-no">SEANS № ${String(s.no).padStart(3, '0')} — ${esc(fmtTarih(s.tarih).toLocaleUpperCase('tr-TR'))}</div>
  <h1>${esc(s.altBaslik || s.baslik)}</h1>
  <div class="meta">
    <span>Film: <b>${esc(s.baslik)}</b></span>
    <span>Yönetmen: <b>${esc(s.yonetmen || '—')}</b></span>
    <span>Katılımcılar: <b>${esc(s.katilimci || '—')} kişi</b></span>
    <span>Süre: <b>${esc(s.sure || '—')}</b></span>
  </div>
  ${s.podcastUrl ? `<div class="podcast">🎧 <a href="${esc(s.podcastUrl)}" target="_blank" rel="noopener">Bu seansın kaydını dinle →</a></div>` : ''}
  <div class="body-text">${s.metin || '<p>Bu seans için henüz bir metin eklenmedi.</p>'}</div>
  <div class="share" data-url="${url}" data-title="${esc(title)}">
    <button type="button" class="share-btn" data-act="native" hidden>Paylaş</button>
    <button type="button" class="share-btn" data-act="copy">Linki kopyala</button>
    <span class="share-status" aria-live="polite"></span>
  </div>
  ${nav}
</article></main>

<footer><div class="wrap">
  <span>MESAFE Film Kulübü · Sunan: <a href="https://lryiu.com/" target="_blank" rel="noopener">Lryiu</a></span>
  <span><a href="${SPOTIFY}" target="_blank" rel="noopener" lang="en">Spotify</a> · <a href="https://www.mesafe.pub" target="_blank" rel="noopener">MESAFE Dergi</a></span>
</div></footer>

<script>
${SHARE_JS}
</script>
</body>
</html>
`;
}

function main() {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'seanslar.json'), 'utf8'));
  const all = (data.seanslar || []).filter((s) => s && s.yayinda !== false && s.no != null && s.baslik);
  const slugs = slugMap(all);
  const sorted = all.slice().sort((a, b) => a.no - b.no);
  const outDir = path.join(ROOT, 'seans');
  fs.rmSync(outDir, { recursive: true, force: true }); // yayından kalkan seansların eski sayfaları da silinsin
  sorted.forEach((s, i) => {
    const dir = path.join(outDir, slugs[s.no]);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), page(s, slugs[s.no], sorted[i - 1], sorted[i + 1], slugs));
  });
  const last = sorted.map((s) => isoDate(s.tarih)).filter(Boolean).sort().pop();
  const urls = [{ loc: SITE + '/', lastmod: last }].concat(sorted.map((s) => ({ loc: `${SITE}/seans/${slugs[s.no]}/`, lastmod: isoDate(s.tarih) })));
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}  </url>`).join('\n') + '\n</urlset>\n');
  console.log(`Seans sayfaları üretildi: ${sorted.length} sayfa (${sorted.map((s) => slugs[s.no]).join(', ')})`);
}

main();
