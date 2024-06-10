// Function to retrieve user's choice of hourly wage and currency from Chrome storage
function getUserOptions(callback) {
    chrome.storage.sync.get(['hourlyWage', 'currency'], (result) => {
        const hourlyWage = result.hourlyWage || 100; // Default hourly wage is 100 INR if none is saved
        const currency = result.currency || 'INR'; // Default currency is INR if none is saved
        callback(hourlyWage, currency);
    });
}

// Function to update popup.html with user's choice of hourly wage and currency
function updatePopup(hourlyWage, currency) {
    document.getElementById('hourlyWage').textContent = hourlyWage;
    document.getElementById('currency').textContent = currency;
}

// Main function to execute when popup.html is loaded
function main() {
    // Gets user's choice of hourly wage and currency
    getUserOptions((hourlyWage, currency) => {
        // Updates popup.html with user's choice
        updatePopup(hourlyWage, currency);
    });
}

// Calls main function
main();
