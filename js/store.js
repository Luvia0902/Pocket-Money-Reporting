
import { FirebaseService } from './firebase-service.js';

// Fallback config - actual config loaded from localStorage or dynamically in init()
let firebaseConfig = null;

const DEFAULTS = {
    users: [
        { id: 'u1', name: 'Admin User', email: 'admin@company.com', role: 'admin' },
        { id: 'u3', name: 'Super Admin', email: 'admin@gmail.com', role: 'admin' },
        { id: 'u4', name: 'Assistant User', email: 'assistant@company.com', role: 'assistant' },
        { id: 'u2', name: 'John Doe', email: 'john@company.com', role: 'employee' },
        { id: 'u5', name: 'Dejau Luna', email: 'dejau.luna@gmail.com', role: 'admin' }
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
            { id: 'u_dejau', name: 'Dejau Chu', email: 'dejau.chu@gmail.com', role: 'admin' },
            { id: 'u_luna', name: 'Dejau Luna', email: 'dejau.luna@gmail.com', role: 'admin' }
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
        const cloudUsers = await FirebaseService.getAll('users');
        const cloudExpenses = await FirebaseService.getAll('expenses');
        const cloudMappings = await FirebaseService.getAll('mappings');

        // Merge Strategy: Cloud Wins, BUT Local Unsynced Wins over Cloud

        // 1. Users
        const localUsers = this.get('users');
        const mergedUsers = this._mergeData(localUsers, cloudUsers);
        this.set('users', mergedUsers);

        if (mergedUsers.length === 0 && cloudUsers.length === 0) {
            // First time cloud sync? Upload local defaults if any?
            // Actually _mergeData handles local retention. 
            // If completely empty, maybe ask to upload default admin?
            if (confirm("雲端資料庫似乎是空的。是否上傳目前的本機資料？")) {
                await this.uploadAllToCloud();
            }
        }

        // 2. Expenses
        const localExpenses = this.get('expenses');
        const mergedExpenses = this._mergeData(localExpenses, cloudExpenses);
        this.set('expenses', mergedExpenses);

        // 3. Mappings (No IDs usually, difficult to merge without dupes. 
        // Strategy: Union by keyword)
        const localMappings = this.get('mappings');
        const mergedMappings = this._mergeMappings(localMappings, cloudMappings);
        this.set('mappings', mergedMappings);

        // Ensure critical users exist even after sync
        this.ensureCriticalUsers();

        // Post-Sync: Try to upload any unsynced items
        this._uploadUnsyncedItems();
    }

    _mergeData(localList, cloudList) {
        const cloudMap = new Map(cloudList.map(i => [i.id, i]));
        const merged = [];
        const seenIds = new Set();

        // 1. Process Local Items
        for (const localItem of localList) {
            seenIds.add(localItem.id);
            if (localItem._synced === false) {
                // Keep Local Unsynced version (it's newer/pending)
                merged.push(localItem);
            } else {
                // If synced, check if Cloud has newer execution? 
                // For simplicity, if local says synced, valid cloud version wins (if exists), 
                // formatted as: Use Cloud version if exists, else keep local (might be deleted in cloud? logic complex)
                // Simplest robust: If strictly synced, Cloud overrides.
                if (cloudMap.has(localItem.id)) {
                    merged.push(cloudMap.get(localItem.id));
                } else {
                    // Exists locally (marked synced) but NOT in cloud.
                    // Means it was deleted in cloud? Or we are stale?
                    // Safe bet: Keep it but maybe mark it? Or trust cloud deletion?
                    // Let's trust Cloud deletion for 'synced' items.
                    // BUT: If user just added it and _synced=true hasn't persisted yet? 
                    // Unlikely if we code correctly.
                }
            }
        }

        // 2. Process Cloud Items (New ones from other devices)
        for (const cloudItem of cloudList) {
            if (!seenIds.has(cloudItem.id)) {
                merged.push(cloudItem);
            }
        }

        // Sort by date/created?
        // Expenses usually sorted by date desc
        return merged.sort((a, b) => {
            // Try date comparison
            if (a.date && b.date) return new Date(b.date) - new Date(a.date);
            return 0;
        });
    }

    _mergeMappings(local, cloud) {
        const map = new Map();
        [...local, ...cloud].forEach(m => {
            // key is keyword
            map.set(m.keyword, m);
        });
        return Array.from(map.values());
    }

    async _uploadUnsyncedItems() {
        const pushItem = async (collection, item) => {
            try {
                // Remove _synced flag before upload? Or keep it? 
                // Firebase doesn't care, but cleaner to remove.
                const { _synced, ...dataToUpload } = item;
                await FirebaseService.set(collection, item.id, dataToUpload);

                // Update local state to synced
                const list = this.get(collection);
                const idx = list.findIndex(i => i.id === item.id);
                if (idx !== -1) {
                    list[idx]._synced = true;
                    this.set(collection, list);
                }
                console.log(`[Sync] Uploaded ${collection}/${item.id}`);
            } catch (e) {
                console.error(`[Sync] Failed to upload ${collection}/${item.id}`, e);
            }
        };

        const users = this.get('users').filter(u => u._synced === false);
        for (const u of users) await pushItem('users', u);

        const expenses = this.get('expenses').filter(e => e._synced === false);
        for (const e of expenses) await pushItem('expenses', e);
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
        // Mark as unsynced initially
        const newExpense = { status: 'pending', ...expense, id: Date.now().toString(), _synced: false };
        list.unshift(newExpense); // Add to top
        this.set('expenses', list);

        if (this.isCloudEnabled) {
            try {
                const { _synced, ...dataToUpload } = newExpense;
                await FirebaseService.set('expenses', newExpense.id, dataToUpload);
                // Mark synced on success
                newExpense._synced = true;
                this.set('expenses', list); // Trigger save
            } catch (e) {
                console.warn("Upload failed, stored locally as unsynced", e);
            }
        }
        return newExpense;
    }

    async updateExpense(id, updates) {
        const list = this.get('expenses');
        const index = list.findIndex(e => e.id === id);
        if (index !== -1) {
            const original = list[index];
            const updated = { ...original, ...updates, _synced: false }; // Mark unsynced

            // Learn from updates
            // Use updated values, fallback to original if not present in updates
            const finalMerchant = updates.merchant !== undefined ? updates.merchant : original.merchant;
            const finalCategory = updates.category !== undefined ? updates.category : original.category;
            await this.checkAndLearn(finalMerchant, finalCategory);

            list[index] = updated;
            this.set('expenses', list);

            if (this.isCloudEnabled) {
                try {
                    const { _synced, ...dataToUpload } = updated;
                    await FirebaseService.set('expenses', id, dataToUpload);
                    // Mark synced on success
                    updated._synced = true;
                    this.set('expenses', list);
                } catch (e) {
                    console.warn("Update upload failed, kept as unsynced", e);
                }
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
        const newUser = { ...user, id, _synced: false };
        list.push(newUser);
        this.set('users', list);

        if (this.isCloudEnabled) {
            try {
                const { _synced, ...dataToUpload } = newUser;
                await FirebaseService.set('users', id, dataToUpload);
                newUser._synced = true;
                this.set('users', list);
            } catch (e) {
                console.warn("User upload failed", e);
            }
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
