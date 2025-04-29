// Abrir/Fechar Modal
const openModal = document.getElementById('openModal');
const modal = document.getElementById('modal');
const fecharModal = document.getElementById('fecharModal');
const formCliente = document.getElementById('formCliente');
const tabelaClientes = document.getElementById('tabelaClientes');

let clientes = [];

openModal.addEventListener('click', () => modal.classList.remove('hidden'));
fecharModal.addEventListener('click', () => modal.classList.add('hidden'));

// Cadastro Cliente
formCliente.addEventListener('submit', (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const telefone = document.getElementById('telefone').value;
  const plano = document.getElementById('plano').value;
  const status = document.getElementById('status').value;

  const novoCliente = { nome, email, telefone, plano, status };
  clientes.push(novoCliente);

  atualizarTabela();
  atualizarContadores();

  formCliente.reset();
  modal.classList.add('hidden');
});

// Atualiza Tabela
function atualizarTabela() {
  tabelaClientes.innerHTML = '';
  clientes.forEach(cliente => {
    tabelaClientes.innerHTML += `
      <tr class="border-b border-gray-700">
        <td class="py-2">${cliente.nome}</td>
        <td class="py-2">${cliente.email}</td>
        <td class="py-2">${cliente.telefone}</td>
        <td class="py-2">${cliente.plano}</td>
        <td class="py-2">${cliente.status}</td>
      </tr>
    `;
  });
}

// Atualiza Contadores
function atualizarContadores() {
  document.getElementById('ativos').innerText = clientes.filter(c => c.status === 'Ativo').length;
  document.getElementById('inativos').innerText = clientes.filter(c => c.status === 'Inativo').length;
  document.getElementById('teste').innerText = clientes.filter(c => c.status === 'Teste').length;
}

