const SocketEvents = Object.freeze({
    CONNECT: "connect",
    DISCONNECT: "disconnect",

    SET_USERNAME: "set_username",
    USERNAME_SET: "username_set",

    JOIN_GAME: "join_game",
    GAME_JOINED: "game_joined",
    GAME_STARTED: "game_started",
    GAME_FINISHED: "game_finished"
});

export default SocketEvents;