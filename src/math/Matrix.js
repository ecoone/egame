egame.define("Matrix",["Point"],function(Point) {
    /**
     * 矩阵操作类
     * 形式如下:
     * | a | b | tx|
     * | c | d | ty|
     * | 0 | 0 | 1 |
     *
     * @class
     * @memberof egame
     */
    function Matrix()
    {
        /**
         * @member {number}
         * @default 1
         */
        this.a = 1;

        /**
         * @member {number}
         * @default 0
         */
        this.b = 0;

        /**
         * @member {number}
         * @default 0
         */
        this.c = 0;

        /**
         * @member {number}
         * @default 1
         */
        this.d = 1;

        /**
         * @member {number}
         * @default 0
         */
        this.tx = 0;

        /**
         * @member {number}
         * @default 0
         */
        this.ty = 0;
    }

    Matrix.prototype.constructor = Matrix;

    /**
     * 通过数组创建矩阵，对象关系如下：
     * a = array[0]
     * b = array[1]
     * c = array[3]
     * d = array[4]
     * tx = array[2]
     * ty = array[5]
     *
     * @param array {number[]} 填充矩阵的数组
     */
    Matrix.prototype.fromArray = function (array)
    {
        this.a = array[0];
        this.b = array[1];
        this.c = array[3];
        this.d = array[4];
        this.tx = array[2];
        this.ty = array[5];
    };


    /**
     * 设置矩阵的属性
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @param {number} tx
     * @param {number} ty
     *
     * @return {egame.Matrix} 返回这个矩阵以便支持链式操作
     */
    Matrix.prototype.set = function (a, b, c, d, tx, ty)
    {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;

        return this;
    };


    /**
     * 从这个矩阵生成一个数组
     * @param transpose {boolean} 是否需要颠倒,false或者不传是按照列存储，颠倒则按行存储
     * @param [out] {Array} 如果提供了out数组，那么矩阵学校将存入这个数组终
     * @return {number[]} 包含这个矩阵信息的数组
     */
    Matrix.prototype.toArray = function (transpose, out)
    {
        if (!this.array)
        {
            this.array = new Float32Array(9);
        }

        var array = out || this.array;

        if (transpose)
        {
            array[0] = this.a;
            array[1] = this.b;
            array[2] = 0;
            array[3] = this.c;
            array[4] = this.d;
            array[5] = 0;
            array[6] = this.tx;
            array[7] = this.ty;
            array[8] = 1;
        }
        else
        {
            array[0] = this.a;
            array[1] = this.c;
            array[2] = this.tx;
            array[3] = this.b;
            array[4] = this.d;
            array[5] = this.ty;
            array[6] = 0;
            array[7] = 0;
            array[8] = 1;
        }

        return array;
    };

    /**
     * 对传入的点应用当前矩阵变换，得到变换后的点
     * 这个可以用于将局部坐标空间转换成全局坐标空间
     *
     * @param pos {egame.Point} 原始的点
     * @param [newPos] {egame.Point} 新位置将指定到的传入的点（允许为原始点）
     * @return {egame.Point} 通过矩阵变换获取的新的点
     */
    Matrix.prototype.apply = function (pos, newPos)
    {
        newPos = newPos || new Point();

        var x = pos.x;
        var y = pos.y;

        newPos.x = this.a * x + this.c * y + this.tx;
        newPos.y = this.b * x + this.d * y + this.ty;

        return newPos;
    };

    /**
     * 对传入的点应用当前矩阵的逆矩阵变换，得到变换后的点，这个点在由apply变换变可得到，
     * 当前点，用的是可逆矩阵相乘是1的原理
     * 用于从全局坐标系转换到局部坐标系
     * @param pos {egame.Point} 原始点
     * @param [newPos] {egame.Point} 新位置将指定到的传入的点（允许为原始点）
     * @return {egame.Point} 通过逆矩阵变换获取的新的点
     */
    Matrix.prototype.applyInverse = function (pos, newPos)
    {
        newPos = newPos || new Point();

        var id = 1 / (this.a * this.d + this.c * -this.b);

        var x = pos.x;
        var y = pos.y;

        newPos.x = this.d * id * x + -this.c * id * y + (this.ty * this.c - this.tx * this.d) * id;
        newPos.y = this.a * id * y + -this.b * id * x + (-this.ty * this.a + this.tx * this.b) * id;

        return newPos;
    };

    /**
     * 移动矩阵
     * @param {number} x
     * @param {number} y
     * @return {egame.Matrix} 当前矩阵，以便链式操作.
     */
    Matrix.prototype.translate = function (x, y)
    {
        this.tx += x;
        this.ty += y;

        return this;
    };

    /**
     * 对当前矩阵应用缩放
     * @param {number} x 水平缩放
     * @param {number} y 垂直缩放
     * @return {egame.Matrix} 当前矩阵，以便链式操作.
     */
    Matrix.prototype.scale = function (x, y)
    {
        this.a *= x;
        this.d *= y;
        this.c *= x;
        this.b *= y;
        this.tx *= x;
        this.ty *= y;

        return this;
    };


    /**
     * 给这个矩阵应用旋转变换
     * @param {number} angle - 旋转的角度。
     * @return {egame.Matrix} 当前矩阵，以便链式操作.
     */
    Matrix.prototype.rotate = function (angle)
    {
        var cos = Math.cos( angle );
        var sin = Math.sin( angle );

        var a1 = this.a;
        var c1 = this.c;
        var tx1 = this.tx;

        this.a = a1 * cos-this.b * sin;
        this.b = a1 * sin+this.b * cos;
        this.c = c1 * cos-this.d * sin;
        this.d = c1 * sin+this.d * cos;
        this.tx = tx1 * cos - this.ty * sin;
        this.ty = tx1 * sin + this.ty * cos;

        return this;
    };

    /**
     * 将传入的矩阵附加到当前矩阵
     * currentMatrix*matrix
     * @param {egame.Matrix} matrix
     * @return {egame.Matrix} 当前矩阵，以便链式操作.
     */
    Matrix.prototype.append = function (matrix)
    {
        var a1 = this.a;
        var b1 = this.b;
        var c1 = this.c;
        var d1 = this.d;

        this.a  = matrix.a * a1 + matrix.b * c1;
        this.b  = matrix.a * b1 + matrix.b * d1;
        this.c  = matrix.c * a1 + matrix.d * c1;
        this.d  = matrix.c * b1 + matrix.d * d1;

        this.tx = matrix.tx * a1 + matrix.ty * c1 + this.tx;
        this.ty = matrix.tx * b1 + matrix.ty * d1 + this.ty;

        return this;
    };

    /**
     * 基于所有属性设置矩阵
     * @param {number} x
     * @param {number} y
     * @param {number} pivotX 中心点的x坐标
     * @param {number} pivotY 中心点的y坐标
     * @param {number} scaleX
     * @param {number} scaleY
     * @param {number} rotation
     * @param {number} skewX
     * @param {number} skewY
     *
     * @return {egame.Matrix} 返回当前矩阵以便链式操作
     */
    Matrix.prototype.setTransform = function (x, y, pivotX, pivotY, scaleX, scaleY, rotation, skewX, skewY)
    {
        var a, b, c, d, sr, cr, cy, sy, nsx, cx;

        sr  = Math.sin(rotation);
        cr  = Math.cos(rotation);
        cy  = Math.cos(skewY);
        sy  = Math.sin(skewY);
        nsx = -Math.sin(skewX);
        cx  =  Math.cos(skewX);

        a  =  cr * scaleX;
        b  =  sr * scaleX;
        c  = -sr * scaleY;
        d  =  cr * scaleY;

        this.a  = cy * a + sy * c;
        this.b  = cy * b + sy * d;
        this.c  = nsx * a + cx * c;
        this.d  = nsx * b + cx * d;

        this.tx = x + ( pivotX * a + pivotY * c );
        this.ty = y + ( pivotX * b + pivotY * d );

        return this;
    };

    /**
     * 将传入的矩阵加到当前矩阵的前面
     * @param {egame.Matrix} matrix
     * @return {egame.Matrix} 当前矩阵，以便链式操作.
     */
    Matrix.prototype.prepend = function(matrix)
    {
        var tx1 = this.tx;

        if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1)
        {
            var a1 = this.a;
            var c1 = this.c;
            this.a  = a1*matrix.a+this.b*matrix.c;
            this.b  = a1*matrix.b+this.b*matrix.d;
            this.c  = c1*matrix.a+this.d*matrix.c;
            this.d  = c1*matrix.b+this.d*matrix.d;
        }

        this.tx = tx1*matrix.a+this.ty*matrix.c+matrix.tx;
        this.ty = tx1*matrix.b+this.ty*matrix.d+matrix.ty;

        return this;
    };

    /**
     * 转置当前矩阵
     *
     * @return {egame.Matrix} 当前矩阵，以便链式操作.
     */
    Matrix.prototype.invert = function()
    {
        var a1 = this.a;
        var b1 = this.b;
        var c1 = this.c;
        var d1 = this.d;
        var tx1 = this.tx;
        var n = a1*d1-b1*c1;

        this.a = d1/n;
        this.b = -b1/n;
        this.c = -c1/n;
        this.d = a1/n;
        this.tx = (c1*this.ty-d1*tx1)/n;
        this.ty = -(a1*this.ty-b1*tx1)/n;

        return this;
    };


    /**
     * 归一化矩阵
     * @return {egame.Matrix} 当前矩阵，以便链式操作.
     */
    Matrix.prototype.identity = function ()
    {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.tx = 0;
        this.ty = 0;

        return this;
    };

    /**
     * 克隆一个新的矩阵
     * @return {egame.Matrix} 返回克隆出的矩阵以便链式操作
     */
    Matrix.prototype.clone = function ()
    {
        var matrix = new Matrix();
        matrix.a = this.a;
        matrix.b = this.b;
        matrix.c = this.c;
        matrix.d = this.d;
        matrix.tx = this.tx;
        matrix.ty = this.ty;

        return matrix;
    };

    /**
     * 改变当前矩阵的值为传入矩阵的值
     * @return {egame.Matrix} 当前矩阵，以便链式操作.
     */
    Matrix.prototype.copy = function (matrix)
    {
        matrix.a = this.a;
        matrix.b = this.b;
        matrix.c = this.c;
        matrix.d = this.d;
        matrix.tx = this.tx;
        matrix.ty = this.ty;

        return matrix;
    };

    /**
     * 默认矩阵（归一化矩阵）
     * 
     * @static
     * @const
     */
    Matrix.IDENTITY = new Matrix();

    /**
     * 一个零时的矩阵
     * @static
     * @const
     */
    Matrix.TEMP_MATRIX = new Matrix();
    
    egame.Matrix = Matrix;
    return Matrix;

});
