// 블록커스 게임 로직

class BlokusGame {
    constructor(mode = '1v1v1v1') {
        this.mode = mode;
        this.boardSize = 20;
        this.cellSize = 30; // 기본값, updateCanvasSize()로 동적 조정
        this.board = this.createBoard();
        this.players = this.createPlayers(mode);
        this.currentPlayerIndex = 0;
        this.selectedPiece = null;
        this.gameOver = false;
        this.passCount = 0;

        // 각 플레이어의 시작 코너 위치
        this.startCorners = {
            1: [0, 0],           // 왼쪽 상단
            2: [19, 19],         // 오른쪽 하단
            3: [19, 0],          // 오른쪽 상단
            4: [0, 19]           // 왼쪽 하단
        };
    }

    // 캔버스 크기를 뷰포트에 맞게 동적으로 조정
    updateCanvasSize(canvas) {
        const container = canvas.parentElement;
        if (!container) return;

        // 컨테이너의 실제 너비 가져오기
        const containerWidth = container.clientWidth;
        const containerHeight = window.innerHeight - 250; // 헤더, 컨트롤 버튼 등 고려

        // 뷰포트 크기에 따라 cellSize 동적 계산
        // 모바일: 최대 너비/높이의 90% 사용
        // 데스크탑: 최대 600px
        const maxSize = Math.min(containerWidth, containerHeight, 600);
        const calculatedCellSize = Math.floor(maxSize / this.boardSize);

        // cellSize는 최소 15px, 최대 30px
        this.cellSize = Math.max(15, Math.min(calculatedCellSize, 30));

        // 캔버스 크기 설정
        const canvasSize = this.cellSize * this.boardSize;
        canvas.width = canvasSize;
        canvas.height = canvasSize;

        // 고해상도 디스플레이 대응
        const dpr = window.devicePixelRatio || 1;
        if (dpr > 1) {
            canvas.style.width = canvasSize + 'px';
            canvas.style.height = canvasSize + 'px';
            canvas.width = canvasSize * dpr;
            canvas.height = canvasSize * dpr;

            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
        }
    }

