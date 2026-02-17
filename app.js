// Utility functions for the College Helper app
class CollegeHelper {
    static init() {
        this.setupAuthCheck();
        this.setupLogout();
        this.setupTheme();
    }

    // Auth management
    static setupAuthCheck() {
        const currentUser = localStorage.getItem('ch_currentUser');
        const publicPages = ['index.html', 'auth.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        if (!currentUser && !publicPages.includes(currentPage)) {
            location.href = 'auth.html';
            return;
        }

        if (currentUser && currentPage === 'auth.html') {
            location.href = 'dashboard.html';
            return;
        }
    }

    static setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    static logout() {
        localStorage.removeItem('ch_currentUser');
        location.href = 'auth.html';
    }

    // Data management
    static getData(key, userId = null) {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        return userId ? data.filter(item => item.user === userId) : data;
    }

    static saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // UI utilities
    static setupTheme() {
        const hour = new Date().getHours();
        if (hour >= 18 || hour < 6) {
            document.body.classList.add('dark-mode');
        }
    }

    static showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    }

    static formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = (now - d) / 1000; // difference in seconds

        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

        return d.toLocaleDateString();
    }

    static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Form validation
    static validateForm(formElement, rules) {
        const errors = [];
        for (const [field, fieldRules] of Object.entries(rules)) {
            const input = formElement.querySelector(`[name="${field}"]`);
            if (!input) continue;

            const value = input.value.trim();
            for (const rule of fieldRules) {
                switch (rule.type) {
                    case 'required':
                        if (!value) errors.push(rule.message);
                        break;
                    case 'minLength':
                        if (value.length < rule.value) errors.push(rule.message);
                        break;
                    case 'maxLength':
                        if (value.length > rule.value) errors.push(rule.message);
                        break;
                    case 'pattern':
                        if (!rule.value.test(value)) errors.push(rule.message);
                        break;
                }
            }
        }
        return errors;
    }

    // Search and filter
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static setupSearch(inputId, callback) {
        const searchInput = document.getElementById(inputId);
        if (searchInput) {
            const debouncedSearch = this.debounce((value) => {
                callback(value.toLowerCase());
            }, 300);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
    }

    // Animation utilities
    static animate(element, keyframes, options) {
        return element.animate(keyframes, {
            duration: 300,
            easing: 'ease-in-out',
            ...options
        });
    }

    static fadeIn(element) {
        return this.animate(element, [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ]);
    }

    static fadeOut(element) {
        return this.animate(element, [
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(20px)' }
        ]);
    }
}

// Add toast styles
const style = document.createElement('style');
style.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: #333;
        color: white;
        border-radius: 4px;
        opacity: 0;
        transform: translateY(100%);
        transition: all 0.3s ease;
        z-index: 1000;
    }
    .toast.show {
        opacity: 1;
        transform: translateY(0);
    }
    .toast-success { background: #28a745; }
    .toast-error { background: #dc3545; }
    .toast-warning { background: #ffc107; color: #333; }
    
    .dark-mode {
        background: #1a1a1a;
        color: #fff;
    }
    .dark-mode .navbar {
        background: #2c2c2c;
    }
    .dark-mode .card,
    .dark-mode .notes-panel,
    .dark-mode .auth-box {
        background: #2c2c2c;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }
`;
document.head.appendChild(style);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    CollegeHelper.init();
});