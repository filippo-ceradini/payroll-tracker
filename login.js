document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // If user is already logged in, redirect to main app
    if (sessionStorage.getItem('loggedInUser')) {
        window.location.href = 'index.html';
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = e.target.username.value;
        const password = e.target.password.value;

        // Hardcoded credentials
        if (username === 'john_doe' && password === '1234') {
            sessionStorage.setItem('loggedInUser', username);
            window.location.href = 'index.html';
        } else {
            errorMessage.textContent = 'Invalid username or password.';
        }
    });
});