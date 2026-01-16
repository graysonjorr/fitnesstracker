// Settings page functionality

// Logout function
function logout() {
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Add logout button listener
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});