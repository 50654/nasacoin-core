/**
 * Common UI helper functions used across the application
 */

/**
 * Shows a toast notification using the main dashboard's toast system
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (info, success, error, warning)
 */
function showToast(message, type = 'info') {
    if (window.nasaCoinDashboard) {
        window.nasaCoinDashboard.showToast(message, type);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * Updates an element's text content by ID
 * @param {string} id - The element ID
 * @param {string|number} value - The value to set
 */
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Common Chart.js options configuration for dark theme
 * @returns {Object} Chart.js options object
 */
function getChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#ffffff'
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#b0b0b0'
                },
                grid: {
                    color: '#333333'
                }
            },
            y: {
                ticks: {
                    color: '#b0b0b0'
                },
                grid: {
                    color: '#333333'
                }
            }
        }
    };
}

/**
 * Sets up common modal event listeners
 * @param {HTMLElement} modal - The modal element
 * @param {string} closeButtonSelector - The selector for the close button
 * @param {string} cancelButtonSelector - The selector for the cancel button
 */
function setupModalEventListeners(modal, closeButtonSelector, cancelButtonSelector) {
    // Close button handler
    const closeButton = modal.querySelector(closeButtonSelector);
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            modal.remove();
        });
    }
    
    // Cancel button handler
    const cancelButton = modal.querySelector(cancelButtonSelector);
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            modal.remove();
        });
    }
}

/**
 * Sets wallet address in modal if available
 * @param {string} walletAddressId - The ID of the wallet address input element
 */
function setModalWalletAddress(walletAddressId) {
    const walletAddress = document.getElementById(walletAddressId);
    if (walletAddress && window.nasaCoinDashboard && window.nasaCoinDashboard.currentAddress) {
        walletAddress.value = window.nasaCoinDashboard.currentAddress;
    }
}

// Export for use in both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showToast,
        updateElement,
        getChartOptions,
        setupModalEventListeners,
        setModalWalletAddress
    };
}

// Also make available globally in browser
if (typeof window !== 'undefined') {
    window.UIHelpers = {
        showToast,
        updateElement,
        getChartOptions,
        setupModalEventListeners,
        setModalWalletAddress
    };
}
