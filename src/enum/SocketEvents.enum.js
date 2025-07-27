const SocketEvents = Object.freeze({
    CONNECT: "connect",
    DISCONNECT: "disconnect",

    SET_USERNAME: "set_username",
    USERNAME_SET: "username_set",

    JOIN_GAME: "join_game",
    GAME_JOINED: "game_joined",

    LEAVE_GAME: "leave_game",
    GAME_LEFT: "game_left",

    GAME_STARTED: "game_started",
    GAME_FINISHED: "game_finished",

    MAKE_MOVE: "make_move",
    MOVE_MADE: "move_made",
    INVALID_MOVE: "invalid_move",
});

export default SocketEvents;