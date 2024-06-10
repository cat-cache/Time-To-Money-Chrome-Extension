// contentScript.js

// API key for accessing the exchange rate API (consider keeping this secure)
const YOURAPIKEY = "----";//add your api key
const url = `https://v6.exchangerate-api.com/v6/${YOURAPIKEY}/latest/INR`;

let exchangeRatesData = null; // Variable to store fetched data

/**
 * Function to fetch exchange rates data from the API
 */
const fetchExchangeRatesData = async () => {
    try {
        let response = await fetch(url);
        if (response.ok) {
            exchangeRatesData = await response.json();
            const currentTime = new Date().getTime();
            chrome.storage.local.set({
                exchangeRatesData,
                lastUpdateTime: currentTime
            });
            console.log('Data fetched successfully:', exchangeRatesData);
        } else {
            console.error('Error:', response.status);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

/**
 * Function to get conversion rate for a currency from INR
 * @param {string} currency - The target currency code
 * @returns {number|null} - The conversion rate or null if not available
 */
const getConversionRate = async (currency) => {
    const data = await new Promise((resolve) => {
        chrome.storage.local.get(['exchangeRatesData', 'lastUpdateTime'], resolve);
    });

    const { exchangeRatesData, lastUpdateTime } = data;
    const currentTime = new Date().getTime();

    // Check if exchangeRatesData is available and up to date
    if (!exchangeRatesData || !lastUpdateTime || (currentTime - lastUpdateTime > 2 * 24 * 60 * 60 * 1000)) {
        // Fetch new exchange rates data if not available or older than two days
        await fetchExchangeRatesData();
    } else {
        console.log('Using cached exchange rates data');
    }

    const updatedData = await new Promise((resolve) => {
        chrome.storage.local.get(['exchangeRatesData'], resolve);
    });

    const conversionRates = updatedData.exchangeRatesData.conversion_rates;

    // Calculate conversion rate
    if (conversionRates && conversionRates[currency]) {
        return conversionRates[currency];
    } else {
        console.error('Conversion rate not available for currency:', currency);
        return null;
    }
};

/**
 * Function to convert an amount from INR to any target currency
 * @param {number} amountINR - The amount in INR
 * @param {string} targetCurrency - The target currency code
 * @returns {number|null} - The converted amount or null if conversion fails
 */
const convertFromINR = async (amountINR, targetCurrency) => {
    const conversionRate = await getConversionRate(targetCurrency);
    if (conversionRate !== null) {
        const amount = amountINR * conversionRate;
        return amount;
    }
    return null; // Return null if conversion fails
};

/**
 * Function to append hours of work based on the price elements found on the page
 * @param {number} hourlyWage - The hourly wage in INR
 */
async function appendHoursOfWork(hourlyWage) {
    const priceElements = document.querySelectorAll('.a-price-whole'); // Find all elements containing price information
    for (let priceElement of priceElements) {
        const parentElement = priceElement.parentNode; // Get the parent element containing the price
        const symbolElement = parentElement.querySelector('.a-price-symbol'); // Find the currency symbol element
        const symbol = symbolElement ? symbolElement.textContent.trim() : ''; // Get the currency symbol

        // Get the whole and fractional parts of the price
        const priceText = priceElement.textContent.trim().replace(/,/g, ''); // Remove commas from the price text
        const whole = parseFloat(priceText);
        const fractionElement = parentElement.querySelector('.a-price-fraction');
        const fraction = fractionElement ? parseFloat(fractionElement.textContent.trim()) : 0;

        let price = whole + fraction / 100; // Calculate total price, combine whole and fractional parts

        // Currency mapping
        const currencyMapping = {
            '₹': 'INR', // Indian Rupee
            '$': 'USD', // United States Dollar
            '€': 'EUR', // Euro
            '£': 'GBP', // British Pound Sterling
            '¥': 'JPY', // Japanese Yen
            'C$': 'CAD', // Canadian Dollar
            'A$': 'AUD', // Australian Dollar
            'CHF': 'CHF', // Swiss Franc
            'HK$': 'HKD', // Hong Kong Dollar
            'S$': 'SGD', // Singapore Dollar
            '₩': 'KRW', // South Korean Won
            'R$': 'BRL', // Brazilian Real
            'RUB': 'RUB', // Russian Ruble
            '₱': 'PHP', // Philippine Peso
            'MX$': 'MXN', // Mexican Peso
            'NZ$': 'NZD', // New Zealand Dollar
            'ZAR': 'ZAR', // South African Rand
            '₺': 'TRY', // Turkish Lira
            '₪': 'ILS', // Israeli Shekel
            'د.إ': 'AED', // UAE Dirham
            'kr': 'SEK' // Swedish Krona
        };

        // Convert the price to INR if it's not already
        if (symbol !== '₹') {
            if (currencyMapping[symbol]) {
                const valofonerupee = await convertFromINR(1, currencyMapping[symbol]);
                if (valofonerupee !== null) {
                    price = price / valofonerupee;
                }
            }
        }

        // Calculate hours of work based on the price and hourly wage
        const hoursOfWork = price / hourlyWage;

        // Create a new element to display the hours of work
        const hoursElement = document.createElement('span');
        hoursElement.textContent = ` (${hoursOfWork.toFixed(2)} hrs)`;

        // Insert the hours of work after the price
        parentElement.appendChild(hoursElement);
    }
}

/**
 * Function to retrieve user settings from Chrome storage
 * @param {function} callback - The callback function to handle the retrieved settings
 */
function getUserSettings(callback) {
    chrome.storage.sync.get(['hourlyWage', 'currency'], async (result) => {
        let hourlyWage = result.hourlyWage || 100; // Default hourly wage is 100 INR if none is saved
        const currency = result.currency || 'INR'; // Default currency is INR if none is saved

        if (currency !== 'INR') {
            const conversionRate = await convertFromINR(1, currency);
            if (conversionRate !== null) {
                hourlyWage = hourlyWage / conversionRate; // Convert hourly wage to INR
            }
        }

        callback(hourlyWage);
    });
}

/**
 * Main function to execute when content script is injected
 */
function main() {
    // Get user settings from Chrome storage
    getUserSettings((hourlyWage) => {
        // Append hours of work after each displayed price
        appendHoursOfWork(hourlyWage);
    });
}

// Call main function
main();
