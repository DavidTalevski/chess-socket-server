import { setupServerAndClient, createClient } from '../helpers/server.helper.js';

describe('Gameplay Tests', () => {
    const getClientSocket = setupServerAndClient();

    it('should join a game and receive a gameId then leave game', (done) => {
        const socket = getClientSocket();

        // Add this error handler for better debugging!
        socket.on('connect_error', (err) => {
            // If the client can't connect, fail the test immediately
            // with a clear error instead of a timeout.
            done(new Error(`Connection failed: ${err.message}`));
        });

        socket.on('game_joined', (data) => {
            expect(data).toHaveProperty('gameId');
            expect(typeof data.gameId).toBe('number');
            socket.on('game_left', (data) => {
                done();
            });
            socket.emit("leave_game")
        });

        socket.emit('join_game');
    });

    it('should place two players in the same game', async () => {
        const player1Socket = await createClient();
        const player2Socket = await createClient();

        const joinGame = (socket) => {
            return new Promise((resolve, reject) => {
                // Also add error handlers to promises
                socket.on('connect_error', reject);
                socket.emit('join_game');
                socket.on('game_joined', resolve);
            });
        };

        const [game1, game2] = await Promise.all([
            joinGame(player1Socket),
            joinGame(player2Socket),
        ]);

        expect(game1.gameId).toBeDefined();
        expect(game1.gameId).toBe(game2.gameId);

        player1Socket.disconnect();
        player2Socket.disconnect();
    });
});