/**
 * Date utility functions for the LTI OMT Meeting System
 * Consolidates date calculations to avoid code duplication
 */

/**
 * Calculate the age of an LTI from its planned start date
 * @param {string|Date} plannedStartDate - The planned start date of the isolation
 * @returns {Object} Object containing days, display string, category, and isSixMonthsPlus flag
 */
export const calculateLTIAge = (plannedStartDate) => {
  if (!plannedStartDate) {
    return {
      days: 0,
      display: 'Unknown',
      category: 'unknown',
      isSixMonthsPlus: false
    };
  }

  try {
    // A bare number is almost certainly an unconverted Excel serial. Passing
    // it to Date() would treat it as milliseconds since 1970 - serial 45000
    // becomes 45 seconds past the epoch and reports as ~56 years old, which
    // then flags for six-month review.
    if (typeof plannedStartDate === 'number') {
      return {
        days: 0,
        display: 'Invalid Date',
        category: 'unknown',
        isSixMonthsPlus: false
      };
    }

    const startDate = new Date(plannedStartDate);

    // Validate date
    if (isNaN(startDate.getTime())) {
      return {
        days: 0,
        display: 'Invalid Date',
        category: 'unknown',
        isSixMonthsPlus: false
      };
    }

    const currentDate = new Date();

    // Not Math.abs: an isolation can be planned before it starts, and taking
    // the absolute difference made a not-yet-started isolation look aged. One
    // planned to begin in seven months was reported as seven months old and
    // appeared on the Operations Manager review list.
    if (startDate > currentDate) {
      return {
        days: 0,
        display: 'Not started',
        category: 'notstarted',
        isSixMonthsPlus: false
      };
    }

    const diffTime = currentDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let display = '';
    let category = '';

    if (diffDays < 30) {
      display = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
      category = 'recent';
    } else if (diffDays < 183) { // Less than 6 months
      const months = Math.floor(diffDays / 30);
      display = `${months} month${months > 1 ? 's' : ''}`;
      category = 'medium';
    } else if (diffDays < 365) { // 6-12 months
      const months = Math.floor(diffDays / 30);
      display = `${months} month${months > 1 ? 's' : ''}`;
      category = 'sixplus';
    } else if (diffDays < 730) { // 1-2 years
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      display = `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
      category = 'oneyearplus';
    } else { // 2+ years
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      display = `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
      category = 'twoyearplus';
    }

    const isSixMonthsPlus = diffDays >= 183;

    return { days: diffDays, display, category, isSixMonthsPlus };
  } catch (error) {
    return {
      days: 0,
      display: 'Invalid Date',
      category: 'unknown',
      isSixMonthsPlus: false
    };
  }
};

/**
 * Calculate age in months from a date string
 * @param {string|Date} dateStr - The date to calculate from
 * @returns {number} Age in months (can be fractional)
 */
export const calculateAgeInMonths = (dateStr) => {
  if (!dateStr) return 0;

  try {
    const startDate = new Date(dateStr);
    if (isNaN(startDate.getTime())) return 0;

    const currentDate = new Date();
    const diffTime = currentDate - startDate;
    return diffTime / (1000 * 60 * 60 * 24 * 30);
  } catch (error) {
    return 0;
  }
};

/**
 * Format a date for display
 * @param {string|Date} date - The date to format
 * @param {string} format - 'short' (MM/DD/YYYY) or 'long' (Month DD, YYYY)
 * @returns {string} Formatted date string
 */
export const formatDisplayDate = (date, format = 'short') => {
  if (!date) return 'N/A';

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    if (format === 'long') {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    return dateObj.toLocaleDateString('en-US');
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Check if a date is valid
 * @param {string|Date} date - The date to validate
 * @returns {boolean} True if valid date
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

/**
 * Get date threshold categories for LTI age display
 * @param {string} category - The category from calculateLTIAge
 * @returns {string} Color code for MUI chip (error, warning, info, success, default)
 */
export const getAgeCategoryColor = (category) => {
  switch (category) {
    case 'twoyearplus':
      return 'error';
    case 'oneyearplus':
      return 'warning';
    case 'sixplus':
      return 'info';
    case 'medium':
      return 'default';
    case 'recent':
      return 'success';
    default:
      return 'default';
  }
};
