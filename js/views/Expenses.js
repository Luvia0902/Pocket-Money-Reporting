
import { store } from '../store.js';
import { formatCurrency, formatDate } from '../utils.js';

export class ExpensesView {
    constructor() {
        this.user = store.getCurrentUser();
        this.html5QrcodeScanner = null;
    }

    render() {
        const expenses = store.get('expenses').filter(e => e.employeeId === this.user.id);
        const currentMonth = new Date().getMonth();
        const monthlyTotal = expenses
            .filter(e => new Date(e.date).getMonth() === currentMonth)
            .reduce((sum, e) => sum + Number(e.amount), 0);

        const getIconForCategory = (cat) => {
            if (!cat) return 'fa-receipt';
            if (cat.includes('交通')) return 'fa-car';
            if (cat.includes('伙食') || cat.includes('餐')) return 'fa-utensils';
            if (cat.includes('文具')) return 'fa-pen-nib';
            if (cat.includes('郵')) return 'fa-envelope';
            if (cat.includes('運費')) return 'fa-truck';
            return 'fa-receipt';
        };

        return `
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(monthlyTotal)}</div>
                    <div class="stat-label">本月總支出</div>
                    <i class="fas fa-chart-line" style="position:absolute; right:10px; bottom:10px; opacity:0.1; font-size:3rem; color:var(--primary);"></i>
                </div>
                 <div class="stat-card">
                    <div class="stat-value" style="color:var(--warning)">${expenses.filter(e => e.status === 'pending').length}</div>
                    <div class="stat-label">待審核筆數</div>
                    <i class="fas fa-clock" style="position:absolute; right:10px; bottom:10px; opacity:0.1; font-size:3rem; color:var(--warning);"></i>
                </div>
            </div>

            <div class="card fade-in-up stagger-1">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h3 style="font-family:var(--font-heading); font-size:1.2rem;">新增報帳</h3>
                    <div class="flex gap-2">
                        <button id="btn-scan" class="btn btn-primary" style="padding:0.6rem 1rem;">
                            <i class="fas fa-qrcode"></i> Scan
                        </button>
                        <button id="btn-manual" class="btn btn-outline" style="padding:0.6rem 1rem;">
                            <i class="fas fa-pen"></i>
                        </button>
                    </div>
                </div>
                
                <div id="scanner-container" class="hidden mb-4" style="background:black; border-radius:var(--radius-md); padding:1rem;">
                    <div id="reader"></div>
                    <div style="text-align:center; color:#aaa; font-size:12px; margin-top:5px; font-family:monospace;">Scanner System v3.24</div>
                    <button id="stop-scan" class="btn btn-outline" style="margin-top:1rem; width:100%; color:white; border-color:white;">停止掃描</button>
                </div>

                <form id="expense-form" class="hidden fade-in-up">
                    <div class="input-group">
                        <label class="label">日期</label>
                        <input type="date" name="date" class="input" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    ${['admin', 'assistant'].includes(this.user.role) ? `
                    <div class="input-group" style="background:var(--surface-light); padding:0.5rem; border-radius:var(--radius-sm); border:1px solid var(--primary-light);">
                        <label class="label" style="color:var(--primary);">
                            <i class="fas fa-user-edit"></i> 代填人員 (僅管理員/助理可見)
                        </label>
                        <select name="target_employee" class="input">
                            <option value="${this.user.id}">我自己 (${this.user.name})</option>
                            ${store.get('users')
                    .filter(u => u.id !== this.user.id)
                    .map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`)
                    .join('')}
                        </select>
                    </div>` : ''}
                    <div class="input-group">
                        <label class="label">商家名稱</label>
                        <input type="text" name="merchant" class="input" placeholder="例如: Uber, 7-11" required>
                    </div>
                    <div class="input-group">
                        <label class="label">金額</label>
                        <input type="number" name="amount" class="input" placeholder="0" required>
                    </div>
                    <div class="input-group">
                        <label class="label">類別 (自動帶入)</label>
                        <input type="text" name="category" class="input" placeholder="自動判斷..." readonly style="background-color: #f1f5f9;">
                    </div>
                    <div class="input-group">
                        <label class="label">備註</label>
                        <input type="text" name="notes" class="input" placeholder="用途說明">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;">
                        提交報帳 <i class="fas fa-paper-plane" style="margin-left:5px;"></i>
                    </button>
                </form>
            </div>

            <div class="card fade-in-up stagger-2">
                <h3 style="font-family:var(--font-heading); font-size:1.2rem; margin-bottom:1rem;">最近紀錄</h3>
                <div class="transaction-list">
                    ${expenses.length === 0 ? '<div style="text-align:center; padding:2rem; color:var(--text-muted);"><i class="fas fa-receipt" style="font-size:2rem; margin-bottom:0.5rem; display:block;"></i>尚無紀錄</div>' : ''}
                    ${expenses.map((e, index) => `
                        <div class="transaction-item fade-in-up" style="animation-delay: ${index * 0.05}s">
                            <div class="t-icon">
                                <i class="fas ${getIconForCategory(e.category)}"></i>
                            </div>
                            <div class="t-info">
                                <h4>${e.merchant}</h4>
                                <div class="t-date">${formatDate(e.date)}</div>
                            </div>
                            <div class="text-right">
                                <div class="t-amount">${formatCurrency(e.amount)}</div>
                                <span class="badge badge-${e.status}">${e.status === 'approved' ? '已核准' : '審核中'}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    afterRender() {
        const form = document.querySelector('#expense-form');
        const manualBtn = document.querySelector('#btn-manual');
        const scanBtn = document.querySelector('#btn-scan');
        const scannerContainer = document.querySelector('#scanner-container');
        const merchantInput = document.querySelector('input[name="merchant"]');

        // Toggle Manual Form
        manualBtn.addEventListener('click', () => {
            scannerContainer.classList.add('hidden');
            form.classList.toggle('hidden');
            if (this.html5QrcodeScanner) {
                this.html5QrcodeScanner.stop().catch(err => console.error(err));
                this.html5QrcodeScanner = null;
            }
        });

        // Auto-Categorize logic
        merchantInput.addEventListener('input', (e) => {
            const val = e.target.value;
            const cat = store.autoCategorize(val);
            document.querySelector('input[name="category"]').value = cat;
        });

        // Form Submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const expense = {
                date: formData.get('date'),
                merchant: formData.get('merchant'),
                amount: formData.get('amount'),
                category: formData.get('category'),
                notes: formData.get('notes'),
                employeeId: formData.get('target_employee') || this.user.id
            };
            store.addExpense(expense);

            // If added for someone else, show special message
            const targetId = formData.get('target_employee');
            if (targetId && targetId !== this.user.id) {
                const targetName = store.get('users').find(u => u.id === targetId)?.name;
                alert(`已成功幫 ${targetName} 新增一筆報帳！`);
            } else {
                alert('報帳成功！');
            }
            form.reset();
            form.classList.add('hidden');
            window.location.reload(); // Simple refresh for state update
        });

        // Scanner Logic
        scanBtn.addEventListener('click', () => {
            form.classList.remove('hidden'); // Show form to fill
            scannerContainer.classList.remove('hidden');

            if (!this.html5QrcodeScanner) {
                this.html5QrcodeScanner = new Html5Qrcode("reader");
            }

            // Improved camera start logic
            Html5Qrcode.getCameras().then(devices => {
                if (devices && devices.length) {
                    // Try to use the back camera
                    const cameraId = devices[devices.length - 1].id; // Usually the last one is the back camera on some devices, or user 'facingMode'

                    // Use specific config
                    const config = {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                        // aspectRatio: 1.0
                    };

                    this.html5QrcodeScanner.start(
                        { facingMode: "environment" }, // Prefer environment facing camera
                        config,
                        (decodedText, decodedResult) => {
                            // Success
                            console.log(`Scan matched: ${decodedText} `);

                            // Parse Taiwan E-Invoice (Left QR Code usually)
                            // Format reference: 10(ID) + 7(Date) + 4(Random) + 8(Amount in Hex)
                            // Validations
                            if (decodedText.startsWith("**")) {
                                alert("您掃描到的是「發票明細」(右側 QR Code)。\n請掃描位於「左側」的發票字軌 QR Code，通常包含日期與金額資訊。");
                                return; // Skip processing
                            }

                            let amount = "";
                            let merchantName = "掃描發票 (" + decodedText.substring(0, 5) + ")";

                            let totalAmountHex = "";
                            let salesAmountHex = "";
                            let sellerId = "";

                            const knownMerchants = {
                                // Utility & Government
                                "20828693": "台灣中油",

                                // Convenience Stores
                                "22555003": "7-ELEVEN",
                                "28984895": "7-ELEVEN", // Additional UBN
                                "23060248": "全家便利商店",
                                "23285582": "萊爾富 Hi-Life",
                                "24556801": "萊爾富", // Legacy
                                "22853565": "OK超商",
                                "23222509": "美廉社",

                                // Supermarkets / Malls
                                "16740494": "全聯福利中心",
                                "22662550": "家樂福 Carrefour",
                                "03795556": "家樂福", // Legacy
                                "96972798": "好市多 Costco",

                                // Food & Drink
                                "12411160": "麥當勞 McDonald's",
                                "97161500": "KFC/必勝客", // Both use same UBN (Richfood)
                                "23928945": "摩斯漢堡 MOS",
                                "16097091": "星巴克 Starbucks",
                                "54857699": "路易莎 Louisa",

                                // Retail / Lifestyle
                                "23224657": "屈臣氏 Watsons",
                                "89957386": "康是美",
                                "97151664": "寶雅 POYA",
                                "80518858": "無印良品 MUJI",
                                "28965825": "UNIQLO",
                                "23117530": "IKEA",

                                // Online
                                "83118125": "Uber Eats",
                                "53926705": "Foodpanda",
                                "56801904": "蝦皮購物",
                                "27365925": "MOMO",
                                "80136913": "PChome"
                            };

                            // Basic length check for standard E-Invoice (77 chars)
                            if (decodedText.length >= 29) {
                                try {
                                    // Characters 29-37 are the Total Amount (Tax Included) in Hex
                                    if (decodedText.length >= 37) {
                                        totalAmountHex = decodedText.substring(29, 37);
                                        const parsedTotal = parseInt(totalAmountHex, 16);
                                        if (!isNaN(parsedTotal) && parsedTotal > 0) {
                                            amount = parsedTotal;
                                        }
                                    }

                                    // Fallback: Characters 21-29 are the Sales Amount (Tax Excluded) in Hex
                                    salesAmountHex = decodedText.substring(21, 29);
                                    const parsedSales = parseInt(salesAmountHex, 16);

                                    if (amount === "" && !isNaN(parsedSales)) {
                                        amount = parsedSales;
                                    }

                                    // Characters 45-53 are the Seller ID (UBN)
                                    if (decodedText.length >= 53) {
                                        sellerId = decodedText.substring(45, 53);
                                        if (knownMerchants[sellerId]) {
                                            merchantName = knownMerchants[sellerId];
                                        }
                                    }
                                } catch (e) {
                                    console.warn("Parse error:", e);
                                }
                            }

                            // Debug info
                            let debugHex = `Total:${totalAmountHex}, Sales:${salesAmountHex}, UBN:${sellerId}`;

                            // Safe Set Helpers
                            const safeSet = (name, val) => {
                                const el = document.querySelector(`input[name="${name}"]`);
                                if (el && val !== undefined && val !== null) el.value = val;
                            };

                            safeSet('merchant', merchantName);
                            safeSet('amount', amount);
                            safeSet('notes', `Raw: ${decodedText.substring(0, 40)}... [${debugHex}]`);
                            safeSet('category', store.autoCategorize(merchantName));

                            // Auto stop after scan
                            this.html5QrcodeScanner.stop().then(() => {
                                scannerContainer.classList.add('hidden');
                            });
                        },
                        (errorMessage) => {
                            // parse error, ignore
                        }
                    ).catch(err => {
                        console.error("Error starting scanner:", err);
                        if (err.name === 'NotAllowedError' || err.toString().includes('not allowed')) {
                            alert("無法啟動相機：請檢查瀏覽器權限。\n\n⚠️ 若您正在使用 LINE 開啟，請點擊右上角選單，選擇「使用預設瀏覽器開啟」以取得完整相機權限。");
                        } else {
                            alert("無法啟動相機：" + err);
                        }
                    });
                } else {
                    alert("找不到相機裝置！请確認您的裝置有相機功能。");
                }
            }).catch(err => {
                console.error("Error getting cameras:", err);
                if (err.name === 'NotAllowedError' || err.toString().includes('not allowed')) {
                    alert("無法取得相機權限。\n\n⚠️ 若您正在使用 LINE 開啟，請點擊右上角選單，選擇「使用預設瀏覽器開啟」。");
                } else {
                    alert("無法偵測相機：" + err);
                }
            });
        });

        document.querySelector('#stop-scan').addEventListener('click', () => {
            if (this.html5QrcodeScanner) {
                this.html5QrcodeScanner.stop().then(() => {
                    scannerContainer.classList.add('hidden');
                });
            }
        });
    }
}
