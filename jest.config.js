/** @type {import('jest').Config} */
const config = {
    // This is the most critical line. It tells Jest to set up a Node.js environment,
    // which automatically makes globals like `jest`, `describe`, and `it` available.
    testEnvironment: 'node',

    // This sets the timeout for ALL tests globally. It replaces the need
    // for jest.setTimeout() in any of your test files.
    testTimeout: 30000,

    // This line is often necessary for projects using native ES Modules (`import`/`export`).
    transform: {},

    // Optional but recommended: Make test output clearer.
    verbose: true,
};

export default config;