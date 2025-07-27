import { setupServerAndClient } from '../helpers/server.helper.js';

describe('Connection Tests', () => {
    // This function call sets up all the beforeAll/afterAll/etc. hooks
    const getClientSocket = setupServerAndClient();

    it('should connect to the server successfully', () => {
        const socket = getClientSocket();
        expect(socket.connected).toBe(true);
    });

    it('should set a username and receive confirmation', (done) => {
        const socket = getClientSocket();
        const testUsername = "player1";

        socket.emit('set_username', testUsername);

        socket.on('username_set', (username) => {
            expect(username).toBe(testUsername);
            done(); // Notify Jest the async test is complete
        });
    });
});