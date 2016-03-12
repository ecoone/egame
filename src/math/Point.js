egame.define("Point", function() {
    /**
     * The Point object represents a location in a two-dimensional coordinate system, where x represents
     * the horizontal axis and y represents the vertical axis.
     *
     * @class
     * @memberof egame
     * @param [x=0] {number} position of the point on the x axis
     * @param [y=0] {number} position of the point on the y axis
     */
    function Point(x, y)
    {
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
    }

    Point.prototype.constructor = Point;

    /**
     * Creates a clone of this point
     *
     * @return {egame.Point} a copy of the point
     */
    Point.prototype.clone = function ()
    {
        return new Point(this.x, this.y);
    };

    /**
     * Copies x and y from the given point
     *
     * @param p {egame.Point}
     */
    Point.prototype.copy = Point.prototype.copyFrom = function (p) {
        this.set(p.x, p.y);
    };

    /**
    * 点的x，y坐标与传入的坐标相乘
    * @method egame.Point#multiply
    * @param {number} x - The value to multiply Point.x by.
    * @param {number} y - The value to multiply Point.x by.
    * @return {egame.Point} This Point object. Useful for chaining method calls.
    */
    Point.prototype.multiply = function (x, y) {

        this.x *= x;
        this.y *= y;
        return this;

    },

    /**
     * Returns true if the given point is equal to this point
     *
     * @param p {egame.Point}
     * @returns {boolean}
     */
    Point.prototype.equals = function (p) {
        return (p.x === this.x) && (p.y === this.y);
    };

    /**
     * Sets the point to a new x and y position.
     * If y is omitted, both x and y will be set to x.
     *
     * @param [x=0] {number} position of the point on the x axis
     * @param [y=0] {number} position of the point on the y axis
     */
    Point.prototype.set = Point.prototype.setTo = function (x, y)
    {
        this.x = x || 0;
        this.y = y || ( (y !== 0) ? this.x : 0 ) ;
    };
    egame.Point = Point;
    return Point;
});
