/**
 * Simoon Cafe Admin Panel - Auto Layout Logger (Runs on Page Load)
 * This script automatically logs a detailed, hierarchical structure of the main tabs.
 */
(function(admin) {
    'use strict';

    /**
     * تابع اصلی برای لاگ کردن خودکار ساختار تب‌ها
     */
    admin.logLayoutOnLoad = function() {
        // یک عنوان مشخص و قابل جستجو در کنسول ایجاد می‌کنیم
        console.log('%c🗂️ AUTO LAYOUT LOG (Page Load)', 'font-size: 18px; font-weight: bold; color: #17a2b8;');
        console.log('================================================');

        const mainTabsContainer = document.querySelector('#mainTabs');

        if (!mainTabsContainer) {
            console.error('❌ Critical Error: Could not find #mainTabs container!');
            return;
        }

        // لاگ کردن اطلاعات کانتینر اصلی
        logElementDetails(mainTabsContainer, 'Parent Container: #mainTabs', true);

        const children = mainTabsContainer.children;
        console.log(`Found ${children.length} direct children inside #mainTabs.`);

        // پیمایش و لاگ کردن تمام فرزندان مستقیم
        Array.from(children).forEach((child, index) => {
            const childTitle = `Child #${index + 1}: <${child.tagName.toLowerCase()}> .${child.className.split(' ').join('.')}`;
            console.group(`└── ${childTitle}`);
            logElementDetails(child);

            // اگر فرزند، خودش فرزندانی داشت (مثل .main-tab-item)، آن‌ها را هم لاگ کن
            if (child.children.length > 0) {
                Array.from(child.children).forEach((grandchild, gIndex) => {
                    const grandchildTitle = `Grandchild #${index + 1}.${gIndex + 1}: <${grandchild.tagName.toLowerCase()}> .${grandchild.className.split(' ').join('.')}`;
                    console.group(`    └── ${grandchildTitle}`);
                    logElementDetails(grandchild);
                    console.groupEnd();
                });
            }
            console.groupEnd();
        });

        console.log('================================================');
        console.log('%cEnd of Auto Layout Log', 'font-style: italic; color: #6c757d;');
    };

    /**
     * تابع کمکی برای لاگ کردن جزئیات یک المان
     * @param {HTMLElement} element - المانی که می‌خواهیم لاگ کنیم
     * @param {string} [title] - عنوان اختیاری برای گروه
     * @param {boolean} [isParent=false] - آیا این المان کانتینر اصلی است؟
     */
    function logElementDetails(element, title, isParent = false) {
        if (title) {
            console.groupCollapsed(isParent ? title : `Details for <${element.tagName.toLowerCase()}>`);
        }

        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        console.log('📏 Position & Dimensions (relative to viewport):');
        console.log({
            top: `${rect.top.toFixed(2)}px`,
            left: `${rect.left.toFixed(2)}px`,
            width: `${rect.width.toFixed(2)}px`,
            height: `${rect.height.toFixed(2)}px`
        });

        console.log('🎨 Key Computed Styles:');
        console.log({
            display: style.display,
            position: style.position,
            flexDirection: style.flexDirection,
            justifyContent: style.justifyContent,
            alignItems: style.alignItems,
            gap: style.gap,
            padding: style.padding,
            margin: style.margin,
            border: style.border
        });
        
        console.log('📝 Text Content:', element.textContent.trim());

        if (title) {
            console.groupEnd();
        }
    }

})(window.SimoonAdmin);