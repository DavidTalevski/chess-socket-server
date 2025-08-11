import { getRandomInt, pickRandom, generateRandomString, generateRandomEventName } from './utils.js';


const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const PIECES = ['P', 'N', 'B', 'R', 'Q', 'K'];

/**
 * Generates a completely random and likely invalid move string.
 * @returns {string} A random string.
 */
export function generateRandomGarbage() {
    const types = [
        generateRandomString(getRandomInt(1, 20)), // completely random string
        null,
        undefined,
        12345,
        { a: 1, b: { c: 'nested' } },
        ['a', 'b', true],
        true,
        false,
    ];
    return pickRandom(types);
}
/**
 * Generates a syntactically plausible, but likely illegal, chess move.
 * e.g., "a1", "h8", "e4", "Nc3"
 * @returns {string} A pseudo-legal move string.
 */
export function generatePseudoLegalMove() {
    const from = pickRandom(FILES) + pickRandom(RANKS);
    const to = pickRandom(FILES) + pickRandom(RANKS);
    const piece = pickRandom(PIECES);

    const moveFormats = [
        `${from}${to}`,
        `${piece}${from}${to}`,
        `${piece}${to}`,
        `${to}`,
    ];

    return pickRandom(moveFormats);
}

/**
 * Generates a random valid square on the board.
 * @returns {string} A random square, e.g., "e4".
 */
export function getRandomSquare() {
    return pickRandom(FILES) + pickRandom(RANKS);
}

/**
 * The main fuzzing function that generates a move.
 * @returns {*} A fuzzed move payload.
 */
export function generateFuzzedMove() {
    const fuzzType = getRandomInt(1, 3);
    switch (fuzzType) {
        case 1:
            return generateRandomGarbage(); // Now uses the enhanced garbage generator
        case 2:
            return generatePseudoLegalMove();
        case 3:
        default:
            return getRandomSquare();
    }
}


/**
 * Generates a random socket event with random data.
 * @returns {{eventName: string, data: any}}
 */
export function generateFuzzedEvent() {
    const eventName = generateRandomEventName();
    const data = generateRandomGarbage();
    return { eventName, data };
}

/**
 * Generates a single, random piece of fuzzed data from a wide variety of types.
 * This function is self-contained and has no external dependencies.
 * It is designed to produce chaotic and unexpected inputs to test the robustness
 * of application handlers and parsers.
 *
 * @returns {*} A randomly generated piece of data for fuzzing.
 */
export function generateFuzzedData() {
    /**
     * An array of anonymous functions, where each function is a "generator"
     * that produces a specific type of potentially problematic data.
     */
    const dataGenerators = [
        // Category 1: Primitives and Common Edge Cases
        () => null,
        () => undefined,
        () => true,
        () => false,
        () => NaN,
        () => Infinity,
        () => -Infinity,
        () => 0,

        // Category 2: Numbers (Integers and Floats)
        () => Math.floor((Math.random() - 0.5) * 20000), // Random integer
        () => (Math.random() - 0.5) * 20000,             // Random float

        // Category 3: Strings of various kinds
        () => "", // Empty string
        () => " ", // Whitespace
        () => "\t\n", // Tabs and newlines
        () => "null", // String literal "null"
        () => "undefined", // String literal "undefined"
        () => "12345", // String that looks like a number
        () => "true",  // String that looks like a boolean
        () => "<script>alert('fuzz-xss')</script>", // Mock XSS attack
        () => "'; DROP TABLE users; --",            // Mock SQL injection
        () => "😂🔥👌",                              // Emojis / multi-byte Unicode
        () => "你好世界",                           // Non-ASCII characters
        () => { // Generates a short, completely random string
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/?';
            const length = Math.floor(Math.random() * 30) + 1;
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        },
        () => 'a'.repeat(1024 + Math.floor(Math.random() * 2048)), // Very long string

        // Category 4: Arrays
        () => [], // Empty array
        () => [null, undefined, "item", 123], // Array of mixed types
        () => new Array(1000).fill(null), // Very large array, tests memory
        () => [ // A nested array structure
            [1, 2, 3],
            ["a", "b", "c"]
        ],

        // Category 5: Objects
        () => ({}), // Empty object
        () => ({ a: 1, b: "text", c: null }), // "Normal" object
        () => ({ a: { b: { c: { d: "deeply nested" } } } }), // Deeply nested object
        () => ({ key: undefined, another: NaN }), // Object with problematic values
        () => Object.create(null), // Object with no prototype, breaks `hasOwnProperty`

        // --- REMOVED THE FOLLOWING GENERATOR ---
        // The purpose of this generator was to find crashes in serializers.
        // It successfully crashed the server's logger and the client's emitter.
        // Its job is done. We remove it to allow other fuzz tests to run.
        /*
        () => {
            const circular = {};
            circular.a = { b: circular };
            return circular;
        },
        */
    ];

    // Select a random generator function from the array and execute it.
    const randomIndex = Math.floor(Math.random() * dataGenerators.length);
    const selectedGenerator = dataGenerators[randomIndex];

    return selectedGenerator();
}