
import { store } from './store.js';
import { ExpensesView } from './views/Expenses.js';
import { AdminView } from './views/Admin.js';
import { RulesView } from './views/Rules.js';

const routes = {
    '/': ExpensesView,
    '/admin': AdminView,
    '/rules': RulesView
};

class App {
    constructor() {
        this.currentUser = store.getCurrentUser();
    }

    init() {
        this.renderNavbar();
        this.router();

        window.addEventListener('hashchange', () => this.router());

        // Listen for store updates if needed to re-render
        // For simplicity, we stick to specific events
    }

    renderNavbar() {
        const nav = document.getElementById('navbar');
        const users = store.get('users');

        nav.innerHTML = `
            <a href="#/" class="brand">
                <i class="fas fa-wallet"></i>
                ZeroMoney
            </a>
            
            <div class="nav-links">
                <a href="#/" class="nav-item ${location.hash === '' || location.hash === '#/' ? 'active' : ''}">我的報帳</a>
                <a href="#/rules" class="nav-item">規則說明</a>
                ${this.currentUser.role === 'admin' ? '<a href="#/admin" class="nav-item">管理後台</a>' : ''}
            </div>

            <div style="margin-left:auto; display:flex; align-items:center; gap:0.5rem; font-size:0.8rem;">
                <span>${this.currentUser.name}</span>
                <select id="user-switch" style="border:1px solid #ddd; padding:2px; border-radius:4px;">
                    ${users.map(u => `<option value="${u.id}" ${u.id === this.currentUser.id ? 'selected' : ''}>${u.name} (${u.role})</option>`).join('')}
                </select>
            </div>
        `;

        document.getElementById('user-switch').addEventListener('change', (e) => {
            store.login(e.target.value);
        });
    }

    router() {
        const path = location.hash.slice(1) || '/';
        const ViewClass = routes[path] || routes['/'];

        // Simple protection
        if (path === '/admin' && this.currentUser.role !== 'admin') {
            location.hash = '/';
            return;
        }

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
