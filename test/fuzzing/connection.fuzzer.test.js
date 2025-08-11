import { setupServerAndClient, createClient, joinAndAwaitStart, makeMove, waitForGameOver } from '../helpers/server.helper.js';
import { pickRandom } from '../helpers/utils.js';

describe('Connection Fuzzer', () => {
    setupServerAndClient();

    /**
     * Test Suite 1: The "Thundering Herd"
     */
    it('should handle a "thundering herd" of players joining simultaneously', async () => {
        const CLIENT_COUNT = 50;
        let gamesStarted = 0;
        const clients = await Promise.all(
            Array.from({ length: CLIENT_COUNT }, () => createClient())
        );

        try {
            // Create an array of promises, each resolving when its client starts a game or times out.
            const gameStartPromises = clients.map(client => {
                return new Promise(resolve => {
                    let timer;

                    const onGameStarted = () => {
                        // --- FIX: Clean up the timeout timer ---
                        clearTimeout(timer);
                        gamesStarted++;
                        resolve();
                    };

                    client.once('game_started', onGameStarted);

                    // --- FIX: Store the timer so it can be cleared ---
                    timer = setTimeout(() => {
                        // If the timeout fires, it means the game didn't start.
                        // Remove the other listener to prevent a memory leak.
                        client.removeListener('game_started', onGameStarted);
                        resolve();
                    }, 5000);
                });
            });

            // Have all clients join at the same time.
            clients.forEach(client => client.emit('join_game'));

            // Wait for all clients to either start a game or time out.
            await Promise.all(gameStartPromises);

            // Each game has two players, so the event should fire for every client.
            expect(gamesStarted).toBe(CLIENT_COUNT);

        } catch (error) {
            fail('Thundering Herd test failed with an unexpected error: ' + error.message);
        } finally {
            clients.forEach(client => client.disconnect());
        }
    });

    /**
     * Test Suite 2: The "Lobby Spinner"
     */
    it('should not leak memory or crash when a player rapidly joins and leaves', async () => {
        const client = await createClient();
        const ITERATIONS = 100;
        try {
            for (let i = 0; i < ITERATIONS; i++) {
                client.emit('join_game');
                await new Promise(res => setTimeout(res, 5));
                client.emit('leave_game');
            }
            await new Promise(res => setTimeout(res, 200));
        } catch (error) {
            fail('Lobby Spinner test failed with an unexpected error: ' + error.message);
        } finally {
            client.disconnect();
        }
    });

    /**
     * Test Suite 3: The "Split Brain"
     */
    it('should keep game states isolated even with chaos in other games', async () => {
        const [game1_p1, game1_p2] = await Promise.all([joinAndAwaitStart(), joinAndAwaitStart()]);
        const game1_white = game1_p1.color === 'w' ? game1_p1 : game1_p2;
        const game1_black = game1_p1.color === 'b' ? game1_p1 : game1_p2;
        const game1_overPromise = waitForGameOver(game1_white.socket);

        const allSockets = [game1_p1.socket, game1_p2.socket];
        // --- FIX: Control flag for the chaos loop ---
        let chaosRunning = true;

        const chaosLoop = async () => {
            while (chaosRunning) {
                // Check the flag at the start of each loop
                if (!chaosRunning) break;

                const [p1, p2] = await Promise.all([joinAndAwaitStart(), joinAndAwaitStart()]);
                // Only add sockets if the loop is still supposed to be running
                if (chaosRunning) {
                    allSockets.push(p1.socket, p2.socket);
                    await new Promise(res => setTimeout(res, 200));
                    p1.socket.disconnect();
                    p2.socket.disconnect();
                } else {
                    // if the loop was told to stop while joining, just disconnect the new sockets immediately
                    p1.socket.disconnect();
                    p2.socket.disconnect();
                }
            }
        };

        try {
            // Start the loop but don't wait for it
            chaosLoop();

            await makeMove(game1_white.socket, 'f3');
            await makeMove(game1_black.socket, 'e5');
            await makeMove(game1_white.socket, 'g4');
            await makeMove(game1_black.socket, 'Qh4');

            const result = await game1_overPromise;
            expect(result.reason).toBe('checkmate');
            expect(result.winner).toBe('b');

        } catch (error) {
            fail('Split Brain test failed. Error: ' + error.message);
        } finally {
            // --- FIX: Gracefully stop the chaos loop ---
            chaosRunning = false;
            // Wait a moment to allow the loop to finish its final iteration
            await new Promise(res => setTimeout(res, 300));
            allSockets.forEach(s => {
                if (s.connected) s.disconnect();
            });
        }
    });

    /**
     * Test Suite 2: Chaos Monkey - Player Connection Fuzzing
     * This test simulates unreliable network conditions. It repeatedly creates games,
     * performs a random action (move or disconnect), and verifies the server can
     * gracefully handle the cleanup and prepare for the next game.
     */
    describe('Chaos Monkey - Connection Fuzzing', () => {
        it('should remain stable when games are abruptly ended by disconnection', async () => {
            const CHAOS_ITERATIONS = 20;
            // This array will now track ALL sockets we create so we can clean them up at the end.
            const allSockets = [];

            try {
                for (let i = 0; i < CHAOS_ITERATIONS; i++) {
                    // --- Start a fresh game for each iteration ---
                    let players = await Promise.all([joinAndAwaitStart(), joinAndAwaitStart()]);
                    allSockets.push(players[0].socket, players[1].socket);

                    // --- Perform a single random action ---
                    const action = pickRandom(['move', 'disconnect']);

                    if (action === 'move') {
                        // Make one or two random moves.
                        const randomPlayer = pickRandom(players);
                        try {
                            await makeMove(randomPlayer.socket, generateFuzzedMove());
                        } catch (e) { /* Expected for invalid moves */ }
                    }

                    if (action === 'disconnect') {
                        // Abruptly end the game by disconnecting one player.
                        const playerToDisconnect = pickRandom(players);
                        playerToDisconnect.socket.disconnect();
                    }

                    // --- Cleanup for this iteration ---
                    // Disconnect any players from the current game that are still connected.
                    players.forEach(p => {
                        if (p.socket.connected) {
                            p.socket.disconnect();
                        }
                    });

                    // A small pause to allow the server to process the disconnections.
                    await new Promise(res => setTimeout(res, 100));
                }
            } catch (error) {
                console.log(error)
                // If any error bubbles up here, it means the server failed to handle a state.
                fail('Chaos Monkey test encountered an unexpected error: ' + error.message);
            } finally {
                // Final cleanup of any sockets that might have been left hanging.
                allSockets.forEach(s => {
                    if (s.connected) {
                        s.disconnect();
                    }
                });
            }
        });
    });

    /**
 * Test Suite 4: High-Frequency Move Test (Race Condition Fuzzer)
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

});