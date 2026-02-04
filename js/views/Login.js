
import { store } from '../store.js';

export class LoginView {
    render() {
        return `
            <div style="min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 1rem;">
                <div class="card fade-in-up" style="width: 100%; max-width: 400px; padding: 2.5rem;">
                    <div style="text-align: center; margin-bottom: 2.5rem;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: var(--glow); transform: rotate(-5deg);">
                            <i class="fas fa-bolt" style="font-size: 2.5rem; color: white;"></i>
                        </div>
                        <h2 style="font-family: var(--font-heading); font-weight: 800; font-size: 2rem; background: linear-gradient(to right, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ZeroMoney</h2>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem; font-size: 1.1rem;">智慧報帳系統</p>
                    </div>

                    <form id="login-form">
                        <div class="input-group">
                            <label class="label" style="font-size: 0.9rem;">Email Address</label>
                            <input type="email" id="login-email" class="input" placeholder="name@company.com" required autofocus style="padding: 1rem;">
                        </div>

                        <div id="login-error" style="background: #FEF2F2; color: var(--danger); font-size: 0.9rem; margin-bottom: 1.5rem; padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid #FECACA; display: none;">
                            <i class="fas fa-exclamation-circle" style="margin-right: 0.5rem;"></i> 查無此帳號
                        </div>

                        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem; border-radius: 12px;">
                            登入 <i class="fas fa-arrow-right" style="margin-left: 0.5rem;"></i>
                        </button>
                    </form>

                    <div style="margin-top: 2rem; text-align: center; font-size: 0.9rem; color: var(--text-secondary); opacity: 0.8;">
                        Protected by Company Policy v3.32
                    </div>
                </div>
            </div>`;
    }

    afterRender() {
        const form = document.getElementById('login-form');
        const errorMsg = document.getElementById('login-error');
        const emailInput = document.getElementById('login-email');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();

            if (email) {
                const success = store.loginByEmail(email);
                if (!success) {
                    errorMsg.style.display = 'block';
                    emailInput.style.borderColor = 'var(--danger)';
                } else {
                    window.location.hash = '/';
                }
            }
        });

        emailInput.addEventListener('input', () => {
            errorMsg.style.display = 'none';
            emailInput.style.borderColor = '';
        });
    }
}
