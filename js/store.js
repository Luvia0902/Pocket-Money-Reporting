
import { FirebaseService } from './firebase-service.js';

// Fallback config - actual config loaded from localStorage or dynamically in init()
let firebaseConfig = null;

const DEFAULTS = {
    users: [
        { id: 'u1', name: 'Admin User', email: 'admin@company.com', role: 'admin' },
        { id: 'u3', name: 'Super Admin', email: 'admin@gmail.com', role: 'admin' },
        { id: 'u4', name: 'Assistant User', email: 'assistant@company.com', role: 'assistant' },
        { id: 'u2', name: 'John Doe', email: 'john@company.com', role: 'employee' }
    ],
    mappings: [
        // 交通費
        { keyword: '加油站', category: '交通費' },
        { keyword: '停車場', category: '交通費' },
        { keyword: 'etag', category: '交通費' },
        { keyword: '中油', category: '交通費' },
        { keyword: '台塑', category: '交通費' },
        { keyword: '高速公路', category: '交通費' },
        { keyword: '計程車', category: '交通費' },
        { keyword: 'uber', category: '交通費' },
        { keyword: 'taxi', category: '交通費' },
        { keyword: '公車', category: '交通費' },
        { keyword: '捷運', category: '交通費' },
        { keyword: '高鐵', category: '交通費' },
        { keyword: '台鐵', category: '交通費' },
        // 交際費
        { keyword: '餐廳', category: '交際費' },
        { keyword: '咖啡', category: '交際費' },
        { keyword: '飲料', category: '交際費' },
        { keyword: '百貨', category: '交際費' },
        { keyword: '餐飲', category: '交際費' },
        { keyword: '星巴克', category: '交際費' },
        { keyword: '喜來登', category: '交際費' },
        { keyword: '晶華', category: '交際費' },
        { keyword: '宴會', category: '交際費' },
        // 伙食費
        { keyword: '便當', category: '伙食費' },
        { keyword: '自助餐', category: '伙食費' },
        { keyword: '員工餐廳', category: '伙食費' },
        { keyword: '麥當勞', category: '伙食費' },
        { keyword: '肯德基', category: '伙食費' },
        { keyword: '摩斯', category: '伙食費' },
        { keyword: '早餐', category: '伙食費' },
        { keyword: '小吃', category: '伙食費' },
        { keyword: '滷肉飯', category: '伙食費' },
        { keyword: '7-11', category: '交際費' },
        { keyword: '全家', category: '伙食費' },
        // 文具用品
        { keyword: '書局', category: '文具用品' },
        { keyword: '文具', category: '文具用品' },
        { keyword: '誠品', category: '文具用品' },
        { keyword: '金石堂', category: '文具用品' },
        { keyword: '九乘九', category: '文具用品' },
        { keyword: '筆', category: '文具用品' },
        { keyword: '紙', category: '文具用品' },
        { keyword: '辦公用品', category: '文具用品' },
        // 郵電費
        { keyword: '郵局', category: '郵電費' },
        { keyword: '中華電信', category: '郵電費' },
        { keyword: '遠傳', category: '郵電費' },
        { keyword: '台灣大哥大', category: '郵電費' },
        { keyword: '郵資', category: '郵電費' },
        { keyword: '電話費', category: '郵電費' },
        // 運費
        { keyword: '宅急便', category: '運費' },
        { keyword: '宅配通', category: '運費' },
        { keyword: '貨運', category: '運費' },
        { keyword: '順豐', category: '運費' },
        { keyword: '黑貓', category: '運費' },
        { keyword: '快遞', category: '運費' },
        { keyword: '運送', category: '運費' }
    ],
    expenses: []
};

class Store {
    constructor() {
        // Initialize in-memory state from local storage or defaults immediately for fast TTI
        const storedMappings = JSON.parse(localStorage.getItem('money_mappings') || '[]');

        this.state = {
            users: JSON.parse(localStorage.getItem('money_users')) || DEFAULTS.users,
            // Use stored mappings only if it has data, otherwise use defaults
            mappings: (storedMappings && storedMappings.length > 0) ? storedMappings : DEFAULTS.mappings,
            expenses: JSON.parse(localStorage.getItem('money_expenses')) || DEFAULTS.expenses,
        };
        this.isCloudEnabled = false;

        // Ensure defaults are saved if first run or if mappings was empty
        if (!localStorage.getItem('money_users')) this.saveToLocal('users', this.state.users);
        if (!localStorage.getItem('money_mappings') || storedMappings.length === 0) {
            this.saveToLocal('mappings', DEFAULTS.mappings);
            this.state.mappings = DEFAULTS.mappings;
        }
        if (!localStorage.getItem('money_expenses')) this.saveToLocal('expenses', this.state.expenses);

        // Ensure critical users exist immediately
        this.ensureCriticalUsers();
    }

