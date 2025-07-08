// game.test.js
const io = require('socket.io-client');

describe('Socket Server Tests', () => {
    let socket;

    beforeAll((done) => {
        // Connect to the Socket.IO server
        socket = io.connect('http://localhost:3000', {
            transports: ['websocket'], // Use WebSocket transport for faster testing
            forceNew: true,
        });

        socket.on('connect', () => {
            console.log('Connected to server');
            done(); // Notify Jest that the connection is established
        });
    });

    afterAll((done) => {
        // Cleanup after all tests are complete
        socket.disconnect();
        done();
    });

    it('should connect to the server', (done) => {
        expect(socket.connected).toBe(true);
        done();
    });

    it('should set the username successfully', (done) => {
        const testUsername = "testUser";

        socket.emit('set_username', testUsername); // Emit the event

        socket.on('username_set', (username) => {
            expect(username).toBe(testUsername);
            done();
        });
    });

    it('should join a game and receive gameId', (done) => {
        socket.emit('join_game'); // Emit the join game event

        socket.on('joined_game', (data) => {
            done();
        });
    });

    it('should disconnect from the server', (done) => {
        socket.on('disconnect', () => {
            expect(socket.connected).toBe(false); // Socket should be disconnected
            done();
        });

        socket.disconnect(); // Disconnect from the server
    });
});
