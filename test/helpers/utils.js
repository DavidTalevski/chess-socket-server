/**
 * Generates a random integer between min (inclusive) and max (inclusive).
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random integer.
 */
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Picks a random element from an array.
 * @param {Array<T>} arr - The array to pick from.
 * @returns {T} A random element from the array.
 */
export function pickRandom(arr) {
    return arr[getRandomInt(0, arr.length - 1)];
}

/**
 * Generates a random string of a given length.
 * @param {number} length - The desired length of the string.
 * @returns {string} A random string.
 */
export function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generates a random event name from a predefined list or a completely random one.
 * @returns {string} A random event name.
 */
export function generateRandomEventName() {
    const knownEvents = ['join_game', 'make_move', 'leave_game', 'game_started', 'move_made', 'invalid_move', 'game_finished'];
    // 50% chance to pick a known event, 50% to generate a random string
    if (Math.random() > 0.5) {
        return pickRandom(knownEvents);
    }
    return generateRandomString(getRandomInt(4, 12));
}
