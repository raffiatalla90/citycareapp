import { login } from '../../data/api';
import { announceToScreenReader } from '../../utils';
import CONFIG from '../../config';

export default class LoginPage {
  async render() {
    return `
      <section class="auth-section container">
        <div class="auth-container">
          <h1>Login</h1>
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                aria-required="true"
                autocomplete="email"
                placeholder="Enter your email"
              />
              <span class="error-message" id="email-error"></span>
            </div>
            
            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required 
                aria-required="true"
                autocomplete="current-password"
                minlength="8"
                placeholder="Enter your password"
              />
              <span class="error-message" id="password-error"></span>
            </div>
            
            <button type="submit" class="btn-primary">Login</button>
            <div id="form-message" class="form-message"></div>
          </form>
          
          <p class="auth-switch">
            Don't have an account? <a href="#/register">Register here</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageDiv = document.getElementById('form-message');

    // Check if already logged in
    if (localStorage.getItem(CONFIG.TOKEN_KEY)) {
      window.location.hash = '#/';
      return;
    }

    // Form validation
    emailInput.addEventListener('blur', () => {
      this._validateEmail(emailInput);
    });

    passwordInput.addEventListener('blur', () => {
      this._validatePassword(passwordInput);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const isEmailValid = this._validateEmail(emailInput);
      const isPasswordValid = this._validatePassword(passwordInput);
      
      if (!isEmailValid || !isPasswordValid) {
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';

      try {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        const response = await login(email, password);
        
        if (response.error === false && response.loginResult.token) {
          localStorage.setItem(CONFIG.TOKEN_KEY, response.loginResult.token);
          localStorage.setItem('user_name', response.loginResult.name);
          
          this._showMessage('Login successful! Redirecting...', 'success');
          
          setTimeout(() => {
            window.location.hash = '#/';
          }, 1000);
        }
      } catch (error) {
        this._showMessage(error.message || 'Login failed. Please try again.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
      }
    });
  }

  _validateEmail(emailInput) {
    const emailError = document.getElementById('email-error');
    const email = emailInput.value.trim();
    
    if (!email) {
      emailError.textContent = 'Email is required';
      emailInput.setAttribute('aria-invalid', 'true');
      return false;
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      emailError.textContent = 'Please enter a valid email address';
      emailInput.setAttribute('aria-invalid', 'true');
      return false;
    }
    
    emailError.textContent = '';
    emailInput.setAttribute('aria-invalid', 'false');
    return true;
  }

  _validatePassword(passwordInput) {
    const passwordError = document.getElementById('password-error');
    const password = passwordInput.value;
    
    if (!password) {
      passwordError.textContent = 'Password is required';
      passwordInput.setAttribute('aria-invalid', 'true');
      return false;
    }
    
    if (password.length < 8) {
      passwordError.textContent = 'Password must be at least 8 characters';
      passwordInput.setAttribute('aria-invalid', 'true');
      return false;
    }
    
    passwordError.textContent = '';
    passwordInput.setAttribute('aria-invalid', 'false');
    return true;
  }

  _showMessage(message, type) {
    const messageDiv = document.getElementById('form-message');
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;
    announceToScreenReader(message);
  }
}
