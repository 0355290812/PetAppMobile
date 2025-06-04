/**
 * Format image URLs by adding the base URL to paths that start with "/upload"
 * 
 * @param {string} imageUrl - The image URL or path
 * @returns {string} - The properly formatted image URL
 */
export const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    // If URL already has http/https protocol, return it as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // If URL starts with /upload, add the base URL
    if (imageUrl.startsWith('/upload')) {
        const baseUrl = process.env.EXPO_PUBLIC_API_URL.split('/api')[0] || 'http://localhost:3000';
        return `${ baseUrl }${ imageUrl }`;
    }

    // Return original URL if it doesn't match any condition
    return imageUrl;
};

/**
 * Format multiple image URLs in an array
 * 
 * @param {Array<string>} imageUrls - Array of image URLs or paths
 * @returns {Array<string>} - Array of properly formatted image URLs
 */
export const formatImageUrls = (imageUrls) => {
    if (!imageUrls || !Array.isArray(imageUrls)) return [];

    return imageUrls.map(url => formatImageUrl(url));
};

/**
 * Extract image URLs from API response objects
 * 
 * @param {Object} item - API response object containing image field(s)
 * @param {string} imageField - Name of the field containing the image URL (default: 'image')
 * @returns {string} - The properly formatted image URL
 */
export const getItemImageUrl = (item, imageField = 'image') => {
    if (!item) return null;

    // Handle case where the image field might be an array
    if (Array.isArray(item[imageField]) && item[imageField].length > 0) {
        return formatImageUrl(item[imageField][0]);
    }

    // Handle case where the image field is a string
    if (typeof item[imageField] === 'string') {
        return formatImageUrl(item[imageField]);
    }

    // Handle images field which might be an array of image objects
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        // Check if images contains objects with a url property
        if (typeof item.images[0] === 'object' && item.images[0].url) {
            return formatImageUrl(item.images[0].url);
        }
        // Or if images contains string URLs directly
        if (typeof item.images[0] === 'string') {
            return formatImageUrl(item.images[0]);
        }
    }

    return null;
};
