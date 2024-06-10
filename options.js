// Get the saved currency and hourly wage from Chrome storage
chrome.storage.sync.get(['currency', 'hourlyWage'], (result) => {
    // If there's no saved currency or hourly wage, set default values
    const currency = result.currency || 'INR'; // Default to INR if no currency is saved
    const hourlyWage = result.hourlyWage || 100; // Default hourly wage is 100 INR if none is saved

    // Set the selected currency and hourly wage in the HTML select and input elements
    document.getElementById('currency').value = currency;
    document.getElementById('hourlyWage').value = hourlyWage;
});

// Event listener for the "Save" button
document.getElementById('save').addEventListener('click', () => {
    const currency = document.getElementById('currency').value;
    const hourlyWageInput = document.getElementById('hourlyWage');
    const hourlyWage = parseFloat(hourlyWageInput.value);

    // Check if hourlyWage is a valid number and greater than zero
    if (isNaN(hourlyWage) || hourlyWage <= 0) {
        alert('Please enter a valid hourly wage.');
        hourlyWageInput.focus(); // Set focus back to the input field
        return; // Exit the function without saving
    }

    // Save the currency and hourly wage to Chrome storage
    chrome.storage.sync.set({ currency, hourlyWage }, () => {
      alert('Hourly wage saved!');
    });
});
