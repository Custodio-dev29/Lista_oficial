// Service Worker do app "Lista de Compras"
// Para publicar uma atualização, troque o número da versão do cache (ex.: v2)
const CACHE_NAME = 'lista-compras-v1';

const ARQUIVOS_BASE = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png',
    './icons/apple-touch-icon-180.png'
];

// Instalação: guarda os arquivos base no cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => Promise.allSettled(ARQUIVOS_BASE.map((arquivo) => cache.add(arquivo))))
            .then(() => self.skipWaiting())
    );
});

// Ativação: limpa caches de versões antigas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((chaves) => Promise.all(
                chaves.filter((chave) => chave !== CACHE_NAME).map((chave) => caches.delete(chave))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    // Navegação (abrir/recarregar a página): rede primeiro; offline usa o cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((resposta) => {
                    const copia = resposta.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copia));
                    return resposta;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Demais recursos (CSS/JS/ícones): cache primeiro, atualizando em segundo plano
    event.respondWith(
        caches.match(request).then((doCache) => {
            if (doCache) {
                fetch(request)
                    .then((resposta) => {
                        if (resposta && (resposta.status === 200 || resposta.type === 'opaque')) {
                            const copia = resposta.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
                        }
                        return resposta;
                    })
                    .catch(() => doCache);
                return doCache;
            }
            return fetch(request)
                .then((resposta) => {
                    if (resposta && (resposta.status === 200 || resposta.type === 'opaque')) {
                        const copia = resposta.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
                    }
                    return resposta;
                })
                .catch(() => doCache);
        })
    );
});
