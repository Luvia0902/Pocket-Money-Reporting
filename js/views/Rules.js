
import { store } from '../store.js';

export class RulesView {
    constructor() {
        this.currentUser = store.getCurrentUser();
    }

    render() {
        const mappings = store.get('mappings');
        const isAdmin = this.currentUser.role === 'admin';

        return `
            <div class="card">
                <h3>關鍵字對應規則</h3>
                <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1rem;">
                    系統會根據商家名稱中的關鍵字自動對應類別。
                    ${isAdmin ? '<br>由於您是管理員，您可以新增或刪除規則。' : ''}
                </p>
                
                ${isAdmin ? `
                <form id="add-mapping-form" class="flex gap-2 mb-4" style="background:#f8fafc; padding:1rem; border-radius:0.5rem; border:1px solid var(--border);">
                    <input type="text" name="keyword" class="input" placeholder="關鍵字 (例如: Uber)" required>
                    <input type="text" name="category" class="input" placeholder="類別 (例如: 交通費)" required>
                    <button type="submit" class="btn btn-primary" style="width: auto;">新增規則</button>
                </form>
                ` : ''}

                 <div class="transaction-list">
                    ${mappings.length === 0 ? '<p>尚無規則</p>' : ''}
                    ${mappings.map(m => `
                         <div class="transaction-item">
                            <div class="t-info">
                                <h4>${m.keyword}</h4>
                            </div>
                            <div class="text-right flex gap-2" style="align-items:center;">
                                <span class="badge badge-approved">${m.category}</span>
                                ${isAdmin ? `
                                <button class="btn btn-outline" style="padding:0.25rem 0.5rem; color:var(--danger); border-color:transparent;" onclick="window.deleteMapping('${m.keyword}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
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
