import { register } from '../../data/api';
import { announceToScreenReader } from '../../utils';
import CONFIG from '../../config';

export default class RegisterPage {
  async render() {
    return `
      <section class="auth-section container">
        <div class="auth-container">
          <h1>Register</h1>
          <form id="register-form" class="auth-form">
            <div class="form-group">
              <label for="name">Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                aria-required="true"
                placeholder="Enter your name"
              />
              <span class="error-message" id="name-error"></span>
            </div>
            
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                aria-required="true"
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
                minlength="8"
                placeholder="Enter your password (min. 8 characters)"
              />
              <span class="error-message" id="password-error"></span>
            </div>
            
            <button type="submit" class="btn-primary">Register</button>
            <div id="form-message" class="form-message"></div>
          </form>
          
          <p class="auth-switch">
            Already have an account? <a href="#/login">Login here</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('register-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Check if already logged in
    if (localStorage.getItem(CONFIG.TOKEN_KEY)) {
      window.location.hash = '#/';
      return;
    }

    // Form validation
    nameInput.addEventListener('blur', () => {
      this._validateName(nameInput);
    });

    emailInput.addEventListener('blur', () => {
      this._validateEmail(emailInput);
    });

    passwordInput.addEventListener('blur', () => {
      this._validatePassword(passwordInput);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const isNameValid = this._validateName(nameInput);
      const isEmailValid = this._validateEmail(emailInput);
      const isPasswordValid = this._validatePassword(passwordInput);
      
      if (!isNameValid || !isEmailValid || !isPasswordValid) {
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Registering...';

      try {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        const response = await register(name, email, password);
        
        if (response.error === false) {
          this._showMessage('Registration successful! Redirecting to login...', 'success');
          
          setTimeout(() => {
            window.location.hash = '#/login';
          }, 1500);
        }
      } catch (error) {
        this._showMessage(error.message || 'Registration failed. Please try again.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = 'Register';
      }
    });
  }

  _validateName(nameInput) {
    const nameError = document.getElementById('name-error');
    const name = nameInput.value.trim();
    
    if (!name) {
      nameError.textContent = 'Name is required';
      nameInput.setAttribute('aria-invalid', 'true');
      return false;
    }
    
    if (name.length < 3) {
      nameError.textContent = 'Name must be at least 3 characters';
      nameInput.setAttribute('aria-invalid', 'true');
      return false;
    }
    
    nameError.textContent = '';
    nameInput.setAttribute('aria-invalid', 'false');
    return true;
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
