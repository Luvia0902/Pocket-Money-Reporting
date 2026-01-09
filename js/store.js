
const DEFAULTS = {
    users: [
        { id: 'u1', name: 'Admin User', email: 'admin@company.com', role: 'admin' },
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
        { keyword: '7-11', category: '伙食費' },
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
    expenses: [
        { id: 'e1', employeeId: 'u2', merchant: 'Uber Trip', amount: 350, category: '交通費', date: '2023-10-25', status: 'approved', notes: 'Client meeting' },
        { id: 'e2', employeeId: 'u2', merchant: 'Starbucks', amount: 150, category: '伙食費', date: '2023-10-26', status: 'pending', notes: 'Coffee' }
    ]
};

class Store {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem('money_users')) {
            localStorage.setItem('money_users', JSON.stringify(DEFAULTS.users));
        }
        if (!localStorage.getItem('money_mappings')) {
            localStorage.setItem('money_mappings', JSON.stringify(DEFAULTS.mappings));
        }
        if (!localStorage.getItem('money_expenses')) {
            localStorage.setItem('money_expenses', JSON.stringify(DEFAULTS.expenses));
        }
        // Current User Session
        if (!localStorage.getItem('money_current_user')) {
            localStorage.setItem('money_current_user', JSON.stringify(DEFAULTS.users[0])); // Default login as admin
        }
    }

    get(key) {
        return JSON.parse(localStorage.getItem(`money_${key}`)) || [];
    }

    set(key, value) {
        localStorage.setItem(`money_${key}`, JSON.stringify(value));
        // Dispatch event for reactivity
        window.dispatchEvent(new CustomEvent('store-update', { detail: { key, value } }));
    }

    // Specialized Helpers
    addExpense(expense) {
        const list = this.get('expenses');
        const newExpense = { status: 'pending', ...expense, id: Date.now().toString() };
        list.unshift(newExpense); // Add to top
        this.set('expenses', list);
        return newExpense;
    }

    updateExpense(id, updates) {
        const list = this.get('expenses');
        const index = list.findIndex(e => e.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            this.set('expenses', list);
        }
    }

    deleteExpense(id) {
        const list = this.get('expenses').filter(e => e.id !== id);
        this.set('expenses', list);
    }

    addMapping(mapping) {
        const list = this.get('mappings');
        list.push(mapping);
        this.set('mappings', list);
    }

    deleteMapping(keyword) {
        const list = this.get('mappings').filter(m => m.keyword !== keyword);
        this.set('mappings', list);
    }

    addUser(user) {
        const list = this.get('users');
        list.push({ ...user, id: 'u' + Date.now() });
        this.set('users', list);
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('money_current_user'));
    }

    login(userId) {
        const user = this.get('users').find(u => u.id === userId);
        if (user) {
            localStorage.setItem('money_current_user', JSON.stringify(user));
            window.location.reload();
        }
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
