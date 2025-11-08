// 블록커스 메인 앱

class BlokusApp {
    constructor() {
        this.game = null;
        this.canvas = null;
        this.ctx = null;
        this.selectedPieceElement = null;
        this.mousePos = { x: -1, y: -1 };

        // 터치/드래그 관련 변수
        this.isDragging = false;
        this.dragStartPos = null;
        this.isMobile = 'ontouchstart' in window;

        this.init();
    }

    init() {
        // DOM 요소 가져오기
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');

        // 이벤트 리스너 등록
        this.setupEventListeners();

        // 모드 선택 화면 표시
        this.showModeSelection();
    }

    setupEventListeners() {
        // 모드 선택 버튼
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.startGame(mode);
            });
        });

        // 캔버스 이벤트 (마우스)
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.mousePos = { x: -1, y: -1 };
            this.render();
        });

        // 캔버스 터치 이벤트
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // 조작 버튼
        document.getElementById('rotate-btn').addEventListener('click', () => this.rotatePiece());
        document.getElementById('flip-h-btn').addEventListener('click', () => this.flipHorizontal());
        document.getElementById('flip-v-btn').addEventListener('click', () => this.flipVertical());
        document.getElementById('pass-btn').addEventListener('click', () => this.pass());
        document.getElementById('new-game-btn').addEventListener('click', () => this.showModeSelection());

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (!this.game || this.game.gameOver) return;

            switch (e.key) {
                case 'r':
                case 'R':
                    this.rotatePiece();
                    break;
                case 'h':
                case 'H':
                    this.flipHorizontal();
                    break;
                case 'v':
                case 'V':
                    this.flipVertical();
                    break;
                case 'p':
                case 'P':
                    this.pass();
                    break;
            }
        });
    }

    showModeSelection() {
        document.getElementById('mode-selection').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
    }

    startGame(mode) {
        // 게임 생성
        this.game = new BlokusGame(mode);

        // 화면 전환
        document.getElementById('mode-selection').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        // 캔버스 크기 조정 (모바일 대응)
        this.resizeCanvas();

        // UI 업데이트
        this.updateModeDisplay(mode);
        this.renderPieces();
        this.updatePlayersInfo();
        this.render();

        // 리사이즈 이벤트 리스너
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        if (!this.game) return;

        const container = document.getElementById('board-container');
        const maxWidth = container.clientWidth - 20;
        const maxSize = Math.min(maxWidth, 600);

        // 캔버스 크기 설정
        this.canvas.width = maxSize;
        this.canvas.height = maxSize;

        // 셀 크기 재계산
        this.game.cellSize = maxSize / this.game.boardSize;

        // 다시 그리기
        this.render();
    }

    updateModeDisplay(mode) {
        const modeText = {
            '1v1': '1 vs 1 (2인)',
            '1v1v1v1': '1v1v1v1 (4인)',
            '2v2': '2 vs 2 (팀전)'
        };
        document.getElementById('mode-display').textContent = `게임 모드: ${modeText[mode]}`;
    }

    renderPieces() {
        const container = document.getElementById('pieces-container');
        container.innerHTML = '';

        const player = this.game.getCurrentPlayer();

        player.pieces.forEach((piece, index) => {
            const pieceDiv = document.createElement('div');
            pieceDiv.className = 'piece-item';
            if (piece.used) {
                pieceDiv.classList.add('used');
            }

            const canvas = document.createElement('canvas');
            canvas.className = 'piece-canvas';
            canvas.width = 100;
            canvas.height = 100;

            pieceDiv.appendChild(canvas);
            container.appendChild(pieceDiv);

            // 미리보기 그리기
            piece.drawPreview(canvas);

            // 클릭/탭 이벤트
            if (!piece.used) {
                pieceDiv.addEventListener('click', () => {
                    this.selectPiece(index, pieceDiv);
                });

                // 더블탭으로 회전 (모바일)
                let lastTap = 0;
                pieceDiv.addEventListener('touchend', (e) => {
                    const currentTime = new Date().getTime();
                    const tapLength = currentTime - lastTap;

                    if (tapLength < 300 && tapLength > 0) {
                        // 더블탭 감지
                        e.preventDefault();
                        this.selectPiece(index, pieceDiv);
                        this.rotatePiece();
                    } else {
                        // 싱글탭
                        this.selectPiece(index, pieceDiv);
                    }

                    lastTap = currentTime;
                });
            }
        });
    }

    selectPiece(index, element) {
        // 이전 선택 해제
        if (this.selectedPieceElement) {
            this.selectedPieceElement.classList.remove('selected');
        }

        // 새로운 조각 선택
        const player = this.game.getCurrentPlayer();
        this.game.selectedPiece = player.pieces[index];
        this.selectedPieceElement = element;
        element.classList.add('selected');

        this.render();
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.game.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.game.cellSize);

        this.mousePos = { x, y };
        this.render();
    }

    handleClick(e) {
        if (!this.game.selectedPiece || this.game.gameOver) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.game.cellSize);
        const y = Math.floor((e.clientY - rect.top) / this.game.cellSize);

        // 조각 배치 시도
        if (this.game.placePiece(this.game.selectedPiece, x, y)) {
            // 성공
            this.game.selectedPiece = null;
            if (this.selectedPieceElement) {
                this.selectedPieceElement.classList.remove('selected');
                this.selectedPieceElement = null;
            }

            this.renderPieces();
            this.updatePlayersInfo();
            this.updateStatus();

            // 게임 종료 확인
            if (this.game.isGameOver()) {
                this.showGameOver();
            }
        }

        this.render();
    }

    rotatePiece() {
        if (!this.game.selectedPiece || this.game.gameOver) return;
        this.game.selectedPiece.rotate();
        this.updateSelectedPiecePreview();
        this.render();
    }

    flipHorizontal() {
        if (!this.game.selectedPiece || this.game.gameOver) return;
        this.game.selectedPiece.flipHorizontal();
        this.updateSelectedPiecePreview();
        this.render();
    }

    flipVertical() {
        if (!this.game.selectedPiece || this.game.gameOver) return;
        this.game.selectedPiece.flipVertical();
        this.updateSelectedPiecePreview();
        this.render();
    }

    updateSelectedPiecePreview() {
        if (this.selectedPieceElement) {
            const canvas = this.selectedPieceElement.querySelector('canvas');
            this.game.selectedPiece.drawPreview(canvas);
        }
    }

    pass() {
        if (this.game.gameOver) return;

        if (confirm('정말 패스하시겠습니까?')) {
            this.game.pass();
            this.game.selectedPiece = null;
            if (this.selectedPieceElement) {
                this.selectedPieceElement.classList.remove('selected');
                this.selectedPieceElement = null;
            }

            this.renderPieces();
            this.updatePlayersInfo();
            this.updateStatus();

            if (this.game.isGameOver()) {
                this.showGameOver();
            }
        }
    }

    updatePlayersInfo() {
        const container = document.getElementById('players-info');
        container.innerHTML = '<h3>플레이어</h3>';

        this.game.players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-info';
            if (index === this.game.currentPlayerIndex) {
                playerDiv.classList.add('active');
            }

            const usedCount = player.pieces.filter(p => p.used).length;
            const totalCount = player.pieces.length;

            let teamInfo = '';
            if (this.game.mode === '2v2') {
                teamInfo = ` (팀 ${player.team})`;
            }

            playerDiv.innerHTML = `
                <div class="player-name">
                    <span class="player-color" style="background-color: ${player.color}"></span>
                    ${player.name}${teamInfo}
                </div>
                <div class="player-pieces">
                    조각: ${usedCount}/${totalCount} 사용
                    ${player.canPlay ? '' : '(패스됨)'}
                </div>
            `;

            container.appendChild(playerDiv);
        });
    }

    updateStatus() {
        const player = this.game.getCurrentPlayer();
        document.getElementById('current-player').textContent = `현재 턴: ${player.name}`;

        const statusDiv = document.getElementById('status-text');
        if (player.isFirstMove) {
            statusDiv.textContent = '시작 코너(★)에 조각을 배치하세요.';
        } else {
            statusDiv.textContent = '같은 색 조각과 모서리가 닿도록 배치하세요. 변이 닿으면 안됩니다.';
        }
    }

    showGameOver() {
        const winner = this.game.getWinner();
        const scores = this.game.calculateScores();

        let message = '게임 종료!\n\n점수:\n';
        for (let player of this.game.players) {
            message += `${player.name}: ${scores[player.id]}점\n`;
        }

        message += '\n';

        if (this.game.mode === '2v2') {
            if (winner.type === 'team') {
                message += `팀 ${winner.team} 승리! (${winner.score}점)`;
            } else {
                message += `무승부! (${winner.score}점)`;
            }
        } else {
            const winnerPlayer = this.game.players.find(p => p.id === winner.playerId);
            message += `${winnerPlayer.name} 승리! (${winner.score}점)`;
        }

        setTimeout(() => {
            alert(message);
        }, 100);

        document.getElementById('status-text').textContent = message.replace(/\n/g, ' ');
    }

    render() {
        // 보드 그리기
        this.game.drawBoard(this.canvas);

        // 선택된 조각 미리보기
        if (this.game.selectedPiece && this.mousePos.x >= 0 && this.mousePos.y >= 0) {
            this.game.drawPreview(
                this.canvas,
                this.game.selectedPiece,
                this.mousePos.x,
                this.mousePos.y
            );
        }

        // 상태 업데이트
        if (!this.game.gameOver) {
            this.updateStatus();
        }
    }

    // 터치 이벤트 핸들러
    handleTouchStart(e) {
        e.preventDefault();
        if (!this.game || !this.game.selectedPiece || this.game.gameOver) return;

        const touch = e.touches[0];
        this.dragStartPos = { x: touch.clientX, y: touch.clientY };
        this.updateTouchPosition(touch);
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.game || !this.game.selectedPiece || this.game.gameOver) return;

        const touch = e.touches[0];
        this.updateTouchPosition(touch);

        // 스와이프 제스처 감지 (회전)
        if (this.dragStartPos) {
            const dx = touch.clientX - this.dragStartPos.x;
            const dy = touch.clientY - this.dragStartPos.y;

            // 가로 스와이프 - 회전
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 2) {
                this.rotatePiece();
                this.dragStartPos = { x: touch.clientX, y: touch.clientY };
            }
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.game || !this.game.selectedPiece || this.game.gameOver) return;

        // 터치 종료 시 조각 배치 시도
        if (this.mousePos.x >= 0 && this.mousePos.y >= 0) {
            if (this.game.placePiece(this.game.selectedPiece, this.mousePos.x, this.mousePos.y)) {
                // 성공
                this.game.selectedPiece = null;
                if (this.selectedPieceElement) {
                    this.selectedPieceElement.classList.remove('selected');
                    this.selectedPieceElement = null;
                }

                this.renderPieces();
                this.updatePlayersInfo();
                this.updateStatus();

                // 게임 종료 확인
                if (this.game.isGameOver()) {
                    this.showGameOver();
                }
            }
        }

        this.dragStartPos = null;
        this.render();
    }

    updateTouchPosition(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const x = Math.floor(((touch.clientX - rect.left) * scaleX) / this.game.cellSize);
        const y = Math.floor(((touch.clientY - rect.top) * scaleY) / this.game.cellSize);

        this.mousePos = { x, y };
        this.render();
    }
}

// 앱 시작
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new BlokusApp();
});
