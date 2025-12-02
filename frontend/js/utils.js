// ================================= JAVASCRIPT FILE =================================
// File: js/utils.js
// Description: Utility functions for Simoon Cafe application.
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================

// وارد کردن متغیر IMAGE_BASE_PATH از فایل config.js
import { IMAGE_BASE_PATH } from './config.js';

// ================================= HELPER FUNCTIONS =================================
/**
 * Formats a number into a currency string (USD).
 * @param {number} price - The numerical price to format.
 * @returns {string} The formatted price string (e.g., "$2.50").
 */
export const formatPrice = (price) => {
    // ابتدا price را به عدد تبدیل کنید و سپس از toFixed استفاده کنید
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
        return '0.00'; // در صورتی که مقدار نامعتبر بود
    }
    return numPrice.toFixed(2);
};

/**
 * Creates and returns a debounced version of the passed function.
 * The debounced function will only be invoked after the specified delay has passed
 * since its last invocation. Useful for performance-sensitive events like resizing or scrolling.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} The new debounced function.
 */
export const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

/**
 * Normalizes image paths to ensure they're correctly formatted
 * @param {string} imagePath - The original image path
 * @returns {string} - The normalized image path
 */
export const normalizeImagePath = (imagePath) => {
  // --- DEBUG LOG ---
  console.log(`[PATH DEBUG] normalizeImagePath received: "${imagePath}"`);
  console.log(`[PATH DEBUG] IMAGE_BASE_PATH is: "${IMAGE_BASE_PATH}"`);
  // --- END DEBUG LOG ---

  if (!imagePath) {
    console.log('[PATH DEBUG] Path is empty, returning empty string.');
    return '';
  } 
  
  // If path is already a full URL, return it as is
  if (imagePath.startsWith('http')) {
    console.log(`[PATH DEBUG] Path is a full URL, returning as is: "${imagePath}"`);
    return imagePath;
  }
  
  // If path already starts with the base path, return it as is
  if (imagePath.startsWith(IMAGE_BASE_PATH)) {
    console.log(`[PATH DEBUG] Path already starts with base path, returning as is: "${imagePath}"`);
    return imagePath;
  }
  
  // If path already contains 'images/', don't add it again
  if (imagePath.includes('images/')) {
    console.log(`[PATH DEBUG] Path already contains 'images/', removing and prepending base path`);
    // Remove 'images/' from the path and prepend the base path
    const cleanPath = imagePath.replace('images/', '');
    const finalPath = `${IMAGE_BASE_PATH}${cleanPath}`;
    console.log(`[PATH DEBUG] Final path is: "${finalPath}"`);
    return finalPath;
  }
  
  // Otherwise, prepend the base path
  const finalPath = `${IMAGE_BASE_PATH}${imagePath}`;
  console.log(`[PATH DEBUG] Prepending base path. Final path is: "${finalPath}"`);
  return finalPath;
};

/**
 * Sets the background image for an element using the normalized path
 * @param {HTMLElement} element - The element to set the background for
 * @param {string} imagePath - The image path
 */
export const setBackgroundImage = (element, imagePath) => {
  if (!element) return;
  
  const normalizedPath = normalizeImagePath(imagePath);
  element.style.backgroundImage = `url('${normalizedPath}')`;
};

/**
 * Sets the source for an image element using the normalized path
 * @param {HTMLImageElement} imgElement - The image element
 * @param {string} imagePath - The image path
 */
export const setImageSrc = (imgElement, imagePath) => {
  if (!imgElement) return;
  
  const normalizedPath = normalizeImagePath(imagePath);
  imgElement.src = normalizedPath;
};
// ========================== END OF HELPER FUNCTIONS ==========================
// ============================== END OF JAVASCRIPT FILE ==============================