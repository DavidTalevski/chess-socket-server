import { setupServerAndClient, createClient, makeMove, waitForGameOver, joinAndAwaitStart } from '../helpers/server.helper.js';

describe('Advanced Chess Logic Fuzzing', () => {

    // Setup the server once for all advanced logic tests
    setupServerAndClient();

    /**
     * Test Suite 1: Draw Condition Fuzzer
     * This suite tests the server's ability to correctly identify and declare draws
     * under specific, less common conditions like stalemate and threefold repetition.
     * NOTE: These tests rely on a precise sequence of valid moves. The `makeMove` helper
     * is used to ensure each move is successfully processed by the server before the
     * next one is sent, building the game state step-by-step.
     */
    describe('Draw Condition Fuzzer', () => {

        it('should correctly identify and end the game in a stalemate', async () => {
            const [p1, p2] = await Promise.all([joinAndAwaitStart(), joinAndAwaitStart()]);
            const white = p1.color === 'w' ? p1 : p2;
            const black = p1.color === 'b' ? p1 : p2;
            const gameOverPromise = waitForGameOver(white.socket);

            // A known sequence that leads to a stalemate position.
            const movesToStalemate = [
                'e3', 'a5', 'Qh5', 'Ra6', 'Qxa5', 'h5',
                'h4', 'Rah6', 'Qxc7', 'f6', 'Qxd7', 'Kf7',
                'Qxb7', 'Qd3', 'Qxb8', 'Qh7', 'Qxc8', 'Kg6',
                'Qe6', // This final move creates the stalemate.
            ];

            try {
                // We use `await makeMove` in a loop to guarantee the board state.
                for (let i = 0; i < movesToStalemate.length; i++) {
                    const turn = i % 2 === 0 ? white : black;
                    await makeMove(turn.socket, movesToStalemate[i]);
                }

                // After the final move, we await the server's 'game_over' event.
                const result = await gameOverPromise;
                expect(result.reason).toBe('stalemate');
                expect(result.winner).toBeNull(); // A draw has no winner.

            } catch (error) {
                throw new Error('Stalemate fuzzer encountered an unexpected error: ' + error.message);
            } finally {
                p1.socket.disconnect();
                p2.socket.disconnect();
            }
        });

        it('should correctly identify a draw by threefold repetition', async () => {
            const [p1, p2] = await Promise.all([joinAndAwaitStart(), joinAndAwaitStart()]);
            const white = p1.color === 'w' ? p1 : p2;
            const black = p1.color === 'b' ? p1 : p2;
            const gameOverPromise = waitForGameOver(white.socket);

            // A sequence causing the same position to repeat three times.
            const movesToRepetition = [
                'Nf3', 'Nf6', 'Ng1', 'Ng8', // Position occurs once
                'Nf3', 'Nf6', 'Ng1', 'Ng8', // Position occurs twice
                'Nf3', 'Nf6', 'Ng1', 'Ng8', // Position occurs three times, triggering the draw
            ];

            try {
                for (let i = 0; i < movesToRepetition.length; i++) {
                    const turn = i % 2 === 0 ? white : black;
                    // Each move is awaited to ensure sequential execution.
                    await makeMove(turn.socket, movesToRepetition[i]);
                }

                const result = await gameOverPromise;
                expect(result.reason).toBe('repetition');
                expect(result.winner).toBeNull();

            } catch (error) {
                fail('Threefold repetition fuzzer encountered an unexpected error: ' + error.message);
            } finally {
                p1.socket.disconnect();
                p2.socket.disconnect();
            }
        });
    });

    /**
     * Test Suite 2: Castling Rights Fuzzer
     * This test ensures the server correctly invalidates castling rights after the
     * king or rook has moved. It uses `makeMove` to build the state and then to test
     * for the expected failure of the illegal castling attempt.
     */
    describe('Castling Rights Fuzzer', () => {

        it('should fail to castle if the king has moved and returned', async () => {
            const [p1, p2] = await Promise.all([joinAndAwaitStart(), joinAndAwaitStart()]);
            const white = p1.color === 'w' ? p1 : p2;
            const black = p1.color === 'b' ? p1 : p2;

            try {
                const moves = [
                    'e4', 'e5',
                    'Nf3', 'Nf6',
                    'Ke2', // White king moves, which should invalidate castling rights.
                    'a6',
                    'Ke1', // White king returns to its starting square.
                    'a5',
                ];

                // Sequentially make all the setup moves. If any of these fail,
                // the test will correctly stop.
                for (let i = 0; i < moves.length; i++) {
                    const turn = i % 2 === 0 ? white : black;
                    await makeMove(turn.socket, moves[i]);
                }

                // The core assertion of the test.
                // We expect the promise from `makeMove` to be rejected because the move is illegal.
                // If the server incorrectly allows it, this `expect` will fail the test.
                // We can also check for the specific error message for more robust testing.
                await expect(makeMove(white.socket, 'O-O')).rejects.toThrow('Invalid move');

            } finally {
                // The 'finally' block ensures that no matter what happens in the 'try'
                // block (success or failure), the clients will be disconnected.
                p1.socket.disconnect();
                p2.socket.disconnect();
            }
        });

        it('should fail to castle if a rook has moved and returned', async () => {
            const [p1, p2] = await Promise.all([joinAndAwaitStart(), joinAndAwaitStart()]);
            const white = p1.color === 'w' ? p1 : p2;
            const black = p1.color === 'b' ? p1 : p2;

            const moves = [
                'h4', 'a5',
                'Rh2', // White kingside rook moves, invalidating kingside castling.
                'a4',
                'Rh1', // White rook returns home.
                'a3', 'g3', 'b5', 'Bg2', 'b4',
                'Nf3', 'c5', 'e4', 'd5'
            ];

            try {
                for (let i = 0; i < moves.length; i++) {
                    const turn = i % 2 === 0 ? white : black;
                    await makeMove(turn.socket, moves[i]);
                }

                // Even though the path is clear and pieces are home, castling rights were lost.
                await expect(makeMove(white.socket, 'O-O')).rejects.toThrow();

            } catch (error) {
                throw new Error('Castling fuzzer (rook move) failed unexpectedly: ' + error.message);
            } finally {
                p1.socket.disconnect();
                p2.socket.disconnect();
            }
        });
    });

    /**
     * Test Suite 3: En Passant Fuzzer
     * This suite validates the server's handling of the en passant special move,
     * specifically its availability for only one turn. `makeMove` is used throughout
     * to control the game state with precision.
     */
    describe('En Passant Fuzzer', () => {

        it('should reject an en passant capture that is not immediate', async () => {
            const [p1, p2] = await Promise.all([joinAndAwaitStart(), joinAndAwaitStart()]);
            const white = p1.color === 'w' ? p1 : p2;
            const black = p1.color === 'b' ? p1 : p2;

            const moves = [
                'e4', 'a6',
                'e5', 'd5', // Black's move creates the en passant opportunity.
            ];

            try {
                // Sequentially make the moves to set up the en passant state.
                for (let i = 0; i < moves.length; i++) {
                    const turn = i % 2 === 0 ? white : black;
                    await makeMove(turn.socket, moves[i]);
                }

                // As a control, confirm the move IS valid if made immediately in a parallel game.
                const [p3, p4] = await Promise.all([joinAndAwaitStart(), joinAndAwaitStart()]);
                const tempWhite = p3.color === 'w' ? p3 : p4;
                for (let i = 0; i < moves.length; i++) {
                    const turn = i % 2 === 0 ? p3 : p4;
                    await makeMove(turn.socket, moves[i]);
                }
                await makeMove(tempWhite.socket, 'exd6'); // This should succeed.
                p3.socket.disconnect();
                p4.socket.disconnect();

                // Back in the original game, we make other moves, "missing" the one-turn window.
                await makeMove(white.socket, 'a4');
                await makeMove(black.socket, 'a5');

                // Now, attempting the en passant capture in the original game should be illegal.
                await expect(makeMove(white.socket, 'exd6')).rejects.toThrow();

            } catch (error) {
                throw new Error('En passant fuzzer failed unexpectedly: ' + error.message);
            } finally {
                p1.socket.disconnect();
                p2.socket.disconnect();
            }
        });
    });
});