// background.js

// This event is fired when the extension is first installed or updated.
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');  // Log a message to the console indicating the extension has been installed.
});
