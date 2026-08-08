let meuGrafico = null;

// =====================================================
// FORMATAÇÃO
// =====================================================

// Formata número como moeda brasileira (separador de milhar + vírgula decimal)
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// =====================================================
// INICIALIZAÇÃO E LOGIN PERSISTENTE
// =====================================================

window.onload = function() {
    const hoje = new Date();
    document.getElementById('seletorMes').value = hoje.toISOString().slice(0, 7);
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
    }

    // Se já existe um usuário salvo neste navegador, pula a tela de login
    const usuarioSalvo = localStorage.getItem('planilhaUsuarioLogado');
    if (usuarioSalvo) {
        document.getElementById('tela-login').style.display = 'none';
        document.getElementById('app-planilha').style.display = 'block';
        carregarDados();
    }
};

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    calcular();
}

function liberarApp() {
    const nomeInput = document.getElementById('nome_usuario').value;
    if (nomeInput.trim() === '') {
        alert("Por favor, digite seu nome para acessar!");
        return;
    }
    localStorage.setItem('planilhaUsuarioLogado', nomeInput.trim());
    document.getElementById('tela-login').style.display = 'none';
    document.getElementById('app-planilha').style.display = 'block';
    carregarDados();
}

// Permite trocar de usuário sem apagar os dados já salvos
function trocarUsuario() {
    if (!confirm('Deseja trocar de usuário? Seus dados salvos não serão apagados.')) return;
    localStorage.removeItem('planilhaUsuarioLogado');
    document.getElementById('app-planilha').style.display = 'none';
    document.getElementById('tela-login').style.display = 'block';
    document.getElementById('nome_usuario').value = '';
}

// =====================================================
// NOMES DAS PESSOAS (configurável, sem nomes fixos no código)
// =====================================================

function atualizarNomes() {
    const nome1 = document.getElementById('nomePessoa1').value.trim() || 'Pessoa 1';
    const nome2 = document.getElementById('nomePessoa2').value.trim() || 'Pessoa 2';

    document.getElementById('tituloIndivPessoa1').innerText = `Contas ${nome1}`;
    document.getElementById('tituloIndivPessoa2').innerText = `Contas ${nome2}`;
    document.getElementById('tituloResumoPessoa1').innerText = `Balanço ${nome1}`;
    document.getElementById('tituloResumoPessoa2').innerText = `Balanço ${nome2}`;

    calcular();
}

function obterNomes() {
    return {
        nome1: document.getElementById('nomePessoa1').value.trim() || 'Pessoa 1',
        nome2: document.getElementById('nomePessoa2').value.trim() || 'Pessoa 2'
    };
}

// =====================================================
// LINHAS DINÂMICAS (contas fixas e individuais)
// =====================================================

function togglePago(id) {
    const elemento = document.getElementById(id);
    const checkbox = elemento.querySelector('.checkbox-pago');
    checkbox.checked ? elemento.classList.add('linha-paga') : elemento.classList.remove('linha-paga');
    calcular();
}

// Custos fixos agora usam <input type="date"> nativo (formato ISO aaaa-mm-dd),
// eliminando a necessidade de validar formato manualmente por regex.
function addFixoHTML(nome, valor, data, isBase, pago = false, obs = '') {
    const id = 'fixo-' + Date.now() + Math.floor(Math.random() * 1000);
    const isChecked = pago ? 'checked' : '';
    const classPaga = pago ? 'linha-paga' : '';

    const html = `
        <div class="linha-inputs conta-fixa ${classPaga}" id="${id}">
            <input type="checkbox" class="checkbox-pago" title="Marcar como pago" ${isChecked} onchange="togglePago('${id}')">
            <input type="text" class="nome-fixo" value="${nome}" placeholder="Nome da conta" ${isBase ? 'readonly' : ''} oninput="calcular()">
            <input type="number" class="valor-fixo" value="${valor}" min="0" placeholder="R$" oninput="calcular()">
            <input type="date" class="data-fixo" value="${data}" onchange="calcular()">
            <input type="text" class="input-obs obs-fixo" value="${obs}" placeholder="Obs/Atraso..." oninput="calcular()">
            ${!isBase ? `<button class="remover" onclick="removerLinha('${id}')">X</button>` : `<button class="remover" style="visibility:hidden">X</button>`}
        </div>
    `;
    document.getElementById('lista-fixos').insertAdjacentHTML('beforeend', html);
}