    // 보드 생성
    createBoard() {
        const board = [];
        for (let i = 0; i < this.boardSize; i++) {
            board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                board[i][j] = 0; // 0 = 빈 칸
            }
        }
        return board;
    }

    // 플레이어 생성
    createPlayers(mode) {
        const players = [];
        let playerCount;

        switch (mode) {
            case '1v1':
                playerCount = 2;
                break;
            case '2v2':
            case '1v1v1v1':
                playerCount = 4;
                break;
            default:
                playerCount = 4;
        }

        for (let i = 1; i <= playerCount; i++) {
            players.push({
                id: i,
                name: `플레이어 ${i}`,
                pieces: createPieceSet(i),
                color: PLAYER_COLORS[i],
                isFirstMove: true,
                canPlay: true,
                team: mode === '2v2' ? (i <= 2 ? 1 : 2) : null
            });
        }

        return players;
    }

    // 현재 플레이어 가져오기
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // 다음 플레이어로 턴 넘기기
    nextTurn() {
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        } while (!this.getCurrentPlayer().canPlay && !this.isGameOver());

        // 모든 플레이어가 패스한 경우
        if (this.passCount >= this.players.filter(p => p.canPlay).length) {
            this.endGame();
        }
    }

    // 조각 배치 가능 여부 확인
    canPlacePiece(piece, x, y) {
        const player = this.getCurrentPlayer();

        // 1. 보드 범위 내에 있는지 확인
        for (let [dx, dy] of piece.blocks) {
            const newX = x + dx;
            const newY = y + dy;

            if (newX < 0 || newX >= this.boardSize ||
                newY < 0 || newY >= this.boardSize) {
                return false;
            }

            // 이미 조각이 있는지 확인
            if (this.board[newY][newX] !== 0) {
                return false;
            }
        }

        // 2. 첫 번째 수인 경우 시작 코너를 포함해야 함
        if (player.isFirstMove) {
            const [cornerX, cornerY] = this.startCorners[player.id];
            let touchesCorner = false;

            for (let [dx, dy] of piece.blocks) {
                if (x + dx === cornerX && y + dy === cornerY) {
                    touchesCorner = true;
                    break;
                }
            }

            if (!touchesCorner) {
                return false;
            }
        } else {
            // 3. 첫 수가 아닌 경우: 같은 색 조각과 대각선으로 인접해야 하고, 변은 닿으면 안됨
            let touchesCorner = false;
            let touchesEdge = false;

            for (let [dx, dy] of piece.blocks) {
                const newX = x + dx;
                const newY = y + dy;

                // 대각선 확인
                const diagonals = [
                    [newX - 1, newY - 1],
                    [newX + 1, newY - 1],
                    [newX - 1, newY + 1],
                    [newX + 1, newY + 1]
                ];

                for (let [diagX, diagY] of diagonals) {
                    if (diagX >= 0 && diagX < this.boardSize &&
                        diagY >= 0 && diagY < this.boardSize) {
                        if (this.board[diagY][diagX] === player.id) {
                            touchesCorner = true;
                        }
                    }
                }

                // 변 확인
                const edges = [
                    [newX - 1, newY],
                    [newX + 1, newY],
                    [newX, newY - 1],
                    [newX, newY + 1]
                ];

                for (let [edgeX, edgeY] of edges) {
                    if (edgeX >= 0 && edgeX < this.boardSize &&
                        edgeY >= 0 && edgeY < this.boardSize) {
                        if (this.board[edgeY][edgeX] === player.id) {
                            touchesEdge = true;
                        }
                    }
                }
            }

            if (!touchesCorner || touchesEdge) {
                return false;
            }
        }

        return true;
    }

    // 조각 배치
    placePiece(piece, x, y) {
        if (!this.canPlacePiece(piece, x, y)) {
            return false;
        }

        const player = this.getCurrentPlayer();

        // 보드에 조각 배치
        for (let [dx, dy] of piece.blocks) {
            this.board[y + dy][x + dx] = player.id;
        }

        // 조각을 사용됨으로 표시
        piece.used = true;
        player.isFirstMove = false;
        this.passCount = 0;

        // 더 이상 놓을 수 있는 조각이 없는지 확인
        if (!this.hasValidMoves(player)) {
            player.canPlay = false;
        }

        this.nextTurn();
        return true;
    }

    // 플레이어가 놓을 수 있는 수가 있는지 확인
    hasValidMoves(player) {
        for (let piece of player.pieces) {
            if (piece.used) continue;

            // 보드의 모든 위치에서 시도
            for (let y = 0; y < this.boardSize; y++) {
                for (let x = 0; x < this.boardSize; x++) {
                    // 4가지 회전에서 시도
                    for (let rotation = 0; rotation < 4; rotation++) {
                        if (this.canPlacePiece(piece, x, y)) {
                            return true;
                        }
                        piece.rotate();
                    }

                    // 좌우 반전 후 4가지 회전에서 시도
                    piece.flipHorizontal();
                    for (let rotation = 0; rotation < 4; rotation++) {
                        if (this.canPlacePiece(piece, x, y)) {
                            piece.flipHorizontal(); // 원래대로
                            return true;
                        }
                        piece.rotate();
                    }
                    piece.flipHorizontal(); // 원래대로
                }
            }
        }
        return false;
    }

    // 턴 패스
    pass() {
        this.passCount++;
        this.getCurrentPlayer().canPlay = false;
        this.nextTurn();
    }

    // 게임 종료 여부 확인
    isGameOver() {
        return this.players.every(p => !p.canPlay) || this.gameOver;
    }

    // 게임 종료
    endGame() {
        this.gameOver = true;
    }

    // 점수 계산
    calculateScores() {
        const scores = {};

        for (let player of this.players) {
            let score = 0;
            for (let piece of player.pieces) {
                if (!piece.used) {
                    score -= piece.size;
                }
            }

            // 모든 조각을 다 놓은 경우 보너스
            const allUsed = player.pieces.every(p => p.used);
            if (allUsed) {
                score += 15;
                // 마지막 조각이 1칸짜리인 경우 추가 보너스
                const lastPiece = player.pieces.find(p => p.id === 1);
                if (lastPiece && lastPiece.used) {
                    score += 5;
                }
            }

            scores[player.id] = score;
        }

        return scores;
    }

    // 승자 결정
    getWinner() {
        const scores = this.calculateScores();

        if (this.mode === '2v2') {
            // 팀 점수 계산
            const team1Score = scores[1] + scores[2];
            const team2Score = scores[3] + scores[4];

            if (team1Score > team2Score) {
                return { type: 'team', team: 1, score: team1Score };
            } else if (team2Score > team1Score) {
                return { type: 'team', team: 2, score: team2Score };
            } else {
                return { type: 'tie', score: team1Score };
            }
        } else {
            // 개인 점수로 승자 결정
            let maxScore = -Infinity;
            let winnerId = null;

            for (let playerId in scores) {
                if (scores[playerId] > maxScore) {
                    maxScore = scores[playerId];
                    winnerId = parseInt(playerId);
                }
            }

            return { type: 'player', playerId: winnerId, score: maxScore };
        }
    }

    // 보드 그리기
    drawBoard(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 격자 그리기
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const posX = x * this.cellSize;
                const posY = y * this.cellSize;

                // 배경
                ctx.fillStyle = '#fff';
                ctx.fillRect(posX, posY, this.cellSize, this.cellSize);

                // 격자선
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 1;
                ctx.strokeRect(posX, posY, this.cellSize, this.cellSize);

                // 배치된 조각 그리기
                const playerId = this.board[y][x];
                if (playerId !== 0) {
                    ctx.fillStyle = PLAYER_COLORS[playerId];
                    ctx.fillRect(posX + 1, posY + 1, this.cellSize - 2, this.cellSize - 2);
                }
            }
        }

        // 시작 코너 표시
        for (let playerId in this.startCorners) {
            const player = this.players.find(p => p.id === parseInt(playerId));
            if (!player || !player.isFirstMove) continue;

            const [cornerX, cornerY] = this.startCorners[playerId];
            const posX = cornerX * this.cellSize;
            const posY = cornerY * this.cellSize;

            ctx.fillStyle = player.color;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(posX, posY, this.cellSize, this.cellSize);
            ctx.globalAlpha = 1.0;

            // 별 표시
            ctx.fillStyle = player.color;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', posX + this.cellSize / 2, posY + this.cellSize / 2);
        }
    }

    // 미리보기 그리기
    drawPreview(canvas, piece, x, y) {
        if (!piece || x < 0 || y < 0) return;

        const ctx = canvas.getContext('2d');
        const canPlace = this.canPlacePiece(piece, x, y);

        piece.draw(
            ctx,
            this.cellSize,
            x,
            y,
            canPlace ? 0.5 : 0.2
        );

        // 배치 불가능한 경우 X 표시
        if (!canPlace) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            for (let [dx, dy] of piece.blocks) {
                const posX = (x + dx) * this.cellSize;
                const posY = (y + dy) * this.cellSize;
                ctx.beginPath();
                ctx.moveTo(posX + 5, posY + 5);
                ctx.lineTo(posX + this.cellSize - 5, posY + this.cellSize - 5);
                ctx.moveTo(posX + this.cellSize - 5, posY + 5);
                ctx.lineTo(posX + 5, posY + this.cellSize - 5);
                ctx.stroke();
            }
        }
    }

    // 게임 리셋
    reset(mode) {
        this.mode = mode;
        this.board = this.createBoard();
        this.players = this.createPlayers(mode);
        this.currentPlayerIndex = 0;
        this.selectedPiece = null;
        this.gameOver = false;
        this.passCount = 0;
    }
}
