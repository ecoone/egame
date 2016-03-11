
egame.define("RenderTexture", ["CONST", "Matrix", "CanvasBuffer","Rectangle","BaseTexture","Texture"], function(CONST, Matrix, CanvasBuffer,Rectangle,BaseTexture,Texture) {
var    tempMatrix = new Matrix();

/**
 * RenderTexture是一个特别的纹理，他允许任何egame显示对象被他渲染
 * 提示:所有的显示对象（也就是精灵）需要通过renderTexture渲染需要提前加载，否则将会画一个黑色的矩形
 * RenderTexture获取传给渲染方法的显示对象的快照，设置的位置和旋转被忽略。
 * 例如:
 * ```js
 * var renderer = egame.autoDetectRenderer(1024, 1024, { view: canvas, ratio: 1 });
 * var renderTexture = new egame.RenderTexture(renderer, 800, 600);
 * var sprite = egame.Sprite.fromImage("spinObj_01.png");
 *
 * sprite.position.x = 800/2;
 * sprite.position.y = 600/2;
 * sprite.anchor.x = 0.5;
 * sprite.anchor.y = 0.5;
 *
 * renderTexture.render(sprite);
 * ```
 *
 * The Sprite in this case will be rendered to a position of 0,0. To render this sprite at its actual
 * position a Container should be used:
 * 这个精灵会被渲染在0，0，为了让用户渲染精灵到中心需要用一个容器
 *
 * ```js
 * var doc = new egame.Container();
 *
 * doc.addChild(sprite);
 *
 * renderTexture.render(doc); 
 * ```
 *
 * @class
 * @extends egame.Texture
 * @memberof egame
 * @param renderer {egame.CanvasRenderer|egame.WebGLRenderer} 被RendererTexture使用的渲染器
 * @param [width=100] {number} 渲染纹理的宽度
 * @param [height=100] {number} 渲染纹理的高度
 * @param [scaleMode] {number} 缩放模式
 * @param [resolution=1] {number} 生成纹理的分辨率
 */
function RenderTexture(renderer, width, height, scaleMode, resolution)
{
    if (!renderer)
    {
        throw new Error('你需要给构造函数传递一个渲染器');
    }

    width = width || 100;
    height = height || 100;
    resolution = resolution || CONST.RESOLUTION;

    /**
     * 基础纹理
     * @member {BaseTexture}
     */
    var baseTexture = new BaseTexture();
    baseTexture.width = width;
    baseTexture.height = height;
    baseTexture.resolution = resolution;
    baseTexture.scaleMode = scaleMode || CONST.SCALE_MODES.DEFAULT;
    baseTexture.hasLoaded = true;

    //纹理对象
    Texture.call(this,
        baseTexture,
        new Rectangle(0, 0, width, height)
    );


    /**
     * 渲染纹理的宽度
    */
    this.width = width;

    /**
     * 渲染纹理的高度
     */
    this.height = height;

    /**
     * 纹理的分辨率
     */
    this.resolution = resolution;

    /**
     *渲染方法
     */
    this.render = null;

    /**
     * RenderTexture使用的渲染器，只可以是一个类型的渲染器
     * @member {egame.CanvasRenderer|egame.WebGLRenderer}
     */
    this.renderer = renderer;

    this.render = this.renderCanvas;
    //纹理Buffer
    this.textureBuffer = new CanvasBuffer(this.width* this.resolution, this.height* this.resolution);
    this.baseTexture.source = this.textureBuffer.canvas;

    /**
     * @member {boolean}
     */
    this.valid = true;
}

RenderTexture.prototype = Object.create(Texture.prototype);
RenderTexture.prototype.constructor = RenderTexture;

/**
 * 调整渲染纹理的大小
 *
 * @param width {number} 要调整到的宽度
 * @param height {number} 要调整到的高度
 * @param updateBase {boolean} 是否基础纹理也一块调整大小
 */
RenderTexture.prototype.resize = function (width, height, updateBase)
{
    if (width === this.width && height === this.height)
    {
        return;
    }

    this.valid = (width > 0 && height > 0);
    this.width = this._frame.width = this.crop.width = width;
    this.height =  this._frame.height = this.crop.height = height;

    if (updateBase)
    {
        this.baseTexture.width = this.width;
        this.baseTexture.height = this.height;
    }

    if (!this.valid)
    {
        return;
    }

    this.textureBuffer.resize(this.width, this.height);

};

/**
 * 清空渲染纹理
 *
 */
RenderTexture.prototype.clear = function ()
{
    if (!this.valid)
    {
        return;
    }

    this.textureBuffer.clear();
};



/**
 * 分配给'render'的内部方法，渲染器会使用这个方法
 * @private
 * @param displayObject {egame.DisplayObject} 渲染在这个纹理上的显示对象
 * @param [matrix] {egame.Matrix} 在渲染前应用给显示对象的可选矩阵
 * @param [clear] {boolean} 如果是true，在显示对象被画出来之前清空
 */
RenderTexture.prototype.renderCanvas = function (displayObject, matrix, clear, updateTransform)
{
    if (!this.valid)
    {
        return;
    }

    updateTransform = !!updateTransform;

    var wt = tempMatrix;

    wt.identity();

    if (matrix)
    {
        wt.append(matrix);
    }

    var cachedWt = displayObject.worldTransform;
    displayObject.worldTransform = wt;

    // 设置 全局透明度确保显示对象在全透明状态下渲染
    displayObject.worldAlpha = 1;

    var children = displayObject.children;
    var i, j;

    for (i = 0, j = children.length; i < j; ++i)
    {
        children[i].updateTransform();
    }

    if (clear)
    {
        this.textureBuffer.clear();
    }

    var context = this.textureBuffer.context;

    var realResolution = this.renderer.resolution;

    this.renderer.resolution = this.resolution;

    this.renderer.renderDisplayObject(displayObject, context);

    this.renderer.resolution = realResolution;

    if(displayObject.worldTransform === wt)
    {
        // fixes cacheAsBitmap Happening during the above..
        displayObject.worldTransform = cachedWt;
    }

};

/**
 * 销毁纹理
 */
RenderTexture.prototype.destroy = function ()
{
    Texture.prototype.destroy.call(this, true);

    this.textureBuffer.destroy();

    this.renderer = null;
};

/**
 * 返回纹理的一个图片
 * @return {Image}
 */
RenderTexture.prototype.getImage = function ()
{
    var image = new Image();
    image.src = this.getBase64();
    return image;
};

/**
 * 返回纹理的base64编码
 */
RenderTexture.prototype.getBase64 = function ()
{
    return this.getCanvas().toDataURL();
};

/**
 *  返回创建的canvas
 */
RenderTexture.prototype.getCanvas = function ()
{
        return this.textureBuffer.canvas;
};

/**
 * 返回整个纹理的数据
 * @return {Uint8ClampedArray}
 */
RenderTexture.prototype.getPixels = function ()
{
    var width, height;
    width = this.textureBuffer.canvas.width;
    height = this.textureBuffer.canvas.height;

    return this.textureBuffer.canvas.getContext('2d').getImageData(0, 0, width, height).data;
};

/**
 * 用一维数组返回一个像素点(rgba)
 * @param x {number} 像素点的x坐标
 * @param y {number} 像素点的y坐标
 */
RenderTexture.prototype.getPixel = function (x, y)
{
    return this.textureBuffer.canvas.getContext('2d').getImageData(x, y, 1, 1).data;
};

    egame.RenderTexture = RenderTexture;
    return RenderTexture;
});