#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get user inputs from command-line arguments
const [directoryPath, searchString, replaceString] = process.argv.slice(2);

// Validate user inputs
if (!directoryPath || !searchString || !replaceString) {
    console.error('Usage: file-editor.exe <directory> <searchString> <replaceString>');
    process.exit(1);
}

// Define logs directory outside the packaged executable
const logsDir = path.join(os.homedir(), 'logs'); // Save logs in the user's home directory

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Generate log file name with current date
const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
const logFilePath = path.join(logsDir, `editor-${currentDate}.log`);

// Function to log messages to the log file and console
function logMessage(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    // Log to console
    console.log(logEntry.trim());

    // Log to file
    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error(`Failed to write to log file: ${err}`);
        }
    });
}

function editFilesInDirectory(dirPath) {
    // Read the contents of the directory
    fs.readdir(dirPath, (err, files) => {
        if (err) {
			logMessage(`ERROR: Unable to scan directory: ${err}`);
            return console.error(`Unable to scan directory: ${err}`);
        }

        // Loop through each file/directory in the current directory
        files.forEach((file) => {
            const filePath = path.join(dirPath, file);

            // Check if the current path is a directory or a file
            fs.stat(filePath, (err, stats) => {
                if (err) {
					logMessage(`ERROR: Unable to stat file/directory: ${err}`);
                    return;
                }

                if (stats.isDirectory()) {
                    // If it's a directory, recursively call the function
                    editFilesInDirectory(filePath);
                } else if (stats.isFile()) {
                    // If it's a file, read the file content
                    fs.readFile(filePath, 'utf8', (err, data) => {
                        if (err) {
							logMessage(`ERROR: Unable to read file: ${filePath} - ${err}`);
                            return;
                        }

                        // Check if the search string exists in the file
                        if (data.includes(searchString)) {
                            // Replace the search string with the replace string
                            const updatedData = data.replace(new RegExp(searchString, 'g'), replaceString);

                            // Write the updated content back to the file
                            fs.writeFile(filePath, updatedData, 'utf8', (err) => {
                                if (err) {
                                    logMessage(`ERROR: Unable to write file: ${filePath} - ${err}`);
                                    return;
                                }
                                logMessage(`UPDATED: ${filePath}`);
                            });
                        } else {
                            // If the search string is not found, skip the file
                            logMessage(`SKIPPED: ${filePath} (String not found)`);
                        }
                    });
                }
            });
        });
    });
}

// Start the process by calling the function with the directory path
logMessage('Starting file editor script...');
logMessage(`Directory: ${directoryPath}`);
logMessage(`Search String: ${searchString}`);
logMessage(`Replace String: ${replaceString}`);
editFilesInDirectory(directoryPath);