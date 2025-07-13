// Helper function to format date and time in a user-friendly way
export const formatDateTime = (dateString, completedAt) => {
  // Use completed_at if available (has time), otherwise fall back to date
  const timestamp = completedAt || dateString;

  try {
    const date = new Date(timestamp);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Fall back to original date if parsing fails
    }

    // Format as "July 11, 2025 at 2:30 PM"
    const dateOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    const timeOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    const formattedDate = date.toLocaleDateString('en-US', dateOptions);
    const formattedTime = date.toLocaleTimeString('en-US', timeOptions);

    return `${formattedDate} @ ${formattedTime}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Fall back to original if anything goes wrong
  }
};
