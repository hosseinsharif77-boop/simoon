/**
 * Simoon Cafe Admin Panel - Main Application (Updated with i18n)
 */
(function(admin) {
    'use strict';

    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🚀 ' + admin.i18n.t('admin_panel_script_loaded'));
        
        if (typeof admin.setupEventListeners !== 'function') {
            console.error(admin.i18n.t('fatal_error_event_listeners'));
            return; 
        }
        
        try {
            // 1. اول از همه، سیستم چندزبانه را راه‌اندازی کنید
            if (typeof admin.i18n.init === 'function') {
                await admin.i18n.init();
            } else {
                console.error(admin.i18n.t('fatal_error_i18n_init'));
            }

            // 2. سپس رویدادها را تنظیم کنید
            admin.setupEventListeners();
            
            // --- راه‌حل بهبودیافته برای مشکل هنگ کردن مودال ---
            // ابتدا، تگ <body> را به یک عنصر قابل فوکوس تبدیل می‌کنیم
            document.body.setAttribute('tabindex', '-1');

            // این تابع کمکی، با استفاده از requestAnimationFrame برای جلوگیری از race condition، فوکوس را مدیریت می‌کند
            const addModalFocusFix = (modalId) => {
                const modalElement = document.getElementById(modalId);
                if (modalElement) {
                    // رویداد hide.bs.modal را برای مدیریت فوکوس اضافه می‌کنیم
                    modalElement.addEventListener('hide.bs.modal', function () {
                        const focusedElement = document.activeElement;
                        if (focusedElement && modalElement.contains(focusedElement)) {
                            // استفاده از requestAnimationFrame برای حل مشکل timing
                            requestAnimationFrame(() => {
                                document.body.focus();
                            });
                        }
                    });
                    
                    // همچنین رویداد hidden.bs.modal را برای اطمینان از پاکسازی منابع اضافه می‌کنیم
                    modalElement.addEventListener('hidden.bs.modal', function () {
                        // حذف کلاس‌های مودال از body برای جلوگیری از تداخل
                        document.body.classList.remove('modal-open');
                        document.body.style.removeProperty('overflow');
                        document.body.style.removeProperty('padding-right');
                        
                        // حذف backdrop در صورت وجود
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) {
                            backdrop.remove();
                        }
                    });
                }
            };

            // اعمال این اصلاح روی تمام مودال‌های موجود
            const modalsToFix = [
                'productModal', 
                'confirmModal', 
                'categoryModal', 
                'bulkEditModal', 
                'stockUpdateModal', 
                'addIngredientModal', 
                'specialSlideModal',
                'orderDetailsModal', 
                'userSettingsModal'
            ];
            modalsToFix.forEach(addModalFocusFix);
            // --- پایان راه‌حل بهبودیافته ---
            
            // 3. سپس داده‌ها را بارگذاری کنید
            if (typeof admin.fetchProducts === 'function') {
                await admin.fetchProducts();
            } else {
                console.warn(admin.i18n.t('warning_fetch_products'));
            }

            if (typeof admin.fetchCategoriesAndSubcategories === 'function') {
                await admin.fetchCategoriesAndSubcategories();
            } else {
                console.warn(admin.i18n.t('warning_fetch_categories'));
            }

            if (typeof admin.fetchSpecialSlides === 'function') {
                await admin.fetchSpecialSlides();
            } else {
                console.warn(admin.i18n.t('warning_fetch_slides'));
            }
            
            // Initialize namespaces if they don't exist
            if (!admin.orders) admin.orders = {};
            if (!admin.settings) admin.settings = {};
            if (!admin.dashboard) admin.dashboard = {};
            if (!admin.customers) admin.customers = {}; // اصلاح غلط املایی
            if (!admin.reports) admin.reports = {};
            if (!admin.staff) admin.staff = {};
            if (!admin.inventory) admin.inventory = {};
            
            // Fetch data for existing sections
            if (typeof admin.orders.fetchOrders === 'function') {
                await admin.orders.fetchOrders();
            } else {
                console.warn(admin.i18n.t('warning_fetch_orders'));
            }

            if (typeof admin.settings.loadSettings === 'function') {
                await admin.settings.loadSettings();
            } else {
                console.warn(admin.i18n.t('warning_load_settings'));
            }
            
            // --- Initialize new sections ---
            if (typeof admin.dashboard.init === 'function') {
                await admin.dashboard.init();
            } else {
                console.warn(admin.i18n.t('warning_init_dashboard'));
            }

            if (typeof admin.customers.init === 'function') {
                await admin.customers.init();
            } else {
                console.warn(admin.i18n.t('warning_init_customers'));
            }

            if (typeof admin.reports.init === 'function') {
                await admin.reports.init();
            } else {
                console.warn(admin.i18n.t('warning_init_reports'));
            }

            if (typeof admin.staff.init === 'function') {
                await admin.staff.init();
            } else {
                console.warn(admin.i18n.t('warning_init_staff'));
            }
            // --- End Initialize new sections ---

            // 4. رابط کاربری را رندر کنید
            if (typeof admin.renderMainTabs === 'function') {
                admin.renderMainTabs();
            } else {
                console.warn(admin.i18n.t('warning_render_main_tabs'));
            }
            
            // 5. اولین دسته بندی را انتخاب کنید
            if (admin.state && admin.state.allCategories && admin.state.allCategories.length > 0) {
                if (typeof admin.selectMainCategory === 'function') {
                    admin.selectMainCategory(admin.state.allCategories[0].name);
                }
            }

            // 6. Initialize products table functionality
            if (typeof admin.initProductsTable === 'function') {
                admin.initProductsTable();
            } else {
                console.warn(admin.i18n.t('warning_init_products_table'));
            }

            // Initialize mobile navigation
            admin.initMobileNavigation();
            
        } catch (error) {
            console.error(admin.i18n.t('error_initialization'), error);
            alert(admin.i18n.t('error_loading_admin_panel'));
        }
    });

    /**
     * نمایش سکشن مورد نظر و مخفی کردن بقیه (Updated with i18n)
     * @param {string} sectionName - نام سکشن (مثلاً 'categories', 'inventory', 'orders', 'settings')
     */
    admin.showSection = function(sectionName) {
        // Hide all sections first
        if (admin.dom.categoriesSection) admin.dom.categoriesSection.style.display = 'none';
        if (admin.dom.inventorySection) admin.dom.inventorySection.style.display = 'none';
        if (admin.dom.ordersSection) admin.dom.ordersSection.style.display = 'none';
        if (admin.dom.settingsSection) admin.dom.settingsSection.style.display = 'none';
        
        // --- Hide new sections ---
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) dashboardSection.style.display = 'none';
        
        const customersSection = document.getElementById('customers-section');
        if (customersSection) customersSection.style.display = 'none';
        
        const reportsSection = document.getElementById('reports-section');
        if (reportsSection) reportsSection.style.display = 'none';
        
        const staffSection = document.getElementById('staff-section');
        if (staffSection) staffSection.style.display = 'none';
        // --- End Hide new sections ---
        
        // Show selected section with translated title
        if (sectionName === 'categories') {
            if (admin.dom.categoriesSection) {
                admin.dom.categoriesSection.style.display = 'block';
                admin.updateSectionTitle(admin.i18n.t('manage_categories_products'));
            }
        } else if (sectionName === 'inventory') {
            if (admin.dom.inventorySection) {
                admin.dom.inventorySection.style.display = 'block';
                admin.updateSectionTitle(admin.i18n.t('inventory_management'));
                
                // Initialize inventory section if not already initialized
                if (typeof admin.inventory.init === 'function' && !admin.inventory.initialized) {
                    admin.inventory.init();
                    admin.inventory.initialized = true;
                }
                
                // Setup inventory tab event listeners
                admin.setupInventoryTabListeners();
            }
        } else if (sectionName === 'orders') {
            if (admin.dom.ordersSection) {
                admin.dom.ordersSection.style.display = 'block';
                admin.updateSectionTitle(admin.i18n.t('order_management'));
            }
        } else if (sectionName === 'settings') {
            if (admin.dom.settingsSection) {
                admin.dom.settingsSection.style.display = 'block';
                admin.updateSectionTitle(admin.i18n.t('settings'));
            }
        } else if (sectionName === 'dashboard') { // NEW
            if (dashboardSection) {
                dashboardSection.style.display = 'block';
                admin.updateSectionTitle(admin.i18n.t('dashboard'));
            }
        } else if (sectionName === 'customers') { // NEW
            if (customersSection) {
                customersSection.style.display = 'block';
                admin.updateSectionTitle(admin.i18n.t('customer_management'));
            }
        } else if (sectionName === 'reports') { // NEW
            if (reportsSection) {
                reportsSection.style.display = 'block';
                admin.updateSectionTitle(admin.i18n.t('reports_analytics'));
            }
        } else if (sectionName === 'staff') { // NEW
            if (staffSection) {
                staffSection.style.display = 'block';
                admin.updateSectionTitle(admin.i18n.t('staff_management'));
            }
        }
        
        // Update mobile navigation active state
        admin.updateMobileNavActiveState(sectionName);
    };

    /**
     * تغییر عنوان هدر بر اساس سکشن فعال
     * @param {string} title - عنوان جدید (ترجمه شده)
     */
    admin.updateSectionTitle = function(title) {
        if (admin.dom.sectionTitle) {
            admin.dom.sectionTitle.textContent = title;
        }
    };

    /**
     * Initialize mobile navigation
     */
    admin.initMobileNavigation = function() {
        const moreMenuToggle = document.getElementById('more-menu-toggle');
        const mobileDropdown = document.querySelector('.mobile-dropdown');
        const mobileMoreMenu = document.getElementById('mobile-more-menu');
        
        if (!moreMenuToggle || !mobileDropdown || !mobileMoreMenu) {
            console.warn(admin.i18n.t('warning_mobile_nav_elements'));
            return;
        }
        
        // باز/بسته کردن منوی کشویی
        moreMenuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            mobileDropdown.classList.toggle('show');
        });
        
        // مدیریت کلیک روی آیتم‌های منو
        const mobileMenuItems = document.querySelectorAll('.mobile-menu-item');
        mobileMenuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                const section = this.getAttribute('data-section');
                if (section) {
                    // بستن منو
                    mobileDropdown.classList.remove('show');
                    
                    // نمایش بخش انتخاب شده
                    if (typeof admin.showSection === 'function') {
                        admin.showSection(section);
                    }
                }
            });
        });
        
        // بستن منو با کلیک خارج از آن
        document.addEventListener('click', function() {
            if (mobileDropdown.classList.contains('show')) {
                mobileDropdown.classList.remove('show');
            }
        });
        
        // جلوگیری از بسته شدن منو با کلیک داخل آن
        mobileMoreMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // مدیریت آیتم‌های عادی ناوبری موبایل
        const mobileNavItems = document.querySelectorAll('.mobile-bottom-nav-item[data-section]');
        mobileNavItems.forEach(item => {
            item.addEventListener('click', function() {
                const section = this.getAttribute('data-section');
                if (section && typeof admin.showSection === 'function') {
                    // نمایش بخش انتخاب شده
                    admin.showSection(section);
                }
            });
        });
    };
    
    /**
     * Update mobile navigation active state
     * @param {string} sectionName - نام سکشن فعال
     */
    admin.updateMobileNavActiveState = function(sectionName) {
        // به‌روزرسانی حالت فعال برای آیتم‌های ناوبری موبایل
        document.querySelectorAll('.mobile-bottom-nav-item').forEach(navItem => {
            navItem.classList.remove('active');
        });
        
        // بررسی آیا بخش در آیتم‌های اصلی وجود دارد
        const mainNavItem = document.querySelector(`.mobile-bottom-nav-item[data-section="${sectionName}"]`);
        if (mainNavItem) {
            mainNavItem.classList.add('active');
        } else {
            // اگر بخش در منوی کشویی است، دکمه "بیشتر" را فعال کن
            const moreMenuToggle = document.getElementById('more-menu-toggle');
            if (moreMenuToggle) {
                moreMenuToggle.classList.add('active');
            }
        }
    };
    
    /**
     * Setup inventory tab event listeners
     */
    admin.setupInventoryTabListeners = function() {
        const inventoryTabs = document.querySelectorAll('#inventoryTabsRibbon .main-tab-item');
        
        inventoryTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const section = this.getAttribute('data-section');
                if (section && typeof admin.inventory.selectSection === 'function') {
                    admin.inventory.selectSection(section);
                }
            });
        });
    };

    // --- Notification System (unchanged) ---
    let alertIntervalId;

    admin.checkForLowStockAlerts = async () => {
        // Placeholder for real implementation
        console.log(admin.i18n.t('checking_low_stock_alerts'));
    };

    admin.displayLowStockAlert = (alerts) => {
        // Placeholder for real implementation
        console.log(admin.i18n.t('displaying_low_stock_alert'), alerts);
    };

    admin.startStockAlertPolling = () => {
        alertIntervalId = setInterval(admin.checkForLowStockAlerts, 15000);
    };

    admin.stopStockAlertPolling = () => {
        if (alertIntervalId) {
            clearInterval(alertIntervalId);
        }
    };

})(window.SimoonAdmin);