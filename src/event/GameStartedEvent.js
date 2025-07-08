/**
 * @typedef {Object} GameStartedEvent
 * @property {number} gameId - The unique numeric identifier for the game
 * @property {string} color - The player's assigned color ("white" or "black")
 * @property {string} opponentUsername - The opponent’s username
 * @property {string} opponentId - The socket ID or internal ID of the opponent
 * @property {string} fen - The initial board state in FEN notation
 * @property {number} timestamp - Unix timestamp (milliseconds) when the game started
 */

export default {};