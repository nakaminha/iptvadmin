// auth.js - Sistema de Autenticação para Dashboard
class AuthManager {
    constructor() {
      this.isAuthenticated = false;
      this.checkAuthInterval = null;
      this.config = {
        sessionEndpoint: '/api/auth/check-session',
        loginPage: '/login.html',
        logoutEndpoint: '/api/auth/logout',
        checkInterval: 300000, // 5 minutos
      };
    }
  
    /**
     * Inicializa o sistema de autenticação
     */
    init() {
      this.setupLogoutButton();
      this.checkAuth(); // Verificação inicial
      
      // Verificação periódica
      this.checkAuthInterval = setInterval(
        () => this.checkAuth(), 
        this.config.checkInterval
      );
      
      // Verifica quando a página ganha foco
      window.addEventListener('focus', () => this.checkAuth());
    }
  
    /**
     * Verifica o status de autenticação
     */
    async checkAuth() {
      try {
        const response = await fetch(this.config.sessionEndpoint, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
  
        if (!response.ok) {
          throw new Error('Sessão inválida');
        }
  
        const data = await response.json();
        this.handleAuthSuccess(data.user);
        
      } catch (error) {
        this.handleAuthFailure(error);
      }
    }
  
    /**
     * Configura o botão de logout
     */
    setupLogoutButton() {
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.logout();
        });
      }
    }
  
    /**
     * Executa o logout
     */
    async logout() {
      try {
        // Mostra estado de carregamento
        document.body.classList.add('logging-out');
        
        await fetch(this.config.logoutEndpoint, {
          method: 'POST',
          credentials: 'include'
        });
        
        this.redirectToLogin('logout_success');
        
      } catch (error) {
        console.error('Erro no logout:', error);
        this.redirectToLogin('logout_error');
      }
    }
  
    /**
     * Atualiza a UI quando autenticado
     */
    handleAuthSuccess(user) {
      this.isAuthenticated = true;
      
      // Atualiza o nome do usuário
      const usernameElement = document.getElementById('username');
      if (usernameElement) {
        usernameElement.textContent = user.username;
      }
      
      // Mostra conteúdo protegido
      document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = 'block';
      });
      
      // Esconde conteúdo de login
      document.querySelectorAll('.guest-only').forEach(el => {
        el.style.display = 'none';
      });
    }
  
    /**
     * Trata falhas de autenticação
     */
    handleAuthFailure(error) {
      console.error('Falha na autenticação:', error);
      this.isAuthenticated = false;
      this.redirectToLogin('session_expired');
    }
  
    /**
     * Redireciona para a página de login
     */
    redirectToLogin(reason) {
      // Limpa o intervalo de verificação
      clearInterval(this.checkAuthInterval);
      
      // Limpa o estado
      this.isAuthenticated = false;
      
      // Redireciona de forma segura (replace não deixa voltar)
      window.location.replace(`${this.config.loginPage}?reason=${reason}`);
    }
  }
  
  // Inicializa quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    const authManager = new AuthManager();
    authManager.init();
  });