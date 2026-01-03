document.addEventListener('DOMContentLoaded', () => {

    // Elementos do DOM
    const form = document.getElementById('form-item');
    const itemIdInput = document.getElementById('item-id');
    const nomeItemInput = document.getElementById('nome-item');
    const qtdeItemInput = document.getElementById('qtde-item');
    const precoItemInput = document.getElementById('preco-item');
    const listaItens = document.getElementById('lista-itens');
    const totalGeralEl = document.getElementById('total-geral');
    const btnSubmit = document.getElementById('btn-submit');

    // Chave do LocalStorage
    const STORAGE_KEY = 'shopping_list_items';

    // Estado da aplicação
    let items = [];
    let editingItemId = null;

    // --- Funções de Persistência (LocalStorage) ---

    const saveItems = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    };

    const loadItems = () => {
        const storedItems = localStorage.getItem(STORAGE_KEY);
        // Se houver itens, carrega. Senão, inicializa como array vazio.
        items = storedItems ? JSON.parse(storedItems) : [];
    };

    // --- Funções Auxiliares ---

    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const parseCurrency = (value) => {
        if (!value) return 0;
        return parseFloat(value.replace(/\./g, '').replace(',', '.'));
    };

    // --- Funções Principais ---

    const renderItems = () => {
        listaItens.innerHTML = '';

        if (items.length === 0) {
            listaItens.innerHTML = '<li class="item-lista-vazia"><p>Nenhum item na lista.</p></li>';
        } else {
            items.forEach(item => {
                const li = document.createElement('li');
                li.className = `item-lista ${item.checked ? 'checked' : ''}`;
                li.dataset.id = item.id;

                const itemTotal = item.quantity * item.price;

                li.innerHTML = `
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
    
    const setupFormForEdit = (id) => {
        const item = items.find(item => item.id === id);
        if (item) {
            editingItemId = id;
            itemIdInput.value = item.id;
            nomeItemInput.value = item.name;
            qtdeItemInput.value = item.quantity;
            precoItemInput.value = item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', '');
            
            btnSubmit.textContent = 'Atualizar Item';
            nomeItemInput.focus();
        }
    };
    
    const resetForm = () => {
        form.reset();
        itemIdInput.value = '';
        editingItemId = null;
        qtdeItemInput.value = '1';
        btnSubmit.textContent = 'Adicionar Item';
    }

    // --- Event Listeners ---

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = nomeItemInput.value.trim();
        const quantity = parseInt(qtdeItemInput.value);
        const price = parseCurrency(precoItemInput.value);

        if (name && quantity > 0 && !isNaN(price) && price >= 0) {
            if (editingItemId) {
                updateItem(editingItemId, name, quantity, price);
            } else {
                addItem(name, quantity, price);
            }
            resetForm();
        } else {
            alert('Por favor, preencha todos os campos corretamente.');
        }
    });
    
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

            itemElement.querySelector('.item-info').addEventListener('click', () => {
                setupFormForEdit(itemId);
            });

            itemElement.querySelector('.checkbox-container').addEventListener('click', () => {
                toggleItemChecked(itemId);
            });
        });
    }

    // --- Funções de Import/Export ---
    const btnExportPDF = document.getElementById('btn-export-pdf');
    const btnExportJSON = document.getElementById('btn-export-json');
    const btnImport = document.getElementById('btn-import');
    const importFileInput = document.getElementById('import-file');

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
        // Novos espaçamentos de coluna
        const colItem = margin + 2;
        const colQtde = margin + 80;
        const colPreco = margin + 110;
        const colTotal = margin + 150;
        doc.text('Item', colItem, y);
        doc.text('Qtde', colQtde, y);
        doc.text('Preço Unit.', colPreco, y);
        doc.text('Total', colTotal, y, {align: 'right'});
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
            doc.text(formatCurrency(itemTotal), colTotal, y, {align: 'right'});
            y += 8;
        });

        // Linha do total
        doc.setDrawColor(40, 40, 120);
        doc.setLineWidth(0.8);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 12;

        // Valor Total
        const grandTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 0);
        // Valor Total alinhado à coluna Total
        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 0);
        doc.text('Valor Total:', colTotal - 40, y, {align: 'right'});
        doc.text(formatCurrency(grandTotal), colTotal, y, {align: 'right'});
        y += 15;

        // Rodapé com data
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        const data = new Date();
        const dataStr = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
        doc.text('Exportado em: ' + dataStr, margin, doc.internal.pageSize.getHeight() - 10);

        doc.save('lista-de-compras.pdf');
    };

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

    btnExportPDF.addEventListener('click', exportDataPDF);
    btnExportJSON.addEventListener('click', exportDataJSON);
    btnImport.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);


    // --- Inicialização da Aplicação ---
    const init = () => {
        loadItems();
        renderItems();
    };

    init(); // Inicia a aplicação
});
