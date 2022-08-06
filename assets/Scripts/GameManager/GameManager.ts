import { _decorator, Component, Node, Prefab, CCInteger, instantiate, Vec3, Label } from 'cc';
import { PlayerController } from '../Player/PlayerController';
const { ccclass, property } = _decorator;

enum BlockType {
    BT_NONE,
    BT_STONE,
}

enum GameState {
    GS_INIT,
    GS_PLAYING,
    GS_GAMEOVER,
}

@ccclass('GameManager')
export class GameManager extends Component {

    @property({ type: Prefab })
    public cubPrefab: Prefab = null;
    @property({ type: CCInteger })
    public roadLenght: number = 50;
    @property({ type: PlayerController })
    public playerCtrl: PlayerController = null;
    @property({ type: Node })
    public startMenu: Node = null;
    @property({ type: Label })
    public stepsLabel: Label | null = null;


    private _road: number[] = [];
    private _curState: GameState = GameState.GS_INIT;

    start() {
        this.curState = GameState.GS_INIT;
        this.playerCtrl?.node.on('JumpStart', this.onPlayerJumpStart, this);
        this.playerCtrl?.node.on('JumpEnd', this.onPlayerJumpEnd, this);
        this.generateRoad();
    }

    init() {
        if (this.startMenu) {
            this.startMenu.active = true;
        }

        this.generateRoad();

        if (this.playerCtrl) {
            this.playerCtrl.setInputActive(false);
            this.playerCtrl.node.setPosition(Vec3.ZERO);
        }
        this.playerCtrl.reset();
    }

    set curState(value: GameState) {
        switch (value) {
            case GameState.GS_INIT:
                this.unschedule(this.onPlayerTimeout);
                this.init();
                break;
            case GameState.GS_PLAYING:
                if (this.startMenu) {
                    this.startMenu.active = false;
                }
                if (this.stepsLabel) {
                    this.stepsLabel.string = '0';
                }
                setTimeout(() => {
                    if (this.playerCtrl) {
                        this.playerCtrl.setInputActive(true);
                    }
                }, .1);
                this.scheduleOnce(this.onPlayerTimeout, 1);
                break;
            case GameState.GS_GAMEOVER:
                this.curState = GameState.GS_INIT;
                break;
        }
        this._curState = value;
    }

    generateRoad() {
        this.node.removeAllChildren();

        this._road = [];
        this._road.push(BlockType.BT_STONE);

        for (let i = 1; i < this.roadLenght; i++) {
            if (this._road[i - 1] === BlockType.BT_NONE) {
                this._road.push(BlockType.BT_STONE);
            } else {
                this._road.push(Math.floor(Math.random() * 2));
            }
        }

        for (let j = 0; j < this.roadLenght; j++) {
            let block: Node = this.spawnBlockByType(this._road[j]);
            if (block) {
                this.node.addChild(block);
                block.setPosition(j, -1.5, 0);
            }
        }
    }

    spawnBlockByType(type: BlockType) {
        if (type === BlockType.BT_NONE) {
            return null;
        }

        let block: Node | null = null;
        switch (type) {
            case BlockType.BT_STONE:
                block = instantiate(this.cubPrefab);
                break;
        }

        return block;
    }

    onStartButtonClicked() {
        this.curState = GameState.GS_PLAYING;
    }

    checkResult(moveIndex: number) {
        if (moveIndex <= this.roadLenght) {
            if (this._road[moveIndex] === BlockType.BT_NONE) {
                this.curState = GameState.GS_GAMEOVER;
            }
        } else {
            this.curState = GameState.GS_GAMEOVER;
        }
    }

    onPlayerJumpStart() {
        this.unschedule(this.onPlayerTimeout);
    }

    onPlayerJumpEnd(moveIndex: number) {
        this.scheduleOnce(this.onPlayerTimeout, 1);

        this.checkResult(moveIndex);

        if (this._curState === GameState.GS_PLAYING) {
            if (this.stepsLabel) {
                this.stepsLabel.string = '' + moveIndex;
            }
        }
    }

    onPlayerTimeout() {
        this.curState = GameState.GS_GAMEOVER;
    }

}

