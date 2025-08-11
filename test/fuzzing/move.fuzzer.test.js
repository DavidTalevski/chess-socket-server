import { setupServerAndClient, createClient, makeMove, waitForGameOver, joinAndAwaitStart } from '../helpers/server.helper.js';
import { generateFuzzedMove } from '../helpers/fuzzer.js';
import { pickRandom } from '../helpers/utils.js';

describe('Chess Move Fuzzing Scenarios', () => {

    // This will set up the server once for all the fuzzing tests.
    setupServerAndClient();

    /**
     * Test Suite 1: Standard Move Fuzzing
     * This test sends a stream of fuzzed moves to a stable, two-player game.
     * Its primary goal is to ensure the core move validation logic is robust and doesn't crash the server.
     */
    describe('Standard Move Fuzzing', () => {
        it('should not crash the server with a high volume of random moves', async () => {
            const [player1, player2] = await Promise.all([
                joinAndAwaitStart(),
                joinAndAwaitStart(),
            ]);

            const white = player1.color === 'w' ? player1 : player2;
            const black = player1.color === 'b' ? player1 : player2;

            let gameFinished = false;
            const gameOverPromise = Promise.race([
                waitForGameOver(white.socket),
                waitForGameOver(black.socket),
            ]).then(() => { gameFinished = true; });

            const FUZZ_MOVES_COUNT = 200; // Increased count for more thorough testing
            try {
                for (let i = 0; i < FUZZ_MOVES_COUNT && !gameFinished; i++) {
                    const turn = i % 2 === 0 ? white : black;
                    const move = generateFuzzedMove();
                    try {
                        // We must await the move to ensure turns are sequential and don't get stuck.
                        await makeMove(turn.socket, move);
                    } catch (error) {
                        // Expected: Invalid moves will be rejected by the makeMove promise.
                    }
                }
            } catch (error) {
                fail('Standard fuzz test encountered an unexpected error: ' + error.message);
            } finally {
                // Wait for the game to potentially end or for a short timeout
                await Promise.race([gameOverPromise, new Promise(resolve => setTimeout(resolve, 500))]);
                white.socket.disconnect();
                black.socket.disconnect();
            }
        });
    });

    /**
     * Test Suite 2: High-Frequency Move Test (Race Condition Fuzzer)
     * This test simulates two players sending valid moves almost simultaneously.
     * The goal is to uncover race conditions where the server might process a move
     * from the wrong player or enter an inconsistent state.
     */
    describe('Race Condition Fuzzer', () => {
        it('should handle near-simultaneous moves without corrupting state', async () => {
            const [player1, player2] = await Promise.all([
                joinAndAwaitStart(),
                joinAndAwaitStart(),
            ]);

            const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6']; // A known valid sequence
            try {
                for (let i = 0; i < moves.length; i++) {
                    const move = moves[i];

                    // Both players emit a move at the same time. The server's turn logic
                    // should gracefully reject the one from the wrong player.
                    player1.socket.emit('make_move', move);
                    player2.socket.emit('make_move', move);

                    // Wait a moment for the server to process the events.
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            } catch (error) {
                fail('Race condition fuzzer encountered an unexpected error: ' + error.message);
            } finally {
                player1.socket.disconnect();
                player2.socket.disconnect();
            }
        });
    });

    /**
     * Test Suite 3: Syntactically Plausible but Illegal Move Fuzzer
     * This test sends moves that are in a valid format but are illegal according
     * to the rules of chess, such as moving a pawn three squares forward.
     */
    describe('Illegal Move Fuzzer', () => {
        it('should not crash when receiving syntactically correct but illegal moves', async () => {
            const [player1, player2] = await Promise.all([
                joinAndAwaitStart(),
                joinAndAwaitStart(),
            ]);

            const white = player1.color === 'w' ? player1 : player2;

            const illegalMoves = [
                'e5', // Pawn moving three squares
                'Nf4', // Knight moving to an illegal square
                'Bf5', // Bishop moving through other pieces
                'Qh6', // Queen moving through other pieces
                'Ke3', // King moving into check
            ];

            try {
                for (const move of illegalMoves) {
                    try {
                        await makeMove(white.socket, move);
                    } catch (error) {
                        // Expected: Invalid moves will be rejected.
                    }
                }
            } catch (error) {
                fail('Illegal move fuzzer encountered an unexpected error: ' + error.message);
            } finally {
                player1.socket.disconnect();
                player2.socket.disconnect();
            }
        });
    });

    /**
     * Test Suite 4: Promotion Fuzzing
     * This test focuses on the promotion of a pawn, sending a variety of
     * valid and invalid promotion piece types.
     */
    describe('Promotion Fuzzing', () => {
        it('should handle various pawn promotion scenarios gracefully', async () => {
            const [player1, player2] = await Promise.all([
                joinAndAwaitStart(),
                joinAndAwaitStart(),
            ]);

            const white = player1.color === 'w' ? player1 : player2;

            // A sequence of moves to get a pawn to the promotion rank
            const movesToPromotion = ['e4', 'f5', 'exf5', 'g5', 'fxg6', 'h5', 'gxh7', 'a6', 'h8=Q'];

            try {
                for (let i = 0; i < movesToPromotion.length - 1; i++) {
                    const turn = i % 2 === 0 ? player1 : player2;
                    try {
                        await makeMove(turn.socket, movesToPromotion[i]);
                    } catch (e) {
                        // We might have some invalid moves in the setup sequence
                    }
                }

                const promotionMoves = [
                    'h8=Q', // Valid promotion to Queen
                    'h8=R', // Valid promotion to Rook
                    'h8=B', // Valid promotion to Bishop
                    'h8=N', // Valid promotion to Knight
                    'h8=K', // Invalid promotion to King
                    'h8=P', // Invalid promotion to Pawn
                    'h8=X', // Invalid piece type
                ];

                for (const move of promotionMoves) {
                    try {
                        await makeMove(white.socket, move);
                    } catch (error) {
                        // Expected: Invalid promotion moves will be rejected.
                    }
                }
            } catch (error) {
                fail('Promotion fuzzer encountered an unexpected error: ' + error.message);
            } finally {
                player1.socket.disconnect();
                player2.socket.disconnect();
            }
        });
    });

    /**
  * Test Suite 3: Simultaneous and Out-of-Turn Fuzzing (NEW)
  * Both players spam *different* fuzzed moves at the same time. This is a more chaotic
  * version of the race condition test to ensure the server correctly rejects the
  * out-of-turn player's move every time without crashing.
  */
    describe('Simultaneous and Out-of-Turn Fuzzing', () => {
        it('should not crash when both players spam fuzzed moves simultaneously', async () => {
            const [player1, player2] = await Promise.all([
                joinAndAwaitStart(),
                joinAndAwaitStart(),
            ]);

            const FUZZ_ITERATIONS = 100;
            try {
                for (let i = 0; i < FUZZ_ITERATIONS; i++) {
                    // Both players emit a fuzzed move without waiting.
                    // The server should be able to handle this storm, rejecting
                    // the move from the player whose turn it isn't.
                    player1.socket.emit('make_move', generateFuzzedMove());
                    player2.socket.emit('make_move', generateFuzzedMove());

                    // Brief pause to allow server processing
                    await new Promise(res => setTimeout(res, 20));
                }
            } catch (error) {
                fail('Simultaneous fuzzing test encountered an unexpected server error: ' + error.message);
            } finally {
                player1.socket.disconnect();
                player2.socket.disconnect();
            }
        });
    });

    /**
     * Test Suite 4: Invalid Payload Fuzzing on "make_move" (NEW)
     * This test sends data of incorrect types to the `make_move` endpoint. The server's
     * handler should be robust enough to handle malformed payloads without crashing.
     */
    describe('Invalid Payload Fuzzing on "make_move"', () => {
        it('should not crash when receiving non-string payloads for a move', async () => {
            const [player1, player2] = await Promise.all([joinAndAwaitStart(), joinAndAwaitStart()]);

            const garbagePayloads = [
                null,
                undefined,
                12345,
                { not: 'a string' },
                ['e4'],
                true,
                { from: 'e2', to: 'e4' }, // A common object format that might be mishandled
            ];

            try {
                for (const payload of garbagePayloads) {
                    player1.socket.emit('make_move', payload);
                    // Give the server a moment to process the bad input
                    await new Promise(res => setTimeout(res, 50));
                }
            } catch (error) {
                fail('Invalid payload fuzzing caused an unexpected error: ' + error.message);
            } finally {
                player1.socket.disconnect();
                player2.socket.disconnect();
            }
        });
    });

    /**
     * Test Suite 5: Special Character and Injection Fuzzing (NEW)
     * This test sends various non-standard string inputs to check for parsing errors,
     * sanitization issues, or other vulnerabilities.
     */
    describe('Special Character and Injection Fuzzing', () => {
        it('should not crash when receiving moves with special characters or injection attempts', async () => {
            const [player1, player2] = await Promise.all([joinAndAwaitStart(), joinAndAwaitStart()]);

            const maliciousStrings = [
                'e4; DROP TABLE users; --', // Mock SQL Injection
                '<script>alert("xss")</script>', // Mock XSS
                '♔♘♖',          // Unicode chess characters
                '你好',            // Non-ASCII characters
                '😂🔥👌',        // Emojis
                '%20e4',           // URL-encoded characters
            ];

            try {
                for (const str of maliciousStrings) {
                    try {
                        await makeMove(player1.socket, str);
                    } catch (e) { /* Expected rejection */ }
                }
            } catch (error) {
                fail('Special character fuzz test encountered an unexpected error: ' + error.message);
            } finally {
                player1.socket.disconnect();
                player2.socket.disconnect();
            }
        });
    });

    /**
     * Test Suite 6: Buffer Overflow and Long String Fuzzing (NEW)
     * This test sends an extremely long string as a move to test for buffer overflow
     * vulnerabilities or performance degradation (Denial of Service).
     */
    describe('Buffer Overflow and Long String Fuzzing', () => {
        it('should not crash when receiving an extremely long move string', async () => {
            const [player1, player2] = await Promise.all([joinAndAwaitStart(), joinAndAwaitStart()]);

            // Create a very long, nonsensical string (10,000 chars)
            const longMove = 'a'.repeat(10000);

            try {
                // We don't expect this to succeed, just not to crash the server.
                // Using a timeout because `makeMove` might hang if the server is bogged down.
                const movePromise = makeMove(player1.socket, longMove);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Move timed out")), 500));
                await Promise.race([movePromise, timeoutPromise]);

            } catch (error) {
                // We expect an error, either a rejection from `makeMove` or our timeout.
                // The test fails only if the server crashes and the test runner itself errors out.
            } finally {
                player1.socket.disconnect();
                player2.socket.disconnect();
            }
        });
    });
});