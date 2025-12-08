/**
 * Simoon Cafe Admin Panel - Internationalization (i18n)
 */
(function(admin) {
    'use strict';
    
    // Create i18n namespace if it doesn't exist
    if (!admin.i18n) {
        admin.i18n = {};
    }
    
    // Default language
    admin.i18n.defaultLanguage = 'en';
    
    // Current language
    admin.i18n.currentLanguage = localStorage.getItem('language') || admin.i18n.defaultLanguage;
    
    // Translations object
    admin.i18n.translations = {};
    
    /**
     * Load translations for a specific language
     * @param {string} lang - Language code (e.g., 'en', 'fa', 'ar')
     */
    // در فایل i18n.js، تابع loadTranslations را به این شکل اصلاح کنید:
    admin.i18n.loadTranslations = async function(lang) {
        try {
            // اصلاح مسیر برای اشاره به پوشه translations در ریشه admin
            const response = await fetch(`translations/${lang}.json`);
            
            if (!response.ok) throw new Error(`Failed to load ${lang} translations`);
            
            admin.i18n.translations[lang] = await response.json();
            console.log(`Translations for ${lang} loaded successfully`);
        } catch (error) {
            console.error(`Error loading ${lang} translations:`, error);
            
            // Fallback to default language if loading fails
            if (lang !== admin.i18n.defaultLanguage) {
                console.log(`Falling back to ${admin.i18n.defaultLanguage}`);
                return admin.i18n.loadTranslations(admin.i18n.defaultLanguage);
            }
        }
    };
    
    /**
     * Get translation for a key
     * @param {string} key - Translation key
     * @param {string} lang - Language code (optional, defaults to current language)
     * @returns {string} Translated text or the key itself if not found
     */
    admin.i18n.t = function(key, lang = admin.i18n.currentLanguage) {
        if (!admin.i18n.translations[lang]) {
            console.warn(`Translations for ${lang} not loaded`);
            return key;
        }
        
        const translation = admin.i18n.translations[lang][key];
        if (translation === undefined) {
            console.warn(`Translation key "${key}" not found for ${lang}`);
            return key;
        }
        
        return translation;
    };
    
    /**
     * Set the current language
     * @param {string} lang - Language code
     */
    admin.i18n.setLanguage = async function(lang) {
        // Load translations if not already loaded
        if (!admin.i18n.translations[lang]) {
            await admin.i18n.loadTranslations(lang);
        }
        
        // Update current language
        admin.i18n.currentLanguage = lang;
        
        // Save to localStorage
        localStorage.setItem('language', lang);
        
        // Update page direction for RTL languages
        if (lang === 'fa' || lang === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
            document.body.classList.add('rtl');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
            document.body.classList.remove('rtl');
        }
        
        // Update all elements with data-i18n attribute
        admin.i18n.updateDOM();
        
        // Refresh the page to apply all translations
        window.location.reload();
    };
    
    /**
     * Update DOM elements with data-i18n attribute
     */
    admin.i18n.updateDOM = function() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = admin.i18n.t(key);
        });
    };
    
    /**
     * Initialize i18n system
     */
    admin.i18n.init = async function() {
        // Load translations for current language
        await admin.i18n.loadTranslations(admin.i18n.currentLanguage);
        
        // Update page direction
        if (admin.i18n.currentLanguage === 'fa' || admin.i18n.currentLanguage === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
            document.body.classList.add('rtl');
        }
        
        // Update DOM elements
        admin.i18n.updateDOM();
        
        // Create language switcher if it doesn't exist
        admin.i18n.createLanguageSwitcher();
    };
    
    /**
     * Create language switcher dropdown
     */
    admin.i18n.createLanguageSwitcher = function() {
        // Check if language switcher already exists
        if (document.getElementById('language-switcher')) {
            return;
        }
        
        // Create language switcher HTML
        const languageSwitcher = document.createElement('div');
        languageSwitcher.id = 'language-switcher';
        languageSwitcher.className = 'dropdown me-2'; // اضافه کردن کلاس برای استایل‌دهی بهتر
        
        languageSwitcher.innerHTML = `
            <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="languageDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-globe"></i> <span id="current-lang">${admin.i18n.currentLanguage.toUpperCase()}</span>
            </button>
            <ul class="dropdown-menu" aria-labelledby="languageDropdown">
                <li><a class="dropdown-item" href="#" data-lang="en">English</a></li>
                <li><a class="dropdown-item" href="#" data-lang="fa">فارسی</a></li>
                <li><a class="dropdown-item" href="#" data-lang="ar">العربية</a></li>
            </ul>
        `;
        
        // Find a suitable place to add the language switcher
        const header = document.querySelector('.admin-header-top .d-flex');
        if (header) {
            header.appendChild(languageSwitcher);
            
            // Add event listeners
            document.querySelectorAll('#language-switcher .dropdown-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const lang = this.getAttribute('data-lang');
                    admin.i18n.setLanguage(lang);
                });
            });
        }
    };
    
})(window.SimoonAdmin);