# Lista de Compras (PWA)

App de lista de compras que salva os itens no navegador (`localStorage`),
com total calculado automaticamente, marcação de itens comprados,
reordenação por posição, exportação em PDF/JSON e instalação como
aplicativo no celular.

## Funcionalidades

- **Adicionar/Editar items** — botão circular **"+"** no topo abre um modal único para as duas ações (com campo opcional de posição).
- **Marcar como comprado** — toque no círculo ao lado do item (risca o nome e muda a cor).
- **Reordenar** — nº da posição em cada item; setas ↑/↓ no item; campo "Posição" no modal; arrastar e soltar (segurar ~350ms no celular; arraste com o mouse no desktop).
- **Total geral** — calculado sempre que a lista muda.
- **Exportar/Importar** — PDF (visível/imprimível) e JSON (backup/restauração: só o `.json` é importável).
- **Deletar a lista** — botão no cabeçalho remove todos os itens de uma vez, com confirmação e sugestão de backup.
- **Instalável e offline** — PWA com service worker; funciona sem internet após a primeira visita.

## Estrutura de arquivos

```
Lista/
├── index.html        # Estrutura HTML (cabeçalho, lista e modal)
├── css/
│   └── style.css     # Toda a estilização (seções numeradas por área)
├── js/
│   ├── app.js        # Lógica principal: estado, lista, CRUD, posição, modal, exportação
│   ├── viewport.js   # Ajustes de tela no mobile (teclado/barra de endereço)
│   └── pwa.js        # Registro do service worker (instalação/offline)
├── sw.js             # Service worker (cache/offline)
├── manifest.json     # Metadados do PWA (nome, ícones, cores)
└── icons/            # Ícones do app (normal, maskable, iOS e favicon)
```

## Rodando localmente

O app abre direto no navegador, mas para testar o service worker
(instalação/offline) é preciso HTTPS ou `localhost`:

```powershell
python -m http.server  # serve em http://localhost:8000
```

## Publicando no GitHub Pages

1. Crie um repositório **vazio e público** no GitHub.
2. No terminal, na pasta do projeto:
   ```powershell
   git add -A
   git commit -m "atualização"
   git remote add origin https://github.com/SEU_USUARIO/lista-de-compras.git  # só na primeira vez
   git push -u origin main
   ```
3. No GitHub: **Settings → Pages → Build and deployment** →
   Source: *"Deploy from a branch"* → Branch: `main` / `(root)` → **Save**.
4. O app fica disponível em `https://SEU_USUARIO.github.io/lista-de-compras/`
   (todos os caminhos são relativos, então também funciona em `SEU_USUARIO.github.io`).

## Instalação no celular

- **Android (Chrome):** menu ⋮ → *"Instalar app"*.
- **iPhone (Safari):** Compartilhar ⬆️ → *"Adicionar à Tela de Início"*.
- **Desktop (Chrome/Edge):** ícone ⊕ na barra de endereço.

## Manutenção / atualizações

Ao fazer qualquer mudança no código e publicar:

1. Em `sw.js`, troque a versão do cache: `CACHE_NAME = 'lista-compras-v2'` → `v3`
   (senão quem já instalou continuará vendo a versão antiga).
2. `git add -A && git commit -m "..." && git push`.

### Onde mexer em cada coisa

| O que | Arquivo |
|---|---|
| Cores, espaçamentos, visual | `css/style.css` (seção numerada correspondente) |
| Comportamento da lista, modal, ordem, exportação | `js/app.js` (seções numeradas no topo) |
| Textos e estrutura do app (IDs das telas) | `index.html` |
| Política de cache/offline | `sw.js` |
