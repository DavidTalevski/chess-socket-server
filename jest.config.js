/** @type {import('jest').Config} */
const config = {
    // Tells Jest to use Node.js environment
    testEnvironment: 'node',

    // This is crucial for ES Modules support
    transform: {}, // No transformation needed if Node version supports ESM fully

    // Increase the default timeout for tests that involve network communication
    testTimeout: 5000,
};

export default config;