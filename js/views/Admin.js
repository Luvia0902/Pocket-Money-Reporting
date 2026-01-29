
import { store } from '../store.js';
import { formatCurrency, formatDate, generateCSV, downloadCSV } from '../utils.js';
import { SettingsView } from './Settings.js';

export class AdminView {
    constructor() {
        this.activeTab = 'review'; // review, employees, settings, rules
        this.filterUserId = 'all';
        this.filterRangeType = 'all';
        this.fixedCategories = ['交通費', '伙食費', '文具用品', '郵電費', '運費', '交際費', '其他'];
    }

    render() {
        const users = store.get('users');
        const expenses = store.get('expenses');
        // Filter users (exclude self if needed, or just show all. Usually Admin wants to filter by sales reps)
        // Let's show all users in the filter.

        let content = '';

        // TABS
        const tabs = `
            <div class="flex gap-2 mb-4" style="background:var(--surface-light); padding:0.5rem; border-radius:var(--radius-full); display:inline-flex; border:1px solid var(--surface-border);">
                <button class="btn ${this.activeTab === 'review' ? 'btn-primary' : 'btn-outline'}" 
                    style="border-radius:var(--radius-full); padding:0.5rem 1.5rem; border:none; ${this.activeTab !== 'review' ? 'color:var(--text-secondary); background:transparent;' : ''}" 
                    data-tab="review">審核報帳</button>
                <button class="btn ${this.activeTab === 'employees' ? 'btn-primary' : 'btn-outline'}" 
                    style="border-radius:var(--radius-full); padding:0.5rem 1.5rem; border:none; ${this.activeTab !== 'employees' ? 'color:var(--text-secondary); background:transparent;' : ''}"
                    data-tab="employees">員工管理</button>
                <button class="btn ${this.activeTab === 'rules' ? 'btn-primary' : 'btn-outline'}" 
                    style="border-radius:var(--radius-full); padding:0.5rem 1.5rem; border:none; ${this.activeTab !== 'rules' ? 'color:var(--text-secondary); background:transparent;' : ''}"
                    data-tab="rules">分類規則</button>
                <button class="btn ${this.activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}" 
                    style="border-radius:var(--radius-full); padding:0.5rem 1.5rem; border:none; ${this.activeTab !== 'settings' ? 'color:var(--text-secondary); background:transparent;' : ''}"
                    data-tab="settings">雲端設定</button>
            </div>
        `;

        const filterHtml = `
             <div class="card" style="background:transparent; border:none; box-shadow:none; padding:1rem 0; margin-bottom:0.5rem;">
                <div class="flex gap-2 wrap" style="align-items:center;">
                    <label class="label" style="margin:0; min-width:auto; display:flex; align-items:center; gap:0.5rem;">
                        <i class="fas fa-filter text-secondary"></i> 篩選:
                    </label>
                    
                    <!-- User Filter -->
                    <select id="filter-user" class="input" style="width: auto; padding:0.5rem 2rem 0.5rem 1rem;">
                        <option value="all" ${this.filterUserId === 'all' ? 'selected' : ''}>所有員工</option>
                        ${users.map(u => `<option value="${u.id}" ${this.filterUserId === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                    </select>

                    <select id="report-range-type" class="input" style="width: auto; padding:0.5rem 2rem 0.5rem 1rem;">
                        <option value="all" ${this.filterRangeType === 'all' ? 'selected' : ''}>全部時間</option>
                        <option value="this_month" ${this.filterRangeType === 'this_month' ? 'selected' : ''}>本月</option>
                        <option value="last_month" ${this.filterRangeType === 'last_month' ? 'selected' : ''}>上個月</option>
                        <option value="custom" ${this.filterRangeType === 'custom' ? 'selected' : ''}>自訂範圍</option>
                    </select>
                    
                    <div id="report-custom-dates" class="flex gap-2 hidden fade-in-up">
                        <input type="date" id="report-start" class="input" style="padding:0.4rem;">
                        <span style="align-self:center; color:var(--text-secondary);">to</span>
                        <input type="date" id="report-end" class="input" style="padding:0.4rem;">
                    </div>
                </div>
            </div>
        `;

        // CONTENT: REVIEW
        if (this.activeTab === 'review') {
            // Filter Logic
            let pending = expenses.filter(e => e.status === 'pending');

            if (this.filterUserId !== 'all') {
                pending = pending.filter(e => e.employeeId === this.filterUserId);
            }
            // Date filter logic (simplified for render, real logic in export)
            // Ideally we filter view too? Yes, let's filter view too.
            // But date info is in DOM inputs for custom range... 
            // For simplicity, let's just filter by User for the view list initially or strict simple ranges.
            // Complex date filtering usually requires re-render on change.

            content = `
                ${filterHtml}
                <div class="card fade-in-up">
                     <div class="flex justify-between mb-4" style="align-items:center;">
                        <div class="flex align-center gap-2">
                            <h3 style="margin:0;">待審核列表${this.filterUserId !== 'all' ? ` (${users.find(u => u.id === this.filterUserId)?.name})` : ''}</h3>
                            <span class="badge ${pending.length > 0 ? 'badge-pending' : 'badge-approved'}">${pending.length}</span>
                        </div>
                        <button id="btn-export-pending" class="btn btn-outline" style="width:auto; padding: 0.5rem 1rem;">
                            <i class="fas fa-file-export"></i> 匯出待審核 CSV
                        </button>
                     </div>
                     <div class="transaction-list">
                        ${pending.length === 0 ? '<div style="padding:2rem; text-align:center; color:var(--text-muted);"><i class="fas fa-check-circle" style="font-size:2rem; margin-bottom:0.5rem; display:block; color:var(--success);"></i>目前無待審核項目</div>' : ''}
                        ${pending.map((e, index) => {
                const employee = users.find(u => u.id === e.employeeId)?.name || 'Unknown';
                return `
                            <div class="transaction-item fade-in-up" style="animation-delay:${index * 0.05}s">
                                <div class="t-info">
                                    <h4 style="display:flex; align-items:center; gap:0.5rem;">
                                        ${e.merchant} 
                                        <span class="badge" style="background:var(--primary-light); color:var(--primary); font-size:0.75rem;">${employee}</span>
                                    </h4>
                                    <div class="t-date">${formatDate(e.date)} · ${e.category}</div>
                                    ${e.notes ? `<div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.25rem;"><i class="fas fa-comment-alt" style="font-size:0.7rem; margin-right:4px;"></i>${e.notes}</div>` : ''}
                                </div>
                                <div class="text-right flex gap-2" style="flex-direction:column; align-items:flex-end;">
                                    <div class="t-amount" style="font-size:1.2rem;">${formatCurrency(e.amount)}</div>
                                    <button class="btn btn-primary" style="padding:0.35rem 1rem; font-size:0.85rem; border-radius:var(--radius-full);" onclick="window.approveExpense('${e.id}')">
                                        <i class="fas fa-check"></i> 核准
                                    </button>
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
                <div class="stat-grid fade-in-up">
                    <div class="stat-card">
                        <div class="stat-value">${users.length}</div>
                        <div class="stat-label">總人數</div>
                        <i class="fas fa-users" style="position:absolute; right:10px; bottom:10px; opacity:0.1; font-size:2.5rem;"></i>
                    </div>
                </div>

                <div class="card fade-in-up stagger-1">
                    <h3>新增員工</h3>
                    <form id="add-employee-form" class="flex gap-2 mb-4" style="margin-top:1rem; flex-wrap:wrap;">
                        <input type="text" name="name" class="input" placeholder="姓名" required style="flex:1; min-width:120px;">
                        <input type="email" name="email" class="input" placeholder="Email" required style="flex:1.5; min-width:200px;">
                        <select name="role" class="input" style="width:auto; flex:0.8;">
                            <option value="employee">員工</option>
                            <option value="admin">管理員</option>
                        </select>
                        <button type="submit" class="btn btn-primary" style="width: auto;">
                            <i class="fas fa-plus"></i>
                        </button>
                    </form>
                </div>

                ${filterHtml}
                <div class="card fade-in-up stagger-2">
                     <div class="flex justify-between" style="align-items:center; margin-bottom:1rem;">
                        <h3>員工列表</h3>
                        <button id="btn-admin-add-expense" class="btn btn-outline" style="width:auto; padding:0.4rem 0.8rem; font-size:0.85rem;">
                            <i class="fas fa-magic"></i> 代填報帳
                        </button>
                     </div>
                     
                     <!-- Hidden Admin Add Form -->
                     <div id="admin-add-expense-panel" class="hidden fade-in-up" style="margin-bottom:1.5rem; padding:1.5rem; background:var(--background); border-radius:var(--radius-lg); border:1px solid var(--border);">
                        <h4 style="margin-bottom:1rem;">代員工新增報帳</h4>
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
                             <div class="flex gap-2" style="margin-top:1rem; justify-content:flex-end;">
                                <button type="button" id="btn-cancel-admin-add" class="btn btn-outline" style="width:auto;">取消</button>
                                <button type="submit" class="btn btn-primary" style="width:auto;">確認新增</button>
                             </div>
                        </form>
                     </div>

                     <div class="transaction-list">
                        ${users.map((u, i) => `
                            <div class="transaction-item fade-in-up" style="animation-delay:${i * 0.05}s">
                                <div class="t-info">
                                    <h4 style="display:flex; align-items:center; gap:0.5rem;">
                                        ${u.name} 
                                        <span class="badge ${u.role === 'admin' || u.role === 'assistant' ? 'badge-pending' : 'badge-approved'}" style="font-size:0.7rem;">
                                            ${u.role === 'admin' ? 'ADMIN' : (u.role === 'assistant' ? 'ASSISTANT' : 'USER')}
                                        </span>
                                    </h4>
                                    <div class="t-date">${u.email}</div>
                                </div>
                                <div class="text-right">
                                     <button class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.8rem; border-radius:var(--radius-full);" onclick="window.exportEmployee('${u.id}')">
                                        <i class="fas fa-download"></i> 報表
                                     </button>
                                </div>
                            </div>
                        `).join('')}
                     </div>
                </div>
            `;
        }

        // CONTENT: RULES
        if (this.activeTab === 'rules') {
            const mappings = store.get('mappings');

            // Group mappings
            const grouped = {};
            this.fixedCategories.forEach(c => grouped[c] = []);

            mappings.forEach(m => {
                if (grouped[m.category]) {
                    grouped[m.category].push(m);
                } else {
                    if (!grouped['其他']) grouped['其他'] = [];
                    grouped['其他'].push(m);
                }
            });

            const groupsHtml = this.fixedCategories.map(cat => {
                const items = grouped[cat];
                if (!items || items.length === 0) return '';

                return `
                    <div class="category-group" style="margin-bottom: 2rem;">
                        <h4 style="color:var(--primary); border-bottom:1px solid var(--border); padding-bottom:0.5rem; margin-bottom:1rem;">
                            ${cat} <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:normal;">(${items.length})</span>
                        </h4>
                        <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                            ${items.map(m => `
                                 <div style="display:inline-flex; align-items:center; background:var(--surface-light); padding:0.5rem 1rem; border-radius:999px; border:1px solid var(--border); font-size:0.9rem;">
                                    <span>${m.keyword}</span>
                                    <button onclick="window.deleteMapping('${m.keyword}')" style="background:none; border:none; color:var(--text-secondary); margin-left:0.5rem; cursor:pointer; font-size:0.8rem; padding:0 2px;">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');

            content = `
                <div class="card fade-in-up">
                    <div style="text-align:center; margin-bottom:2rem;">
                        <h3 style="font-family:var(--font-heading); font-size:1.5rem; margin-bottom:0.5rem;">自動分類規則</h3>
                        <p style="color:var(--text-secondary); font-size:0.95rem;">
                            系統會掃描商家名稱，若包含以下關鍵字，將自動填入對應類別。
                        </p>
                    </div>
                    
                    <form id="add-mapping-form" class="flex gap-2 mb-4" style="background:var(--background); padding:1.25rem; border-radius:var(--radius-lg); border:1px solid var(--border); box-shadow:inset 0 2px 4px rgba(0,0,0,0.02);">
                        <div style="flex:1;">
                            <label class="label">關鍵字</label>
                            <input type="text" name="keyword" class="input" placeholder="例如: Uber, 星巴克" required>
                        </div>
                        <div style="flex:1;">
                             <label class="label">對應類別</label>
                            <select name="category" class="input">
                                ${this.fixedCategories.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                        <div style="display:flex; align-items:flex-end;">
                            <button type="submit" class="btn btn-primary" style="height:46px; width:46px; border-radius:12px; padding:0; display:flex; align-items:center; justify-content:center;">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </form>

                     <div class="rules-container">
                        ${mappings.length === 0 ? '<p style="text-align:center; color:var(--text-secondary);">尚無規則</p>' : groupsHtml}
                     </div>
                </div>
            `;
        }

        if (this.activeTab === 'settings') {
            const settingsView = new SettingsView();
            content = settingsView.render();
        }

        return `<div>${tabs}${content}</div>`;
    }

    afterRender() {
        // Tab Switching
        document.querySelectorAll('button[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeTab = btn.dataset.tab;
                this.refresh();
            });
        });

        if (this.activeTab === 'settings') {
            new SettingsView().afterRender();
            return;
        }

        // Global functions
        window.approveExpense = (id) => {
            if (confirm('確定核准?')) {
                store.updateExpense(id, { status: 'approved' });
                this.refresh();
            }
        };

        // Filter Logic
        const rangeType = document.querySelector('#report-range-type');
        const customDates = document.querySelector('#report-custom-dates');
        const userFilter = document.querySelector('#filter-user');

        if (rangeType) {
            // Restore UI state
            if (this.filterRangeType === 'custom') customDates.classList.remove('hidden');

            rangeType.addEventListener('change', (e) => {
                this.filterRangeType = e.target.value;
                if (e.target.value === 'custom') {
                    customDates.classList.remove('hidden');
                } else {
                    customDates.classList.add('hidden');
                }
                // Don't auto refresh on range yet, wait for user or maybe auto?
                // For better UX, let's refresh
                // this.refresh(); // Not updating view yet for date, just for export. 
            });
        }

        if (userFilter) {
            userFilter.addEventListener('change', (e) => {
                this.filterUserId = e.target.value;
                this.refresh();
            });
        }

        // CSV Generations
        const getFilteredExpenses = (baseList = store.get('expenses')) => {
            let result = baseList;

            // 1. Filter by User
            if (this.filterUserId !== 'all') {
                result = result.filter(e => e.employeeId === this.filterUserId);
            }

            // 2. Filter by Date
            const type = this.filterRangeType;
            if (type === 'all') return result;

            const now = new Date();
            let start, end;

            if (type === 'this_month') {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            } else if (type === 'last_month') {
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
            } else if (type === 'custom') {
                const s = document.querySelector('#report-start').value;
                const e = document.querySelector('#report-end').value;
                if (s) start = new Date(s);
                if (e) end = new Date(e);
            }

            if (!start && !end) return result;

            return result.filter(exp => {
                const d = new Date(exp.date);
                if (start && d < start) return false;
                if (end && d > end) return false;
                return true;
            });
        };

        const exportPendingBtn = document.querySelector('#btn-export-pending');
        if (exportPendingBtn) {
            exportPendingBtn.addEventListener('click', () => {
                const pending = store.get('expenses').filter(e => e.status === 'pending');
                const exps = getFilteredExpenses(pending);

                if (exps.length === 0) {
                    alert('目前條件下無待審核資料可匯出');
                    return;
                }

                const userName = this.filterUserId === 'all' ? 'All' : store.get('users').find(u => u.id === this.filterUserId)?.name;
                const datePart = new Date().toISOString().split('T')[0];
                downloadCSV(generateCSV(exps), `pending_expenses_${userName}_${datePart}.csv`);
            });
        }

        window.exportEmployee = (id) => {
            let exps = store.get('expenses').filter(e => e.employeeId === id);
            exps = getFilteredExpenses(exps); // Date filter still applies
            const csv = generateCSV(exps);
            downloadCSV(csv, `employee_${id}_report_${this.filterRangeType}.csv`);
        };

        // ... Employee Forms logic (keep existing) ...
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
                    status: 'approved'
                });
                alert('已代填完成');
                this.refresh();
            });

        }

        // Rules Tab Logic
        if (this.activeTab === 'rules') {
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

            window.deleteMapping = (keyword) => {
                if (confirm(`確定要刪除「${keyword}」這個規則嗎？`)) {
                    store.deleteMapping(keyword);
                    this.refresh();
                }
            };
        }

    }

    refresh() {
        const app = document.querySelector('#main-content');
        app.innerHTML = this.render();
        this.afterRender();
    }
}