function addIndivHTML(pessoa, nome, valor, pago = false, obs = '', categoria = 'Outros') {
    const id = 'indiv-' + Date.now() + Math.floor(Math.random() * 1000);
    const isChecked = pago ? 'checked' : '';
    const classPaga = pago ? 'linha-paga' : '';

    const html = `
        <div class="linha-inputs conta-indiv-${pessoa} ${classPaga}" id="${id}">
            <input type="checkbox" class="checkbox-pago" title="Marcar como pago" ${isChecked} onchange="togglePago('${id}')">
            <input type="text" class="nome-indiv" value="${nome}" placeholder="Nome da conta" oninput="calcular()">

            <select class="categoria-indiv" onchange="calcular()">
                <option value="Alimentação" ${categoria === 'Alimentação' ? 'selected' : ''}>🍔 Alimentação</option>
                <option value="Lazer" ${categoria === 'Lazer' ? 'selected' : ''}>🎬 Lazer</option>
                <option value="Saúde" ${categoria === 'Saúde' ? 'selected' : ''}>💊 Saúde</option>
                <option value="Transporte" ${categoria === 'Transporte' ? 'selected' : ''}>🚗 Transporte</option>
                <option value="Vestuário" ${categoria === 'Vestuário' ? 'selected' : ''}>👕 Vestuário</option>
                <option value="Outros" ${categoria === 'Outros' ? 'selected' : ''}>📦 Outros</option>
            </select>

            <input type="number" class="valor-indiv" value="${valor}" min="0" placeholder="R$" oninput="calcular()">
            <input type="text" class="input-obs obs-indiv" value="${obs}" placeholder="Obs/Atraso..." oninput="calcular()">
            <button class="remover" onclick="removerLinha('${id}')">X</button>
        </div>
    `;
    document.getElementById(`lista-indiv-${pessoa}`).insertAdjacentHTML('beforeend', html);
}

// Agora pede confirmação antes de excluir, evitando perda de dado por clique acidental
function removerLinha(id) {
    if (!confirm('Remover esta linha? Essa ação não pode ser desfeita.')) return;
    document.getElementById(id).remove();
    calcular();
}

// Converte data ISO (aaaa-mm-dd) em timestamp para ordenação; vazio vai para o final
function paraTimestamp(dataStr) {
    if (!dataStr) return Infinity;
    const t = new Date(dataStr).getTime();
    return isNaN(t) ? Infinity : t;
}

function ordenarContas() {
    const lista = document.getElementById('lista-fixos');
    const linhas = Array.from(lista.querySelectorAll('.conta-fixa'));
    const tipo = document.getElementById('ordenarFixos').value;

    linhas.sort((a, b) => {
        const valA = parseFloat(a.querySelector('.valor-fixo').value) || 0;
        const valB = parseFloat(b.querySelector('.valor-fixo').value) || 0;
        const dataA = paraTimestamp(a.querySelector('.data-fixo').value);
        const dataB = paraTimestamp(b.querySelector('.data-fixo').value);
        if (tipo === 'valorCrescente') return valA - valB;
        if (tipo === 'valorDecrescente') return valB - valA;
        if (tipo === 'dataCrescente') return dataA - dataB;
        return 0;
    });
    linhas.forEach(linha => lista.appendChild(linha)); salvarDados();
}

// =====================================================
// CÁLCULO PRINCIPAL
// =====================================================

