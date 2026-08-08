# 💰 Planilha Financeira Familiar

Aplicação web (PWA) para controle financeiro mensal compartilhado entre duas pessoas — divide contas fixas da casa, controla gastos individuais por categoria e mostra o saldo final de cada pessoa e do casal, mês a mês.

Projeto pessoal desenvolvido de forma autodidata, com uso ativo de ferramentas de IA como apoio no processo de aprendizado, revisão de lógica e boas práticas — mantendo o raciocínio e as decisões técnicas por conta própria.

---

## 📜 Histórico do projeto

### Versão inicial

A primeira versão nasceu de uma necessidade real: dividir as contas da casa de forma justa e acompanhar o saldo de cada pessoa mês a mês, sem depender de planilha manual. Tinha:

- Cálculo de renda, custos fixos divididos e custos individuais
- Persistência por mês via `localStorage`
- Gráfico de distribuição de gastos (Chart.js)
- Backup e restauração em arquivo `.json`
- Suporte a modo escuro
- Estrutura de PWA (instalável, funciona offline)

Limitação da v1: os nomes das duas pessoas estavam **fixos no código-fonte**, o que tornava o projeto pouco reutilizável e expunha dado pessoal desnecessariamente num repositório público.

### Versão atual — refatoração e melhorias de UX

A segunda etapa revisou lógica, fluxo de uso e experiência do usuário de ponta a ponta. Principais mudanças:

| Área | Antes | Depois |
|---|---|---|
| Nomes das pessoas | Fixos no código (`"Ariele"`, `"Cassiano"`) | Campos editáveis, salvos por mês, sem dado pessoal no código |
| Login | Pedia o nome toda vez que o app abria | Lembra o usuário entre sessões (com opção de trocar) |
| Estrutura da tela | Backup aparecia antes de qualquer dado financeiro | Backup movido para o fim; fluxo segue a ordem lógica de preenchimento |
| Resumo financeiro | Só individual (2 cards separados) | Card combinado do casal + cards individuais |
| Data das contas fixas | Campo de texto livre validado por regex (`dd/mm/aaaa`) | `<input type="date">` nativo do navegador |
| Exclusão de linha | Removia direto ao clicar | Pede confirmação antes de excluir |
| Exibição de valores | `3000.00` (sem separador) | `3.000,00` (formato monetário brasileiro) |
| Identidade visual | Ícone de PWA hospedado em CDN externo | Ícone próprio (`icon-192.png` / `icon-512.png`), versionado no repositório |
| Organização do código | Funções soltas, sem agrupamento | Código dividido em seções comentadas (inicialização, nomes, linhas dinâmicas, cálculo, gráfico, persistência, backup) |

Todas as mudanças foram testadas em navegador headless (Playwright) antes de entrar no repositório — incluindo simulação de preenchimento, exclusão de linha com confirmação, persistência de login entre recarregamentos, e verificação do cálculo de saldo.

---

## ✨ Funcionalidades atuais

- **Login persistente** — lembra quem está usando o app no navegador, sem pedir nome toda vez
- **Nomes configuráveis** — cada pessoa define o próprio nome, refletido dinamicamente em todos os títulos
- **Divisão automática de contas fixas** entre as duas pessoas
- **Contas individuais categorizadas** — Alimentação, Lazer, Saúde, Transporte, Vestuário, Outros
- **Controle de dívidas** por pessoa, somado ao cálculo de saldo final
- **Persistência por mês** — cada mês é salvo separadamente, com navegação entre meses
- **Resumo combinado do casal** — mostra renda e saldo somados dos dois
- **Gráfico de distribuição de gastos** (Chart.js), reativo ao tema claro/escuro
- **Modo escuro** com detecção automática da preferência do sistema
- **Ordenação de contas fixas** por valor ou data de vencimento
- **Seletor de data nativo** para vencimento das contas fixas
- **Confirmação antes de excluir** qualquer linha
- **Valores formatados** em padrão monetário brasileiro
- **Backup e restauração** dos dados em arquivo `.json`
- **Sugestão automática de reserva de emergência** quando sobra saldo no mês
- **Instalável como app** (PWA) — funciona offline via Service Worker

---

## 🧭 Fluxo de uso

