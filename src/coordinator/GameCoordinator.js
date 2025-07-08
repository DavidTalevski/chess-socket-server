import { Socket } from "socket.io";
import GameManager from "../game/GameManager.js";
import PlayerManager from "../player/PlayerManager.js";
import Game from "../game/Game.js";

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
     * @param {Socket} socket 
     */
    addNewPlayer(socket) {
        return this.players.addNewPlayer(socket);
    }
}