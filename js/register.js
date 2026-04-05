document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');

    errorDiv.textContent = '';
    errorDiv.classList.remove('show');
    successDiv.textContent = '';
    successDiv.classList.remove('show');

    const { error } = await supabaseClient.auth.signUp({ email, password });

    if (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('show');
        return;
    }

    successDiv.textContent = 'Account created! Redirecting to login...';
    successDiv.classList.add('show');
    setTimeout(() => window.location.href = 'login.html', 1500);
});
