import { Socket } from "socket.io";
import Player from "./Player.js";
import ChessPlayer from "./ChessPlayer.js";

export default class PlayerManager {
    /**
     * @type {Player[]}
     */
    players = [];

    /** @type {number} */
    nextPlayerId = 1;

    /**
     * Adds a new player to the collection
     * @param {Socket} socket 
     * @returns {Player}
     */
    addNewPlayer(socket) {
        const player = new ChessPlayer(this.nextPlayerId++, socket);
        this.players.push(player);
        return player;
    }

    /**
     * Retrieves a player by their ID
     * @param {number} id
     * @returns {Player|undefined}
     */
    getPlayerById(id) {
        return this.players.find(player => player.id === id);
    }

    /**
     * Removes a player by ID and calls their destroy method
     * @param {number} id
     * @returns {boolean} True if removed, false if not found
     */
    removePlayer(id) {
        const index = this.players.findIndex(player => player.id === id);
        if (index !== -1) {
            const player = this.players[index];
            player.destroy();
            this.players.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Gets all players that are currently free/available
     * @returns {Player[]}
     */
    getFreePlayers() {
        return this.players.filter(player => !player.isInGame && !player.destroyed);
    }

    /**
     * Gets a random player from the free/available players
     * @returns {Player|null}
     */
    getFreeRandomPlayer() {
        const freePlayers = this.getFreePlayers();
        if (freePlayers.length === 0) return null;
        const index = Math.floor(Math.random() * freePlayers.length);
        return freePlayers[index];
    }
}
