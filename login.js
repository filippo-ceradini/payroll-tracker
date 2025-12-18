document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // If user is already logged in, redirect to main app
    if (localStorage.getItem('loggedInUser')) {
        window.location.href = 'index.html';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        
        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('loggedInUser', data.username);
                window.location.href = 'index.html';
            } else {
                errorMessage.textContent = data.message || 'Login failed.';
            }
        } catch (error) {
            errorMessage.textContent = 'An error occurred. Please try again.';
        }
    });
});