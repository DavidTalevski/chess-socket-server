const GameStatus = Object.freeze({
    ONGOING: 'ongoing',
    CHECKMATE: 'checkmate',
    STALEMATE: 'stalemate',
    DRAW: 'draw',
    INSUFF_MATERIAL: 'insufficient material',
    THREEFOLD_REP: 'threefold repetition',
    CHECK: 'check',
    RESIGNATION: "resignation"
});

export default GameStatus;