/* ============================================================
   Lista de Compras — Ajustes de tela para mobile
   ------------------------------------------------------------
   Mantém a altura do app sincronizada com a área realmente
   visível (barra de endereço + teclado). Também ajusta o modal:
   com o teclado aberto ele alinha no topo para os campos
   continuarem visíveis.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Aplica apenas em dispositivos de toque, para não interferir no desktop
    if (!window.visualViewport || !window.matchMedia('(pointer: coarse)').matches) {
        return;
    }

    const app = document.getElementById('app');
    const modalOverlay = document.getElementById('modal-item');

    const syncViewport = () => {
        const alturaVisivel = window.visualViewport.height;
        app.style.height = alturaVisivel + 'px';
        if (modalOverlay) {
            // Teclado reduz a área visível para menos de 85% da tela
            modalOverlay.classList.toggle('teclado', alturaVisivel < window.innerHeight * 0.85);
        }
    };

    window.visualViewport.addEventListener('resize', syncViewport);
    syncViewport();
});
