egame.define("Texture", ["CONST", "Utils", "EventEmitter","Rectangle","BaseTexture"], function(CONST, Utils, EventEmitter,Rectangle,BaseTexture) {
/**
 * 纹理存储图片信息或者图片的部分信息，他不可以直接添加到显示列表，应该将他用于Sprite。如果没有frame提供那么就使用全部信息。
 * 你可以直接使用image创建纹理然后多次使用，像下面这样
 * ```js
 * var texture = egame.Texture.fromImage('assets/image.png');
 * var sprite1 = new egame.Sprite(texture);
 * var sprite2 = new egame.Sprite(texture);
 * ```
 *
 * @class
 * @memberof egame
 * @param baseTexture {egame.BaseTexture} 用于创建纹理的基础纹理
 * @param [frame] {egame.Rectangle} 纹理要显示的矩形框
 * @param [crop] {egame.Rectangle} 原始的纹理区域，裁剪纹理区域
 * @param [trim] {egame.Rectangle} 修剪纹理区域
 * @param [rotate] {boolean} 表示纹理是否要旋转90deg(用于纹理打包)
 */
function Texture(baseTexture, frame, crop, trim, rotate)
{
    EventEmitter.call(this);

    /**
     * 是否设置纹理显示矩形框
     * @member {boolean}
     */
    this.noFrame = false;

    if (!frame)
    {
        this.noFrame = true;
        frame = new Rectangle(0, 0, 1, 1);
    }

    if (baseTexture instanceof Texture)
    {
        baseTexture = baseTexture.baseTexture;
    }

    /**
     * 基础纹理对象
     * @member {egame.BaseTexture}
     */
    this.baseTexture = baseTexture;

    /**
     * 从基础纹理中指定一个区域来让纹理使用
     * @member {egame.Rectangle}
     * @private
     */
    this._frame = frame;

    /**
     * 纹理修剪数据
     *
     * @member {egame.Rectangle}
     */
    this.trim = trim;

    /**
     * 表示让渲染器知道这个纹理是否可用
     * @member {boolean}
     */
    this.valid = false;

    /**
     * 纹理的宽度
     * @member {number}
     */
    this.width = 0;

    /**
     * 纹理的高度
     * @member {number}
     */
    this.height = 0;

    /**
     * 原始的纹理区域
     * @member {egame.Rectangle}
     */
    this.crop = crop || frame.clone();//new Rectangle(0, 0, 1, 1);
    /**
     * 表示纹理是否旋转90度
     */
    this.rotate = !!rotate;
    if (baseTexture.hasLoaded)
    {
        if (this.noFrame)
        {
            frame = new Rectangle(0, 0, baseTexture.width, baseTexture.height);
            //监控基础纹理更新
            baseTexture.on('update', this.onBaseTextureUpdated, this);
        }
        this.frame = frame;
    }
    else
    {
        baseTexture.once('loaded', this.onBaseTextureLoaded, this);
    }

}

Texture.prototype = Object.create(EventEmitter.prototype);
Texture.prototype.constructor = Texture;

Object.defineProperties(Texture.prototype, {
    /**
     * 从基础纹理取出的一个区域，给纹理对象使用
     * @member {egame.Rectangle}
     * @memberof egame.Texture#
     */
    frame: {
        get: function ()
        {
            return this._frame;
        },
        set: function (frame)
        {
            this._frame = frame;
            this.noFrame = false;

            this.width = frame.width;
            this.height = frame.height;

            if (!this.trim && !this.rotate && (frame.x + frame.width > this.baseTexture.width || frame.y + frame.height > this.baseTexture.height))
            {
                throw new Error('纹理错误:区域不适合基础纹理尺寸' + this);
            }

            this.valid = frame && frame.width && frame.height && this.baseTexture.hasLoaded;

            if (this.trim)
            {
                //从框架中裁剪的区域
                this.width = this.trim.width;
                this.height = this.trim.height;
                this._frame.width = this.trim.width;
                this._frame.height = this.trim.height;
            }
            else
            {
                //修剪区域
                this.crop = frame.clone();
            }

        }
    }
});

/**
 * 更新纹理
 *
 */
Texture.prototype.update = function ()
{
    this.baseTexture.update();
};

/**
 * 当基础纹理加载完成的时候调用
 */
Texture.prototype.onBaseTextureLoaded = function (baseTexture)
{
    if (this.noFrame)
    {
        this.frame = new Rectangle(0, 0, baseTexture.width, baseTexture.height);
    }
    else
    {
        this.frame = this._frame;
    }

    this.emit('update', this);
};

/**
 * 当基础纹理更新的时候调用
 */
Texture.prototype.onBaseTextureUpdated = function (baseTexture)
{
    this._frame.width = baseTexture.width;
    this._frame.height = baseTexture.height;

    this.emit('update', this);
};

/**
 * 销毁纹理
 * @param [destroyBase=false] {boolean} 是否销毁基础纹理对象
 */
Texture.prototype.destroy = function (destroyBase)
{
    if (this.baseTexture)
    {
        if (destroyBase)
        {
            this.baseTexture.destroy();
        }

        this.baseTexture.off('update', this.onBaseTextureUpdated, this);
        this.baseTexture.off('loaded', this.onBaseTextureLoaded, this);

        this.baseTexture = null;
    }

    this._frame = null;
    this._uvs = null;
    this.trim = null;
    this.crop = null;

    this.valid = false;

    this.off('dispose', this.dispose, this);
    this.off('update', this.update, this);
};

/**
 * 克隆一个新的纹理
 * @return {egame.Texture}
 */
Texture.prototype.clone = function ()
{
    return new Texture(this.baseTexture, this.frame, this.crop, this.trim, this.rotate);
};

/**
 * 有给定url生成纹理，如果这个图片已经生成过纹理，直接反回
 * @static
 * @param imageUrl {string} 图片url
 * @param crossorigin {boolean} 是否允许跨域
 * @param scaleMode {number} 缩放模式
 */
Texture.fromImage = function (imageUrl, crossorigin, scaleMode)
{
    var texture = Utils.TextureCache[imageUrl];

    if (!texture)
    {
        texture = new Texture(BaseTexture.fromImage(imageUrl, crossorigin, scaleMode));
        Utils.TextureCache[imageUrl] = texture;
    }

    return texture;
};
Texture.fromResource = function(resourceName, scaleMode){
    var imageUrl = egame.Caches[resourceName].requestUrl;
    var data = egame.Caches[resourceName].data;
    var texture = Utils.TextureCache[imageUrl];
    if (!texture)
    {
        texture = new Texture(new BaseTexture(data,scaleMode));
        Utils.TextureCache[imageUrl] = texture;
    }

    return texture;    
}

Texture.fromResource2 = function(resourceName,crossorigin, scaleMode){
    var imageUrl = egame.Caches[resourceName].requestUrl;
    var texture = Utils.TextureCache[imageUrl];
    if (!texture)
    {
        texture = new Texture(BaseTexture.fromImage(imageUrl, crossorigin, scaleMode));
        Utils.TextureCache[imageUrl] = texture;
    }

    return texture;    
}


/**
 * 通过帧id获取纹理
 * @static
 * @param frameId {string} 纹理的id
 */
Texture.fromFrame = function (frameId)
{
    var texture = Utils.TextureCache[frameId];

    if (!texture)
    {
        throw new Error('The frameId "' + frameId + '" does not exist in the texture cache');
    }

    return texture;
};

/**
 * 用canvas元素生成一个纹理
 * @static
 * @param canvas {Canvas} canvas元素
 * @param scaleMode {number} 缩放模式
 */
Texture.fromCanvas = function (canvas, scaleMode)
{
    return new Texture(BaseTexture.fromCanvas(canvas, scaleMode));
};


/**
 * 添加纹理到缓存，这个纹理属于egame全局
 * @static
 * @param texture {egame.Texture} 要被加入的缓存的纹理
 * @param id {string} 纹理在缓存中相应的id
 */
Texture.addTextureToCache = function (texture, id)
{
    Utils.TextureCache[id] = texture;
};

/**
 * 从纹理缓存中清除纹理
 * @static
 * @param id {string} 要移除纹理的缓存
 * @return {egame.Texture} 被移除的纹理
 */
Texture.removeTextureFromCache = function (id)
{
    var texture = Utils.TextureCache[id];

    delete Utils.TextureCache[id];
    delete Utils.BaseTextureCache[id];

    return texture;
};

/**
 * 一个空的纹理，经常用来不必要创建多个空的纹理
 */
Texture.EMPTY = new Texture(new BaseTexture());

    egame.Texture = Texture;
    return Texture;
});