function calcular() {
    const { nome1, nome2 } = obterNomes();

    const salPessoa1 = parseFloat(document.getElementById('salarioPessoa1').value) || 0;
    const extPessoa1 = parseFloat(document.getElementById('extraPessoa1').value) || 0;
    const rendaPessoa1 = salPessoa1 + extPessoa1;

    const salPessoa2 = parseFloat(document.getElementById('salarioPessoa2').value) || 0;
    const extPessoa2 = parseFloat(document.getElementById('extraPessoa2').value) || 0;
    const rendaPessoa2 = salPessoa2 + extPessoa2;

    let totalFixos = 0;
    document.querySelectorAll('.valor-fixo').forEach(input => totalFixos += parseFloat(input.value) || 0);
    const fixoDividido = totalFixos / 2;

    let indivPessoa1 = 0;
    document.querySelectorAll('.conta-indiv-pessoa1 .valor-indiv').forEach(i => indivPessoa1 += parseFloat(i.value) || 0);
    const dividaPessoa1 = parseFloat(document.getElementById('dividaPessoa1').value) || 0;
    const totalIndivPessoa1 = indivPessoa1 + dividaPessoa1;

    let indivPessoa2 = 0;
    document.querySelectorAll('.conta-indiv-pessoa2 .valor-indiv').forEach(i => indivPessoa2 += parseFloat(i.value) || 0);
    const dividaPessoa2 = parseFloat(document.getElementById('dividaPessoa2').value) || 0;
    const totalIndivPessoa2 = indivPessoa2 + dividaPessoa2;

    const saldoPessoa1 = rendaPessoa1 - (fixoDividido + totalIndivPessoa1);
    const saldoPessoa2 = rendaPessoa2 - (fixoDividido + totalIndivPessoa2);

    document.getElementById('resFixoTotal').innerText = formatarMoeda(totalFixos);
    document.getElementById('resFixoDividido').innerText = formatarMoeda(fixoDividido);
    document.querySelectorAll('.resFixoParte').forEach(el => el.innerText = formatarMoeda(fixoDividido));

    document.getElementById('resRendaPessoa1').innerText = formatarMoeda(rendaPessoa1);
    document.getElementById('resIndivPessoa1').innerText = formatarMoeda(totalIndivPessoa1);
    document.getElementById('resSaldoPessoa1').innerText = formatarMoeda(saldoPessoa1);
    document.getElementById('boxPessoa1').className = saldoPessoa1 >= 0 ? 'alivio' : 'atencao';

    document.getElementById('resRendaPessoa2').innerText = formatarMoeda(rendaPessoa2);
    document.getElementById('resIndivPessoa2').innerText = formatarMoeda(totalIndivPessoa2);
    document.getElementById('resSaldoPessoa2').innerText = formatarMoeda(saldoPessoa2);
    document.getElementById('boxPessoa2').className = saldoPessoa2 >= 0 ? 'alivio' : 'atencao';

    // Resumo combinado do casal — responde "quanto sobra pra nós dois juntos?"
    const rendaCasal = rendaPessoa1 + rendaPessoa2;
    const saldoCasal = saldoPessoa1 + saldoPessoa2;
    document.getElementById('resRendaCasal').innerText = formatarMoeda(rendaCasal);
    document.getElementById('resSaldoCasal').innerText = formatarMoeda(saldoCasal);
    document.getElementById('boxCasal').className = saldoCasal >= 0 ? 'alivio' : 'atencao';

    const divInvestPessoa1 = document.getElementById('investPessoa1');
    if (saldoPessoa1 >= 100) {
        divInvestPessoa1.innerHTML = `💡 <strong>Vamos investigar esse dinheiro sobrando?</strong><br>Sugerimos guardar R$ 100,00 na sua <b>Reserva de Emergência</b> este mês!`;
        divInvestPessoa1.style.display = 'block';
    } else { divInvestPessoa1.style.display = 'none'; }

    const divInvestPessoa2 = document.getElementById('investPessoa2');
    if (saldoPessoa2 >= 100) {
        divInvestPessoa2.innerHTML = `💡 <strong>Vamos investigar esse dinheiro sobrando?</strong><br>Sugerimos guardar R$ 100,00 na sua <b>Reserva de Emergência</b> este mês!`;
        divInvestPessoa2.style.display = 'block';
    } else { divInvestPessoa2.style.display = 'none'; }

    desenharGrafico(totalFixos, totalIndivPessoa1, totalIndivPessoa2, nome1, nome2);
    salvarDados();
}

// =====================================================
// GRÁFICO (Chart.js)
// =====================================================

function desenharGrafico(fixos, valorPessoa1, valorPessoa2, nome1, nome2) {
    const canvas = document.getElementById('chartResumo');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (meuGrafico) meuGrafico.destroy();

    const isDarkMode = document.body.classList.contains('dark-mode');
    const corTexto = isDarkMode ? '#e0e0e0' : '#333333';
    const corBorda = isDarkMode ? '#1e1e1e' : '#ffffff';

    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Fixos da Casa', `Contas ${nome1}`, `Contas ${nome2}`],
            datasets: [{
                data: [fixos, valorPessoa1, valorPessoa2],
                backgroundColor: ['#3498db', '#9b59b6', '#e67e22'],
                borderColor: corBorda,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: corTexto, font: { size: 14 } } } },
            animation: { duration: 500 }
        }
    });
}

// =====================================================
// PERSISTÊNCIA (localStorage, por mês)
// =====================================================

