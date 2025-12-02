// ================================= JAVASCRIPT FILE =================================
// File: js/api.js
// Description: API service functions for interacting with the server
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================
import { config } from './config.js';
import { 
    apiLogger, 
    validateMenuData, 
    checkImagesExist, 
    createPerformanceMonitor // <--- این خط حتماً باید وجود داشته باشد
} from './logger.js';
import { setBackgroundImage } from './utils.js';

let lastMenuDataHash = null;
const welcomeSection = document.querySelector('.welcome-section');
setBackgroundImage(welcomeSection, 'locwel.png');
/**
 * Fetches all menu items and custom categories from the server
 * @returns {Promise<Array<Object>>} Array of menu items
 */
export const fetchMenuItems = async () => {
    const monitor = createPerformanceMonitor('fetchMenuItems');
    
    try {
        apiLogger.section('Fetch Menu Items');
        
        // دریافت محصولات از سرور
        const productsResponse = await fetch(`${config.API_BASE_URL}/api/menu`);
        
        if (!productsResponse.ok) {
            throw new Error(`Server responded with ${productsResponse.status}: ${productsResponse.statusText}`);
        }
        
        const productsData = await productsResponse.json();
        apiLogger.debug('Products data received from server', productsData);
        
        // دریافت دسته‌بندی‌های سفارشی از سرور
        const categoriesResponse = await fetch(`${config.API_BASE_URL}/api/admin/custom-categories`);
        const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : [];
        apiLogger.debug('Custom categories received from server', categoriesData);
        
        // تبدیل داده‌های محصولات به ساختار مورد انتظار فرانت
        const transformedData = productsData.map(item => ({
            ...item,
            mainCategory: item.category,       // تبدیل category به mainCategory
            subCategory: item.sub_category,     // تبدیل sub_category به subCategory
            // Keep the ingredients array as is, it will be processed in menu.js
            ingredients: item.ingredients || []
        }));
        
        // Validate the transformed data
        const validation = validateMenuData(transformedData);
        apiLogger.logDataValidation('Menu Items', transformedData, validation.isValid, validation.issues);
        
        // Check if images exist
        if (validation.isValid) {
            apiLogger.info('Checking if menu item images exist...');
            checkImagesExist(transformedData).then(results => {
                const missingImages = results.filter(result => !result.exists);
                if (missingImages.length > 0) {
                    apiLogger.warn(`Found ${missingImages.length} missing images`, missingImages);
                } else {
                    apiLogger.info('All menu item images loaded successfully');
                }
            });
        }
        
        apiLogger.logApiCall('GET', `${config.API_BASE_URL}/api/menu`, null, transformedData);
        console.log('DEBUG: Fetching from URL:', config.API_BASE_URL);

        const duration = monitor.end({ itemCount: transformedData.length });
        apiLogger.endSection();
        
        return transformedData;
    } catch (error) {
        apiLogger.logApiCall('GET', `${config.API_BASE_URL}/api/menu`, null, null, error);
            console.log('DEBUG: Fetching from URL:', config.API_BASE_URL);

        apiLogger.endSection();
        throw error;
    }
};

/**
 * Checks if the menu data has changed on the server.
 * @returns {Promise<boolean>} True if data has changed, false otherwise.
 */
export const checkForMenuUpdates = async () => {
    const monitor = createPerformanceMonitor('checkForMenuUpdates');
    
    apiLogger.section('Check for Menu Updates');
    
    try {
        const response = await fetch(`${config.API_BASE_URL}/api/menu`);
        if (!response.ok) {
            apiLogger.warn('Could not check for updates, server might be unavailable');
            apiLogger.endSection();
            return false;
        }
        
        const data = await response.json();
        
        const transformedData = data.map(item => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            mainCategory: item.category,
            subCategory: item.sub_category,
            image: item.image,
            available: item.stock_quantity,
            isSpecial: item.is_special,
            ingredients: item.ingredients || []
        }));
        
        const newDataHash = JSON.stringify(transformedData.sort((a, b) => a.id - b.id));
        
        if (newDataHash !== lastMenuDataHash) {
            apiLogger.info('Menu data has changed, update required');
            lastMenuDataHash = newDataHash;
            window.allMenuItems = transformedData;
            
            const duration = monitor.end({ hasChanges: true });
            apiLogger.endSection();
            return true;
        } else {
            apiLogger.info('Menu data has not changed');
            
            const duration = monitor.end({ hasChanges: false });
            apiLogger.endSection();
            return false;
        }
    } catch (error) {
        apiLogger.error('Error checking for menu updates', error);
        apiLogger.endSection();
        return false;
    }
};
// ============================== END OF JAVASCRIPT FILE ==============================