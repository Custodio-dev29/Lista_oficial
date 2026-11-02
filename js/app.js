/* ============================================================
   Lista de Compras — Lógica principal
   ------------------------------------------------------------
   Sumário:
     1. Elementos do DOM
     2. Estado e persistência (localStorage)
     3. Formatadores e parsers (moeda)
     4. Renderização da lista
     5. CRUD de itens
     6. Ordem/posição (setas, campo posição, arrastar e soltar)
     7. Modal (adicionar/editar)
     8. Eventos do formulário e do modal
     9. Exportação (PDF/JSON) e importação (JSON)
    10. Inicialização
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ===== 1. Elementos do DOM ===== */

    const form = document.getElementById('form-item');
    const itemIdInput = document.getElementById('item-id');
    const nomeItemInput = document.getElementById('nome-item');
    const qtdeItemInput = document.getElementById('qtde-item');
    const precoItemInput = document.getElementById('preco-item');
    const posicaoItemInput = document.getElementById('posicao-item');
    const listaItens = document.getElementById('lista-itens');
    const totalGeralEl = document.getElementById('total-geral');
    const mainEl = document.querySelector('main');

    // Botão "+" e modal
    const btnAddItem = document.getElementById('btn-add-item');
    const modalOverlay = document.getElementById('modal-item');
    const modalTitulo = document.getElementById('modal-titulo');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSubmit = document.getElementById('btn-submit');
    const btnExcluirModal = document.getElementById('btn-excluir-modal');
    const btnDeletarLista = document.getElementById('btn-deletar-lista');

    // Botões de exportar/importar
    const btnExportPDF = document.getElementById('btn-export-pdf');
    const btnExportJSON = document.getElementById('btn-export-json');
    const btnImport = document.getElementById('btn-import');
    const importFileInput = document.getElementById('import-file');

    /* ===== 2. Estado e persistência (localStorage) ===== */

    const STORAGE_KEY = 'shopping_list_items';

    // Estado da aplicação
    let items = [];
    let editingItemId = null;

    const saveItems = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    };

    const loadItems = () => {
        const storedItems = localStorage.getItem(STORAGE_KEY);
        // Se houver itens, carrega. Senão, inicializa como array vazio.
        items = storedItems ? JSON.parse(storedItems) : [];
    };

    /* ===== 3. Formatadores e parsers (moeda) ===== */

    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const parseCurrency = (value) => {
        if (!value) return 0;
        return parseFloat(value.replace(/\./g, '').replace(',', '.'));
    };

    // Permite digitar vírgula normalmente e formata apenas ao sair do campo
    precoItemInput.addEventListener('input', () => {
        // Permite apenas números, vírgula e ponto
        let v = precoItemInput.value.replace(/[^0-9.,]/g, '');
        // Troca ponto por vírgula se o usuário digitar ponto
        v = v.replace(/\./g, ',');
        // Só permite uma vírgula
        const parts = v.split(',');
        if (parts.length > 2) {
            v = parts[0] + ',' + parts.slice(1).join('');
        }
        precoItemInput.value = v;
    });

    // Formata como moeda ao sair do campo
    precoItemInput.addEventListener('blur', () => {
        let valor = precoItemInput.value;
        if (valor) {
            valor = valor.replace(/\./g, '').replace(',', '.');
            const num = parseFloat(valor);
            if (!isNaN(num)) {
                precoItemInput.value = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
        }
    });

    /* ===== 4. Renderização da lista ===== */

    const renderItems = () => {
        listaItens.innerHTML = '';

        if (items.length === 0) {
            listaItens.innerHTML = '<li class="item-lista-vazia"><p>Nenhum item na lista.</p></li>';
        } else {
            items.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = `item-lista ${item.checked ? 'checked' : ''}`;
                li.dataset.id = item.id;
                li.setAttribute('draggable', 'true');
                li.setAttribute('title', 'Arraste para mudar a posição');

                const itemTotal = item.quantity * item.price;
                const primeiroItem = index === 0;
                const ultimoItem = index === items.length - 1;

                li.innerHTML = `
                    <span class="item-posicao">${index + 1}</span>
                    <div class="checkbox-container">
                        <div class="checkbox">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                        </div>
                    </div>
                    <div class="item-info">
                        <h3>${item.name}</h3>
                        <p>${item.quantity} x ${formatCurrency(item.price)}</p>
                    </div>
                    <span class="item-total">${formatCurrency(itemTotal)}</span>
                    <div class="item-acoes">
                        <button type="button" class="move-btn subir-btn" aria-label="Mover para cima" ${primeiroItem ? 'disabled' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 15l6-6 6 6H6z"></path></svg>
                        </button>
                        <button type="button" class="move-btn descer-btn" aria-label="Mover para baixo" ${ultimoItem ? 'disabled' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6H6z"></path></svg>
                        </button>
                        <button class="delete-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                        </button>
                    </div>
                `;
                listaItens.appendChild(li);
            });
        }

        calculateGrandTotal();
        addEventListenersToItems();
        saveItems(); // Salva o estado atual no localStorage sempre que a UI é renderizada
    };

    const calculateGrandTotal = () => {
        const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        totalGeralEl.textContent = formatCurrency(total);
    };

    /* ===== 5. CRUD de itens ===== */

    // Adiciona item ao final da lista e retorna o novo item
    const addItem = (name, quantity, price) => {
        const newItem = {
            id: Date.now(),
            name,
            quantity,
            price,
            checked: false
        };
        items.push(newItem);
        renderItems();
        return newItem;
    };

    const updateItem = (id, name, quantity, price) => {
        const itemIndex = items.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            const existingCheckedState = items[itemIndex].checked;
            items[itemIndex] = { id, name, quantity, price, checked: existingCheckedState };
        }
        editingItemId = null;
        btnSubmit.textContent = 'Adicionar Item';
        renderItems();
    };

    const deleteItem = (id) => {
        items = items.filter(item => item.id !== id);
        renderItems();
    };

    const toggleItemChecked = (id) => {
        const itemIndex = items.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            items[itemIndex].checked = !items[itemIndex].checked;
        }
        renderItems();
    };

    /* ===== 6. Ordem/posição (setas, campo posição, arrastar e soltar) ===== */

    // Move o item uma posição para cima (-1) ou para baixo (+1)
    const moveItem = (id, direction) => {
        const index = items.findIndex(item => item.id === id);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= items.length) return;
        [items[index], items[target]] = [items[target], items[index]];
        renderItems();
    };

    // Move o item para a posição desejada (limitada ao tamanho da lista)
    const moveToPosition = (id, desiredPosition) => {
        let newPos = parseInt(desiredPosition);
        if (isNaN(newPos)) return;
        newPos = Math.min(Math.max(newPos, 1), items.length);
        const currentIndex = items.findIndex(item => item.id === id);
        if (currentIndex === -1 || newPos === currentIndex + 1) return;
        const [item] = items.splice(currentIndex, 1);
        items.splice(Math.min(newPos, items.length) - 1, 0, item);
        renderItems();
    };

    // --- Arrastar e soltar (touch + mouse) ---

    const LONG_PRESS_MS = 350;   // tempo segurando para iniciar o arraste no touch
    let dragState = null;        // { li, x, y, ativo, timer, isMouse }
    let arrastandoTouch = false; // trava cliques de edição/marcar logo após o arraste

    // Reposiciona o item arrastado conforme a posição do ponteiro
    const reposicionarArraste = (li, x, y) => {
        const alvoEl = document.elementFromPoint(x, y);
        const liAlvo = alvoEl && alvoEl.closest('.item-lista');
        if (liAlvo && liAlvo !== li) {
            const rect = liAlvo.getBoundingClientRect();
            const antes = y < rect.top + rect.height / 2;
            listaItens.insertBefore(li, antes ? liAlvo : liAlvo.nextSibling);
        }
    };

    // Aplica no estado a nova ordem definida pelo arrastar e soltar
    const finalizeOrder = () => {
        const orderedIds = Array.from(listaItens.querySelectorAll('.item-lista'))
            .map(li => parseInt(li.dataset.id));
        const reordered = orderedIds
            .map(id => items.find(it => it.id === id))
            .filter(Boolean);
        if (reordered.length === items.length) {
            items = reordered;
        }
        renderItems();
    };

    const iniciarArrasteTouch = (li) => {
        dragState.ativo = true;
        arrastandoTouch = true;
        li.classList.add('arrastando');
        if (navigator.vibrate) navigator.vibrate(30); // feedback háptico
    };

    listaItens.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1 || arrastandoTouch) return;
        const li = e.target.closest('.item-lista');
        // Não inicia arraste pelos botões de ação nem pelo checkbox
        if (!li || e.target.closest('.item-acoes, .checkbox-container')) return;
        const touch = e.touches[0];
        dragState = {
            li,
            x: touch.clientX,
            y: touch.clientY,
            ativo: false,
            timer: setTimeout(() => iniciarArrasteTouch(li), LONG_PRESS_MS)
        };
    }, { passive: true });

    listaItens.addEventListener('touchmove', (e) => {
        if (!dragState) return;
        const touch = e.touches[0];
        const deslocamento = Math.hypot(touch.clientX - dragState.x, touch.clientY - dragState.y);

        // Movimento antes do tempo limite cancela o arraste (rolagem normal da lista)
        if (!dragState.ativo) {
            if (deslocamento > 12) {
                clearTimeout(dragState.timer);
                dragState = null;
            }
            return;
        }

        e.preventDefault(); // trava a rolagem da página durante o arraste
        reposicionarArraste(dragState.li, touch.clientX, touch.clientY);

        // Rolagem automática ao aproximar os cantos da área da lista
        const mainRect = mainEl.getBoundingClientRect();
        if (touch.clientY < mainRect.top + 48) mainEl.scrollTop -= 12;
        else if (touch.clientY > mainRect.bottom - 48) mainEl.scrollTop += 12;
    }, { passive: false });

    const encerrarArrasteTouch = (e) => {
        if (!dragState) return;
        clearTimeout(dragState.timer);
        const estavaArrastando = dragState.ativo;
        if (estavaArrastando) {
            if (e.cancelable) e.preventDefault(); // evita disparar clique no item
            dragState.li.classList.remove('arrastando');
            finalizeOrder();
            setTimeout(() => { arrastandoTouch = false; }, 100);
        }
        dragState = null;
    };

    listaItens.addEventListener('touchend', encerrarArrasteTouch);
    listaItens.addEventListener('touchcancel', encerrarArrasteTouch);

    // Arrastar e soltar com o mouse (desktop)
    listaItens.addEventListener('dragstart', (e) => {
        const li = e.target.closest('.item-lista');
        if (!li) return;
        dragState = { li, ativo: true, isMouse: true };
        li.classList.add('arrastando');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', li.dataset.id);
    });

    listaItens.addEventListener('dragover', (e) => {
        if (!dragState || !dragState.isMouse) return;
        e.preventDefault();
        reposicionarArraste(dragState.li, e.clientX, e.clientY);
    });

    const encerrarArrasteMouse = () => {
        if (!dragState || !dragState.isMouse) return;
        dragState.li.classList.remove('arrastando');
        dragState = null;
        finalizeOrder();
    };

    listaItens.addEventListener('drop', (e) => {
        if (dragState && dragState.isMouse) e.preventDefault();
        encerrarArrasteMouse();
    });
    listaItens.addEventListener('dragend', encerrarArrasteMouse);

    /* ===== 7. Modal (adicionar/editar) ===== */

    const openModal = (editMode) => {
        modalTitulo.textContent = editMode ? 'Editar Item' : 'Adicionar Item';
        // Sugere como posição: a atual do item (edição) ou o final da lista (adição)
        posicaoItemInput.value = editMode
            ? (items.findIndex(item => item.id === editingItemId) + 1)
            : (items.length + 1);
        posicaoItemInput.max = items.length + (editMode ? 0 : 1);
        // No mobile, o botão de excluir só aparece em modo de edição
        btnExcluirModal.classList.toggle('visivel', !!editMode);
        modalOverlay.classList.add('aberto');
        nomeItemInput.focus();
    };

    const setupFormForEdit = (id) => {
        const item = items.find(item => item.id === id);
        if (item) {
            editingItemId = id;
            itemIdInput.value = item.id;
            nomeItemInput.value = item.name;
            qtdeItemInput.value = item.quantity;
            precoItemInput.value = item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', '');

            btnSubmit.textContent = 'Atualizar Item';
            openModal(true); // abre o modal preenchido para edição
        }
    };

    const resetForm = () => {
        form.reset();
        itemIdInput.value = '';
        editingItemId = null;
        qtdeItemInput.value = '1';
        btnSubmit.textContent = 'Adicionar Item';
    };

    const closeModal = () => {
        modalOverlay.classList.remove('aberto');
        resetForm();
    };

    /* ===== 8. Eventos do formulário e do modal ===== */

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = nomeItemInput.value.trim();
        const quantity = parseInt(qtdeItemInput.value);
        const price = parseCurrency(precoItemInput.value);

        if (name && quantity > 0 && !isNaN(price) && price >= 0) {
            if (editingItemId) {
                updateItem(editingItemId, name, quantity, price);
                moveToPosition(editingItemId, posicaoItemInput.value);
            } else {
                const novoItem = addItem(name, quantity, price);
                moveToPosition(novoItem.id, posicaoItemInput.value);
            }
            closeModal(); // fecha o modal e reseta o formulário
        } else {
            alert('Por favor, preencha todos os campos corretamente.');
        }
    });

    // Botão "+" no cabeçalho: abre o modal para adicionar
    btnAddItem.addEventListener('click', () => {
        resetForm(); // garante estado limpo mesmo se uma edição anterior foi cancelada
        openModal(false);
    });

    btnCloseModal.addEventListener('click', closeModal);

    // Excluir item direto do modal (botão visível no mobile em modo edição)
    btnExcluirModal.addEventListener('click', () => {
        if (!editingItemId) return;
        const item = items.find(i => i.id === editingItemId);
        if (item && confirm(`Tem certeza que deseja excluir "${item.name}"?`)) {
            deleteItem(editingItemId);
            closeModal();
        }
    });

    // Fecha ao clicar fora do modal
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Fecha com a tecla Esc
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('aberto')) {
            closeModal();
        }
    });

    /**
     * Liga os eventos de cada item renderizado:
     * excluir, mover (↑/↓), marcar como comprado e editar.
     */
    const addEventListenersToItems = () => {
        document.querySelectorAll('.item-lista').forEach(itemElement => {
            const itemId = parseInt(itemElement.dataset.id);

            itemElement.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const item = items.find(i => i.id === itemId);
                if (item && confirm(`Tem certeza que deseja excluir "${item.name}"?`)) {
                    deleteItem(itemId);
                }
            });

            itemElement.querySelector('.subir-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                moveItem(itemId, -1);
            });

            itemElement.querySelector('.descer-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                moveItem(itemId, +1);
            });

            itemElement.querySelector('.item-info').addEventListener('click', () => {
                if (arrastandoTouch) return; // ignora clique logo após um arraste
                setupFormForEdit(itemId);
            });

            itemElement.querySelector('.checkbox-container').addEventListener('click', () => {
                if (arrastandoTouch) return; // ignora clique logo após um arraste
                toggleItemChecked(itemId);
            });
        });
    };

    /* ===== 9. Exportação (PDF/JSON) e importação (JSON) ===== */

    // Exporta lista em PDF
    const exportDataPDF = () => {
        if (items.length === 0) {
            alert('A lista está vazia. Não há nada para exportar.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = 20;

        // Título
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 120);
        doc.text('Lista de Compras', pageWidth / 2, y, { align: 'center' });
        y += 12;

        // Linha decorativa
        doc.setDrawColor(40, 40, 120);
        doc.setLineWidth(1.2);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // Cabeçalho da tabela
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.setFillColor(220, 230, 250);
        doc.rect(margin, y - 7, pageWidth - 2 * margin, 10, 'F');
        doc.setTextColor(40, 40, 120);
        const colItem = margin + 2;
        const colQtde = margin + 80;
        const colPreco = margin + 110;
        const colTotal = margin + 150;
        doc.text('Item', colItem, y);
        doc.text('Qtde', colQtde, y);
        doc.text('Preço Unit.', colPreco, y);
        doc.text('Total', colTotal, y, { align: 'right' });
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.5);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 10;

        // Itens da lista
        doc.setFont(undefined, 'normal');
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        items.forEach((item, idx) => {
            const itemTotal = item.quantity * item.price;
            // Alterna cor de fundo das linhas
            if (idx % 2 === 0) {
                doc.setFillColor(245, 245, 255);
                doc.rect(margin, y - 6, pageWidth - 2 * margin, 8, 'F');
            }
            doc.text(item.name, colItem, y);
            doc.text(String(item.quantity), colQtde, y);
            doc.text(formatCurrency(item.price), colPreco, y);
            doc.text(formatCurrency(itemTotal), colTotal, y, { align: 'right' });
            y += 8;
        });

        // Linha do total
        doc.setDrawColor(40, 40, 120);
        doc.setLineWidth(0.8);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 12;

        // Valor Total (alinhado à coluna Total)
        const grandTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 0);
        doc.text('Valor Total:', colTotal - 40, y, { align: 'right' });
        doc.text(formatCurrency(grandTotal), colTotal, y, { align: 'right' });
        y += 15;

        // Rodapé com data
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        const data = new Date();
        const dataStr = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
        doc.text('Exportado em: ' + dataStr, margin, doc.internal.pageSize.getHeight() - 10);

        doc.save('lista-de-compras.pdf');
    };

    // Exporta lista em JSON
    const exportDataJSON = () => {
        if (items.length === 0) {
            alert('A lista está vazia. Não há nada para exportar.');
            return;
        }
        const dataStr = JSON.stringify(items, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lista-de-compras.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Importa lista de um arquivo .json (não é possível importar PDF)
    const importData = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        // Verifica a extensão do arquivo
        if (file.type === 'application/pdf') {
            alert('A importação de arquivos PDF não é suportada.\n\nPara importar uma lista, por favor, utilize um arquivo .json que tenha sido exportado anteriormente desta aplicação. A exportação em PDF serve apenas para visualização e impressão.');
            importFileInput.value = ''; // Limpa o seletor de arquivo
            return;
        }

        if (file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedItems = JSON.parse(e.target.result);
                    if (Array.isArray(importedItems)) {
                        if (confirm('Isso substituirá sua lista de compras atual. Deseja continuar?')) {
                            items = importedItems;
                            renderItems();
                            alert('Lista de compras importada com sucesso!');
                        }
                    } else {
                        alert('O arquivo de importação é inválido. O conteúdo deve ser uma lista de itens.');
                    }
                } catch (error) {
                    console.error('Erro ao analisar o arquivo JSON:', error);
                    alert('Ocorreu um erro ao importar o arquivo. Verifique se o arquivo é um JSON válido.');
                } finally {
                    importFileInput.value = '';
                }
            };
            reader.onerror = () => {
                alert('Não foi possível ler o arquivo.');
                importFileInput.value = '';
            };
            reader.readAsText(file);
        } else {
            alert('Formato de arquivo não suportado. Por favor, selecione um arquivo .json ou .pdf.');
            importFileInput.value = '';
        }
    };

    btnExportPDF.addEventListener('click', exportDataPDF);
    btnExportJSON.addEventListener('click', exportDataJSON);
    btnImport.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);

    // Deleta todos os itens da lista (com confirmação e sugestão de backup)
    const deletarLista = () => {
        if (items.length === 0) {
            alert('A lista já está vazia.');
            return;
        }
        const aviso = `Deletar TODOS os ${items.length} itens da lista?\n\nEsta ação não pode ser desfeita. Se quiser guardar um backup antes, use "Exportar JSON".`;
        if (confirm(aviso)) {
            items = [];
            renderItems(); // limpa a lista, recalcula o total e salva o estado vazio
        }
    };

    btnDeletarLista.addEventListener('click', deletarLista);

    /* ===== 10. Inicialização ===== */

    const init = () => {
        loadItems();
        renderItems();
    };

    init(); // Inicia a aplicação
});
