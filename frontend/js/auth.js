// Authentication Module
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function initAuth() {
  const loggedIn = localStorage.getItem('loggedIn');
  
  if (!loggedIn) {
    showLoginForm();
  } else {
    showMainApp();
  }
}

function showLoginForm() {
  document.getElementById('loginContainer').style.display = 'flex';
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('main').style.display = 'none';
  document.getElementById('signUpModal').classList.remove('open');
  document.getElementById('forgotModal').classList.remove('open');
  
  // Login button
  document.getElementById('loginBtn').onclick = function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
      toast('Please enter username and password', 'error');
      return;
    }
    
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('sf_username', username);
      showMainApp();
      toast('Logged in successfully!', 'success');
    } else {
      toast('Invalid username or password', 'error');
    }
  };
  
  // Sign Up Link
  document.getElementById('signUpLink').onclick = function(e) {
    e.preventDefault();
    document.getElementById('signUpModal').classList.add('open');
  };
  
  // Forgot Password Link
  document.getElementById('forgotPassword').onclick = function(e) {
    e.preventDefault();
    document.getElementById('forgotModal').classList.add('open');
  };
  
  // Sign Up Button
  document.getElementById('signUpBtn').onclick = function(e) {
    e.preventDefault();
    const username = document.getElementById('signUpUsername').value.trim();
    const password = document.getElementById('signUpPassword').value.trim();
    const confirm = document.getElementById('confirmPassword').value.trim();
    
    if (!username || !password || !confirm) {
      toast('Please fill all fields', 'error');
      return;
    }
    
    if (password !== confirm) {
      toast('Passwords do not match', 'error');
      return;
    }
    
    const users = getUsers();
    if (users.find(u => u.username === username)) {
      toast('Username already exists', 'error');
      return;
    }
    
    users.push({ username, password });
    saveUsers(users);
    toast('Account created! Please login.', 'success');
    
    // Clear fields
    document.getElementById('signUpUsername').value = '';
    document.getElementById('signUpPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // Reset password visibility
    document.getElementById('signUpPassword').type = 'password';
    document.getElementById('confirmPassword').type = 'password';
    document.getElementById('toggleSignUpPwd').textContent = '👁️';
    document.getElementById('toggleConfirmPwd').textContent = '👁️';
    
    // Close modal
    document.getElementById('signUpModal').classList.remove('open');
  };
  
  // Password toggle buttons
  document.getElementById('toggleSignUpPwd').onclick = function(e) {
    e.preventDefault();
    const pwdField = document.getElementById('signUpPassword');
    if (pwdField.type === 'password') {
      pwdField.type = 'text';
      this.textContent = '🙈';
    } else {
      pwdField.type = 'password';
      this.textContent = '👁️';
    }
  };
  
  document.getElementById('toggleConfirmPwd').onclick = function(e) {
    e.preventDefault();
    const pwdField = document.getElementById('confirmPassword');
    if (pwdField.type === 'password') {
      pwdField.type = 'text';
      this.textContent = '🙈';
    } else {
      pwdField.type = 'password';
      this.textContent = '👁️';
    }
  };
  
  // Send Reset Button
  document.getElementById('sendResetBtn').onclick = function(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!email) {
      toast('Please enter an email', 'error');
      return;
    }
    
    toast('Reset link sent to your email!', 'success');
    document.getElementById('resetEmail').value = '';
    document.getElementById('forgotModal').classList.remove('open');
  };
  
  // Close modal buttons
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      document.getElementById('signUpModal').classList.remove('open');
      document.getElementById('forgotModal').classList.remove('open');
    };
  });
  
  // Click outside modal to close
  document.getElementById('signUpModal').onclick = function(e) {
    if (e.target === this) {
      this.classList.remove('open');
    }
  };
  
  document.getElementById('forgotModal').onclick = function(e) {
    if (e.target === this) {
      this.classList.remove('open');
    }
  };
}

function showMainApp() {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('sidebar').style.display = '';
  document.getElementById('main').style.display = '';
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = function(e) {
      e.preventDefault();
      localStorage.removeItem('loggedIn');
      localStorage.removeItem('sf_username');
      location.reload();
    };
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initAuth();
});
