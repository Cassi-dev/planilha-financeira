let meuGrafico = null;

window.onload = function() {
    const hoje = new Date();
    document.getElementById('seletorMes').value = hoje.toISOString().slice(0, 7);
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
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
    document.getElementById('tela-login').style.display = 'none';
    document.getElementById('app-planilha').style.display = 'block';
    carregarDados(); 
}

function togglePago(id) {
    const elemento = document.getElementById(id);
    const checkbox = elemento.querySelector('.checkbox-pago');
    checkbox.checked ? elemento.classList.add('linha-paga') : elemento.classList.remove('linha-paga');
    calcular();
}

function addFixoHTML(nome, valor, data, isBase, pago = false, obs = '') {
    const id = 'fixo-' + Date.now() + Math.floor(Math.random() * 1000);
    const isChecked = pago ? 'checked' : '';
    const classPaga = pago ? 'linha-paga' : '';
    
    const html = `
        <div class="linha-inputs conta-fixa ${classPaga}" id="${id}">
            <input type="checkbox" class="checkbox-pago" title="Marcar como pago" ${isChecked} onchange="togglePago('${id}')">
            <input type="text" class="nome-fixo" value="${nome}" placeholder="Nome da conta" ${isBase ? 'readonly' : ''} oninput="calcular()">
            <input type="number" class="valor-fixo" value="${valor}" min="0" placeholder="R$" oninput="calcular()">
            <input type="text" class="data-fixo" value="${data}" placeholder="dd/mm/aaaa" onblur="validarData(this)">
            <input type="text" class="input-obs obs-fixo" value="${obs}" placeholder="Obs/Atraso..." oninput="calcular()">
            ${!isBase ? `<button class="remover" onclick="removerLinha('${id}')">X</button>` : `<button class="remover" style="visibility:hidden">X</button>`}
        </div>
    `;
    document.getElementById('lista-fixos').insertAdjacentHTML('beforeend', html);
}

// NOVO: Adicionado o campo "Categoria" no HTML das contas individuais
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

function removerLinha(id) { document.getElementById(id).remove(); calcular(); }

function validarData(input) {
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
    if (input.value && !regex.test(input.value)) {
        alert("Formato de data inválido. Use dd/mm/aaaa"); input.value = "";
    }
    calcular();
}

function formatarDataParaOrdem(dataStr) {
    if (!dataStr) return 99999999; 
    const partes = dataStr.split('/'); return parseInt(`${partes[2]}${partes[1]}${partes[0]}`); 
}

function ordenarContas() {
    const lista = document.getElementById('lista-fixos');
    const linhas = Array.from(lista.querySelectorAll('.conta-fixa'));
    const tipo = document.getElementById('ordenarFixos').value;

    linhas.sort((a, b) => {
        const valA = parseFloat(a.querySelector('.valor-fixo').value) || 0;
        const valB = parseFloat(b.querySelector('.valor-fixo').value) || 0;
        const dataA = formatarDataParaOrdem(a.querySelector('.data-fixo').value);
        const dataB = formatarDataParaOrdem(b.querySelector('.data-fixo').value);
        if (tipo === 'valorCrescente') return valA - valB;
        if (tipo === 'valorDecrescente') return valB - valA;
        if (tipo === 'dataCrescente') return dataA - dataB;
        return 0; 
    });
    linhas.forEach(linha => lista.appendChild(linha)); salvarDados();
}

function calcular() {
    const salAriele = parseFloat(document.getElementById('salarioAriele').value) || 0;
    const extAriele = parseFloat(document.getElementById('extraAriele').value) || 0;
    const rendaAriele = salAriele + extAriele;

    const salCassiano = parseFloat(document.getElementById('salarioCassiano').value) || 0;
    const extCassiano = parseFloat(document.getElementById('extraCassiano').value) || 0;
    const rendaCassiano = salCassiano + extCassiano;

    let totalFixos = 0;
    document.querySelectorAll('.valor-fixo').forEach(input => totalFixos += parseFloat(input.value) || 0);
    const fixoDividido = totalFixos / 2;

    let indivAriele = 0;
    document.querySelectorAll('.conta-indiv-ariele .valor-indiv').forEach(i => indivAriele += parseFloat(i.value) || 0);
    const dividaAriele = parseFloat(document.getElementById('dividaAriele').value) || 0;
    const totalIndivAriele = indivAriele + dividaAriele;

    let indivCassiano = 0;
    document.querySelectorAll('.conta-indiv-cassiano .valor-indiv').forEach(i => indivCassiano += parseFloat(i.value) || 0);
    const dividaCassiano = parseFloat(document.getElementById('dividaCassiano').value) || 0;
    const totalIndivCassiano = indivCassiano + dividaCassiano;

    const saldoAriele = rendaAriele - (fixoDividido + totalIndivAriele);
    const saldoCassiano = rendaCassiano - (fixoDividido + totalIndivCassiano);

    document.getElementById('resFixoTotal').innerText = totalFixos.toFixed(2);
    document.getElementById('resFixoDividido').innerText = fixoDividido.toFixed(2);
    document.querySelectorAll('.resFixoParte').forEach(el => el.innerText = fixoDividido.toFixed(2));

    document.getElementById('resRendaAriele').innerText = rendaAriele.toFixed(2);
    document.getElementById('resIndivAriele').innerText = totalIndivAriele.toFixed(2);
    document.getElementById('resSaldoAriele').innerText = saldoAriele.toFixed(2);
    document.getElementById('boxAriele').className = saldoAriele >= 0 ? 'alivio' : 'atencao';

    document.getElementById('resRendaCassiano').innerText = rendaCassiano.toFixed(2);
    document.getElementById('resIndivCassiano').innerText = totalIndivCassiano.toFixed(2);
    document.getElementById('resSaldoCassiano').innerText = saldoCassiano.toFixed(2);
    document.getElementById('boxCassiano').className = saldoCassiano >= 0 ? 'alivio' : 'atencao';

    const divInvestAriele = document.getElementById('investAriele');
    if (saldoAriele >= 100) {
        divInvestAriele.innerHTML = `💡 <strong>Vamos investigar esse dinheiro sobrando?</strong><br>Sugerimos guardar R$ 100,00 na sua <b>Reserva de Emergência</b> este mês!`;
        divInvestAriele.style.display = 'block';
    } else { divInvestAriele.style.display = 'none'; }

    const divInvestCassiano = document.getElementById('investCassiano');
    if (saldoCassiano >= 100) {
        divInvestCassiano.innerHTML = `💡 <strong>Vamos investigar esse dinheiro sobrando?</strong><br>Sugerimos guardar R$ 100,00 na sua <b>Reserva de Emergência</b> este mês!`;
        divInvestCassiano.style.display = 'block';
    } else { divInvestCassiano.style.display = 'none'; }

    desenharGrafico(totalFixos, totalIndivAriele, totalIndivCassiano);
    salvarDados();
}

