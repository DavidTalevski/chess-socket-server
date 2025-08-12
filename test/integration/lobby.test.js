/**
 * @file Game Lobby and Matchmaking Tests
 * @description This suite tests the initial player journey: connecting, setting a username,
 * and being matched into a game. It ensures the core lobby and matchmaking logic is working correctly.
 */
import { jest } from '@jest/globals'; // <-- THE FIX IS HERE
import { setupServerAndClient, createClient } from '../helpers/server.helper.js';

describe('Game Lobby and Matchmaking Tests', () => {
    // The setupServerAndClient helper initializes the server and provides a function
    // to create new client sockets for each test.
    const getClientSocket = setupServerAndClient();

    it('should allow a player to set a username and receive confirmation', (done) => {
        const socket = getClientSocket();
        const username = 'Player1';

        socket.on('connect_error', (err) => {
            done(new Error(`Connection failed: ${err.message}`));
        });

        socket.on('username_set', (data) => {
            expect(data).toBe(username);
            socket.disconnect();
            done();
        });

        socket.emit('set_username', username);
    });

    it('should allow a player to join a game and receive a gameId, then leave successfully', (done) => {
        const socket = getClientSocket();

        socket.on('connect_error', (err) => {
            done(new Error(`Connection failed: ${err.message}`));
        });

        socket.on('game_joined', (data) => {
            expect(data).toHaveProperty('gameId');
            expect(typeof data.gameId).toBe('number');

            socket.on('game_left', () => {
                socket.disconnect();
                done();
            });

            socket.emit('leave_game');
        });

        socket.emit('join_game');
    });

    it('should place two players in the same game when they join', async () => {
        const player1Socket = await createClient();
        const player2Socket = await createClient();

        const joinGame = (socket) => {
            return new Promise((resolve) => {
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

    // This test will now pass because 'jest.fn()' is explicitly imported.
    it('should make a single player wait for an opponent', (done) => {
        const socket = getClientSocket();

        // This creates a mock function (a "spy") that we can use to track calls.
        const gameStartedSpy = jest.fn();
        socket.on('game_started', gameStartedSpy);

        socket.emit('join_game');

        // Wait for a short period to ensure the 'game_started' event isn't sent.
        setTimeout(() => {
            // Assert that our spy function was NOT called.
            expect(gameStartedSpy).not.toHaveBeenCalled();
            socket.disconnect();
            done();
        }, 500);
    });
});