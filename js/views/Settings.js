
import { store } from '../store.js';

export class SettingsView {
    render() {
        const config = localStorage.getItem('firebase_config')
            ? JSON.parse(localStorage.getItem('firebase_config'))
            : null;

        const configStr = config ? JSON.stringify(config, null, 4) : '';

        return `
            <div class="card fade-in-up">
                <h3>雲端資料庫設定 (Firebase)</h3>
                <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1rem;">
                    若要啟用跨裝置連線，請貼上 Firebase Config 設定檔。
                    <br>
                    <a href="https://console.firebase.google.com/" target="_blank" style="color:var(--primary);">前往 Firebase Console 申請</a>
                </p>

                <form id="settings-form">
                    <div class="input-group">
                        <label class="label">Firebase Config (JSON)</label>
                        <textarea name="config" class="input" style="height:200px; font-family:monospace; font-size:0.85rem;" placeholder='{ "apiKey": "...", "authDomain": "...", ... }'>${configStr}</textarea>
                    </div>
                    <div class="flex gap-2" style="justify-content:flex-end; margin-top:1rem;">
                        <button type="button" id="btn-clear-config" class="btn btn-outline" style="border-color:var(--danger); color:var(--danger);">清除設定</button>
                        <button type="submit" class="btn btn-primary">儲存並連線</button>
                    </div>
                </form>
            </div>
        `;
    }

    afterRender() {
        const form = document.querySelector('#settings-form');
        const clearBtn = document.querySelector('#btn-clear-config');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const configText = form.querySelector('textarea').value.trim();
            try {
                const config = JSON.parse(configText);
                localStorage.setItem('firebase_config', JSON.stringify(config));
                alert("設定已儲存！系統將重新啟動以連線...");
                window.location.reload();
            } catch (err) {
                alert("設定格式錯誤 (必須是 JSON)！\n" + err.message);
            }
        });

        clearBtn.addEventListener('click', () => {
            if (confirm("確定要清除雲端設定嗎？系統將回到單機模式。")) {
                localStorage.removeItem('firebase_config');
                alert("設定已清除。");
                window.location.reload();
            }
        });
    }
}
