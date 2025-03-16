import { _decorator, Component, Node, Vec3, log } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MahjongTile')
export class MahjongTile extends Component {
    private isRaised: boolean = false;
    private originalPosition: Vec3 = new Vec3();
    private gameManager: Node = null;

    onLoad() {
        // 保存麻将牌的初始位置
        this.originalPosition.set(this.node.position);
        // 添加点击事件监听
        this.node.on(Node.EventType.TOUCH_END, this.onTileClicked, this);
    }

    onTileClicked() {
        log(`Tile clicked: ${this.node.name}`);
        if (this.isRaised) {
            // 如果麻将牌已抬起，再次点击将其弃出
            this.gameManager.getComponent('GameManager').discardTile(this.node);
        } else {
            // 如果麻将牌未抬起，抬起麻将牌
            this.gameManager.getComponent('GameManager').raiseTile(this.node);
        }
    }

    setGameManager(gameManager: Node) {
        this.gameManager = gameManager;
    }

    raise() {
        this.node.setPosition(this.originalPosition.clone().add3f(0, 50, 0)); // 基于初始位置抬起
        this.isRaised = true;
    }
    
    lower() {
        this.node.setPosition(this.originalPosition); // 恢复到初始位置
        this.isRaised = false;
    }
}