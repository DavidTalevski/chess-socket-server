import { setupServerAndClient, createClient, makeMove, joinAndAwaitStart } from '../helpers/server.helper.js';

describe('Gameplay Tests', () => {

    const getClientSocket = setupServerAndClient();


    it('should assign colors, start the game, and allow players to make moves in turn', async () => {
        const [player1, player2] = await Promise.all([
            joinAndAwaitStart(),
            joinAndAwaitStart(),
        ]);

        expect(player1.color).not.toBe(player2.color);

        const whitePlayer = player1.color === 'w' ? player1 : player2;
        const blackPlayer = player1.color === 'b' ? player1 : player2;

        expect(whitePlayer.color).toBe('w');
        expect(blackPlayer.color).toBe('b');

        try {
            await makeMove(whitePlayer.socket, 'e4');
            await makeMove(blackPlayer.socket, 'e5');
            await makeMove(whitePlayer.socket, 'Nf3');
            await makeMove(blackPlayer.socket, 'Nc6');
        } catch (error) {
            fail(error);
        } finally {
            whitePlayer.socket.disconnect();
            blackPlayer.socket.disconnect();
        }
    });
});