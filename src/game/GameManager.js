import ChessGame from "./ChessGame.js";
import Game from "./Game.js";

export default class GameManager {
    /** @type {Game[]} */
    games = [];

    /** @type {number} */
    nextGameId = 1;

    /**
     * Creates a new game
     * @returns {ChessGame} The newly created game.
     */
    createNewGame() {
        const id = this.generateGameId();
        const newGame = new ChessGame(id);
        this.games.push(newGame);
        return newGame;
    }

    /**
     * Finds a game with the given ID.
     * @param {number} id - The ID of the game to find.
     * @returns {Game} The game with the matching ID, or null if not found.
     */
    getGameWithId(id) {
        return this.games.find(game => game.id === id) || null;
    }

    /**
     * Returns the first game that has room for more players.
     * Assumes a Game has a method `hasEmptySlot()`.
     * @returns {Game}
     */
    getGameWithEmptySlot() {
        return this.games.find(game => !game.started && game.hasEmptySlot());
    }

    /**
     * Removes a game with the given ID.
     * @param {number} id - The ID of the game to remove.
     * @returns {boolean} True if a game was removed, false otherwise.
     */
    removeGame(id) {
        const index = this.games.findIndex(game => game.id === id);
        if (index !== -1) {
            const game = this.games[index];
            game.destroy(); // Clean up the game before removal
            this.games.splice(index, 1);
            return true;
        }
        return false;
    }


    /**
     * Returns all currently active games.
     * Assumes a Game has an `isActive` property.
     * @returns {Game[]} An array of active games.
     */
    getActiveGames() {
        return this.games.filter(game => game.isActive);
    }

    /**
     * Generates a unique, incremental numeric ID for a new game.
     * @returns {number} A unique game ID.
     */
    generateGameId() {
        return this.nextGameId++;
    }
}
