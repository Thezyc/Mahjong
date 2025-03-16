import { _decorator, Component, Prefab, Node, Sprite, SpriteFrame, instantiate, Vec3, resources, log, UITransform, EventTouch, Button, Label } from 'cc';
import { MahjongTile } from './MahjongTile';
import { HuPaiChecker } from './HuPaiChecker';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Prefab)
    tilePrefab: Prefab = null;

    @property([SpriteFrame])
    tileSprites: SpriteFrame[] = [];

    @property(Node)
    huButton: Node = null; // 胡牌按钮

    @property(Node)
    huResultPopup: Node = null; // 计分窗口

    private tiles: Node[] = [];
    private raisedTile: Node = null;
    private handTiles: Node[] = [];
    private handArea: Node = null;
    private huPaiChecker: HuPaiChecker = new HuPaiChecker();

    onLoad() {
        log('GameManager onLoad');
        this.handArea = this.node.getChildByName('HandArea');
        this.loadTileSprites().then(() => {
            this.initTiles();
        }).catch((err) => {
            log(`Error loading tile sprites: ${err}`);
        });

        // 添加屏幕点击事件监听
        // this.node.on(Node.EventType.TOUCH_START, this.onScreenTouch, this);

        // 初始化胡牌按钮
        this.huButton.active = false;
        this.huButton.on(Button.EventType.CLICK, this.onHuButtonClick, this);

        // 初始化计分窗口
        this.huResultPopup.active = false;
    }

    onDestroy() {
        // 移除屏幕点击事件监听
        this.node.off(Node.EventType.TOUCH_START, this.onScreenTouch, this);
    }

    async loadTileSprites() {
        return new Promise<void>((resolve, reject) => {
            resources.loadDir('output', SpriteFrame, (err, frames) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (frames.length === 0) {
                    reject('No tile sprites found');
                    return;
                }
                this.tileSprites = frames;
                log(`Loaded ${frames.length} tile sprites`);
                resolve();
            });
        });
    }

    initTiles() {
        log('Initializing tiles');
        for (let i = 0; i < 136; i++) {
            let tile = instantiate(this.tilePrefab);
            if (!tile) {
                log(`Error: Tile prefab instantiation failed at index ${i}`);
                continue;
            }
            let sprite = tile.getComponent(Sprite);
            if (!sprite) {
                log(`Error: Sprite component not found on tile at index ${i}`);
                continue;
            }
            sprite.spriteFrame = this.tileSprites[i % this.tileSprites.length];
            let tileScript = tile.getComponent(MahjongTile);
            if (tileScript) {
                tileScript.setGameManager(this.node);
            } else {
                log(`Error: MahjongTile component not found on tilePrefab at index ${i}`);
            }
            this.tiles.push(tile);
        }
        this.shuffleTiles();
        this.dealTiles();
    }

    shuffleTiles() {
        log('Shuffling tiles');
        for (let i = this.tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }
    }

    dealTiles() {
        log('Dealing tiles');
        for (let i = 0; i < 13; i++) {
            let tile = this.tiles.pop();
            if (!tile) {
                log(`Error: Tile is null at index ${i}`);
                continue;
            }
            this.handTiles.push(tile);
            tile.setParent(this.handArea, false);
        }
        this.drawTile(); // 摸一张牌，使手牌区有14张麻将
        this.updateHandTiles();
    }

    updateHandTiles() {
        this.sortHandTiles();
        const tileWidth = this.handArea.getComponent(UITransform).width / 14;
        for (let i = 0; i < this.handTiles.length; i++) {
            let tile = this.handTiles[i];
            tile.setPosition(new Vec3(i * tileWidth - this.handArea.getComponent(UITransform).width / 2 + tileWidth / 2, 0, 0));
            tile.active = true;
            // 保存每个麻将的初始位置
            tile.getComponent(MahjongTile).originalPosition.set(tile.position);
            // 设置图层优先级
            tile.setSiblingIndex(i);
        }

        // 输出当前手牌到日志
        let handTilesLog = this.handTiles.map(tile => tile.getComponent(Sprite).spriteFrame.name).join(', ');
        log(`Current hand tiles: ${handTilesLog}`);

        this.checkHu();
    }

    sortHandTiles() {
        // 确保最新摸到的麻将放在最右边
        const lastTile = this.handTiles.pop();
        this.handTiles.sort((a, b) => {
            const spriteA = a.getComponent(Sprite).spriteFrame.name;
            const spriteB = b.getComponent(Sprite).spriteFrame.name;
            return spriteA.localeCompare(spriteB);
        });
        if (lastTile) {
            this.handTiles.push(lastTile);
        }
    }

    raiseTile(tile: Node) {
        if (this.raisedTile && this.raisedTile !== tile) {
            this.raisedTile.getComponent(MahjongTile).lower();
        }
        tile.getComponent(MahjongTile).raise();
        this.raisedTile = tile;
    }

    discardTile(tile: Node) {
        log(`Discarding tile: ${tile.name}`);
        this.handTiles = this.handTiles.filter(t => t !== tile);
        tile.removeFromParent();
        this.raisedTile = null;
        this.drawTile();
    }

    drawTile() {
        if (this.tiles.length > 0) {
            let tile = this.tiles.pop();
            this.handTiles.push(tile);
            tile.setParent(this.handArea, false);
            this.updateHandTiles();
            log(`Drew new tile: ${tile.name}`);
        } else {
            log('No more tiles to draw');
        }
    }

    checkHu() {
        // 创建一个对象，表示所有可能的麻将牌
        let tileCounts = {
            feng: new Array(4).fill(0),
            jian: new Array(3).fill(0),
            wan: new Array(9).fill(0),
            tong: new Array(9).fill(0),
            tiao: new Array(9).fill(0),
        };

        // 获取当前手牌并转换为数字数组
        this.handTiles.forEach(tile => {
            let spriteFrameName = tile.getComponent(Sprite).spriteFrame.name;
            let parts = spriteFrameName.split('_');
            let type = parts[2];
            let number = parseInt(parts[3]) - 1;
            if (tileCounts[type]) {
                tileCounts[type][number]++;
            }
        });

        // 输出解析后的手牌统计信息到日志
        log('Tile counts:', JSON.stringify(tileCounts));

        // 设置胡牌检测器的手牌
        this.huPaiChecker.setTiles(tileCounts);

        // 检查是否胡牌
        if (this.huPaiChecker.isHu()) {
            log('Hu! You win!');
            this.huButton.active = true; // 显示胡牌按钮
        } else {
            log('Not a Hu yet.');
            this.huButton.active = false; // 隐藏胡牌按钮
        }
    }

    onHuButtonClick() {
        // 显示计分窗口
        this.huResultPopup.active = true;

        // 列出满足的番种（此处简单示例，可以根据实际需求列出具体番种）
        let huResultLabel = this.huResultPopup.getComponentInChildren(Label);
        huResultLabel.string = "恭喜胡牌！\n番种：XX番，YY番";
    }

    onScreenTouch(event: EventTouch) {
        // 如果点击的不是麻将牌，则放下所有抬起的麻将牌
        if (this.raisedTile) {
            this.raisedTile.getComponent(MahjongTile).lower();
            this.raisedTile = null;
        }
    }
}