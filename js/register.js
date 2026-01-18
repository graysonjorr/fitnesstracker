const API_URL = 'http://localhost:5000/api';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const invitationCode = document.getElementById('invitationCode').value;
    const errorDiv = document.getElementById('errorMessage');
    
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, invitation_code: invitationCode })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user_id);
            localStorage.setItem('username', data.username);
            sessionStorage.setItem('isLoggedIn', 'true');
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            errorDiv.textContent = data.error || 'Registration failed';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.classList.add('show');
    }
});