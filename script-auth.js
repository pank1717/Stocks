// Authentication script - Load user profile and handle logout

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
});

async function loadUserProfile() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();

        if (data.authenticated && data.user) {
            displayUserProfile(data.user);
        } else {
            // Not authenticated, redirect to login
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        // On error, redirect to login
        window.location.href = '/login';
    }
}

function displayUserProfile(user) {
    const userProfileElement = document.getElementById('userProfile');

    if (!userProfileElement) return;

    // Get initials for avatar
    const initials = getInitials(user.name || user.email);

    userProfileElement.innerHTML = `
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
            <div class="user-name">${user.name || 'Utilisateur'}</div>
            <div class="user-email">${user.email || user.username}</div>
        </div>
        <a href="/logout" class="logout-btn">Déconnexion</a>
    `;
}

function getInitials(name) {
    if (!name) return '?';

    const parts = name.trim().split(' ');

    if (parts.length >= 2) {
        // First letter of first name + first letter of last name
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else {
        // Just first two letters of name
        return name.substring(0, 2).toUpperCase();
    }
}

// Override the original script.js functions to handle authentication errors
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    try {
        const response = await originalFetch(...args);

        // If 401 Unauthorized, redirect to login
        if (response.status === 401) {
            window.location.href = '/login';
            return response;
        }

        return response;
    } catch (error) {
        throw error;
    }
};
