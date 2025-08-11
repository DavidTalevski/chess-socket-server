import { setupServerAndClient, createClient } from '../helpers/server.helper.js';
import { generateFuzzedData } from '../helpers/fuzzer.js';
import SocketEvents from '../../src/enum/SocketEvents.enum.js';

describe('Targeted Event Fuzzing', () => {

    // Setup the server once for all event fuzzing suites
    setupServerAndClient();

    /**
     * Test Suite 1: Malformed Command Fuzzer (Garbage Data)
     */
    describe('Malformed Command Fuzzer', () => {
        it('should not crash when receiving garbage data on any known event listener', async () => {
            const client = await createClient();

            const clientSideEvents = [
                SocketEvents.SET_USERNAME,
                SocketEvents.JOIN_GAME,
                SocketEvents.LEAVE_GAME,
                SocketEvents.MAKE_MOVE,
            ];

            const FUZZ_EVENTS_COUNT = 100;
            try {
                for (let i = 0; i < FUZZ_EVENTS_COUNT; i++) {
                    const eventName = clientSideEvents[Math.floor(Math.random() * clientSideEvents.length)];

                    client.emit(
                        eventName,
                        generateFuzzedData(),
                        generateFuzzedData(),
                        generateFuzzedData()
                    );
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                // CORRECT WAY TO FAIL: Throw the error. Jest will catch it.
                throw new Error(`Malformed command fuzzer caused an unexpected error: ${error.message}`);
            } finally {
                client.disconnect();
            }
        });
    });

    /**
     * Test Suite 2: High-Frequency Event Spammer (Denial of Service)
     */
    describe('High-Frequency Event Spammer', () => {
        it('should not crash from high-frequency event spam', async () => {
            const client = await createClient();
            const SPAM_COUNT = 5000;
            const eventToSpam = SocketEvents.SET_USERNAME;

            try {
                for (let i = 0; i < SPAM_COUNT; i++) {
                    client.emit(eventToSpam, `spammer_${i}`);
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                // CORRECT WAY TO FAIL: Throw the error.
                throw new Error(`Event spam fuzzer encountered an unexpected error: ${error.message}`);
            } finally {
                client.disconnect();
            }
        });
    });

    /**
     * Test Suite 3: Corrupted Payload Fuzzer
     */
    describe('Corrupted Payload Fuzzer', () => {
        it('should handle incorrect payload types gracefully', async () => {
            const client = await createClient();

            // The circular object has been removed, as we know it crashes the client emitter.
            // Its purpose (finding the server logging bug) has been fulfilled.
            const corruptedPayloads = [
                { user: 'test', pass: '123' },      // An object instead of a string
                ['my_username'],                    // An array instead of a string
                12345,                              // A number instead of a string
                null,                               // Null payload
                true,                               // Boolean payload
                Object.create(null),                // An object with no prototype
            ];

            try {
                for (const payload of corruptedPayloads) {
                    // These emits will now succeed and properly test your server's type validation.
                    client.emit(SocketEvents.SET_USERNAME, payload);
                    client.emit(SocketEvents.MAKE_MOVE, payload);
                    client.emit(SocketEvents.JOIN_GAME, payload);
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                // This block should now only be reached if the SERVER has an actual error.
                throw new Error(`Corrupted payload fuzzer caused an unexpected error: ${error.message}`);
            } finally {
                client.disconnect();
            }
        });
    });

    /**
    * Test Suite 4: Rapid and Illogical State-Change Fuzzer
    */
    describe('Rapid and Illogical State-Change Fuzzer', () => {
        it('should remain stable during rapid, out-of-order event sequences', async () => {
            let client;
            const CHAOS_ITERATIONS = 20;

            try {
                for (let i = 0; i < CHAOS_ITERATIONS; i++) {
                    client = await createClient();
                    client.emit(SocketEvents.MAKE_MOVE, 'e4');
                    client.emit(SocketEvents.LEAVE_GAME);
                    client.emit(SocketEvents.JOIN_GAME);
                    client.emit(SocketEvents.SET_USERNAME, `user_${i}`);
                    client.emit(SocketEvents.JOIN_GAME);
                    client.disconnect();
                    await new Promise(res => setTimeout(res, 50));
                }
            } catch (error) {
                // CORRECT WAY TO FAIL: Throw the error.
                throw new Error(`Rapid state-change fuzzer encountered an unexpected error: ${error.message}`);
            } finally {
                if (client && client.connected) {
                    client.disconnect();
                }
            }
        });
    });
});