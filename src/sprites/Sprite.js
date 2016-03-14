egame.define("Sprite", ["CONST", "Utils", "Point","CanvasTinter","Container","Texture","Component","Core","FixedToCamera","InCamera","Overlap","LifeSpan","Smoothed","Reset"], function(CONST, Utils, Point,CanvasTinter,Container,Texture,Component,Core,FixedToCamera,InCamera,Overlap,LifeSpan,Smoothed,Reset) {
 var   tempPoint = new Point();
/**
 * 
 * 精灵对象是所有被渲染到屏幕的纹理对象的基础
 * 一个精灵可以直接通过图片创建：
 *
 * ```js
 * var sprite = new egame.Sprite.fromImage('assets/image.png');
 * ```
 *
 * @class
 * @extends egame.Container
 * @memberof egame
 * @param texture {egame.Texture} 这个精灵的纹理对象
 */
function Sprite(textureOrResourceKey)
{
    Container.call(this);
    /**
     * 锚点设置纹理的中心
     * 默认是(0,0)也就是纹理的左上角
     * (0.5,0.5)纹理的中心
     * (1,1)纹理的右下方
     *
     * @member {egame.Point}
     */
    this.anchor = new Point();

    /**
     * 精灵使用的纹理
     * @member {egame.Texture}
     * @private
     */
    this._texture = null;

    /**
     * 精灵的宽度(这个最初由纹理设置)
     * @member {number}
     * @private
     */
    this._width = 0;

    /**
     * 精灵的高度(这个最初由纹理设置)
     * @member {number}
     * @private
     */
    this._height = 0;

    /**
     *  色彩应用于精灵。这是一个16进制的值。0xFFFFFF将会移除所有色彩效果
     * @member {number}
     * @default 0xFFFFFF
     */
    this.tint = 0xFFFFFF;

    /**
     * 混合模式应用到精灵。`egame.BLEND_MODES.NORMAL`值重置混合模式
     * @member {number}
     * @default egame.BLEND_MODES.NORMAL
     * @see egame.BLEND_MODES
     */
    this.blendMode = CONST.BLEND_MODES.NORMAL;


    /**
     * 色彩的内部缓存值
     * @member {number}
     * @default 0xFFFFFF
     */
    this.cachedTint = 0xFFFFFF;
    if(egame.util.isString(textureOrResourceKey)){
        //资源名称
        this.resourceKey = textureOrResourceKey;
        //精灵纹理
        this.texture = Texture.fromResource(textureOrResourceKey).clone();
    }else if(egame.util.isObject(textureOrResourceKey)){
        this.texture = textureOrResourceKey;
    }else{
        this.texture = Texture.EMPTY.clone();
    }
    // 设置纹理

    this.physicsType = egame.SPRITE;
    egame.Component.init.call(this);

}

//构造器
Sprite.prototype = Object.create(Container.prototype);
Sprite.prototype.constructor = Sprite;

Object.defineProperties(Sprite.prototype, {
    /**
     * 精灵宽度，设置宽度的值的时候会修改缩放比例，以达到值设置
     * @member {number}
     * @memberof egame.Sprite#
     */
    width: {
        get: function ()
        {
            return Math.abs(this.scale.x) * this.texture._frame.width;
        },
        set: function (value)
        {
            var sign = utils.sign(this.scale.x) || 1;
            this.scale.x = sign * value / this.texture._frame.width;
            this._width = value;
        }
    },

    /**
     * 精灵宽度，设置高度的值的时候会修改缩放比例，以达到值设置
     * @member {number}
     * @memberof egame.Sprite#
     */
    height: {
        get: function ()
        {
            return  Math.abs(this.scale.y) * this.texture._frame.height;
        },
        set: function (value)
        {
            var sign = utils.sign(this.scale.y) || 1;
            this.scale.y = sign * value / this.texture._frame.height;
            this._height = value;
        }
    },

    /**
     * 精灵使用的纹理
     * @member {egame.Texture}
     * @memberof egame.Sprite#
     */
    texture: {
        get: function ()
        {
            return  this._texture;
        },
        set: function (value)
        {
            if (this._texture === value)
            {
                return;
            }

            this._texture = value;
            this.cachedTint = 0xFFFFFF;

            if (value)
            {
                // 等待纹理加载完成
                if (value.baseTexture.hasLoaded)
                {
                    this._onTextureUpdate();
                }
                else
                {
                    value.once('update', this._onTextureUpdate, this);
                }
            }
        }
    }
});

/**
 * 当纹理更新，这个事件会发生用来更新缩放系数和帧
 * @private
 */
Sprite.prototype._onTextureUpdate = function ()
{
    if (this._width)
    {
        this.scale.x = utils.sign(this.scale.x) * this._width / this.texture.frame.width;
    }

    if (this._height)
    {
        this.scale.y = utils.sign(this.scale.y) * this._height / this.texture.frame.height;
    }
};


/**
 * 以矩形的形式返回精灵的边界。边界的计算要考虑到全局变换(worldtransform)
 * @param matrix {egame.Matrix} sprite变换矩阵
 * @return {egame.Rectangle} 矩形框
 */
Sprite.prototype.getBounds = function (matrix)
{
    if(!this._currentBounds)
    {

        var width = this._texture._frame.width;
        var height = this._texture._frame.height;

        var w0 = width * (1-this.anchor.x);
        var w1 = width * -this.anchor.x;
        var h0 = height * (1-this.anchor.y);
        var h1 = height * -this.anchor.y;
        var worldTransform = matrix || this.worldTransform ;

        var a = worldTransform.a;
        var b = worldTransform.b;
        var c = worldTransform.c;
        var d = worldTransform.d;
        var tx = worldTransform.tx;
        var ty = worldTransform.ty;

        var minX,
            maxX,
            minY,
            maxY;
        var x1 = a * w1 + c * h1 + tx;
        var y1 = d * h1 + b * w1 + ty;

        var x2 = a * w0 + c * h1 + tx;
        var y2 = d * h1 + b * w0 + ty;

        var x3 = a * w0 + c * h0 + tx;
        var y3 = d * h0 + b * w0 + ty;

        var x4 =  a * w1 + c * h0 + tx;
        var y4 =  d * h0 + b * w1 + ty;

        minX = x1;
        minX = x2 < minX ? x2 : minX;
        minX = x3 < minX ? x3 : minX;
        minX = x4 < minX ? x4 : minX;

        minY = y1;
        minY = y2 < minY ? y2 : minY;
        minY = y3 < minY ? y3 : minY;
        minY = y4 < minY ? y4 : minY;

        maxX = x1;
        maxX = x2 > maxX ? x2 : maxX;
        maxX = x3 > maxX ? x3 : maxX;
        maxX = x4 > maxX ? x4 : maxX;

        maxY = y1;
        maxY = y2 > maxY ? y2 : maxY;
        maxY = y3 > maxY ? y3 : maxY;
        maxY = y4 > maxY ? y4 : maxY;

        //检查孩子
        if(this.children.length)
        {
            var childBounds = this.containerGetBounds();

            w0 = childBounds.x;
            w1 = childBounds.x + childBounds.width;
            h0 = childBounds.y;
            h1 = childBounds.y + childBounds.height;

            minX = (minX < w0) ? minX : w0;
            minY = (minY < h0) ? minY : h0;

            maxX = (maxX > w1) ? maxX : w1;
            maxY = (maxY > h1) ? maxY : h1;
        }

        var bounds = this._bounds;

        bounds.x = minX;
        bounds.width = maxX - minX;
        bounds.y = minY;
        bounds.height = maxY - minY;

        // 保存边界，下次就不需要再次计算了
        this._currentBounds = bounds;
    }

    return this._currentBounds;
};

/**
 * 获取精灵对象的局部边界。
 *
 */
Sprite.prototype.getLocalBounds = function ()
{   
    this._bounds.x = -this._texture._frame.width * this.anchor.x;
    this._bounds.y = -this._texture._frame.height * this.anchor.y;
    this._bounds.width = this._texture._frame.width;
    this._bounds.height = this._texture._frame.height;
    return this._bounds;
};

/**
* 测试某个点是否在精灵内部
* @param point {egame.Point}被测试的点
* @return {boolean} 测试结果
*/
Sprite.prototype.containsPoint = function( point )
{
    this.worldTransform.applyInverse(point,  tempPoint);

    var width = this._texture._frame.width;
    var height = this._texture._frame.height;
    var x1 = -width * this.anchor.x;
    var y1;

    if ( tempPoint.x > x1 && tempPoint.x < x1 + width )
    {
        y1 = -height * this.anchor.y;

        if ( tempPoint.y > y1 && tempPoint.y < y1 + height )
        {
            return true;
        }
    }

    return false;
};

/**
* 用canvas渲染器渲染对象
* @param renderer {egame.CanvasRenderer} The renderer
* @private
*/
Sprite.prototype._renderCanvas = function (renderer)
{   
    //修剪区域不存在直接返回
    if (this.texture.crop.width <= 0 || this.texture.crop.height <= 0)
    {
        return;
    }

    //设置混合模式
    var compositeOperation = renderer.blendModes[this.blendMode];
    if (compositeOperation !== renderer.context.globalCompositeOperation)
    {
        renderer.context.globalCompositeOperation = compositeOperation;
    }

    if (this.texture.valid)
    {
        var texture = this._texture,
            wt = this.worldTransform,
            dx,
            dy,
            width,
            height;

        //全局透明度
        renderer.context.globalAlpha = this.worldAlpha;

        //renderer.smoothProperty：imageSmoothingEnabled  我们需要修改平滑属性
        var smoothingEnabled = texture.baseTexture.scaleMode === CONST.SCALE_MODES.LINEAR;
        if (renderer.smoothProperty && renderer.context[renderer.smoothProperty] !== smoothingEnabled)
        {
            renderer.context[renderer.smoothProperty] = smoothingEnabled;
        }

        //如果纹理trimmed，我们要设置offset为x/y。否则使用frame的纬度
        if(texture.rotate)
        {
            width = texture.crop.height;
            height = texture.crop.width;
            dx = (texture.trim) ? texture.trim.y - this.anchor.y * texture.trim.height : this.anchor.y * -texture._frame.height;
            dy = (texture.trim) ? texture.trim.x - this.anchor.x * texture.trim.width : this.anchor.x * -texture._frame.width;
       
            dx += width;

            wt.tx = dy * wt.a + dx * wt.c + wt.tx;
            wt.ty = dy * wt.b + dx * wt.d + wt.ty;

            var temp = wt.a;
            wt.a  = -wt.c;
            wt.c  =  temp;

            temp = wt.b;
            wt.b  = -wt.d;
            wt.d  =  temp;

            // 中心位置已经应用过，现在设置为0
            dx = 0;
            dy = 0;

        }
        else
        {
            width = texture.crop.width;
            height = texture.crop.height;

            dx = (texture.trim) ? texture.trim.x - this.anchor.x * texture.trim.width : this.anchor.x * -texture._frame.width;
            dy = (texture.trim) ? texture.trim.y - this.anchor.y * texture.trim.height : this.anchor.y * -texture._frame.height;
        }



        // 像素进行floor操作，不允许小数点,对context进行变换
        if (renderer.roundPixels)
        {
            renderer.context.setTransform(
                wt.a,
                wt.b,
                wt.c,
                wt.d,
                (wt.tx * renderer.resolution) | 0,
                (wt.ty * renderer.resolution) | 0
            );

            dx = dx | 0;
            dy = dy | 0;
        }
        else
        {

            renderer.context.setTransform(
                wt.a,
                wt.b,
                wt.c,
                wt.d,
                wt.tx * renderer.resolution,
                wt.ty * renderer.resolution
            );
        }

        var resolution = texture.baseTexture.resolution;

        if (this.tint !== 0xFFFFFF)
        {
            //对纹理着色
            if (this.cachedTint !== this.tint)
            {
                this.cachedTint = this.tint;

                //着色后的纹理
                this.tintedTexture = CanvasTinter.getTintedTexture(this, this.tint);
            }

            renderer.context.drawImage(
                this.tintedTexture,
                0,   //裁剪
                0,
                width * resolution,
                height * resolution,
                dx * renderer.resolution,//画布
                dy * renderer.resolution,
                width * renderer.resolution,
                height * renderer.resolution
            );
        }
        else
        { 
            renderer.context.drawImage(
                texture.baseTexture.source,
                texture.crop.x * resolution,  //裁剪原图
                texture.crop.y * resolution,
                width * resolution,
                height * resolution,
                dx  * renderer.resolution,
                dy  * renderer.resolution,
                width * renderer.resolution,
                height * renderer.resolution
            );
        }
    }
};

/**
 * 销毁精灵和可选是否销毁纹理
 * @param [destroyTexture=false] {boolean} true销毁纹理
 */
Sprite.prototype.destroy = function (destroyTexture, destroyBaseTexture)
{
    Container.prototype.destroy.call(this);

    this.anchor = null;

    if (destroyTexture)
    {
        this._texture.destroy(destroyBaseTexture);
    }

    this._texture = null;
    this.shader = null;
};


/**
 * 创建一个精灵，他将包含一个基于帧id的纹理
 * 这个id在纹理包文件加载时候创建
 * @static
 * @param frameId {string} 帧id
 */
Sprite.fromFrame = function (frameId)
{
    var texture = utils.TextureCache[frameId];

    if (!texture)
    {
        throw new Error('The frameId "' + frameId + '" does not exist in the texture cache');
    }

    return new Sprite(texture);
};

/**
 * 创建一个精灵，他将包含一个基于图片url的纹理
 * 如果图片在纹理缓存中，将会被加载
 * @static
 * @param imageId {string} 纹理的图片url
 * @return {egame.Sprite} 
 */
Sprite.fromImage = function (imageId, crossorigin, scaleMode)
{
    return new Sprite(Texture.fromImage(imageId, crossorigin, scaleMode));
};
    Component.install.call(Sprite.prototype,["Core","FixedToCamera","InCamera","Overlap","LifeSpan","Smoothed","Reset"]);
    egame.Sprite = Sprite;
    return Sprite;
});