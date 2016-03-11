/**
/**
 * 世界不过是我们想象中的一个画布
 * 一个游戏只有一个世界，世界是一个抽象的地方，所有的游戏对象生活在这里。他没有边界可以任意大小，有舞台限制展示。通过相机去观察世界
 *所有的游戏对象都生活在世界范围内的坐标。默认情况下，一个世界和你的舞台一样大小。
 * @class egame.World
 * @constructor
 * @param {.Game} game - 引用当前游戏对象
 */
egame.define("World", ["Camera"], function(Camera) {
    egame.World = function(game) {
        /**
         * @property {egame.Game} game - 引用的游戏对象
         */
        this.game = game;

        /**
         * 世界没有固定的尺寸，但它有一个范围以外的对象不再被认为是“在世界上”，你应该使用此清理的显示列表和清除死的对象。
         * 0,0 是世界的中心。
         * @property {.Rectangle} bounds - 世界的边界，物体在这个边界里面
         */
        this.bounds = new egame.Rectangle(0, 0, game.width, game.height);

        /**
         * @property {.Camera} camera - 相机实例
         */
        this.camera = null;

        /**
         * @property {boolean} _definedSize - 如果true已经定义了一个特定的尺寸,false匹配game的尺寸
         * @readonly
         */
        this._definedSize = false;

        /**
         * @property {number} width - 世界默认的宽度。有时候边界需要长大（如果你调整游戏的大小），但这仍然保留了原来的要求尺寸。
         */
        this._width = game.width;

        /**
         * @property {number} height - 世界默认的高度。有时候边界需要长大（如果你调整游戏的大小），但这仍然保留了原来的要求尺寸。
         */
        this._height = game.height;

        this.game.state.onStateChange.add(this.stateChange, this);

    };

    egame.World.prototype.constructor = egame.World;

    /**
     * 初始游戏世界
     * @method egame.World#boot
     * @protected
     */
    egame.World.prototype.boot = function() {

        this.camera = new egame.Camera(this.game, 0, 0, 0, this.game.width, this.game.height);

        this.camera.displayObject = this.game.stage;

        this.game.camera = this.camera;

    };

    /**
     *  在状态切换的时候调用
     *
     * @method egame.World#stateChange
     * @protected
     */
    egame.World.prototype.stateChange = function() {

        this.x = 0;
        this.y = 0;
        this.camera.reset();

    };

    /**
     * 更新世界的尺寸，并设置世界的x/y值，相机和物理边界也会更新来匹配新的世界边界
     * @method egame.World#setBounds
     * @param {number} x -世界左上角
     * @param {number} y - 世界左上角
     * @param {number} width - 新世界的宽度
     * @param {number} height - 新世界的高度
     */
    egame.World.prototype.setBounds = function(x, y, width, height) {

        this._definedSize = true;
        this._width = width;
        this._height = height;

        this.bounds.setTo(x, y, width, height);

        this.x = x;
        this.y = y;

        if (this.camera.bounds) {
            // 相机的边界设置为世界的边界
            this.camera.bounds.setTo(x, y, Math.max(width, this.game.width), Math.max(height, this.game.height));
        }
        // this.game.physics.setBoundsToWorld();
    };

    /**
     * 这里会活的一个游戏对象并检查他的x/y坐标是否落到了世界边界的外面。如果这样做，将会让对象到世界的另外一边，创建一环绕式处理
     * 如果精灵有P2体，这个body将会传入第一个参数到这个函数
     * @method egame.World#wrap
     * @param {.Sprite|.Image|.TileSprite|.Text} sprite - 需要环绕处理的对象
     * @param {number} [padding=0] - Extra padding added equally to the sprite.x and y coordinates before checking if within the world bounds. Ignored if useBounds is true.额外的填充添加到精灵在边界检测时和x/y坐标一样，useBounds是true忽略。
     * @param {boolean} [useBounds=false] - 如果usebounds是假包检查object.x/y坐标。如果是真的，它会更精确的边界检查，这是更昂贵的。
     * @param {boolean} [horizontal=true] - 如果水平方向是false。那么对象的y坐标不会就行环绕处理
     * @param {boolean} [vertical=true] - 如果垂直方向是false。那么对象的y坐标不会就行环绕处理
     */
    egame.World.prototype.wrap = function(sprite, padding, useBounds, horizontal, vertical) {

        if (padding === undefined) {
            padding = 0;
        }
        if (useBounds === undefined) {
            useBounds = false;
        }
        if (horizontal === undefined) {
            horizontal = true;
        }
        if (vertical === undefined) {
            vertical = true;
        }

        if (!useBounds) {
            if (horizontal && sprite.x + padding < this.bounds.x) {
                sprite.x = this.bounds.right + padding;
            } else if (horizontal && sprite.x - padding > this.bounds.right) {
                sprite.x = this.bounds.left - padding;
            }

            if (vertical && sprite.y + padding < this.bounds.top) {
                sprite.y = this.bounds.bottom + padding;
            } else if (vertical && sprite.y - padding > this.bounds.bottom) {
                sprite.y = this.bounds.top - padding;
            }
        } else {
            sprite.getBounds();

            if (horizontal) {
                if ((sprite.x + sprite._currentBounds.width) < this.bounds.x) {
                    sprite.x = this.bounds.right;
                } else if (sprite.x > this.bounds.right) {
                    sprite.x = this.bounds.left;
                }
            }

            if (vertical) {
                if ((sprite.y + sprite._currentBounds.height) < this.bounds.top) {
                    sprite.y = this.bounds.bottom;
                } else if (sprite.y > this.bounds.bottom) {
                    sprite.y = this.bounds.top;
                }
            }
        }

    };

    /**
     * @name egame.World#width
     * @property {number} width - G获取或者设置当前游戏世界宽度.永远不能小于游戏（画布）的尺寸。
     */
    Object.defineProperty(egame.World.prototype, "width", {

        get: function() {
            return this.bounds.width;
        },

        set: function(value) {

            if (value < this.game.width) {
                value = this.game.width;
            }

            this.bounds.width = value;
            this._width = value;
            this._definedSize = true;

        }

    });

    /**
     * @name egame.World#height
     * @property {number} height - 获取或者设置当前游戏世界高度.永远不能小于游戏（画布）的尺寸。
     */
    Object.defineProperty(egame.World.prototype, "height", {

        get: function() {
            return this.bounds.height;
        },

        set: function(value) {

            if (value < this.game.height) {
                value = this.game.height;
            }

            this.bounds.height = value;
            this._height = value;
            this._definedSize = true;

        }

    });

    /**
     * @name egame.World#centerX
     * @property {number} centerX - 获取游戏世界中心的X坐标
     * @readonly
     */
    Object.defineProperty(egame.World.prototype, "centerX", {

        get: function() {
            return this.bounds.halfWidth;
        }

    });

    /**
     * @name egame.World#centerY
     * @property {number} centerY - 获取游戏世界中心的Y坐标
     * @readonly
     */
    Object.defineProperty(egame.World.prototype, "centerY", {

        get: function() {
            return this.bounds.halfHeight;
        }

    });

    /**
     * @name egame.World#randomX
     * @property {number} randomX - 获取一个随机整数，小于等于当前游戏世界宽度
     * @readonly
     */
    Object.defineProperty(egame.World.prototype, "randomX", {

        get: function() {

            if (this.bounds.x < 0) {
                return this.game.rnd.between(this.bounds.x, (this.bounds.width - Math.abs(this.bounds.x)));
            } else {
                return this.game.rnd.between(this.bounds.x, this.bounds.width);
            }

        }

    });

    /**
     * @name egame.World#randomY
     * @property {number} randomY - 获取一个随机整数，小于等于当前游戏世界高度
     * @readonly
     */
    Object.defineProperty(egame.World.prototype, "randomY", {

        get: function() {

            if (this.bounds.y < 0) {
                return this.game.rnd.between(this.bounds.y, (this.bounds.height - Math.abs(this.bounds.y)));
            } else {
                return this.game.rnd.between(this.bounds.y, this.bounds.height);
            }

        }

    });

    return egame.World;
});