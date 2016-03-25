egame.define("DisplayObject", ["RenderTexture", "Point", "Rectangle", "Matrix", "CONST", "EventEmitter","Utils"], function(RenderTexture, Point, Rectangle, Matrix, CONST, EventEmitter,Utils) {
    //暂存的矩阵
    var _tempMatrix = new Matrix(),
      _tempDisplayObjectParent = {
            worldTransform: new Matrix(),
            worldAlpha: 1,
            children: []
        };
    /**
     * 是所有显示对象的基类，显示对象就是要在屏幕上展示的对象
     */
    function DisplayObject() {
        EventEmitter.call(this);

        /**
         * 相对于这个显示对象父对象的坐标
         */
        this.position = new Point();
        /**
         * 显示对象的缩放系数
         */
        this.scale = new Point(1, 1);

        /**
         * 显示对象的旋转中心
         */
        this.pivot = new Point(0, 0);


        /**
         * 显示对象的倾斜角度
         */
        this.skew = new Point(0, 0);

        /**
         * 显示对象的旋转角度
         */
        this.rotation = 0;

        /**
         * 显示对象的透明度
         */
        this.alpha = 1;

        /**
         * 显示对象是否可见，如果是false这个对象是不会被绘制的并且updateTransform也不会被调用
         */
        this.visible = true;

        /**
         * 这个对象是否被渲染，如果是false不会进行绘制，但updateTransform方法仍然会被调用
         */
        this.renderable = true;

        /**
         * 显示对象容器，包含这个显示对象的
         */
        this.parent = null;

        /**
         * 全局透明度，由parent的全局透明度和自己的透明度共同决定
         */
        this.worldAlpha = 1;

        /**
         * 基于父对象的全局变换矩阵和当前显示对象在父对象的位置，计算出的当前显示对象的全局变换矩阵
         */
        this.worldTransform = new Matrix();

        /**
         * 过滤器应用区域
         * egame.Rectangle
         */
        this.filterArea = null;

        /**
         *  缓存旋转的sin值
         */
        this._sr = 0;

        /**
         * 缓存旋转的cos值
         */
        this._cr = 1;

        /**
         * 对象边界初始值
         * @member {egame.Rectangle}
         */
        this._bounds = new Rectangle(0, 0, 1, 1);

        /**
         * 对象当前的边界
         * @member {egame.Rectangle}
         */
        this._currentBounds = null;

        /**
         * 对象原始的遮罩
         * @member {egame.Rectangle}
         * @private
         */
        this._mask = null;
    }

    DisplayObject.prototype = Object.create(EventEmitter.prototype);
    DisplayObject.prototype.constructor = DisplayObject;


    Object.defineProperties(DisplayObject.prototype, {
        /**
         * 相对于显示容器的x坐标
         */
        x: {
            get: function() {
                return this.position.x;
            },
            set: function(value) {
                this.position.x = value;
            }
        },

        /**
         * 相对于显示容器的x坐标
         */
        y: {
            get: function() {
                return this.position.y;
            },
            set: function(value) {
                this.position.y = value;
            }
        },

        /**
         * 显示对象是否全局可见
         */
        worldVisible: {
            get: function() {
                var item = this;

                do {
                    if (!item.visible) {
                        return false;
                    }

                    item = item.parent;
                } while (item);

                return true;
            }
        },

        /**
         * 设置遮罩到显示对象。
         * 在egame中遮罩通常是egame.Graphics或者egame.Sprite对象。
         * 清除遮罩将这个属性设置为null即可。
         */
        mask: {
            get: function() {
                return this._mask;
            },
            set: function(value) {
                if (this._mask) {
                    this._mask.renderable = true;
                }

                this._mask = value;

                if (this._mask) {
                    this._mask.renderable = false;
                }
            }
        }
    });

    /*
     * 更新显示对象的全局变换以便进行渲染
     */
    DisplayObject.prototype.updateTransform = function() {
        var parent = this.parent;
        if(!parent){
           parent = _tempDisplayObjectParent;
        }
        var pt = parent.worldTransform;
        var wt = this.worldTransform;
        var a, b, c, d, tx, ty;

        if (this.skew.x || this.skew.y) {
            // 我们假设斜切不常用
            // 记住我们可以设置一个完整的变换使用temp matrix
            _tempMatrix.setTransform(
                this.position.x,
                this.position.y,
                this.pivot.x,
                this.pivot.y,
                this.scale.x,
                this.scale.y,
                this.rotation,
                this.skew.x,
                this.skew.y
            );

            //现在我们可以连接矩阵了
            wt.a = _tempMatrix.a * pt.a + _tempMatrix.b * pt.c;
            wt.b = _tempMatrix.a * pt.b + _tempMatrix.b * pt.d;
            wt.c = _tempMatrix.c * pt.a + _tempMatrix.d * pt.c;
            wt.d = _tempMatrix.c * pt.b + _tempMatrix.d * pt.d;
            wt.tx = _tempMatrix.tx * pt.a + _tempMatrix.ty * pt.c + pt.tx;
            wt.ty = _tempMatrix.tx * pt.b + _tempMatrix.ty * pt.d + pt.ty;
        } else {
            if (this.rotation % CONST.PI_2) {
                // 旋转角度的缓存值
                if (this.rotation !== this.rotationCache) {
                    this.rotationCache = this.rotation;
                    this._sr = Math.sin(this.rotation);
                    this._cr = Math.cos(this.rotation);
                }

                // 获取显示对象的矩阵值，基于变换信息
                a = this._cr * this.scale.x;
                b = this._sr * this.scale.x;
                c = -this._sr * this.scale.y;
                d = this._cr * this.scale.y;
                tx = this.position.x;
                ty = this.position.y;

                // 检查pivot旋转中心，基于这样一个事实
                if (this.pivot.x || this.pivot.y) {
                    tx -= this.pivot.x * a + this.pivot.y * c;
                    ty -= this.pivot.x * b + this.pivot.y * d;
                }

                // c连接矩阵
                wt.a = a * pt.a + b * pt.c;
                wt.b = a * pt.b + b * pt.d;
                wt.c = c * pt.a + d * pt.c;
                wt.d = c * pt.b + d * pt.d;
                wt.tx = tx * pt.a + ty * pt.c + pt.tx;
                wt.ty = tx * pt.b + ty * pt.d + pt.ty;
            } else {
                // 这样做会更快因为我们知道不需要旋转
                a = this.scale.x;
                d = this.scale.y;

                tx = this.position.x - this.pivot.x * a;
                ty = this.position.y - this.pivot.y * d;

                wt.a = a * pt.a;
                wt.b = a * pt.b;
                wt.c = d * pt.c;
                wt.d = d * pt.d;
                wt.tx = tx * pt.a + ty * pt.c + pt.tx;
                wt.ty = tx * pt.b + ty * pt.d + pt.ty;
            }
        }

        // 更新当前现实对象的全局透明度
        this.worldAlpha = this.alpha * parent.worldAlpha;

        // 重置显示对象边界
        this._currentBounds = null;
    };

    // 提高性能，避免使用call（性能快10倍）
    DisplayObject.prototype.displayObjectUpdateTransform = DisplayObject.prototype.updateTransform;

    /**
     *
     *
     * 索引显示对象的边界，返回一个矩形，这里是默认方法，具体显示对象需要重写
     * @param matrix {egame.Matrix}
     * @return {egame.Rectangle} 
     */
    DisplayObject.prototype.getBounds = function(matrix) {
        return Rectangle.EMPTY;
    };

    /**
     *索引显示对象的局部边界，这里是默认方法，具体显示对象需要重写
     * @return {egame.Rectangle}巨形边界区域
     */
    DisplayObject.prototype.getLocalBounds = function() {
        return this.getBounds(Matrix.IDENTITY);
    };

    /**
     * 将显示对象局部坐标，转换为全局坐标
     * @param position {egame.Point} 局部点位置
     * @return {egame.Point} 全局点位置
     */
    DisplayObject.prototype.toGlobal = function(position) {
        if (!this.parent) {

            this.parent = _tempDisplayObjectParent;
            this.displayObjectUpdateTransform();
            this.parent = null;
        } else {
            this.displayObjectUpdateTransform();
        }
        return this.worldTransform.apply(position);
    };

    /**
     * 计算当前显示对象的局部坐标通过相对于其他显示对象的局部坐标
     * @param position {egame.Point} 其他对象的局部坐标
     * @param [from] {egame.DisplayObject} 局部坐标关联的显示对象
     * @param [point] {egame.Point} 用来存储局部坐标 
     * @return {egame.Point} 返回局部坐标
     */
    DisplayObject.prototype.toLocal = function(position, from, point) {
        if (from) {
            position = from.toGlobal(position);
        }

        if (!this.parent) {
            this.parent = _tempDisplayObjectParent;
            this.displayObjectUpdateTransform();
            this.parent = null;
        } else {
            this.displayObjectUpdateTransform();
        }

        return this.worldTransform.applyInverse(position, point);
    };

    /**
     * 使用canvas渲染的接口
     * @param renderer {egmae.CanvasRenderer} canvas渲染器
     */
    DisplayObject.prototype.renderCanvas = function(renderer) {
        // 重写;
    };
    /**
     * 这是一个十分有用的方法，可以返回一个显示对象的纹理，可以用来创建精灵。
     * 如果你的显示对象是静态的/复杂的需要重用多次是十分有用的
     * @param renderer {egame.CanvasRenderer|egame.WebGLRenderer} 渲染器用来生成纹理
     * @param scaleMode {number} 缩放模式
     * @param resolution {number} 纹理的分辨率
     * @return {egame.Texture} 显示对象纹理
     */
    DisplayObject.prototype.generateTexture = function(renderer, scaleMode, resolution) {
        var bounds = this.getLocalBounds();

        var renderTexture = new RenderTexture(renderer, bounds.width | 0, bounds.height | 0, scaleMode, resolution);

        _tempMatrix.tx = -bounds.x;
        _tempMatrix.ty = -bounds.y;

        renderTexture.render(this, _tempMatrix);

        return renderTexture;
    };

    /**
     * 给显示对象设置显示容器
     */
    DisplayObject.prototype.setParent = function(container) {
        if (!container || !container.addChild) {
            throw new Error('setParent:父对象必须是容器');
        }
        container.addChild(this);
        return container;
    };

    /**
     * 方便的功能，一次性设置位置、缩放、倾斜和旋转中心等变换信息
     * @param [x=0] {number} x坐标
     * @param [y=0] {number} y坐标
     * @param [scaleX=1] {number} x方向缩放
     * @param [scaleY=1] {number} y方向缩放
     * @param [rotation=0] {number} 旋转角度
     * @param [skewX=0] {number} x方向斜切
     * @param [skewY=0] {number} y方向斜切
     * @param [pivotX=0] {number} 中心点的x坐标
     * @param [pivotY=0] {number} 中心点的y坐标
     */
    DisplayObject.prototype.setTransform = function(x, y, scaleX, scaleY, rotation, skewX, skewY, pivotX, pivotY) //jshint ignore:line
        {
            this.position.x = x || 0;
            this.position.y = y || 0;
            this.scale.x = !scaleX ? 1 : scaleX;
            this.scale.y = !scaleY ? 1 : scaleY;
            this.rotation = rotation || 0;
            this.skew.x = skewX || 0;
            this.skew.y = skewY || 0;
            this.pivot.x = pivotX || 0;
            this.pivot.y = pivotY || 0;
            return this;
        };

    /**
     *  清除一般显示对象的方法
     */
    DisplayObject.prototype.destroy = function() {

        this.position = null;
        this.scale = null;
        this.pivot = null;
        this.skew = null;

        this.parent = null;

        this._bounds = null;
        this._currentBounds = null;
        this._mask = null;

        this.worldTransform = null;
        this.filterArea = null;
    };

    /**
     * 显示对象的角度
     */
    Object.defineProperty(DisplayObject.prototype, "angle", {
        get: function() {
            return Utils.radToDeg(this.rotation);
        },

        set: function(value) {
            this.rotation = Utils.degToRad(value);
        }
    });

    egame.DisplayObject = DisplayObject;
    return DisplayObject;
});