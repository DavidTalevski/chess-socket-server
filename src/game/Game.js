import GameStatus from "../enum/GameStatus.enum.js";
import SocketEvents from "../enum/SocketEvents.enum.js";
import ChessPlayer from "../player/ChessPlayer.js";
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
        this.started = false;

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
            player.joinGame(this);
        }

        if (this.players.length >= this.playerNeededToStart && !this.isActive) {
            this.startGame();
        }
    }

    /**
     * Removes a player.
     * @param {ChessPlayer} player - The player to remove
     */
    removePlayer(player) {
        if (!this.players) return;

        const index = this.players.indexOf(player);
        if (index == -1) return;

        this.players.splice(index, 1);

        if (this.isActive) {
            this.isActive = false;

            const event = {
                gameId: this.id,
                winner: this.players[0].color,
                reason: GameStatus.RESIGNATION
            }

            player.socket.emit(SocketEvents.GAME_FINISHED, event);
            this.players[0].socket.emit(SocketEvents.GAME_FINISHED, event);
        }
    }

    startGame() {
        this.started = true;
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
     * Cleans up the game instance.
     */
    destroy() {
        this.players = null;
        this.isActive = false;
    }
}
