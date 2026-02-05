/**
 * CONSTRUO 2026 - Admin Authentication Module (Supabase)
 * Handles login, logout, and session management using Supabase Auth
 */

import supabase from './supabase-config.js';

const Auth = {
    config: {
        redirectAfterLogin: 'dashboard.html',
        redirectAfterLogout: 'index.html'
    },

    init() {
        this.bindEvents();
        this.checkSession();
    },

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const togglePassword = document.querySelector('.toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    },

    async checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('admin/index.html') || 
                           currentPath.endsWith('/admin/') ||
                           currentPath.endsWith('/admin');

        console.log('[Auth] checkSession:', { session: !!session, currentPath, isLoginPage });

        if (session) {
            const profile = await this.getProfile(session.user.id);
            if (profile && isLoginPage) {
                console.log('[Auth] Redirecting to dashboard');
                window.location.href = this.config.redirectAfterLogin;
            }
        } else {
            if (!isLoginPage && currentPath.includes('/admin/')) {
                console.warn('[Auth] No valid session found, redirecting to login');
                window.location.href = this.config.redirectAfterLogout;
            }
        }
    },

    async getProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    },

    async getCurrentUser() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;

            const profile = await this.getProfile(session.user.id);
            if (!profile) return null;

            return {
                id: profile.id,
                userId: session.user.id,
                username: profile.username,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                avatar: profile.avatar,
                status: profile.status
            };
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    async handleLogin(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('.btn-login');
        const errorDiv = document.getElementById('loginError');

        const username = form.querySelector('#username').value.trim();
        const password = form.querySelector('#password').value;
        const remember = form.querySelector('#remember')?.checked || false;

        if (!username || !password) {
            this.showLoginError('Please enter username and password');
            return;
        }

        submitBtn.classList.add('loading');
        errorDiv.style.display = 'none';

        try {
            const profile = await this.getProfileByUsername(username);
            if (!profile) {
                throw new Error('Invalid username or password');
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: profile.email,
                password: password
            });

            if (error) throw error;

            if (data.session) {
                await this.logActivity('login', 'auth', `User ${username} logged in`);
                
                this.showToast('success', 'Login Successful', 'Redirecting to dashboard...');
                
                await this.delay(500);
                window.location.href = this.config.redirectAfterLogin;
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showLoginError(error.message || 'Invalid username or password');
        } finally {
            submitBtn.classList.remove('loading');
        }
    },

    async getProfileByUsername(username) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching profile by username:', error);
            return null;
        }
    },

    async handleLogout() {
        try {
            const user = await this.getCurrentUser();
            if (user) {
                await this.logActivity('logout', 'auth', `User ${user.username} logged out`);
            }

            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            this.showToast('info', 'Logged Out', 'You have been logged out successfully');
            
            setTimeout(() => {
                window.location.href = this.config.redirectAfterLogout;
            }, 500);
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('error', 'Error', 'Failed to logout');
        }
    },

    async logActivity(action, section, description) {
        try {
            const user = await this.getCurrentUser();
            
            await supabase.from('activity_logs').insert({
                action,
                section,
                description,
                user_id: user ? user.id : null,
                user_ref: user ? user.id : null,
                ip: null,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    },

    showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        const errorMessage = document.getElementById('errorMessage');

        if (errorDiv && errorMessage) {
            errorMessage.textContent = message;
            errorDiv.style.display = 'flex';
        }
    },

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const eyeOpen = document.querySelector('.eye-open');
        const eyeClosed = document.querySelector('.eye-closed');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
        } else {
            passwordInput.type = 'password';
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
        }
    },

    showToast(type, title, message) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    hasPermission(permission) {
        // Implement permission checking if needed
        return true;
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

window.Auth = Auth;
export default Auth;
