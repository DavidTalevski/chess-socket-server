import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import GameCoordinator from '../coordinator/GameCoordinator.js';
import SocketEvents from '../enum/SocketEvents.enum.js';
import ChessPlayer from '../player/ChessPlayer.js';
import ChessGame from '../game/ChessGame.js';
import GameStatus from '../enum/GameStatus.enum.js';

class GameServer {
    /**
     * @private
     * @type {GameCoordinator}
     */
    coordinator;

    /**
     * @private
     * @type {Server}
     */
    io;

    constructor() {
        const app = express();
        const server = http.createServer(app);
        this.io = new Server(server, {
            cors: { origin: '*', methods: ['GET', 'POST'] }
        });

        this.coordinator = new GameCoordinator();
        this.server = server;
    }

    /**
     * Starts the server and listens for connections.
     * @param {number} port
     */
    listen(port) {
        this.server.listen(port, () => console.log(`Server running on port ${port}`));
        this.io.on(SocketEvents.CONNECT, (socket) => this.onConnection(socket));
    }

    /**
     * Handles a new player connection.
     * @private
     * @param {import('socket.io').Socket} socket
     */
    onConnection(socket) {
        const player = this.coordinator.addNewPlayer(socket);

        socket.on(SocketEvents.SET_USERNAME, (username) => this.handleSetUsername(player, username));
        socket.on(SocketEvents.JOIN_GAME, () => this.handleJoinGame(player));
        socket.on(SocketEvents.LEAVE_GAME, () => this.handleLeaveGame(player));
        socket.on(SocketEvents.MAKE_MOVE, (move) => this.handleMakeMove(player, move));
        socket.on(SocketEvents.DISCONNECT, () => this.handleDisconnect(player));
    }

    /**
     * @private
     * @param {ChessPlayer} player 
     * @param {string} username 
     */
    handleSetUsername(player, username) {
        player.setUsername(username);
        player.socket.emit(SocketEvents.USERNAME_SET, username);
    }

    /**
     * @private
     * @param {ChessPlayer} player 
     */
    handleJoinGame(player) {
        const game = this.coordinator.playerJoinRandomGame(player);

        player.socket.emit(SocketEvents.GAME_JOINED, { gameId: game.id });
    }

    /**
     * @private
     * @param {ChessPlayer} player 
     */
    handleLeaveGame(player) {
        this.coordinator.playerLeaveGame(player);

        player.socket.emit(SocketEvents.GAME_LEFT);
    }

    /**
     * @private
     * @param {ChessPlayer} player
     * @param {string} move
     */
    handleMakeMove(player, move) {
        if (!player.game || player.game.status !== GameStatus.ONGOING) {
            player.socket.emit(SocketEvents.INVALID_MOVE, { move });
            return;
        }

        const result = player.makeMove(move); // This now calls the method on ChessPlayer, which should call the game's makeMove

        if (result) {
            const gameState = player.game.getGameState();

            // Notify all players in the game about the successful move.
            player.game.players.forEach(p => {
                p.socket.emit(SocketEvents.MOVE_MADE, {
                    move,
                    fen: gameState.fen,
                    turn: gameState.turn,
                    by: player.id
                });
            });

            // Check for game over *after* a successful move.
            if (player.game.chess.isGameOver()) {
                this.handleGameOver(player.game);
            }
        } else {
            // The move was invalid (e.g., illegal move, out of turn).
            player.socket.emit(SocketEvents.INVALID_MOVE, { move });
        }
    }

    /**
     * @private
     * @param {ChessGame} game
     */
    handleGameOver(game) {
        let winner = null;
        if (game.status === GameStatus.CHECKMATE) {
            const losingPlayer = game.players.find(p => p.color === game.chess.turn());
            winner = losingPlayer.color === 'w' ? 'b' : 'w';
        }

        const event = {
            gameId: this.id,
            winner: winner,
            reason: game.status
        }

        game.players.forEach(p => {
            p.socket.emit(SocketEvents.GAME_FINISHED, event)
        });

        this.coordinator.removeGame(game);
    }

    /**
     * @private
     * @param {ChessPlayer} player 
     */
    handleDisconnect(player) {
        console.log("Player disconnected:", player.socket.id);
        this.coordinator.removePlayer(player);
    }
}

export default GameServer;