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

/**
 * Format a date string to Vietnamese date format
 * @param {string} dateString - The date string to format
 * @param {string} formatPattern - The format pattern (default: 'dd/MM/yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, formatPattern = 'dd/MM/yyyy') => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Ngày không hợp lệ';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        if (formatPattern === 'dd/MM/yyyy') {
            return `${ day }/${ month }/${ year }`;
        }

        // You can add more format patterns here if needed
        return date.toLocaleDateString('vi-VN');
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Ngày không hợp lệ';
    }
};
