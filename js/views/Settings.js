import { store } from '../store.js';

// Note: config.js may not exist in production/PWA, so we don't import it directly
// Firebase config is managed via localStorage

export class SettingsView {
    render() {
        let config = null;
        try {
            const localConfig = localStorage.getItem('firebase_config');
            if (localConfig) {
                if (localConfig.startsWith('enc_')) {
                    // Decrypt: Remove prefix -> atob -> parse
                    const jsonStr = atob(localConfig.substring(4));
                    config = JSON.parse(jsonStr);
                } else {
                    // Legacy: Plain JSON
                    config = JSON.parse(localConfig);
                }
            }
            // If no localStorage config, config remains null (user needs to set it)
        } catch (e) {
            console.error("Error loading config:", e);
            config = null;
        }

        const configStr = config ? JSON.stringify(config, null, 4) : '';

        return `
            <div class="card fade-in-up">
                <h3>雲端資料庫設定 (Firebase)</h3>
                <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1rem;">
                    若要啟用跨裝置連線，請貼上 Firebase Config 設定檔。
                    <br>
                    <span style="color:var(--success); font-size:0.8rem;"><i class="fas fa-lock"></i> 設定資料將加密儲存</span>
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
            
            <div class="card fade-in-up" style="margin-top:1rem;">
                <h3>版本管理</h3>
                <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1rem;">
                    目前版本：<strong id="current-version">檢測中...</strong>
                    <br><span style="font-size:0.8rem;">若版本過舊或功能異常，請點擊下方按鈕強制更新。</span>
                </p>
                <button id="btn-force-update" class="btn btn-primary" style="width:100%;">
                    <i class="fas fa-sync-alt"></i> 強制更新版本
                </button>
            </div>
        `;
    }

    afterRender() {
        const form = document.querySelector('#settings-form');
        const clearBtn = document.querySelector('#btn-clear-config');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const configText = form.querySelector('textarea').value.trim();

            if (!configText) {
                alert("設定內容不能為空！");
                return;
            }

            try {
                // Verify it's valid JSON first
                const config = JSON.parse(configText);
                const jsonStr = JSON.stringify(config);

                // Encrypt: Stringify -> btoa -> Add prefix
                const encrypted = 'enc_' + btoa(jsonStr);

                localStorage.setItem('firebase_config', encrypted);
                alert("設定已加密儲存！系統將重新啟動以連線...");
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

        // Version management
        const versionEl = document.querySelector('#current-version');
        const forceUpdateBtn = document.querySelector('#btn-force-update');

        // Try to get version from manifest
        fetch('./manifest.json?nocache=' + Date.now())
            .then(r => r.json())
            .then(data => {
                versionEl.textContent = 'v' + (data.version || '未知');
            })
            .catch(() => {
                versionEl.textContent = '無法取得';
            });

        forceUpdateBtn.addEventListener('click', async () => {
            if (confirm('這將清除所有快取並下載最新版本。\n\n確定要繼續嗎？')) {
                forceUpdateBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> 更新中...';
                forceUpdateBtn.disabled = true;

                try {
                    // 1. Unregister Service Worker
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (let registration of registrations) {
                            await registration.unregister();
                        }
                    }

                    // 2. Clear All Caches
                    if ('caches' in window) {
                        const keys = await caches.keys();
                        for (const key of keys) {
                            await caches.delete(key);
                        }
                    }

                    alert('更新完成！即將重新載入 APP。');
                    window.location.reload(true);
                } catch (e) {
                    alert('更新失敗：' + e);
                    forceUpdateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 強制更新版本';
                    forceUpdateBtn.disabled = false;
                }
            }
        });
    }
}
