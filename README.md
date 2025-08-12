# Chess Socket Server

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node->=18.0.0-brightgreen.svg)](https://nodejs.org/en/)
[![NPM Version](https://img.shields.io/badge/npm->=9.0.0-red.svg)](https://www.npmjs.com/)

A real-time, multiplayer chess game server built with Node.js, Express, and Socket.IO. Its main purpose is to serve as a practical example of **fuzz testing with Jest**, using the complex rules of chess to find edge cases and ensure the stability of the stateful game logic.

## Getting Started

### Prerequisites

Make sure you have Node.js and npm installed. This project requires the following versions:

-   **Node.js**: `>=18.0.0`
-   **npm**: `>=9.0.0`

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/DavidTalevski/chess-socket-server.git
    cd chess-socket-server
    ```

2.  **Install NPM dependencies:**
    ```sh
    npm install
    ```

## Available Scripts

This project comes with a set of useful scripts defined in `package.json`:

| Script                  | Description                                                               |
| ----------------------- | ------------------------------------------------------------------------- |
| `npm start`             | Starts the server in production mode.                                     |
| `npm run dev`           | Starts the server in development mode with **Nodemon** for hot-reloading. |
| `npm test`              | Runs all tests once using **Jest**.                                       |
| `npm run test:watch`    | Runs tests in Jest's interactive watch mode.                              |
| `npm run test:coverage` | Generates a test coverage report.                                         |
| `npm run lint`          | Lints all `.js` files in the `src` directory using **ESLint**.            |
| `npm run lint:fix`      | Automatically fixes linting issues.                                       |
| `npm run prettier`      | Formats code using **Prettier**.                                          |
| `npm run build`         | Transpiles the `src` directory to `dist` using **Babel**.                 |

## Testing

To run the complete test suite:

```sh
npm test
```

## Author 
#### David Talevski
