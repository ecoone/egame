/**
 * 相机是你在游戏世界的视图，他有位置和大小并且只渲染在视图内的对象。游戏对象自动创建一个舞台大小的相机在启动的时候。通过x/y在世界中移动相机
 * @class egame.Camera
 * @constructor
 * @param {egame.Game} game - 当前游戏对象引用
 * @param {number} id - 当有多个相机时使用，相机的id
 * @param {number} x - 相机的x坐标
 * @param {number} y - 相机的y坐标
 * @param {number} width - 视图矩形的宽度
 * @param {number} height - 视图矩形的高度
 */
egame.define("Camera", function() {
    egame.Camera = function(game, id, x, y, width, height) {

        /**
         * @property {egame.Game} game - 游戏
         */
        this.game = game;

        /**
         * @property {egame.World} world - 游戏世界
         */
        this.world = game.world;

        /**
         * @property {number} id - 保留为将来多相机设置
         * @default
         */
        this.id = 0;

        /**
         * 相机视图
         * 我们希望从世界中渲染的视图（默认是游戏的尺寸）
         * x/y是在世界中的坐标，不是屏幕坐标，宽度和高度是多少像素要渲染
         * 如果Sprite.autoCull设置为true那么Sprites在视图外面是不会被渲染的。否则总是被渲染
         * @property {egame.Rectangle} view
         */
        this.view = new egame.Rectangle(x, y, width, height);

        /**
         * 相机的边界，相机的移动不可以移出这个边界。默认是可用的，大小是整个世界。这个矩形可以位于世界的任何位置，可以随时更新。
         * 如果你更本不想相机被限制，可以将他设置为null.这个值可以是任意在世界中的坐标
         * @property {egame.Rectangle} bounds -这个矩形是相机的边界，设置为null可以在任意位置移动
         */
        this.bounds = new egame.Rectangle(x, y, width, height);

        /**
         * @property {egame.Rectangle} deadzone - 在这个矩形内移动不会引起摄像机移动
         */
        this.deadzone = null;

        /**
         * @property {boolean} visible - 这个相机是否可见
         * @default
         */
        this.visible = true;

        /**
         * @property {boolean} roundPx - If a Camera has roundPx set to `true` it will call `view.floor` as part of its update loop, keeping its boundary to integer values. Set this to `false` to disable this from happening.
         * @default
         */
        this.roundPx = true;

        /**
         * @property {boolean} atLimit - 是否相机已经和边界相邻
         */
        this.atLimit = {
            x: false,
            y: false
        };

        /**
         * @property {egame.Sprite} target - 相机跟踪的Sprite，如果没有那么就是null.
         * @default
         */
        this.target = null;

        /**
         * @property {PIXI.DisplayObject} 显示对象
         */
        this.displayObject = null;

        /**
         * @property {egame.Point} scale -显示对象的缩放比例 
         */
        this.scale = null;

        /**
         * @property {number} totalInView - 多少Sprite在视图中展示
         * @readonly
         */
        this.totalInView = 0;

        /**
         * @property {egame.Point} _targetPosition - 内部点用于计算目标点
         * @private
         */
        this._targetPosition = new egame.Point();

        /**
         * @property {number} 边界值
         * @private
         * @default
         */
        this._edge = 0;

        /**
         * @property {egame.Point} position - 在世界中的位置
         * @private
         * @default
         */
        this._position = new egame.Point();

    };

    /**
     * @constant
     * @type {number}
     */
    egame.Camera.FOLLOW_LOCKON = 0;

    /**
     * @constant
     * @type {number}
     */
    egame.Camera.FOLLOW_PLATFORMER = 1;

    /**
     * @constant
     * @type {number}
     */
    egame.Camera.FOLLOW_TOPDOWN = 2;

    /**
     * @constant
     * @type {number}
     */
    egame.Camera.FOLLOW_TOPDOWN_TIGHT = 3;

    egame.Camera.prototype = {

        /**
         * Camera preUpdate. Sets the total view counter to zero.
         *
         * @method egame.Camera#preUpdate
         */
        preUpdate: function() {

            this.totalInView = 0;

        },

        /**
         * 告诉相机跟随那个精灵
         *  如果你发现轻微的抖动效果，可能是精灵通过子像素渲染位置，请设置`game.renderer.renderSession.roundPixels = true`就行全像素渲染
         * @method egame.Camera#follow
         * @param {egame.Sprite|egame.Image|egame.Text} target - 你想让相机跟踪的对象。设置为null被跟随任何东西
         * @param {number} [style] - 重复利用盲区预设.如果你使用自定义盲区，忽略这个参数并手工指定盲区，在调用follow之后 
         */
        follow: function(target, style) {

            if (style === undefined) {
                style = egame.Camera.FOLLOW_LOCKON;
            }

            this.target = target;

            var helper;

            switch (style) {

                case egame.Camera.FOLLOW_PLATFORMER:
                    var w = this.width / 8;
                    var h = this.height / 3;
                    this.deadzone = new egame.Rectangle((this.width - w) / 2, (this.height - h) / 2 - h * 0.25, w, h);
                    break;

                case egame.Camera.FOLLOW_TOPDOWN:
                    helper = Math.max(this.width, this.height) / 4;
                    this.deadzone = new egame.Rectangle((this.width - helper) / 2, (this.height - helper) / 2, helper, helper);
                    break;

                case egame.Camera.FOLLOW_TOPDOWN_TIGHT:
                    helper = Math.max(this.width, this.height) / 8;
                    this.deadzone = new egame.Rectangle((this.width - helper) / 2, (this.height - helper) / 2, helper, helper);
                    break;

                case egame.Camera.FOLLOW_LOCKON:
                    this.deadzone = null;
                    break;

                default:
                    this.deadzone = null;
                    break;
            }

        },

        /**
         * 设置相机跟随的对象，阻止它跟随一个对象，如果它是这样做的。
         * @method egame.Camera#unfollow
         */
        unfollow: function() {

            this.target = null;

        },

        /**
         * 将相机聚焦到一个显示对象上
         * @method egame.Camera#focusOn
         * @param {any} displayObject - 相机聚焦到的显示对象，必须有可见的x和y值
         */
        focusOn: function(displayObject) {

            this.setPosition(Math.round(displayObject.x - this.view.halfWidth), Math.round(displayObject.y - this.view.halfHeight));

        },

        /**
         * 将相机聚焦到一个点上
         * @method egame.Camera#focusOnXY
         * @param {number} x - X 位置.
         * @param {number} y - Y 位置.
         */
        focusOnXY: function(x, y) {

            this.setPosition(Math.round(x - this.view.halfWidth), Math.round(y - this.view.halfHeight));

        },

        /**
         * 更新聚焦和滚动
         * @method egame.Camera#update
         */
        update: function() {

            if (this.target) {
                this.updateTarget();
            }

            if (this.bounds) {
                this.checkBounds();
            }

            if (this.roundPx) {
                this.view.floor();
            }
            this.displayObject.position.x = -this.view.x;
            this.displayObject.position.y = -this.view.y;

        },

        /**
         * 内部方法
         * @method egame.Camera#updateTarget
         * @private
         */
        updateTarget: function() {

            this._targetPosition.copyFrom(this.target);

            if (this.target.parent) {
                this._targetPosition.multiply(this.target.parent.worldTransform.a, this.target.parent.worldTransform.d);
            }

            if (this.deadzone) {
                this._edge = this._targetPosition.x - this.view.x;

                if (this._edge < this.deadzone.left) {
                    this.view.x = this._targetPosition.x - this.deadzone.left;
                } else if (this._edge > this.deadzone.right) {
                    this.view.x = this._targetPosition.x - this.deadzone.right;
                }

                this._edge = this._targetPosition.y - this.view.y;

                if (this._edge < this.deadzone.top) {
                    this.view.y = this._targetPosition.y - this.deadzone.top;
                } else if (this._edge > this.deadzone.bottom) {
                    this.view.y = this._targetPosition.y - this.deadzone.bottom;
                }
            } else {
                this.view.x = this._targetPosition.x - this.view.halfWidth;
                this.view.y = this._targetPosition.y - this.view.halfHeight;
            }

        },

        /**
         *设置相机的边界和世界的边界一样
         * @method egame.Camera#setBoundsToWorld
         */
        setBoundsToWorld: function() {

            if (this.bounds) {
                this.bounds.copyFrom(this.game.world.bounds);
            }

        },

        /**
         * 确保视图不要超过相机的边界
         * @method egame.Camera#checkBounds
         */
        checkBounds: function() {
            this.atLimit.x = false;
            this.atLimit.y = false;

            //  Make sure we didn't go outside the cameras bounds
            if (this.view.x <= this.bounds.x) {
                this.atLimit.x = true;
                this.view.x = this.bounds.x;
            }

            if (this.view.right >= this.bounds.right) {
                this.atLimit.x = true;
                this.view.x = this.bounds.right - this.width;
            }

            if (this.view.y <= this.bounds.top) {
                this.atLimit.y = true;
                this.view.y = this.bounds.top;
            }

            if (this.view.bottom >= this.bounds.bottom) {
                this.atLimit.y = true;
                this.view.y = this.bounds.bottom - this.height;
            }

        },

        /**
         * 一次性设置相机的x和y属性。
         * @method egame.Camera#setPosition
         * @param {number} x - X 位置.
         * @param {number} y - Y 位置.
         */
        setPosition: function(x, y) {

            this.view.x = x;
            this.view.y = y;

            if (this.bounds) {
                this.checkBounds();
            }

        },

        /**
         * 设置相机视图矩阵的宽度和高度
         * @method egame.Camera#setSize
         * @param {number} width - 期望的宽度
         * @param {number} height - 期望的高度
         */
        setSize: function(width, height) {

            this.view.width = width;
            this.view.height = height;

        },

        /**
         * 重置相机到（0，0）并停止跟随任何跟随的对象
         * @method egame.Camera#reset
         */
        reset: function() {

            this.target = null;
            this.view.x = 0;
            this.view.y = 0;

        }

    };

    egame.Camera.prototype.constructor = egame.Camera;

    /**
     * 设置相机的y坐标，如果超出了边界会自动钳住
     * @name egame.Camera#x
     * @property {number} x -获取设置x坐标
     */
    Object.defineProperty(egame.Camera.prototype, "x", {

        get: function() {
            return this.view.x;
        },

        set: function(value) {

            this.view.x = value;
            if (this.bounds) {
                this.checkBounds();
            }
        }

    });

    /**
     * 设置相机的y坐标，如果超出了边界会自动钳住
     * @name egame.Camera#y
     * @property {number} y - 获取设置y坐标
     */
    Object.defineProperty(egame.Camera.prototype, "y", {

        get: function() {
            return this.view.y;
        },

        set: function(value) {

            this.view.y = value;

            if (this.bounds) {
                this.checkBounds();
            }
        }

    });

    /**
     * 设置相机的位置，如果超出了边界会自动钳住
     * @name egame.Camera#position
     * @property {egame.Point} position - 设置位置
     */
    Object.defineProperty(egame.Camera.prototype, "position", {

        get: function() {
            this._position.set(this.view.centerX, this.view.centerY);
            return this._position;
        },

        set: function(value) {

            if (typeof value.x !== "undefined") {
                this.view.x = value.x;
            }
            if (typeof value.y !== "undefined") {
                this.view.y = value.y;
            }

            if (this.bounds) {
                this.checkBounds();
            }
        }

    });

    /**
     * 相机的宽度。默认和游戏尺寸一样
     * @name egame.Camera#width
     * @property {number} width - 设置相机的宽度
     */
    Object.defineProperty(egame.Camera.prototype, "width", {

        get: function() {
            return this.view.width;
        },

        set: function(value) {
            this.view.width = value;
        }

    });

    /**
     * 相机的高度。默认和游戏尺寸一样
     * @name egame.Camera#height
     * @property {number} height - 设置相机的高度
     */
    Object.defineProperty(egame.Camera.prototype, "height", {

        get: function() {
            return this.view.height;
        },

        set: function(value) {
            this.view.height = value;
        }

    });

    return egame.Camera;

});