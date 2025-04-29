// dashboard.js - Controle completo do Dashboard
document.addEventListener('DOMContentLoaded', async () => {
  // Elementos da UI
  const usernameElement = document.getElementById('dashboard-username');
  const logoutBtn = document.getElementById('logout-btn');
  const loadingIndicator = document.getElementById('loading-indicator');
  const contentArea = document.getElementById('dashboard-content');



  // 2. Configuração do Logout
  function setupLogout() {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        logoutBtn.disabled = true;
        logoutBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Saindo...';
        
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
        
        window.location.href = '/login.html?logout=success';
      } catch (error) {
        console.error('Erro no logout:', error);
        window.location.href = '/login.html';
      }
    });
  }

  // 3. Carregamento de Dados do Dashboard
  async function loadDashboardData() {
    try {
      const response = await fetch('/api/dashboard', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Falha ao carregar dados');
      
      const data = await response.json();
      updateDashboardUI(data);
    } catch (error) {
      showError('Falha ao carregar dados do dashboard');
    }
  }

  // 4. Atualização da UI
  function updateDashboardUI(data) {
    // Exemplo: Atualizar lista de canais
    const channelsList = document.getElementById('channels-list');
    if (channelsList && data.channels) {
      channelsList.innerHTML = data.channels.map(ch => 
        `<li class="list-group-item">${ch.name} - ${ch.status}</li>`
      ).join('');
    }
    
    // Atualizar outros elementos conforme necessário
  }

  // 5. Tratamento de Erros
  function showError(message) {
    const errorAlert = document.getElementById('error-alert');
    if (errorAlert) {
      errorAlert.textContent = message;
      errorAlert.style.display = 'block';
      setTimeout(() => errorAlert.style.display = 'none', 5000);
    }
  }

  // Inicialização
  await checkAuth();
  setupLogout();
  await loadDashboardData();
  
  // Verificação periódica (opcional)
  setInterval(checkAuth, 300000); // 5 minutos
});

// Gerar gráfico de Barras 3D (simulado)
function gerarGrafico3D() {
  const ativos = clientes.filter(c => c.status === 'Ativo').length;
  const inativos = clientes.filter(c => c.status === 'Inativo').length;
  const teste = clientes.filter(c => c.status === 'Teste').length;

  const data = [{
    type: 'bar',
    x: ['Ativos', 'Inativos', 'Teste'],
    y: [ativos, inativos, teste],
    marker: {
      color: ['#3B82F6', '#EF4444', '#EAB308']
    }
  }];

  const layout = {
    title: 'Distribuição de Clientes (3D)',
    paper_bgcolor: '#1F2937',
    plot_bgcolor: '#1F2937',
    font: {
      color: '#FFFFFF'
    },
    scene: {
      xaxis: { title: 'Status' },
      yaxis: { title: 'Quantidade' }
    }
  };

  Plotly.newPlot('grafico3d', data, layout);
}

