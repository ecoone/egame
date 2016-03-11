// CanvasMaskManager = require('./Utils/CanvasMaskManager');
egame.define("CanvasRenderer", ["CONST", "Utils", "Matrix", "SystemRenderer"], function(CONST, Utils, Matrix, SystemRenderer) {
    /**
     * CanvasRenderer是用来的canvas的2d环境绘制内容。别忘了将CanvasRenderer.view添加到一个DOM节点上否则你什么也看不到
     * @class
     * @memberof egame
     * @extends egame.SystemRenderer
     * @param [width=800] {number} 画布宽度
     * @param [height=600] {number} 画布高度
     * @param [options] {object} 同SystemRenderer介绍
     */
    function CanvasRenderer(width, height, options) {
        options = options || {};

        SystemRenderer.call(this, 'Canvas', width, height, options);

        this.type = CONST.RENDERER_TYPE.CANVAS;

        /**
         * 2d渲染环境
         */
        this.context = this.view.getContext('2d');
        /**
         *  逻辑值控制canvas刷新
         * @member {boolean}
         */
        this.refresh = true;

        /**
         * CanvasMaskManager 实例，处理遮罩，在canvas渲染器中
         * @member {egame.CanvasMaskManager}
         */
        // this.maskManager = new CanvasMaskManager();

        /**
         * 设置canvas的平滑属性
         * @member {string}
         */
        this.smoothProperty = 'imageSmoothingEnabled';

        if (!this.context.imageSmoothingEnabled) {
            if (this.context.webkitImageSmoothingEnabled) {
                this.smoothProperty = 'webkitImageSmoothingEnabled';
            } else if (this.context.mozImageSmoothingEnabled) {
                this.smoothProperty = 'mozImageSmoothingEnabledf';
            } else if (this.context.oImageSmoothingEnabled) {
                this.smoothProperty = 'oImageSmoothingEnabled';
            } else if (this.context.msImageSmoothingEnabled) {
                this.smoothProperty = 'msImageSmoothingEnabled';
            }
        }

        //初始化组件
        this.initPlugins();

        this._mapBlendModes();

        /**
         * 一个临时的显示对象，用于当前渲染条目的父元素
         * @member {egame.DisplayObject}
         * @private
         */
        this._tempDisplayObjectParent = {
            worldTransform: new Matrix(),
            worldAlpha: 1
        };


        this.resize(width, height);
        //置入背景色
        this.context.fillStyle = this._backgroundColorString;
        this.context.fillRect(0,0,width,height);

    }

    CanvasRenderer.prototype = Object.create(SystemRenderer.prototype);
    CanvasRenderer.prototype.constructor = CanvasRenderer;
    //给canvasRenderer添加组件系统
    Utils.pluginTarget.mixin(CanvasRenderer);

    /**
     * 渲染显示对象到画板视图上
     * @param object {egame.DisplayObject} 被渲染的显示对象
     */
    CanvasRenderer.prototype.render = function(object) {
        this.emit('prerender');

        var cacheParent = object.parent;

        this._lastObjectRendered = object;

        object.parent = this._tempDisplayObjectParent;

        // 更新场景图形
        object.updateTransform();

        object.parent = cacheParent;

        this.context.setTransform(1, 0, 0, 1, 0, 0);

        this.context.globalAlpha = 1;

        this.context.globalCompositeOperation = this.blendModes[CONST.BLEND_MODES.NORMAL];

        if (navigator.isCocoonJS && this.view.screencanvas) {
            this.context.fillStyle = 'black';
            this.context.clear();
        }

        if (this.clearBeforeRender) {
            if (this.transparent) {
                this.context.clearRect(0, 0, this.width, this.height);
            } else {
                this.context.fillStyle = this._backgroundColorString;
                this.context.fillRect(0, 0, this.width, this.height);
            }
        }

        this.renderDisplayObject(object, this.context);

        this.emit('postrender');
    };

    /**
     * 移除渲染器上所有的东西，可选择性的移除canvasDOM元素
     * @param [removeView=false] {boolean} 移除canvas元素从DOM中
     */
    CanvasRenderer.prototype.destroy = function(removeView) {
        this.destroyPlugins();

        SystemRenderer.prototype.destroy.call(this, removeView);

        this.context = null;

        this.refresh = true;

        this.maskManager.destroy();
        this.maskManager = null;

        this.smoothProperty = null;
    };

    /**
     * 渲染显示对象
     * @param displayObject {egame.DisplayObject} 被渲染的显示对象
     * @private
     */
    CanvasRenderer.prototype.renderDisplayObject = function(displayObject, context) {
        var tempContext = this.context;

        this.context = context;
        displayObject.renderCanvas(this);
        this.context = tempContext;
    };

    /**
     * @extends egame.SystemRenderer#resize
     *
     * @param {number} w
     * @param {number} h
     */
    CanvasRenderer.prototype.resize = function(w, h) {
        SystemRenderer.prototype.resize.call(this, w, h);

        //重置缩放模式，奇怪的reset当canvas被reset
        if (this.smoothProperty) {
            this.context[this.smoothProperty] = (CONST.SCALE_MODES.DEFAULT === CONST.SCALE_MODES.LINEAR);
        }

    };

    /**
     * 设置渲染的混合模式
     */
    CanvasRenderer.prototype._mapBlendModes = function() {
        if (!this.blendModes) {
            this.blendModes = {};

            if (Utils.canUseNewCanvasBlendModes()) {
                this.blendModes[CONST.BLEND_MODES.NORMAL] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.ADD] = 'lighter'; //IS THIS OK???
                this.blendModes[CONST.BLEND_MODES.MULTIPLY] = 'multiply';
                this.blendModes[CONST.BLEND_MODES.SCREEN] = 'screen';
                this.blendModes[CONST.BLEND_MODES.OVERLAY] = 'overlay';
                this.blendModes[CONST.BLEND_MODES.DARKEN] = 'darken';
                this.blendModes[CONST.BLEND_MODES.LIGHTEN] = 'lighten';
                this.blendModes[CONST.BLEND_MODES.COLOR_DODGE] = 'color-dodge';
                this.blendModes[CONST.BLEND_MODES.COLOR_BURN] = 'color-burn';
                this.blendModes[CONST.BLEND_MODES.HARD_LIGHT] = 'hard-light';
                this.blendModes[CONST.BLEND_MODES.SOFT_LIGHT] = 'soft-light';
                this.blendModes[CONST.BLEND_MODES.DIFFERENCE] = 'difference';
                this.blendModes[CONST.BLEND_MODES.EXCLUSION] = 'exclusion';
                this.blendModes[CONST.BLEND_MODES.HUE] = 'hue';
                this.blendModes[CONST.BLEND_MODES.SATURATION] = 'saturate';
                this.blendModes[CONST.BLEND_MODES.COLOR] = 'color';
                this.blendModes[CONST.BLEND_MODES.LUMINOSITY] = 'luminosity';
            } else {
                //这意味着浏览器不支持比较cool的新混合模式'cough'
                this.blendModes[CONST.BLEND_MODES.NORMAL] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.ADD] = 'lighter'; //IS THIS OK???
                this.blendModes[CONST.BLEND_MODES.MULTIPLY] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.SCREEN] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.OVERLAY] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.DARKEN] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.LIGHTEN] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.COLOR_DODGE] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.COLOR_BURN] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.HARD_LIGHT] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.SOFT_LIGHT] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.DIFFERENCE] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.EXCLUSION] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.HUE] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.SATURATION] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.COLOR] = 'source-over';
                this.blendModes[CONST.BLEND_MODES.LUMINOSITY] = 'source-over';
            }
        }
    };

    egame.CanvasRenderer = CanvasRenderer;
    return CanvasRenderer;
});