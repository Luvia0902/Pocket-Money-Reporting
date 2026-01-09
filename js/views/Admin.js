
import { store } from '../store.js';
import { formatCurrency, formatDate, generateCSV, downloadCSV } from '../utils.js';

export class AdminView {
    constructor() {
        this.activeTab = 'review'; // review, employees, settings
    }

    render() {
        const users = store.get('users');
        const expenses = store.get('expenses');
        const mappings = store.get('mappings');

        let content = '';

        // TABS
        const tabs = `
            <div class="flex gap-2 mb-4" style="border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
                <button class="btn ${this.activeTab === 'review' ? 'btn-primary' : 'btn-outline'}" data-tab="review">審核報帳</button>
                <button class="btn ${this.activeTab === 'employees' ? 'btn-primary' : 'btn-outline'}" data-tab="employees">員工管理</button>
            </div>
        `;

        // CONTENT: REVIEW
        if (this.activeTab === 'review') {
            const pending = expenses.filter(e => e.status === 'pending');
            // Group by Employee option could be added here
            content = `
                <div class="card">
                     <div class="flex justify-between mb-4">
                        <h3>待審核列表 (${pending.length})</h3>
                        <button id="btn-export-all" class="btn btn-outline" style="width:auto; padding: 0.5rem 1rem;">
                            <i class="fas fa-file-export"></i> 匯出全部 CSV
                        </button>
                     </div>
                     <div class="transaction-list">
                        ${pending.length === 0 ? '<div style="padding:1rem; text-align:center; color:var(--text-secondary)">目前沒有待審核項目</div>' : ''}
                        ${pending.map(e => {
                const employee = users.find(u => u.id === e.employeeId)?.name || 'Unknown';
                return `
                            <div class="transaction-item">
                                <div class="t-info">
                                    <h4>${e.merchant} (${employee})</h4>
                                    <div class="t-date">${formatDate(e.date)} · ${e.category}</div>
                                    <div style="font-size:0.8rem; color:var(--text-secondary)">備註: ${e.notes || '--'}</div>
                                </div>
                                <div class="text-right flex gap-2" style="align-items:center;">
                                    <div class="t-amount" style="margin-right:1rem;">${formatCurrency(e.amount)}</div>
                                    <button class="btn btn-primary" style="padding:0.25rem 0.75rem; font-size:0.8rem;" onclick="window.approveExpense('${e.id}')">核准</button>
                                </div>
                            </div>
                            `;
            }).join('')}
                     </div>
                </div>
            `;
        }

        // CONTENT: EMPLOYEES
        if (this.activeTab === 'employees') {
            content = `
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-value">${users.length}</div>
                        <div class="stat-label">總人數</div>
                    </div>
                    <div class="stat-card">
                         <div class="stat-value">${users.filter(u => u.role === 'admin').length}</div>
                        <div class="stat-label">管理員</div>
                    </div>
                </div>

                <div class="card">
                    <h3>新增員工</h3>
                    <form id="add-employee-form" class="flex gap-2" style="margin-top:1rem;">
                        <input type="text" name="name" class="input" placeholder="姓名" required>
                        <input type="email" name="email" class="input" placeholder="Email" required>
                        <select name="role" class="input" style="width: auto;">
                            <option value="employee">員工</option>
                            <option value="admin">管理員</option>
                        </select>
                        <button type="submit" class="btn btn-primary" style="width: auto;">新增</button>
                    </form>
                </div>

                <div class="card">
                     <div class="flex justify-between" style="align-items:center;">
                        <h3>員工列表</h3>
                        <button id="btn-admin-add-expense" class="btn btn-primary" style="width:auto; font-size:0.9rem;">
                            <i class="fas fa-plus"></i> 代填報帳單
                        </button>
                     </div>
                     <!-- Hidden Admin Add Form -->
                     <div id="admin-add-expense-panel" class="hidden" style="margin-top:1rem; padding:1rem; background:#f1f5f9; border-radius:0.5rem;">
                        <h4>代員工新增報帳</h4>
                        <form id="admin-expense-form" class="flex flex-column gap-2">
                             <div class="input-group">
                                <label class="label">選擇員工</label>
                                <select name="target_employee" class="input">
                                    ${users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex gap-2">
                                <input type="date" name="date" class="input" required value="${new Date().toISOString().split('T')[0]}">
                                <input type="number" name="amount" class="input" placeholder="金額" required>
                            </div>
                            <div class="flex gap-2">
                                <input type="text" name="merchant" class="input" placeholder="商家" required>
                                <input type="text" name="category" class="input" placeholder="類別">
                            </div>
                             <input type="text" name="notes" class="input" placeholder="備註">
                             <div class="flex gap-2" style="margin-top:0.5rem">
                                <button type="submit" class="btn btn-primary">確認新增</button>
                                <button type="button" id="btn-cancel-admin-add" class="btn btn-outline">取消</button>
                             </div>
                        </form>
                     </div>

                     <div class="transaction-list" style="margin-top:1rem;">
                        ${users.map(u => `
                            <div class="transaction-item">
                                <div class="t-info">
                                    <h4>${u.name} <span class="badge ${u.role === 'admin' ? 'badge-pending' : 'badge-approved'}">${u.role === 'admin' ? '管理員' : '員工'}</span></h4>
                                    <div class="t-date">${u.email}</div>
                                </div>
                                <div class="text-right">
                                     <button class="btn btn-outline" style="padding:0.25rem 0.5rem; font-size:0.8rem;" onclick="window.exportEmployee('${u.id}')">匯出 CSV</button>
                                </div>
                            </div>
                        `).join('')}
                     </div>
                </div>
            `;
        }

        // CONTENT: SETTINGS
        if (this.activeTab === 'settings') {
            content = `
                <div class="card">
                    <h3>關鍵字對應設定</h3>
                    <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1rem;">系統會根據商家名稱自動對應類別。</p>
                    
                    <form id="add-mapping-form" class="flex gap-2 mb-4">
                        <input type="text" name="keyword" class="input" placeholder="關鍵字 (例如: Uber)" required>
                        <input type="text" name="category" class="input" placeholder="類別 (例如: 交通費)" required>
                        <button type="submit" class="btn btn-primary" style="width: auto;">新增</button>
                    </form>

                     <div class="transaction-list">
                        ${mappings.map(m => `
                             <div class="transaction-item">
                                <div class="t-info">
                                    <h4>${m.keyword}</h4>
                                </div>
                                <div class="text-right">
                                    <span class="badge badge-approved">${m.category}</span>
                                </div>
                            </div>
                        `).join('')}
                     </div>
                </div>
            `;
        }

        return `<div>${tabs}${content}</div>`;
    }

