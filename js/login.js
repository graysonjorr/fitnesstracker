document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('show');
        return;
    }

    window.location.href = '../dashboard.html';
});
