class HuPaiChecker {
    private tiles: { [key: string]: number[] };

    constructor() {
        this.tiles = {
            feng: new Array(4).fill(0),
            jian: new Array(3).fill(0),
            wan: new Array(9).fill(0),
            tong: new Array(9).fill(0),
            tiao: new Array(9).fill(0),
        };
    }

    setTiles(tiles: { [key: string]: number[] }) {
        this.tiles = tiles;
    }

    isHu(): boolean {
        // 尝试为每种类型的牌找到将（对子）
        for (let type in this.tiles) {
            for (let i = 0; i < this.tiles[type].length; i++) {
                if (this.tiles[type][i] >= 2) {
                    this.tiles[type][i] -= 2;
                    // 复制当前牌的状态
                    let tempTiles = JSON.parse(JSON.stringify(this.tiles));
                    if (this.isMentsuAll(tempTiles)) {
                        this.tiles[type][i] += 2;
                        return true;
                    }
                    this.tiles[type][i] += 2;
                }
            }
        }
        return false;
    }

    private isMentsuAll(tiles: { [key: string]: number[] }): boolean {
        for (let type in tiles) {
            if (!this.isMentsu(tiles[type])) {
                return false;
            }
        }
        return true;
    }

    private isMentsu(tiles: number[]): boolean {
        let tilesCopy = tiles.slice();
        for (let i = 0; i < tilesCopy.length; i++) {
            if (tilesCopy[i] >= 3) {
                tilesCopy[i] -= 3;
                i--;
                continue;
            }
            if (i + 2 < tilesCopy.length && tilesCopy[i] > 0 && tilesCopy[i + 1] > 0 && tilesCopy[i + 2] > 0) {
                tilesCopy[i]--;
                tilesCopy[i + 1]--;
                tilesCopy[i + 2]--;
                i--;
                continue;
            }
        }
        return tilesCopy.every(count => count === 0);
    }
}

export { HuPaiChecker };