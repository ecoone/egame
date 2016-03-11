egame.define("CanvasBuffer", function() {
/**
 * 创建一个给定尺寸的canvas元素
 * @class
 * @memberof egame
 * @param width {number} canvas宽度
 * @param height {number} canvas高度
 */
function CanvasBuffer(width, height)
{
    /**
     * 画布对象属于CanvasBuffer
     * @member {HTMLCanvasElement}
     */
    this.canvas = document.createElement('canvas');

    /**
     * CanvasRenderingContext2D对象，2d渲染环境
     *
     * @member {CanvasRenderingContext2D}
     */
    this.context = this.canvas.getContext('2d');

    this.canvas.width = width;
    this.canvas.height = height;
}

CanvasBuffer.prototype.constructor = CanvasBuffer;

Object.defineProperties(CanvasBuffer.prototype, {
    /**
     * canvas缓存的宽度
     *
     * @member {number}
     * @memberof egame.CanvasBuffer#
     */
    width: {
        get: function ()
        {
            return this.canvas.width;
        },
        set: function (val)
        {
            this.canvas.width = val;
        }
    },
    /**
     * canvas缓存的高度
     *
     * @member {number}
     * @memberof egame.CanvasBuffer#
     */
    height: {
        get: function ()
        {
            return this.canvas.height;
        },
        set: function (val)
        {
            this.canvas.height = val;
        }
    }
});

/**
 * 清空CanvasBuffer创建的画布
 */
CanvasBuffer.prototype.clear = function ()
{
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
};

/**
 * 重置canvas到指定的高度和宽度
 * @param width {number} 画布的宽度
 * @param height {number} 画布的高度
 */
CanvasBuffer.prototype.resize = function (width, height)
{
    this.canvas.width = width;
    this.canvas.height = height;
};

/**
 * 销毁这个canvas
 *
 */
CanvasBuffer.prototype.destroy = function ()
{
    this.context = null;
    this.canvas = null;
};

    egame.CanvasBuffer = CanvasBuffer;
    return CanvasBuffer;
});