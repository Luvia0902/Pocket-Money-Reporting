
import { store } from './store.js?v=3.22';
import { ExpensesView } from './views/Expenses.js?v=3.22';
import { AdminView } from './views/Admin.js?v=3.22';
import { LoginView } from './views/Login.js?v=3.22';
const routes = {
    '/': ExpensesView,
    '/admin': AdminView,
    '/login': LoginView
};

class App {
    constructor() {
        this.currentUser = store.getCurrentUser();
    }

    async init() {
        // Show loading state
        document.getElementById('main-content').innerHTML = `
            <div style="height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                <i class="fas fa-circle-notch fa-spin" style="font-size:3rem; color:var(--primary); margin-bottom:1rem;"></i>
                <div style="color:var(--text-secondary);">Connecting to Secure Vault...</div>
            </div>
        `;

        await store.init();

        this.router();
        window.addEventListener('hashchange', () => this.router());
    }

    renderNavbar() {
        const nav = document.getElementById('navbar');
        // Clean class list to ensure it matches current CSS
        nav.className = 'floating-nav';

        if (!this.currentUser) {
            nav.innerHTML = `
                <a href="#/login" class="brand">
                    <i class="fas fa-bolt" style="color:var(--accent)"></i>
                    ZeroMoney
                </a>
            `;
            return;
        }

        // Get initials for avatar
        const initials = this.currentUser.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);

        nav.innerHTML = `
            <a href="#/" class="brand">
                <i class="fas fa-bolt" style="color:var(--accent)"></i>
                Zero<span style="color:var(--text-main)">Money</span>
            </a>
            
            <div class="nav-user">
                ${['admin', 'assistant'].includes(this.currentUser.role)
                ? `<a href="#/admin" class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.8rem;">管理後台</a>`
                : ''}
                


                <div class="user-avatar" title="${this.currentUser.name}">
                    ${initials}
                </div>
                
                <button id="btn-logout" class="nav-menu-btn" title="登出">
                   <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                store.logout();
            });
        }
    }

    router() {
        this.currentUser = store.getCurrentUser();
        const path = location.hash.slice(1) || '/';

        // Auth Guard
        if (!this.currentUser && path !== '/login') {
            location.hash = '/login';
            return;
        }

        // Redirect if logged in trying to access login
        if (this.currentUser && path === '/login') {
            location.hash = '/';
            return;
        }

        const ViewClass = routes[path] || routes['/'];

        // Role Guard
        if (path === '/admin' && this.currentUser && !['admin', 'assistant'].includes(this.currentUser.role)) {
            location.hash = '/';
            return;
        }

        // Render Navbar first as it depends on auth state
        this.renderNavbar();

        const view = new ViewClass();
        document.getElementById('main-content').innerHTML = view.render();
        if (view.afterRender) view.afterRender();

        // Update Nav active state
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('href') === '#' + path) el.classList.add('active');
        });
    }
}

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
