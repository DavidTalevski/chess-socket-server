import Player from "../player/Player.js";

export default class Game {

    /** @type {Player[]} */
    players = []

    /**
     * @param {number} id - Unique numeric ID of the game
     */
    constructor(id) {
        this.id = id;

        this.isActive = false;

        this.maxPlayers = 2;

        this.playerNeededToStart = 2;
    }

    /**
     * Adds a player if there's room.
     * @param {Player} player - The player to add
     * @returns {boolean} True if added successfully, false if full
     */
    addPlayer(player) {
        if (this.players.length < this.maxPlayers) {
            this.players.push(player);
            this.updateActiveStatus();
        }

        if (this.players.length >= this.playerNeededToStart && !this.isActive) {
            this.startGame();
        }
    }

    /**
     * Removes a player.
     * @param {any} player - The player to remove
     */
    removePlayer(player) {
        const index = this.players.indexOf(player);
        if (index !== -1) {
            this.players.splice(index, 1);
            this.updateActiveStatus();
        }
    }

    startGame() {
        this.isActive = true;
    }

    /**
     * Returns whether there is room for more players.
     * @returns {boolean}
     */
    hasEmptySlot() {
        return this.players.length < this.maxPlayers;
    }

    /**
     * Updates the game's active status based on the number of players.
     */
    updateActiveStatus() {
        this.isActive = this.players.length > 0;
    }

    /**
     * Cleans up the game instance.
     */
    destroy() {
        this.players = null;
        this.isActive = false;
    }
}