    ensureCriticalUsers() {
        const requiredUsers = [
            { id: 'u3', name: 'Super Admin', email: 'admin@gmail.com', role: 'admin' },
            { id: 'u_dejau', name: 'Dejau Chu', email: 'dejau.chu@gmail.com', role: 'admin' }
        ];

        let changed = false;
        for (const req of requiredUsers) {
            if (!this.state.users.find(u => u.email.toLowerCase() === req.email.toLowerCase())) {
                this.state.users.push(req);
                changed = true;
            }
        }

        if (changed) {
            this.saveToLocal('users', this.state.users);
            // If cloud is enabled, we should probably try to sync these UP too, 
            // but we can't await here easily if called from constructor. 
            // It will naturally sync up next time user adds something or we can try best effort.
            if (this.isCloudEnabled && FirebaseService.isReady()) {
                requiredUsers.forEach(u => {
                    // Only add if we just added it locally (simple logic check) or just upsert safe
                    FirebaseService.set('users', u.id, u).catch(console.error);
                });
            }
        }
    }

    async init() {
        // Try to dynamically import config.js (may not exist in PWA/production)
        if (!firebaseConfig) {
            try {
                const configModule = await import('./config.js');
                firebaseConfig = configModule.firebaseConfig;
                console.log('[Store] Loaded config.js');
            } catch (e) {
                console.warn('[Store] config.js not found, will use localStorage config only');
            }
        }

        // Init with default config from file, or override from localStorage if set by user manually later
        let config = firebaseConfig;

        try {
            const localConfigStr = localStorage.getItem('firebase_config');
            if (localConfigStr) {
                if (localConfigStr.startsWith('enc_')) {
                    // Decrypt
                    try {
                        const jsonStr = atob(localConfigStr.substring(4));
                        config = JSON.parse(jsonStr);
                    } catch (e) {
                        console.error("Decryption failed", e);
                        // Fallback to default or null? Default is safer.
                    }
                } else {
                    // Legacy Plain JSON
                    config = JSON.parse(localConfigStr);
                }
            }
        } catch (e) { console.error("Bad local config", e); }

        if (config) {
            try {
                const success = await FirebaseService.init(config);
                if (success) {
                    this.isCloudEnabled = true;
                    await this.syncFromCloud();
                }
            } catch (e) {
                console.error("Firebase init failed:", e);
            }
        }

        // Dispatch load event
        window.dispatchEvent(new CustomEvent('store-loaded'));
    }

    async syncFromCloud() {
        console.log("Syncing from Cloud...");
        const users = await FirebaseService.getAll('users');
        const expenses = await FirebaseService.getAll('expenses');
        const mappings = await FirebaseService.getAll('mappings');

        // Simple strategy: Cloud > Local (Overwrite local with cloud)
        if (users.length > 0) {
            this.state.users = users;
            this.saveToLocal('users', users);
        } else {
            // First time cloud sync? Upload local to cloud?
            // For safety, let's upload defaults if cloud is empty
            if (confirm("雲端資料庫似乎是空的。是否上傳目前的本機資料？")) {
                await this.uploadAllToCloud();
            }
        }

        if (expenses.length > 0) {
            this.state.expenses = expenses;
            this.saveToLocal('expenses', expenses);
        }

        if (mappings.length > 0) {
            this.state.mappings = mappings;
            this.saveToLocal('mappings', mappings);
        }

        // Ensure critical users exist even after cloud overwrite
        this.ensureCriticalUsers();
    }

    async uploadAllToCloud() {
        for (const u of this.state.users) await FirebaseService.set('users', u.id, u);
        for (const e of this.state.expenses) await FirebaseService.set('expenses', e.id, e);
        for (const m of this.state.mappings) await FirebaseService.add('mappings', m); // Mappings often don't have IDs
    }

