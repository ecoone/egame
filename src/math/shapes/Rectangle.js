egame.define("Rectangle", ["CONST"], function(CONST) {

    /**
     * the Rectangle object is an area defined by its position, as indicated by its top-left corner point (x, y) and by its width and its height.
     *
     * @class
     * @memberof egame
     * @param x {number} The X coordinate of the upper-left corner of the rectangle
     * @param y {number} The Y coordinate of the upper-left corner of the rectangle
     * @param width {number} The overall width of this rectangle
     * @param height {number} The overall height of this rectangle
     */
    function Rectangle(x, y, width, height) {
        /**
         * @member {number}
         * @default 0
         */
        this.x = x || 0;

        /**
         * @member {number}
         * @default 0
         */
        this.y = y || 0;

        /**
         * @member {number}
         * @default 0
         */
        this.width = width || 0;

        /**
         * @member {number}
         * @default 0
         */
        this.height = height || 0;

        /**
         * The type of the object, mainly used to avoid `instanceof` checks
         *
         * @member {number}
         */
        this.type = CONST.SHAPES.RECT;
    }

    Rectangle.prototype.constructor = Rectangle;

    /**
     * A constant empty rectangle.
     *
     * @static
     * @constant
     */
    Rectangle.EMPTY = new Rectangle(0, 0, 0, 0);


    /**
     * Creates a clone of this Rectangle
     *
     * @return {egame.Rectangle} a copy of the rectangle
     */
    Rectangle.prototype.clone = function() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    };

    /**
     * Checks whether the x and y coordinates given are contained within this Rectangle
     *
     * @param x {number} The X coordinate of the point to test
     * @param y {number} The Y coordinate of the point to test
     * @return {boolean} Whether the x/y coordinates are within this Rectangle
     */
    Rectangle.prototype.contains = function(x, y) {
        if (this.width <= 0 || this.height <= 0) {
            return false;
        }

        if (x >= this.x && x < this.x + this.width) {
            if (y >= this.y && y < this.y + this.height) {
                return true;
            }
        }

        return false;
    };

    /**
    * 设置矩形为给定的值
    * @method egame.Rectangle#setTo
    * @param {number} x - 矩形的x坐标
    * @param {number} y - 矩形的y坐标
    * @param {number} width - 矩形的宽度
    * @param {number} height - 矩形的高度
    * @return {egame.Rectangle} 矩形对象
    */
    Rectangle.prototype.setTo =function (x, y, width, height) {

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        return this;

    };

    /**
    * 从给定的矩形拷贝x,y,width,height
    * @method egame.Rectangle#copyFrom
    * @param {any} source - 拷贝矩形对象
    * @return {egame.Rectangle} 矩形对象
    */
    Rectangle.prototype.copyFrom =function (source) {

        return this.setTo(source.x, source.y, source.width, source.height);

    },


    /**
     * 矩形坐标向下
     */
    Rectangle.prototype.floor = function() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
    };

    /**
     * 矩形相交测试
     */
    Rectangle.prototype.intersects = function(b) {
        return Rectangle.intersects(this, b);
    };
    Rectangle.intersects = function (a, b) {

        if (a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0)
        {
            return false;
        }

        return !(a.right < b.x || a.bottom < b.y || a.x > b.right || a.y > b.bottom);

    };
    /**
     *@property {number} bottom  矩形底部y坐标
     */
    Object.defineProperty(Rectangle.prototype, "bottom", {

        get: function () {
            return this.y + this.height;
        },

        set: function (value) {

            if (value <= this.y)
            {
                this.height = 0;
            }
            else
            {
                this.height = value - this.y;
            }

        }

    });

    /**
     *@property {number} top  矩形顶部y坐标
     */
    Object.defineProperty(Rectangle.prototype, "top", {

        get: function() {
            return this.y;
        },

        set: function(value) {
            if (value >= this.bottom) {
                this.height = 0;
                this.y = value;
            } else {
                this.height = (this.bottom - value);
            }
        }

    });

    /**
     *@property {number} left  矩形左侧x坐标
     */
    Object.defineProperty(Rectangle.prototype, "left", {

        get: function () {
            return this.x;
        },

        set: function (value) {
            if (value >= this.right) {
                this.width = 0;
            } else {
                this.width = this.right - value;
            }
            this.x = value;
        }

    });

    /**
     *@property {number} left  矩形右侧x坐标
     */
    Object.defineProperty(Rectangle.prototype, "right", {

        get: function () {
            return this.x + this.width;
        },

        set: function (value) {
            if (value <= this.x) {
                this.width = 0;
            } else {
                this.width = value - this.x;
            }
        }

    });

    /**
    * @name Phaser.Rectangle#halfWidth
    * @property {number} halfWidth - 矩形宽度的一半
    * @readonly
    */
    Object.defineProperty(Rectangle.prototype, "halfWidth", {

        get: function () {
            return Math.round(this.width / 2);
        }

    });

    /**
    * @name Phaser.Rectangle#halfHeight
    * @property {number} halfHeight - 矩形高度的一半
    * @readonly
    */
    Object.defineProperty(Rectangle.prototype, "halfHeight", {

        get: function () {
            return Math.round(this.height / 2);
        }

    });

    egame.Rectangle = Rectangle;
    return Rectangle;

});