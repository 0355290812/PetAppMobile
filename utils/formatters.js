/**
 * Format a number as Vietnamese currency (VND)
 * @param {number} amount - The amount to format
 * @param {boolean} showUnderline - Whether to show the underlined 'd' (default: true)
 * @returns {string} Formatted currency string
 */
export const formatVietnamCurrency = (amount, showUnderline = true) => {
    if (amount === undefined || amount === null) return '';

    // Format with thousands separator (dots in Vietnamese format)
    const formattedAmount = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Return with underlined 'd' if requested
    return showUnderline ? `${ formattedAmount } đ` : `${ formattedAmount } đ`;
};
