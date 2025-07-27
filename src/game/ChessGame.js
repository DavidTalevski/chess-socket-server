import Game from "./Game.js";
import { Chess } from 'chess.js'
import GameStatus from "../enum/GameStatus.enum.js";
import ChessPlayer from "../player/ChessPlayer.js";
import GameStartedEvent from "../event/GameStartedEvent.js";
import SocketEvents from "../enum/SocketEvents.enum.js";

export default class ChessGame extends Game {
    /**
     * @param {number} id - Unique numeric ID of the game
     */
    constructor(id) {
        super(id);
        this.chess = new Chess(); // Initialize a new Chess game
        this.status = GameStatus.ONGOING; // Initialize the status of the game
    }

    startGame() {
        super.startGame();

        // Randomly assign colors to the two players
        const [player1, player2] = this.players;
        const isPlayer1White = Math.random() < 0.5;

        player1.color = isPlayer1White ? 'w' : 'b';
        player2.color = isPlayer1White ? 'b' : 'w';

        this.players.forEach(player => {
            const opponent = this.players.find(p => p.id !== player.id);

            /** @type {GameStartedEvent} */
            const event = {
                gameId: this.id,
                color: player.color,
                opponentUsername: opponent.username,
                opponentId: opponent.id,
                fen: this.chess.fen(),
                timestamp: Date.now()
            };

            player.onGameStarted(event);
            player.socket.emit(SocketEvents.GAME_STARTED, event);
        });
    }


    /**
     * Make a move on the chessboard
     * @param {string} move - A move in standard algebraic notation (e.g., 'e2e4', 'Nf3', etc.)
     * @param {ChessPlayer} player -
     * @returns {boolean} - The result of the move
     */
    makeMove(player, move) {

        if (this.chess.turn() !== player.color) {
            return false;
        }

        const result = this.chess.move(move);

        if (result === null) {
            return false;
        }

        if (this.chess.isGameOver()) {
            this.updateGameStatus();
        }

        return true;
    }

    /**
     * Get the current game state (board, turn, etc.)
     * @returns {Object} - The current game state
     */
    getGameState() {
        return {
            fen: this.chess.fen(),
            turn: this.chess.turn(),
            gameOver: this.chess.isGameOver(),
            gameStatus: this.status
        };
    }

    /**
     * Get the current status of the game (checkmate, stalemate, draw, etc.)
     * @returns {string|null} - The current game status or null if the game is ongoing
     */
    updateGameStatus() {
        if (this.chess.isCheckmate()) {
            this.status = GameStatus.CHECKMATE;
        } else if (this.chess.isStalemate()) {
            this.status = GameStatus.STALEMATE;
        } else if (this.chess.isDraw()) {
            this.status = GameStatus.DRAW;
        } else if (this.chess.isInsufficientMaterial()) {
            this.status = GameStatus.INSUFF_MATERIAL;
        } else if (this.chess.isThreefoldRepetition()) {
            this.status = GameStatus.THREEFOLD_REP;
        } else if (this.chess.isCheck()) {
            this.status = GameStatus.CHECK;
        } else {
            this.status = GameStatus.ONGOING;
        }
    }

    /**
     * Undo the last move made
     * @returns {boolean} - Whether the undo was successful
     */
    undoMove() {
        const undone = this.chess.undo();
        return undone ? true : false;
    }

    /**
     * Resets the game to its initial state
     */
    resetGame() {
        this.chess.reset();
        this.status = GameStatus.ONGOING;
    }
}