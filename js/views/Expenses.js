
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

        return `
            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(monthlyTotal)}</div>
                    <div class="stat-label">本月支出</div>
                </div>
                 <div class="stat-card" style="border-left: 4px solid var(--accent);">
                    <div class="stat-value">${expenses.filter(e => e.status === 'pending').length}</div>
                    <div class="stat-label">待審核筆數</div>
                </div>
            </div>

            <div class="card">
                <h3>新增報帳</h3>
                <div class="flex gap-2 mb-4" style="margin-top: 1rem;">
                    <button id="btn-scan" class="btn btn-primary">
                        <i class="fas fa-qrcode"></i> 掃描發票
                    </button>
                    <button id="btn-manual" class="btn btn-outline">
                        <i class="fas fa-pen"></i> 手動輸入
                    </button>
                </div>
                
                <div id="scanner-container" class="hidden mb-4">
                    <div id="reader"></div>
                    <button id="stop-scan" class="btn btn-outline" style="margin-top:0.5rem">停止掃描</button>
                </div>

                <form id="expense-form" class="hidden">
                    <div class="input-group">
                        <label class="label">日期</label>
                        <input type="date" name="date" class="input" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
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
                        <input type="text" name="category" class="input" placeholder="自動判斷..." >
                    </div>
                    <div class="input-group">
                        <label class="label">備註</label>
                        <input type="text" name="notes" class="input" placeholder="用途說明">
                    </div>
                    <button type="submit" class="btn btn-primary">提交報帳</button>
                </form>
            </div>

            <div class="card">
                <h3>最近紀錄</h3>
                <div class="transaction-list">
                    ${expenses.length === 0 ? '<p style="color:var(--text-secondary); text-align:center; padding:1rem;">尚無紀錄</p>' : ''}
                    ${expenses.map(e => `
                        <div class="transaction-item">
                            <div class="t-info">
                                <h4>${e.merchant}</h4>
                                <div class="t-date">${formatDate(e.date)} · ${e.category}</div>
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
                employeeId: this.user.id
            };
            store.addExpense(expense);
            alert('報帳成功！');
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

            this.html5QrcodeScanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText, decodedResult) => {
                    // Success
                    console.log(`Scan matched: ${decodedText}`);
                    // Parse Invoice QR (Taiwan E-Invoice format usually)
                    // Format: 77 chars usually. 
                    // Simple heuristic: look for date/amount if possible, else just put raw text

                    // Mock parsing for demo (assuming the text contains "Merchant,100")
                    // Or standard Taiwan invoice format: AB1234567811101...

                    // For this demo, let's assume the QR text is simple or we mock the parse
                    // Real implementation needs complex parsing logic.
                    // We will just fill merchant with "已掃描發票" and try to check length

                    document.querySelector('input[name="merchant"]').value = "掃描發票 (" + decodedText.substring(0, 5) + "...)";
                    // random amount for demo
                    document.querySelector('input[name="amount"]').value = Math.floor(Math.random() * 500) + 50;
                    document.querySelector('input[name="category"]').value = store.autoCategorize("掃描發票");

                    this.html5QrcodeScanner.stop().then(() => {
                        scannerContainer.classList.add('hidden');
                    });
                },
                (errorMessage) => {
                    // parse error, ignore
                }
            ).catch(err => {
                alert("無法啟動相機: " + err);
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
