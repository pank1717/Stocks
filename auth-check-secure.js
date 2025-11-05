/**
 * Authentication Check for Secure Version
 * Vérifie que l'utilisateur est connecté via session serveur
 */

(async function() {
    try {
        // Vérifier la session auprès du serveur
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include' // Important pour les cookies de session
        });

        if (!response.ok) {
            // Non authentifié, rediriger vers login
            console.warn('Session expirée ou non authentifiée');
            window.location.href = '/login-secure.html';
            throw new Error('Not authenticated');
        }

        const user = await response.json();
        console.log('✅ Utilisateur authentifié:', user.username, '(' + user.role + ')');

        // Stocker les infos utilisateur pour l'application
        // (temporairement dans sessionStorage pour compatibilité avec script.js)
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        sessionStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');

    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        if (window.location.pathname !== '/login-secure.html') {
            window.location.href = '/login-secure.html';
        }
    }
})();