    afterRender() {
        // Tab Switching
        document.querySelectorAll('button[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.tab;
                // Re-render handled by app router usually, but here we might need manual refresh or just re-render content
                // Simulating re-render by dispatching custom event or simple reload logic
                // For simplicity in Vanilla Architecture:
                const app = document.querySelector('#main-content');
                app.innerHTML = this.render();
                this.afterRender();
            });
        });

        // Global functions for inline onclicks (hacky but works for vanilla demo)
        window.approveExpense = (id) => {
            if (confirm('確定核准?')) {
                store.updateExpense(id, { status: 'approved' });
                this.refresh();
            }
        };

        window.exportEmployee = (id) => {
            const exps = store.get('expenses').filter(e => e.employeeId === id);
            const csv = generateCSV(exps);
            downloadCSV(csv, `employee_${id}_report.csv`);
        };

        // Forms
        const empForm = document.querySelector('#add-employee-form');
        if (empForm) {
            empForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(empForm);
                store.addUser({
                    name: fd.get('name'),
                    email: fd.get('email'),
                    role: fd.get('role')
                });
                alert('已新增員工！');
                this.refresh();
            });
        }

        const mapForm = document.querySelector('#add-mapping-form');
        if (mapForm) {
            mapForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(mapForm);
                store.addMapping({
                    keyword: fd.get('keyword'),
                    category: fd.get('category')
                });
                this.refresh();
            });
        }

        // Admin Add Expense Logic
        const adminAddBtn = document.querySelector('#btn-admin-add-expense');
        const adminAddPanel = document.querySelector('#admin-add-expense-panel');
        const adminAddForm = document.querySelector('#admin-expense-form');
        const cancelAdminAdd = document.querySelector('#btn-cancel-admin-add');

        if (adminAddBtn && adminAddPanel) {
            adminAddBtn.addEventListener('click', () => adminAddPanel.classList.remove('hidden'));
            cancelAdminAdd.addEventListener('click', () => adminAddPanel.classList.add('hidden'));

            adminAddForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(adminAddForm);
                store.addExpense({
                    date: fd.get('date'),
                    amount: fd.get('amount'),
                    merchant: fd.get('merchant'),
                    category: fd.get('category') || store.autoCategorize(fd.get('merchant')),
                    notes: fd.get('notes'),
                    employeeId: fd.get('target_employee'),
                    status: 'approved' // Admin added, auto approve? Or pending? Let's say Approved.
                });
                alert('已代填完成');
                this.refresh();
            });
        }


        const exportAllBtn = document.querySelector('#btn-export-all');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => {
                const exps = store.get('expenses');
                const csv = generateCSV(exps);
                downloadCSV(csv, 'all_expenses_report.csv');
            });
        }
    }

    refresh() {
        const app = document.querySelector('#main-content');
        app.innerHTML = this.render();
        this.afterRender();
    }
}
