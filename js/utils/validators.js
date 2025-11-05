/**
 * Form Validation Utilities
 */

/**
 * Validate email format
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password) {
    const result = {
        score: 0,
        strength: 'weak',
        feedback: []
    };

    if (!password) {
        result.feedback.push('Le mot de passe est requis');
        return result;
    }

    // Length check
    if (password.length < 8) {
        result.feedback.push('Au moins 8 caractères requis');
    } else {
        result.score += 1;
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
        result.score += 1;
    } else {
        result.feedback.push('Au moins une majuscule requise');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
        result.score += 1;
    } else {
        result.feedback.push('Au moins une minuscule requise');
    }

    // Number check
    if (/[0-9]/.test(password)) {
        result.score += 1;
    } else {
        result.feedback.push('Au moins un chiffre requis');
    }

    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) {
        result.score += 1;
    } else {
        result.feedback.push('Au moins un caractère spécial recommandé');
    }

    // Determine strength
    if (result.score <= 2) {
        result.strength = 'weak';
    } else if (result.score <= 3) {
        result.strength = 'medium';
    } else {
        result.strength = 'strong';
    }

    return result;
}

/**
 * Validate required field
 */
export function isRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
}

/**
 * Validate number is positive
 */
export function isPositiveNumber(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
}

/**
 * Validate number is positive integer
 */
export function isPositiveInteger(value) {
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= 0 && Number.isInteger(num);
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

/**
 * Sanitize string (remove HTML tags)
 */
export function sanitizeString(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '').trim();
}
