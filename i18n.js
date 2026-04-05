const I18N = {
    supportedLocales: ['en', 'zh_CN'],
    defaultLocale: 'zh_CN',
    messages: {},
    currentLocale: null,
    
    async init() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['userLocale'], async (result) => {
                let userLocale = result.userLocale;
                if (!userLocale) {
                    let uiLang = chrome.i18n.getUILanguage();
                    userLocale = uiLang.startsWith('zh') ? 'zh_CN' : 'en';
                }
                if (!this.supportedLocales.includes(userLocale)) {
                    userLocale = this.defaultLocale;
                }
                
                this.currentLocale = userLocale;
                
                const res = await fetch(chrome.runtime.getURL(`_locales/${userLocale}/messages.json`));
                this.messages = await res.json();
                
                this.renderElements();
                resolve();
            });
        });
    },
    
    getMessage(key, substitutions = []) {
        if (!this.messages[key]) return key;
        let msg = this.messages[key].message;
        if (substitutions && substitutions.length > 0) {
            substitutions.forEach((sub, i) => {
                msg = msg.replace(`$${i + 1}`, sub);
            });
        }
        return msg;
    },

    renderElements() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (el.tagName.toLowerCase() === 'input' && el.type === 'button') {
                el.value = this.getMessage(key);
            } else if (el.tagName.toLowerCase() === 'input') {
                el.placeholder = this.getMessage(key);
            } else {
                el.textContent = this.getMessage(key);
            }
        });

        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.getMessage(key);
        });
    },

    async setLocale(locale) {
        if (this.supportedLocales.includes(locale)) {
            await new Promise((resolve) => {
                chrome.storage.local.set({ userLocale: locale }, () => resolve());
            });
            window.location.reload();
        }
    }
};
