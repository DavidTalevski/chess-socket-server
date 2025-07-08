import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import GameCoordinator from "../coordinator/GameCoordinator.js";
import SocketEvents from "../constants/SocketEvents.js"; // adjust path as needed

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const coordinator = new GameCoordinator();

io.on(SocketEvents.CONNECT, (socket) => {
    console.log("Player connected:", socket.id);

    const player = coordinator.addNewPlayer(socket);

    socket.on(SocketEvents.SET_USERNAME, (username) => {
        player.setUserName(username);
        socket.emit(SocketEvents.USERNAME_SET, username);
    });

    socket.on(SocketEvents.JOIN_GAME, () => {
        const game = coordinator.getFreeGame();

        if (game.addPlayer(player)) {
            socket.emit(SocketEvents.GAME_JOINED, { gameId: game.id });
        }

    });

    socket.on(SocketEvents.DISCONNECT, () => {
        console.log("Player disconnected:", socket.id);
        coordinator.players.removePlayer(player.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
