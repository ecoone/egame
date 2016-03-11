egame.define("SystemRenderer", ["CONST", "Utils", "Matrix", "EventEmitter"], function(CONST, Utils, Matrix, EventEmitter) {

    /**
     * 渲染器基类，具体的渲染类有CanvasRenderer和WebglRenderer或者其他
     * @class
     * @memberof egame
     * @param system {string} 渲染器系统,比如：Canvas
     * @param [width=800] {number} 画布视图宽度
     * @param [height=600] {number} t画布视图高度
     * @param [options] {object}  可选渲染器参数
     * @param [options.view] {HTMLCanvasElement} canvas视图元素
     * @param [options.transparent=false] {boolean}渲染的视图是否透明, 默认是false
     * @param [options.autoResize=false] {boolean} 渲染的视图是否自动变化尺寸, 默认是 false
     * @param [options.antialias=false] {boolean} 设置抗锯齿 (仅仅在chrome中有效)
     * @param [options.resolution=1] {number} 分辨率retina可能是2
     * @param [options.clearBeforeRender=true] {boolean} 在渲染前清空画布
     * @param [options.backgroundColor=0x000000] {number} 背景色
     * @param [options.roundPixels=false] {boolean} 如果是true将使用Math.floor() 处理x/y 的值在渲染的时候,停止像素插值。
     */
    function SystemRenderer(system, width, height, options) {
        EventEmitter.call(this);

        Utils.sayHello(system);

        //预处理可选项
        if (options) {
            for (var i in CONST.DEFAULT_RENDER_OPTIONS) {
                if (typeof options[i] === 'undefined') {
                    options[i] = CONST.DEFAULT_RENDER_OPTIONS[i];
                }
            }
        } else {
            options = CONST.DEFAULT_RENDER_OPTIONS;
        }

        /**
         * renderer的类型
         * @member {number}
         * @default egame.RENDERER_TYPE.UNKNOWN
         * @see egame.RENDERER_TYPE
         */
        this.type = CONST.RENDERER_TYPE.UNKNOWN;

        /**
         * canvas画板的宽度
         *
         * @member {number}
         * @default 800
         */
        this.width = width || 800;

        /**
         * canvas画板的高度
         *
         * @member {number}
         * @default 600
         */
        this.height = height || 600;

        /**
         * 一个canvas元素所有元素绘制容器
         * @member {HTMLCanvasElement}
         */
        this.view = options.view || document.createElement('canvas');

        /**
         * 渲染器的分辨率
         * @member {number}
         * @default 1
         */
        this.resolution = options.resolution;
        /**
         * 渲染视图，是否透明
         * @member {boolean}
         */
        this.transparent = options.transparent;

        /**
         * 渲染视图是否自动重新设置大小
         * @member {boolean}
         */
        this.autoResize = options.autoResize || false;

        /**
         * 跟踪混合模式对于这个渲染器是非常有用的
         * @member {object<string, mixed>}
         */
        this.blendModes = null;

        /**
         *  preserveDrawingBuffer标志影响模板缓存内容是否在渲染后维持
         * @member {boolean}
         */
        this.preserveDrawingBuffer = options.preserveDrawingBuffer;

        /**
         * 是否清除画壁在渲染前
         * @member {boolean}
         * @default
         */
        this.clearBeforeRender = options.clearBeforeRender;

        /**
         *  如果是true将使用Math.floor() 处理x/y 的值在渲染的时候,停止像素插值。
         * 便利清脆的像素艺术处理和传统设备上的性能
         * @member {boolean}
         */
        this.roundPixels = options.roundPixels;

        /**
         * 数字型背景色.
         */
        this._backgroundColor = 0xffffff;
 
        /**
         * RGB形式的背景色
         */
        this._backgroundColorRgb = [0, 0, 0];

        /**
         * 字符串形式的背景色
         */
        this._backgroundColorString = '#ffffff';
        //设置背景色
        this.backgroundColor = options.backgroundColor || this._backgroundColor;

        /**
         * 这个一个显示对象的缓存，用于渲染当前条目的parent
         * @member {egame.DisplayObject}
         * @private
         */
        this._tempDisplayObjectParent = {
            worldTransform: new Matrix(),
            worldAlpha: 1,
            children: []
        };

        /**
         * 最后一个根对象渲染器要渲染的
         * @member {egame.DisplayObject}
         * @private
         */
        this._lastObjectRendered = this._tempDisplayObjectParent;
    }

    SystemRenderer.prototype = Object.create(EventEmitter.prototype);
    SystemRenderer.prototype.constructor = SystemRenderer;

    Object.defineProperties(SystemRenderer.prototype, {
        /**
         * 背景色，如果不透明
         */
        backgroundColor: {
            get: function() {
                return this._backgroundColor;
            },
            set: function(val) {
                this._backgroundColor = val;
                this._backgroundColorString = Utils.hex2string(val);
                Utils.hex2rgb(val, this._backgroundColorRgb);
            }
        }
    });

    /**
     * 调整Canvas视图的大小
     * @param width {number} 新的宽度
     * @param height {number} 新的高度
     */
    SystemRenderer.prototype.resize = function(width, height) {
        this.width = width * this.resolution;
        this.height = height * this.resolution;
        this.view.width = this.width;
        this.view.height = this.height;
        if (this.autoResize) {
            this.view.style.width = this.width / this.resolution + 'px';
            this.view.style.height = this.height / this.resolution + 'px';
        }
    };

    /**
     * 清楚渲染器上所有东西，可选移除Canvas DOM
     */
    SystemRenderer.prototype.destroy = function(removeView) {
        if (removeView && this.view.parentNode) {
            this.view.parentNode.removeChild(this.view);
        }

        this.type = CONST.RENDERER_TYPE.UNKNOWN;

        this.width = 0;
        this.height = 0;

        this.view = null;

        this.resolution = 0;

        this.transparent = true;

        this.autoResize = false;

        this.blendModes = null;

        this.preserveDrawingBuffer = false;
        this.clearBeforeRender = false;

        this.roundPixels = false;

        this._backgroundColor = 0;
        this._backgroundColorRgb = null;
        this._backgroundColorString = null;
    };
    
    egame.SystemRenderer = SystemRenderer;
    return SystemRenderer;
});