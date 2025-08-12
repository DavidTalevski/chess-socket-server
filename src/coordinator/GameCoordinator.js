import { Socket } from "socket.io";
import GameManager from "../game/GameManager.js";
import PlayerManager from "../player/PlayerManager.js";
import Game from "../game/Game.js";
import Player from "../player/Player.js";

export default class GameCoordinator {

    players = new PlayerManager();
    games = new GameManager();

    /**
     * @returns {Game}
     */
    getFreeGame() {
        let freeGame = this.games.getGameWithEmptySlot();

        if (!freeGame) {
            freeGame = this.games.createNewGame();
        }

        return freeGame;
    }

    /**
     * Finds a game for a player to join, preventing them from joining if already in a game.
     * @param {Player} player The player who wants to join a game.
     * @returns {Game | null} The game the player joined, or null if they couldn't join.
     */
    playerJoinRandomGame(player) {
        if (!player) {
            // console.warn('GameCoordinator: Attempted to join a game with a null player.');
            return null;
        }

        if (player.game) {
            // console.warn(`GameCoordinator: Player ${player.id} attempted to join a game but is already in game ${player.game.id}.`);
            return player.game;
        }

        const game = this.getFreeGame();
        game.addPlayer(player);

        return game;
    }

    /**
     * Handles a player leaving their current game.
     * @param {Player} player The player leaving the game.
     */
    playerLeaveGame(player) {
        if (!player) {
            // console.warn('GameCoordinator: Attempted to leave a game with a null player.');
            return;
        }

        const game = player.game;

        if (!game) {
            return;
        }

        const gameWasActive = game.isActive;

        player.leaveGame();

        if (gameWasActive) {
            this.removeGame(game);
        }
    }

    /**
     * Creates and adds a new player to the player manager.
     * @param {Socket} socket The socket of the new player.
     * @returns {Player | null} The newly created player, or null if the socket was invalid.
     */
    addNewPlayer(socket) {
        if (!socket) {
            // console.warn('GameCoordinator: Attempted to add a new player with a null socket.');
            return null;
        }
        return this.players.addNewPlayer(socket);
    }

    /**
     * Removes a player from the central player manager.
     * @param {Player} player The player to remove.
     */
    removePlayer(player) {
        if (!player || !player.id) {
            // console.warn('GameCoordinator: Attempted to remove an invalid player.');
            return;
        }
        return this.players.removePlayer(player.id);
    }

    /**
     * Removes a game from the central game manager.
     * @param {Game} game The game to remove.
     */
    removeGame(game) {
        // --- NEW: Defensive check for a valid game object ---
        if (!game || !game.id) {
            // console.warn('GameCoordinator: Attempted to remove an invalid game.');
            return;
        }
        this.games.removeGame(game.id);
    }
}