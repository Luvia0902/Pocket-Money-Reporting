
import { store } from '../store.js';

export class RulesView {
    constructor() {
        this.currentUser = store.getCurrentUser();
    }

    render() {
        const mappings = store.get('mappings');
        const isAdmin = this.currentUser.role === 'admin';

        // Defined categories
        const fixedCategories = ['交通費', '伙食費', '文具用品', '郵電費', '運費', '交際費', '其他'];

        // Group mappings
        const grouped = {};
        fixedCategories.forEach(c => grouped[c] = []);

        mappings.forEach(m => {
            if (grouped[m.category]) {
                grouped[m.category].push(m);
            } else {
                // Handle fallback or dynamic categories
                if (!grouped['其他']) grouped['其他'] = [];
                grouped['其他'].push(m);
            }
        });

        // Generate HTML for groups
        const groupsHtml = fixedCategories.map(cat => {
            const items = grouped[cat];
            if (items.length === 0) return '';

            return `
                <div class="category-group" style="margin-bottom: 2rem;">
                    <h4 style="color:var(--primary); border-bottom:1px solid var(--border); padding-bottom:0.5rem; margin-bottom:1rem;">
                        ${cat} <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:normal;">(${items.length})</span>
                    </h4>
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                        ${items.map(m => `
                             <div style="display:inline-flex; align-items:center; background:#f1f5f9; padding:0.5rem 1rem; border-radius:999px; border:1px solid var(--border); font-size:0.9rem;">
                                <span>${m.keyword}</span>
                                ${isAdmin ? `
                                <button onclick="window.deleteMapping('${m.keyword}')" style="background:none; border:none; color:var(--text-secondary); margin-left:0.5rem; cursor:pointer; font-size:0.8rem; padding:0 2px;">
                                    <i class="fas fa-times"></i>
                                </button>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="card fade-in-up">
                <div style="text-align:center; margin-bottom:2rem;">
                    <h3 style="font-family:var(--font-heading); font-size:1.5rem; margin-bottom:0.5rem;">自動分類規則</h3>
                    <p style="color:var(--text-secondary); font-size:0.95rem;">
                        系統會掃描商家名稱，若包含以下關鍵字，將自動填入對應類別。
                    </p>
                </div>
                
                ${isAdmin ? `
                <form id="add-mapping-form" class="flex gap-2 mb-4" style="background:var(--background); padding:1.25rem; border-radius:var(--radius-lg); border:1px solid var(--border); box-shadow:inset 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="flex:1;">
                        <label class="label">關鍵字</label>
                        <input type="text" name="keyword" class="input" placeholder="例如: Uber, 星巴克" required>
                    </div>
                    <div style="flex:1;">
                         <label class="label">對應類別</label>
                        <select name="category" class="input">
                            ${fixedCategories.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                    <div style="display:flex; align-items:flex-end;">
                        <button type="submit" class="btn btn-primary" style="height:46px; width:46px; border-radius:12px; padding:0; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </form>
                ` : ''}

                 <div class="rules-container">
                    ${mappings.length === 0 ? '<p style="text-align:center; color:var(--text-secondary);">尚無規則</p>' : groupsHtml}
                 </div>
            </div>
        `;
    }

    afterRender() {
        if (this.currentUser.role === 'admin') {
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
