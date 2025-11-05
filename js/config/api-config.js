/**
 * API Configuration
 */

export const API_URL = window.location.origin;

export const API_ENDPOINTS = {
    // Items
    items: '/api/items',
    item: (id) => `/api/items/${id}`,
    itemHistory: (id) => `/api/items/${id}/history`,
    adjustStock: (id) => `/api/items/${id}/adjust`,
    
    // Statistics
    statistics: '/api/statistics',
    alerts: '/api/alerts',
    
    // Auth (for secure version)
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    changePassword: '/api/auth/change-password',
    
    // Users (for secure version)
    users: '/api/users',
    user: (id) => `/api/users/${id}`,
    
    // Audit logs (for secure version)
    auditLogs: '/api/audit-logs'
};
