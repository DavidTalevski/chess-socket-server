import { setupServerAndClient, createClient, makeMove, joinAndAwaitStart } from '../helpers/server.helper.js';

describe('Gameplay Tests', () => {

    const getClientSocket = setupServerAndClient();


    it('should assign colors, start the game, and allow players to make moves in turn', async () => {
        // 1. Both players join and wait for the game to start
        const [player1, player2] = await Promise.all([
            joinAndAwaitStart(),
            joinAndAwaitStart(),
        ]);

        // 2. Verify that colors were assigned correctly
        expect(player1.color).not.toBe(player2.color);

        // 3. Determine who is white and who is black based on the server's response
        const whitePlayer = player1.color === 'w' ? player1 : player2;
        const blackPlayer = player1.color === 'b' ? player1 : player2;

        // Ensure we have one of each
        expect(whitePlayer.color).toBe('w');
        expect(blackPlayer.color).toBe('b');

        // 4. Execute a sequence of moves, ensuring the correct player moves each turn
        // The 'await' here ensures that we wait for the server to confirm each move before sending the next one.
        try {
            await makeMove(whitePlayer.socket, 'e4');
            await makeMove(blackPlayer.socket, 'e5');
            await makeMove(whitePlayer.socket, 'Nf3');
            await makeMove(blackPlayer.socket, 'Nc6');
            // Add more moves as needed to test different scenarios
        } catch (error) {
            // If any move fails, the promise will reject and fail the test
            fail(error);
        } finally {
            // 5. Clean up by disconnecting the sockets
            whitePlayer.socket.disconnect();
            blackPlayer.socket.disconnect();
        }
    }); // Increase timeout for tests with multiple async steps
});