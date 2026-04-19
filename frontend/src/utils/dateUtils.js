export const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // UK format: DD/MM/YYYY
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};
