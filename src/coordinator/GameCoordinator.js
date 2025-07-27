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
     * @param {Player} player 
     */
    playerJoinRandomGame(player) {
        const game = this.getFreeGame()

        game.addPlayer(player);

        return game;
    }

    /**
     * @param {Player} player 
     */
    playerLeaveGame(player) {
        const game = player.game;
        const gameWasActive = game.isActive;

        player.leaveGame();

        if (gameWasActive) {
            this.removeGame(game);
        }
    }

    /**
     * @param {Socket} socket 
     */
    addNewPlayer(socket) {
        return this.players.addNewPlayer(socket);
    }

    /**
     * @param {Player} player 
     */
    removePlayer(player) {
        return this.players.removePlayer(player.id)
    }

    /**
     * @param {Game} game 
     */
    removeGame(game) {
        this.games.removeGame(game.id);
    }
}