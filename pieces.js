// 블록커스 게임의 21개 폴리오미노 조각 정의
// 각 조각은 상대 좌표 배열로 표현됩니다

const PIECES = [
    // 1칸 (1개)
    {
        id: 1,
        name: 'I1',
        blocks: [[0, 0]],
        size: 1
    },

    // 2칸 (1개)
    {
        id: 2,
        name: 'I2',
        blocks: [[0, 0], [1, 0]],
        size: 2
    },

    // 3칸 (2개)
    {
        id: 3,
        name: 'I3',
        blocks: [[0, 0], [1, 0], [2, 0]],
        size: 3
    },
    {
        id: 4,
        name: 'L3',
        blocks: [[0, 0], [1, 0], [1, 1]],
        size: 3
    },

    // 4칸 (5개)
    {
        id: 5,
        name: 'I4',
        blocks: [[0, 0], [1, 0], [2, 0], [3, 0]],
        size: 4
    },
    {
        id: 6,
        name: 'L4',
        blocks: [[0, 0], [1, 0], [2, 0], [2, 1]],
        size: 4
    },
    {
        id: 7,
        name: 'O4',
        blocks: [[0, 0], [1, 0], [0, 1], [1, 1]],
        size: 4
    },
    {
        id: 8,
        name: 'T4',
        blocks: [[0, 0], [1, 0], [2, 0], [1, 1]],
        size: 4
    },
    {
        id: 9,
        name: 'Z4',
        blocks: [[0, 0], [1, 0], [1, 1], [2, 1]],
        size: 4
    },

    // 5칸 (12개)
    {
        id: 10,
        name: 'I5',
        blocks: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
        size: 5
    },
    {
        id: 11,
        name: 'L5',
        blocks: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
        size: 5
    },
    {
        id: 12,
        name: 'Y5',
        blocks: [[0, 0], [1, 0], [2, 0], [3, 0], [2, 1]],
        size: 5
    },
    {
        id: 13,
        name: 'N5',
        blocks: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1]],
        size: 5
    },
    {
        id: 14,
        name: 'T5',
        blocks: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]],
        size: 5
    },
    {
        id: 15,
        name: 'V5',
        blocks: [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]],
        size: 5
    },
    {
        id: 16,
        name: 'W5',
        blocks: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]],
        size: 5
    },
    {
        id: 17,
        name: 'X5',
        blocks: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
        size: 5
    },
    {
        id: 18,
        name: 'Z5',
        blocks: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]],
        size: 5
    },
    {
        id: 19,
        name: 'F5',
        blocks: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]],
        size: 5
    },
    {
        id: 20,
        name: 'P5',
        blocks: [[0, 0], [1, 0], [0, 1], [1, 1], [1, 2]],
        size: 5
    },
    {
        id: 21,
        name: 'U5',
        blocks: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
        size: 5
    }
];

// 조각 클래스
class Piece {
    constructor(pieceData, color) {
        this.id = pieceData.id;
        this.name = pieceData.name;
        this.originalBlocks = pieceData.blocks;
        this.blocks = JSON.parse(JSON.stringify(pieceData.blocks)); // 깊은 복사
        this.size = pieceData.size;
        this.color = color;
        this.used = false;
    }

    // 조각 회전 (시계방향 90도)
    rotate() {
        this.blocks = this.blocks.map(([x, y]) => [y, -x]);
        this.normalize();
    }

    // 좌우 반전
    flipHorizontal() {
        this.blocks = this.blocks.map(([x, y]) => [-x, y]);
        this.normalize();
    }

    // 상하 반전
    flipVertical() {
        this.blocks = this.blocks.map(([x, y]) => [x, -y]);
        this.normalize();
    }

    // 조각 정규화 (좌측 상단이 (0,0)이 되도록)
    normalize() {
        if (this.blocks.length === 0) return;

        const minX = Math.min(...this.blocks.map(b => b[0]));
        const minY = Math.min(...this.blocks.map(b => b[1]));

        this.blocks = this.blocks.map(([x, y]) => [x - minX, y - minY]);
    }

    // 조각 복제
    clone() {
        const newPiece = new Piece({
            id: this.id,
            name: this.name,
            blocks: this.originalBlocks,
            size: this.size
        }, this.color);
        newPiece.blocks = JSON.parse(JSON.stringify(this.blocks));
        newPiece.used = this.used;
        return newPiece;
    }

    // 조각의 경계 크기 계산
    getBounds() {
        if (this.blocks.length === 0) return { width: 0, height: 0 };

        const maxX = Math.max(...this.blocks.map(b => b[0]));
        const maxY = Math.max(...this.blocks.map(b => b[1]));

        return {
            width: maxX + 1,
            height: maxY + 1
        };
    }

    // 캔버스에 조각 그리기
    draw(ctx, cellSize, offsetX = 0, offsetY = 0, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;

        this.blocks.forEach(([x, y]) => {
            const posX = (offsetX + x) * cellSize;
            const posY = (offsetY + y) * cellSize;

            // 조각 색상
            ctx.fillStyle = this.color;
            ctx.fillRect(posX, posY, cellSize, cellSize);

            // 테두리
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(posX, posY, cellSize, cellSize);

            // 하이라이트 효과
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(posX + 2, posY + 2, cellSize - 4, 3);
        });

        ctx.restore();
    }

    // 미리보기용 작은 캔버스에 그리기
    drawPreview(canvas) {
        const ctx = canvas.getContext('2d');
        const bounds = this.getBounds();
        const padding = 4;
        const cellSize = Math.min(
            (canvas.width - padding * 2) / bounds.width,
            (canvas.height - padding * 2) / bounds.height
        );

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const offsetX = (canvas.width - bounds.width * cellSize) / (2 * cellSize);
        const offsetY = (canvas.height - bounds.height * cellSize) / (2 * cellSize);

        this.draw(ctx, cellSize, offsetX, offsetY, this.used ? 0.3 : 1);
    }

    // 조각을 원래 상태로 리셋
    reset() {
        this.blocks = JSON.parse(JSON.stringify(this.originalBlocks));
        this.used = false;
    }
}

// 플레이어 색상 정의
const PLAYER_COLORS = {
    1: '#3498db', // 파란색
    2: '#e74c3c', // 빨간색
    3: '#f39c12', // 주황색
    4: '#2ecc71'  // 초록색
};

// 플레이어의 조각 세트 생성
function createPieceSet(playerNumber) {
    const color = PLAYER_COLORS[playerNumber];
    return PIECES.map(pieceData => new Piece(pieceData, color));
}