function desenharGrafico(fixos, ariele, cassiano) {
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
            labels: ['Fixos da Casa', 'Contas Ariele', 'Contas Cassiano'],
            datasets: [{
                data: [fixos, ariele, cassiano],
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

function salvarDados() {
    const mesAtual = document.getElementById('seletorMes').value; 
    if (!mesAtual) return; 

    let bancoDeDados = JSON.parse(localStorage.getItem('planilhaMensalCompleta')) || {};

    const dadosDoMes = {
        rendas: {
            salarioAriele: document.getElementById('salarioAriele').value,
            extraAriele: document.getElementById('extraAriele').value,
            salarioCassiano: document.getElementById('salarioCassiano').value,
            extraCassiano: document.getElementById('extraCassiano').value,
        },
        dividas: {
            ariele: document.getElementById('dividaAriele').value,
            cassiano: document.getElementById('dividaCassiano').value
        },
        custosFixos: Array.from(document.querySelectorAll('.conta-fixa')).map(linha => ({
            nome: linha.querySelector('.nome-fixo').value,
            valor: linha.querySelector('.valor-fixo').value,
            data: linha.querySelector('.data-fixo').value,
            isBase: linha.querySelector('.nome-fixo').readOnly,
            pago: linha.querySelector('.checkbox-pago').checked,
            obs: linha.querySelector('.obs-fixo').value
        })),
        // Salvando também a categoria escolhida
        indivAriele: Array.from(document.querySelectorAll('.conta-indiv-ariele')).map(linha => ({
            nome: linha.querySelector('.nome-indiv').value,
            valor: linha.querySelector('.valor-indiv').value,
            pago: linha.querySelector('.checkbox-pago').checked,
            obs: linha.querySelector('.obs-indiv').value,
            categoria: linha.querySelector('.categoria-indiv').value
        })),
        indivCassiano: Array.from(document.querySelectorAll('.conta-indiv-cassiano')).map(linha => ({
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
    document.getElementById('lista-indiv-ariele').innerHTML = '';
    document.getElementById('lista-indiv-cassiano').innerHTML = '';
    document.getElementById('ordenarFixos').value = 'padrao'; 

    if (dados) {
        document.getElementById('salarioAriele').value = dados.rendas.salarioAriele || '';
        document.getElementById('extraAriele').value = dados.rendas.extraAriele || '';
        document.getElementById('salarioCassiano').value = dados.rendas.salarioCassiano || '';
        document.getElementById('extraCassiano').value = dados.rendas.extraCassiano || '';
        
        document.getElementById('dividaAriele').value = (dados.dividas && dados.dividas.ariele) ? dados.dividas.ariele : '';
        document.getElementById('dividaCassiano').value = (dados.dividas && dados.dividas.cassiano) ? dados.dividas.cassiano : '';

        if (dados.custosFixos && dados.custosFixos.length > 0) {
            dados.custosFixos.forEach(item => addFixoHTML(item.nome, item.valor, item.data, item.isBase, item.pago, item.obs));
        } else {
            addFixoHTML('Alimentação Base', '', '', true, false, ''); 
        }

        // Carregando com a categoria
        if(dados.indivAriele) dados.indivAriele.forEach(item => addIndivHTML('ariele', item.nome, item.valor, item.pago, item.obs, item.categoria));
        if(dados.indivCassiano) dados.indivCassiano.forEach(item => addIndivHTML('cassiano', item.nome, item.valor, item.pago, item.obs, item.categoria));

    } else {
        document.getElementById('salarioAriele').value = '';
        document.getElementById('extraAriele').value = '';
        document.getElementById('salarioCassiano').value = '';
        document.getElementById('extraCassiano').value = '';
        document.getElementById('dividaAriele').value = '';
        document.getElementById('dividaCassiano').value = '';
        
        addFixoHTML('Alimentação Base', '', '', true, false, '');
    }
    calcular();
}

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