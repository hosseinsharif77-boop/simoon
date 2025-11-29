// ================================= JAVASCRIPT FILE =================================
// File: js/utils.js
// Description: Utility functions for the Simoon Cafe application.
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================

// ================================= HELPER FUNCTIONS =================================
/**
 * Formats a number into a currency string (USD).
 * @param {number} price - The numerical price to format.
 * @returns {string} The formatted price string (e.g., "$2.50").
 */
export const formatPrice = (price) => `$${price.toFixed(2)}`;

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
// ========================== END OF HELPER FUNCTIONS ==========================
// ============================== END OF JAVASCRIPT FILE ==============================