import SocketEvents from "../enum/SocketEvents.enum.js";
import ChessGame from "../game/ChessGame.js";
import Player from "./Player.js";

export default class ChessPlayer extends Player {

    /** @type {ChessGame} */
    game;

    /**
     * @readonly
     * @type {'w'|'b'}
     */
    color;

    /**
     * @param {ChessGame} game 
     */
    joinGame(game) {
        super.joinGame();

        this.game = game;
    }

    leaveGame() {
        super.leaveGame();

        this.game?.removePlayer(this);
        this.game = null;
        this.color = null;
    }

    /**
     * @param {import("../event/GameStartedEvent").GameStartedEvent} event 
     */
    onGameStarted(event) {
        this.color = event.color;
    }

    /**
     * @param {string} move 
     */
    makeMove(move) {
        return this.game.makeMove(this, move);
    }

}