1. **Identificação** — na primeira vez, você informa seu nome. Nas próximas vezes, o app abre direto (o nome fica salvo no navegador; use "🔓 Trocar usuário" para trocar sem apagar dados).
2. **Mês de referência** — escolhe o mês que quer visualizar ou editar. Cada mês tem seus próprios dados, independentes dos outros.
3. **Rendas e Entradas** — preenche o nome das duas pessoas e a renda de cada uma (salário + extra).
4. **Custos Fixos da Casa** — adiciona as contas fixas (aluguel, luz, internet etc.). O total é dividido automaticamente ao meio.
5. **Custos Individuais e Dívidas** — cada pessoa lança seus próprios gastos, já categorizados, e eventuais dívidas a quitar no mês.
6. **Resumo Financeiro** — mostra o saldo combinado do casal, o saldo individual de cada pessoa, e um gráfico de como o dinheiro foi distribuído.
7. **Backup** — a qualquer momento, é possível baixar um backup de todos os meses salvos, ou restaurar um backup anterior.

Todo o cálculo acontece em tempo real: qualquer campo alterado já atualiza o resumo e o gráfico na hora, sem precisar clicar em "salvar" — o salvamento também acontece automaticamente em segundo plano.

---

## 🧠 Lógica interna

### Cálculo do saldo (`calcular()`)

Para cada pessoa, o saldo final segue a fórmula:

```
saldo = renda − (metade dos custos fixos + custos individuais + dívidas)
```

O saldo do casal é simplesmente a soma dos dois saldos individuais — permite ver de forma combinada se o mês fechou no positivo, mesmo que uma pessoa tenha saldo negativo e a outra positivo.

### Persistência por mês

Os dados são salvos no `localStorage` como um único objeto, onde cada chave é um mês (`aaaa-mm`) e o valor é um objeto completo com nomes, rendas, dívidas, custos fixos e individuais daquele mês específico:

```js
{
  "2026-08": { nomes: {...}, rendas: {...}, custosFixos: [...], ... },
  "2026-09": { ... }
}
```

Trocar o seletor de mês recarrega os campos com os dados daquele mês (ou os deixa em branco, se for um mês novo).

### Ordenação de contas fixas

A ordenação por data converte o valor do `<input type="date">` (formato ISO `aaaa-mm-dd`) em timestamp, o que permite comparar datas corretamente mesmo com contas sem data preenchida (que vão para o final da lista).

### Backup

Exportar gera um arquivo `.json` com todos os meses salvos, usando a Blob API do navegador. Importar lê o arquivo escolhido, valida se é um JSON válido, e substitui os dados salvos — com tratamento de erro caso o arquivo esteja corrompido ou não seja um backup válido.

---

## 🛠️ Tecnologias

- HTML5, CSS3, JavaScript (vanilla, sem framework)
- [Chart.js](https://www.chartjs.org/) — gráfico de rosca (doughnut chart)
- Web Storage API (`localStorage`) — persistência de dados no navegador
- Service Worker + Web App Manifest — funcionalidade de PWA (instalável, offline)

---

## 🚀 Como usar

1. Clone o repositório ou baixe os arquivos
2. Abra `index.html` em qualquer navegador moderno
3. Informe seu nome na tela inicial
4. Preencha os nomes das duas pessoas, rendas, contas fixas e individuais
5. Os dados são salvos automaticamente no navegador, por mês

Não requer instalação de dependências nem servidor — é uma aplicação client-side pura.

---

## 📌 Decisões técnicas

- **Sem framework**: projeto pensado para reforçar fundamentos de JavaScript puro (manipulação de DOM, arrays, localStorage) antes de introduzir abstrações de frameworks
- **Nomes das pessoas são configuráveis em tempo de uso**, não fixos no código-fonte — evita dado pessoal versionado e torna o projeto reutilizável por qualquer pessoa
- **Login persistente via localStorage**, não uma autenticação real — o objetivo é conveniência de uso doméstico, não segurança de acesso
- **Confirmação nativa (`confirm()`) antes de ações destrutivas** — simples e suficiente para o escopo do projeto, sem necessidade de modal customizado

---

## 🔭 Possíveis evoluções futuras

- Migrar persistência de `localStorage` para IndexedDB (maior capacidade de dados)
- Adicionar categorização também aos custos fixos (hoje só os individuais têm)
- Indicador visual de "dados salvos" após cada alteração
- Exportar relatório em PDF
- Suporte a mais de duas pessoas no mesmo grupo financeiro

---

Desenvolvido por [Cassiano Oliveira De Paula](https://github.com/Cassi-dev)