function salvarDados() {
    const mesAtual = document.getElementById('seletorMes').value;
    if (!mesAtual) return;

    const { nome1, nome2 } = obterNomes();
    let bancoDeDados = JSON.parse(localStorage.getItem('planilhaMensalCompleta')) || {};

    const dadosDoMes = {
        nomes: { pessoa1: nome1, pessoa2: nome2 },
        rendas: {
            salarioPessoa1: document.getElementById('salarioPessoa1').value,
            extraPessoa1: document.getElementById('extraPessoa1').value,
            salarioPessoa2: document.getElementById('salarioPessoa2').value,
            extraPessoa2: document.getElementById('extraPessoa2').value,
        },
        dividas: {
            pessoa1: document.getElementById('dividaPessoa1').value,
            pessoa2: document.getElementById('dividaPessoa2').value
        },
        custosFixos: Array.from(document.querySelectorAll('.conta-fixa')).map(linha => ({
            nome: linha.querySelector('.nome-fixo').value,
            valor: linha.querySelector('.valor-fixo').value,
            data: linha.querySelector('.data-fixo').value,
            isBase: linha.querySelector('.nome-fixo').readOnly,
            pago: linha.querySelector('.checkbox-pago').checked,
            obs: linha.querySelector('.obs-fixo').value
        })),
        indivPessoa1: Array.from(document.querySelectorAll('.conta-indiv-pessoa1')).map(linha => ({
            nome: linha.querySelector('.nome-indiv').value,
            valor: linha.querySelector('.valor-indiv').value,
            pago: linha.querySelector('.checkbox-pago').checked,
            obs: linha.querySelector('.obs-indiv').value,
            categoria: linha.querySelector('.categoria-indiv').value
        })),
        indivPessoa2: Array.from(document.querySelectorAll('.conta-indiv-pessoa2')).map(linha => ({
            nome: linha.querySelector('.nome-indiv').value,
            valor: linha.querySelector('.valor-indiv').value,
            pago: linha.querySelector('.checkbox-pago').checked,
            obs: linha.querySelector('.obs-indiv').value,
            categoria: linha.querySelector('.categoria-indiv').value
        }))
    };

    bancoDeDados[mesAtual] = dadosDoMes;
    localStorage.setItem('planilhaMensalCompleta', JSON.stringify(bancoDeDados));
}

function carregarDados() {
    const mesAtual = document.getElementById('seletorMes').value;
    const bancoDeDados = JSON.parse(localStorage.getItem('planilhaMensalCompleta')) || {};
    const dados = bancoDeDados[mesAtual];

    document.getElementById('lista-fixos').innerHTML = '';
    document.getElementById('lista-indiv-pessoa1').innerHTML = '';
    document.getElementById('lista-indiv-pessoa2').innerHTML = '';
    document.getElementById('ordenarFixos').value = 'padrao';

    if (dados) {
        document.getElementById('nomePessoa1').value = (dados.nomes && dados.nomes.pessoa1) ? dados.nomes.pessoa1 : '';
        document.getElementById('nomePessoa2').value = (dados.nomes && dados.nomes.pessoa2) ? dados.nomes.pessoa2 : '';

        document.getElementById('salarioPessoa1').value = dados.rendas.salarioPessoa1 || '';
        document.getElementById('extraPessoa1').value = dados.rendas.extraPessoa1 || '';
        document.getElementById('salarioPessoa2').value = dados.rendas.salarioPessoa2 || '';
        document.getElementById('extraPessoa2').value = dados.rendas.extraPessoa2 || '';

        document.getElementById('dividaPessoa1').value = (dados.dividas && dados.dividas.pessoa1) ? dados.dividas.pessoa1 : '';
        document.getElementById('dividaPessoa2').value = (dados.dividas && dados.dividas.pessoa2) ? dados.dividas.pessoa2 : '';

        if (dados.custosFixos && dados.custosFixos.length > 0) {
            dados.custosFixos.forEach(item => addFixoHTML(item.nome, item.valor, item.data, item.isBase, item.pago, item.obs));
        } else {
            addFixoHTML('Alimentação Base', '', '', true, false, '');
        }

        if (dados.indivPessoa1) dados.indivPessoa1.forEach(item => addIndivHTML('pessoa1', item.nome, item.valor, item.pago, item.obs, item.categoria));
        if (dados.indivPessoa2) dados.indivPessoa2.forEach(item => addIndivHTML('pessoa2', item.nome, item.valor, item.pago, item.obs, item.categoria));

    } else {
        document.getElementById('nomePessoa1').value = '';
        document.getElementById('nomePessoa2').value = '';
        document.getElementById('salarioPessoa1').value = '';
        document.getElementById('extraPessoa1').value = '';
        document.getElementById('salarioPessoa2').value = '';
        document.getElementById('extraPessoa2').value = '';
        document.getElementById('dividaPessoa1').value = '';
        document.getElementById('dividaPessoa2').value = '';

        addFixoHTML('Alimentação Base', '', '', true, false, '');
    }

    atualizarNomes();
}

// =====================================================
// BACKUP (exportar / importar JSON)
// =====================================================

function exportarBackup() {
    const dados = localStorage.getItem('planilhaMensalCompleta');
    if (!dados || dados === "{}") { alert('Não há dados salvos para exportar!'); return; }

    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_planilha_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importarBackup(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function(e) {
        try {
            const dadosImportados = JSON.parse(e.target.result);
            localStorage.setItem('planilhaMensalCompleta', JSON.stringify(dadosImportados));
            alert('✅ Backup restaurado com sucesso!');
            carregarDados();
        } catch (erro) {
            alert('❌ Erro: Arquivo inválido.');
        }
        document.getElementById('fileImport').value = '';
    };
    leitor.readAsText(arquivo);
}
