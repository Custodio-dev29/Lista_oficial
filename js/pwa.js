/* ============================================================
   Lista de Compras — PWA (instalação + offline)
   ------------------------------------------------------------
   O manifest e o service worker só funcionam em HTTP(S)
   (GitHub Pages, localhost). Quando a página é aberta como
   arquivo (file://), o navegador bloqueia por CORS — por isso
   só os registramos quando é servido por http/https.
   ============================================================ */

const protocolo = window.location.protocol;

if (protocolo === 'http:' || protocolo === 'https:') {
    // Manifest: injetado via JS para não disparar erro de CORS em file://
    const linkManifest = document.createElement('link');
    linkManifest.rel = 'manifest';
    linkManifest.href = './manifest.json';
    document.head.appendChild(linkManifest);

    // Service worker: habilita instalação e funcionamento offline
    window.addEventListener('load', () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch((err) => {
                console.warn('Falha ao registrar o Service Worker:', err);
            });
        }
    });
} else {
    console.info(
        'Lista de Compras: aberto como arquivo local (file://), o app funciona normalmente, ' +
        'mas instalação/offline exigem http(s) — publique no GitHub Pages ou rode um servidor local.'
    );
}
