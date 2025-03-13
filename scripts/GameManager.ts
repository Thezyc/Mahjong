import { _decorator, Component, Prefab, Node, Sprite, SpriteFrame, instantiate, Vec3, resources, log, UITransform } from 'cc';
import { MahjongTile } from './MahjongTile';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Prefab)
    tilePrefab: Prefab = null;

    @property([SpriteFrame])
    tileSprites: SpriteFrame[] = [];

    private tiles: Node[] = [];
    private raisedTile: Node = null;
    private handTiles: Node[] = [];
    private handArea: Node = null;

    onLoad() {
        log('GameManager onLoad');
        this.handArea = this.node.getChildByName('HandArea');
        this.loadTileSprites().then(() => {
            this.initTiles();
        }).catch((err) => {
            log(`Error loading tile sprites: ${err}`);
        });
    }

    async loadTileSprites() {
        return new Promise<void>((resolve, reject) => {
            resources.loadDir('MahjongTiles', SpriteFrame, (err, frames) => {
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
        for (let i = 0; i < 144; i++) {
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
        this.updateHandTiles();
    }

    updateHandTiles() {
        this.sortHandTiles();
        const tileWidth = this.handArea.getComponent(UITransform).width / 14;
        for (let i = 0; i < this.handTiles.length; i++) {
            let tile = this.handTiles[i];
            tile.setPosition(new Vec3(i * tileWidth - this.handArea.getComponent(UITransform).width / 2 + tileWidth / 2, 0, 0));
            tile.active = true;
        }
    }

    sortHandTiles() {
        this.handTiles.sort((a, b) => {
            const spriteA = a.getComponent(Sprite).spriteFrame.name;
            const spriteB = b.getComponent(Sprite).spriteFrame.name;
            return spriteA.localeCompare(spriteB);
        });
    }

    raiseTile(tile: Node) {
        if (this.raisedTile) {
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
}