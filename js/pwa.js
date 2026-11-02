/* ============================================================
   Lista de Compras — Registro do Service Worker (PWA)
   ------------------------------------------------------------
   Habilita a instalação do app e o funcionamento offline.
   Requer HTTPS (como no GitHub Pages) ou localhost.
   ============================================================ */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
            console.warn('Falha ao registrar o Service Worker:', err);
        });
    });
}
