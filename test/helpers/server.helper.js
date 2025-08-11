import { io } from 'socket.io-client';
import GameServer from '../../src/server/GameServer.js'

const PORT = 3001; // Use a different port for testing to avoid conflicts

/**
 * Sets up a test environment with a running GameServer and a connected client.
 */
export function setupServerAndClient() {
    let server;
    let clientSocket;

    // Start the server once before all tests in a file
    beforeAll((done) => {
        server = new GameServer();
        server.listen(PORT);
        done();
    });

    // Close the server once after all tests in a file
    afterAll((done) => {
        server.io.close();
        done();
    });

    // Connect a new client before each test
    beforeEach((done) => {
        clientSocket = io(`http://localhost:${PORT}`, {
            transports: ['websocket'],
            forceNew: true,
        });
        clientSocket.on('connect', done);
    });

    // Disconnect the client after each test
    afterEach((done) => {
        if (clientSocket.connected) {
            clientSocket.disconnect();
        }
        done();
    });

    // Return a function that tests can use to get the current client socket
    return () => clientSocket;
}

/**
 * Helper to create multiple clients for multiplayer tests.
 * @returns {Promise<import('socket.io-client').Socket>}
 */
export function createClient() {
    return new Promise((resolve) => {
        const socket = io(`http://localhost:${PORT}`, {
            transports: ['websocket'],
            forceNew: true,
        });
        socket.on('connect', () => resolve(socket));
    });
}

export function makeMove(socket, moveString) {
    return new Promise((resolve, reject) => {
        socket.once('move_made', resolve);
        socket.once('invalid_move', (err) => {
            reject(new Error(`Invalid move: ${moveString} - ${err.message}`));
        });
        socket.emit('make_move', moveString);
    });
};

// Helper: Wait for game over event
export function waitForGameOver(socket) {
    return new Promise((resolve) => {
        socket.once('game_finished', resolve);
    });
};

// Helper: Join game and wait for start
export async function joinAndAwaitStart() {
    const socket = await createClient();
    return new Promise((resolve, reject) => {
        socket.on('connect_error', reject);
        socket.on('game_started', (data) => {
            resolve({ socket, color: data.color });
        });
        socket.emit('join_game');
    });
};