    get(key) {
        return this.state[key] || [];
    }

    set(key, value) {
        this.state[key] = value;
        this.saveToLocal(key, value);
        window.dispatchEvent(new CustomEvent('store-update', { detail: { key, value } }));
    }

    saveToLocal(key, value) {
        localStorage.setItem(`money_${key}`, JSON.stringify(value));
    }

    // Auto-learn new categories
    async checkAndLearn(merchant, category) {
        if (!merchant || !category || category === '其他') return;

        // Check if existing logic already covers it
        const currentGuess = this.autoCategorize(merchant);
        if (currentGuess !== category) {
            // New knowledge! Learn it.
            console.log(`[Auto-Learn] Learning new rule: ${merchant} -> ${category}`);
            await this.addMapping({ keyword: merchant, category });
        }
    }

    // Specialized Helpers
    async addExpense(expense) {
        // Learn before adding
        await this.checkAndLearn(expense.merchant, expense.category);

        const list = this.get('expenses');
        const newExpense = { status: 'pending', ...expense, id: Date.now().toString() };
        list.unshift(newExpense); // Add to top
        this.set('expenses', list);

        if (this.isCloudEnabled) {
            await FirebaseService.set('expenses', newExpense.id, newExpense);
        }
        return newExpense;
    }

    async updateExpense(id, updates) {
        const list = this.get('expenses');
        const index = list.findIndex(e => e.id === id);
        if (index !== -1) {
            const original = list[index];
            const updated = { ...original, ...updates };

            // Learn from updates
            // Use updated values, fallback to original if not present in updates
            const finalMerchant = updates.merchant !== undefined ? updates.merchant : original.merchant;
            const finalCategory = updates.category !== undefined ? updates.category : original.category;
            await this.checkAndLearn(finalMerchant, finalCategory);

            list[index] = updated;
            this.set('expenses', list);

            if (this.isCloudEnabled) {
                await FirebaseService.set('expenses', id, updated);
            }
        }
    }

    async deleteExpense(id) {
        const list = this.get('expenses').filter(e => e.id !== id);
        this.set('expenses', list);
        if (this.isCloudEnabled) {
            await FirebaseService.delete('expenses', id);
        }
    }

    async addMapping(mapping) {
        const list = this.get('mappings');
        list.push(mapping);
        this.set('mappings', list);
        // Mappings might not have ID, so we use add
        if (this.isCloudEnabled) {
            await FirebaseService.add('mappings', mapping);
        }
    }

    async deleteMapping(keyword) {
        const list = this.get('mappings').filter(m => m.keyword !== keyword);
        this.set('mappings', list);
        // Note: Can't easily delete from cloud without ID or query capability
        // For now, we only delete locally. In a real app, we'd need to find the Doc ID.
        if (this.isCloudEnabled) {
            console.warn("Delete mapping from cloud not fully implemented (requires ID)");
            // Try to find if we can get ID from cache? 
            // Ideally mappings should have IDs.
        }
    }

    async addUser(user) {
        const list = this.get('users');
        const id = user.id || ('u' + Date.now());
        const newUser = { ...user, id };
        list.push(newUser);
        this.set('users', list);

        if (this.isCloudEnabled) {
            await FirebaseService.set('users', id, newUser);
        }
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('money_current_user'));
    }

    loginByEmail(email) {
        let user = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());

        // Fail-safe auto create
        if (!user && email.toLowerCase() === 'admin@gmail.com') {
            const newUser = { id: 'u3', name: 'Super Admin', email: 'admin@gmail.com', role: 'admin' };
            this.addUser(newUser);
            user = newUser;
        }

        if (user) {
            localStorage.setItem('money_current_user', JSON.stringify(user));
            return true;
        }
        return false;
    }

    logout() {
        localStorage.removeItem('money_current_user');
        window.location.hash = '/login';
        window.location.reload();
    }

    autoCategorize(merchant) {
        const mappings = this.get('mappings');
        const search = merchant.toLowerCase();
        for (const m of mappings) {
            if (search.includes(m.keyword.toLowerCase())) {
                return m.category;
            }
        }
        return '其他';
    }
}

export const store = new Store();
