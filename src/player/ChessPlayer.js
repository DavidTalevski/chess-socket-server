import { Socket } from "socket.io";
import SocketEvents from "../enum/SocketEvents.enum";
import ChessGame from "../game/ChessGame";

export default class ChessPlayer {

    /** @type {ChessGame} */
    game;

    /**
     * @param {ChessGame} game 
     */
    joinGame(game) {
        super.joinGame();

        this.game = game;
    }

    leaveGame() {
        super.leaveGame();

        this.game = null;
    }

    makeMove(move) {
        this.game.makeMove(move);
    }

}
