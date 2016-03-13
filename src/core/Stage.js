/**
 * 舞台控制在上面显示的所有根级别的显示对象，他也处理浏览器显示处理和由于失去焦点的暂停
 * @class egame.Stage
 * @extends egame.Container
 * @constructor
 * @param {egame.Game} game - 当前引用的游戏对象
 */
egame.define("Stage", ["Container", "CanvasRenderer", "CONST"], function(Container, CanvasRenderer, CONST) {
    egame.Stage = function(game) {

        Container.call(this);
        /**
         * @property {egame.Game} game - 引用的游戏对象
         */
        this.game = game;

        /**
         * @property {egame.CanvasRenderer} renderer 舞台渲染器
         */
        this.renderer = new CanvasRenderer(game.width, game.height);

        /**
         * @property {CanvasElement} canvas元素
         */
        this.canvas = this.renderer.view;

        /**
         * @property {CanvasContext} canvas上下文环境
         */
        this.context = this.renderer.context;

        this.exists = true;

        //重写addChild
        this._oldAddChild = this.addChild;

        this.addChild = function(child) {
            child.game = this.game;
            this._oldAddChild(child);
        }

        //舞台缩放模式
        if (game.scaleMode) {
            if (game.scaleMode == egame.ScaleMode.FIXED_WIDTH) {
                this.canvas.style.width = "100%";
            } else if (game.scaleMode == egame.ScaleMode.FIXED_HEIGHT) {
                this.canvas.style.height = "100%";
            } else if (game.scaleMode == egame.ScaleMode.FULL_PAGE) {
                this.canvas.style.width = "100%";
                this.canvas.style.height = "100%";
            }
        }
        if (!game.parent) {
            document.body.appendChild(this.renderer.view);
        } else {
            // document.body.appendChild(this.renderer.view);
            game.parent.appendChild(this.renderer.view);
        }
    };

    egame.Stage.prototype = Object.create(egame.Container.prototype);
    egame.Stage.prototype.constructor = egame.Stage;

    /**
     * 游戏循环前面更新
     *
     * @method egame.Stage#preUpdate
     */
    egame.Stage.prototype.preUpdate = function() {

        for (var i = 0; i < this.children.length; i++) {
            this.children[i].preUpdate();
        }

    };

    /**
     * 舞台更新游戏对象
     *
     * @method egame.Stage#update
     */
    egame.Stage.prototype.update = function() {

        var i = this.children.length;

        while (i--) {
            this.children[i].update();
        }

    };
    /**
     * 这个在渲染之前调用，在插件更新之后。
     * 在物理计算和对象位置发生
     * 对象按照显示对象的顺序处理
     * 唯一的例外是，如果相机是跟随一个对象，在这种情况下，更新第一。
     * @method egame.Stage#postUpdate
     */
    egame.Stage.prototype.postUpdate = function() {

        if (this.game.world.camera.target) {
            if (this.game.world.camera.target.postUpdate) this.game.world.camera.target.postUpdate();

            this.game.world.camera.update();

            var i = this.children.length;

            while (i--) {
                if (this.children[i] !== this.game.world.camera.target) {
                    if (this.children[i].postUpdate) this.children[i].postUpdate();
                }
            }
        } else {
            this.game.world.camera.update();

            var i = this.children.length;

            while (i--) {
                if (this.children[i].postUpdate) this.children[i].postUpdate();
            }
        }
    };

    /**
     * 设置舞台背景色
     * 颜色的形式可以是'#RRGGBB'`、`'rgb(r,g,b)'`、`0xRRGGBB`
     * 透明通道不支持
     * 透明通道不支持，会被忽略
     * 如果设置了透明，setBackgroundColor无效
     * @method egame.Stage#setBackgroundColor
     * @param {number|string} color - 背景色.
     */
    egame.Stage.prototype.setBackgroundColor = function(color) {
        //如果舞台是透明的不需要设置背景色
        if (this.transparent) {
            return;
        }

        function parseHexString(hex, c) {
            var l;
            if (hex.length === 7) {
                l = 2;
            } else if (hex.length === 4) {
                l = 1;
            } else {
                c = [255, 255, 255];
            }
            c[0] = parseInt(hex.substr(1, l), 16);
            c[1] = parseInt(hex.substr(1 + l, l), 16);
            c[2] = parseInt(hex.substr(1 + 2 * l, l), 16);
            return c;
        }

        var rgb_regex = /rgba?\s*\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,?\s*([0-9.]+)?\)/;

        function parseRgbString(rgb, c) {
            var values = rgb_regex.exec(rgb);
            if (values === null || (values.length != 4 && values.length != 5)) {
                c = [255, 255, 255];
            }
            c[0] = Math.round(parseFloat(values[1]));
            c[1] = Math.round(parseFloat(values[2]));
            c[2] = Math.round(parseFloat(values[3]));
            if (values[4]) {
                c[3] = parseFloat(values[4]);
            }
            return c;
        }

        //将rgb转化为十六进制
        function rgbToHex(c) {
            return ((c[0] << 16) + (c[1] << 8) + c[2]);
        }

        var hexValue = color;
        //#RRGGBB 
        if (color[0] === '#') {
            parseHexString(color, c);
            hexValue = rgbToHex(c);
            //rgb(r,g,b)
        } else if (color[0] === 'r' && color[1] === 'g' && color[2] === 'b') {
            parseRgbString(color, c);
            hexValue = rgbToHex(c);
        }

        this.renderer.backgroundColor = hexValue;
    };

    /**
     * @name egame.Stage#backgroundColor 
     * @property {number|string} backgroundColor - 设置舞台背景色
     */
    Object.defineProperty(egame.Stage.prototype, "backgroundColor", {

        get: function() {
            return this.renderer.backgroundColor;
        },
        set: function(color) {
            this.setBackgroundColor(color);
        }

    });
    /**
     * 设置舞台是否透明
     * @name egame.Stage#transparent
     * @property {boolean} transparent - 设置舞台是否透明
     */
    Object.defineProperty(egame.Stage.prototype, "transparent", {

        get: function() {
            return this.renderer.transparent;
        },
        set: function(transparent) {
            this.renderer.transparent = transparent;
        }

    });

    /**
     * 启用或禁用在舞台上的所有对象的纹理平滑。只适用于位图/图像纹理。默认启用平滑。
     * @name egame.Stage#smoothed
     * @property {boolean} smoothed - true启用平滑
     */
    Object.defineProperty(egame.Stage.prototype, "smoothed", {
        get: function() {

            return CONST.SCALE_MODES.DEFAULT === CONST.SCALE_MODES.LINEAR;

        },

        set: function(value) {

            if (value) {
                CONST.SCALE_MODES.DEFAULT = CONST.SCALE_MODES.LINEAR;
            } else {
                CONST.SCALE_MODES.DEFAULT = CONST.SCALE_MODES.NEAREST;
            }
        }

    });

    return egame.Stage;
});