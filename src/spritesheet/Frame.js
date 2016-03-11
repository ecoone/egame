egame.define("Frame", function() {
    
    function distance(x1, y1, x2, y2) {
        var dx = x1 - x2;
        var dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }
    /**
     * @author       Richard Davey <rich@photonstorm.com>
     * @copyright    2015 Photon Storm Ltd.
     * @license      {@link https://github.com/photonstorm/phaser/blob/master/license.txt|MIT License}
     */

    /**
     * A Frame is a single frame of an animation and is part of a FrameData collection.
     *
     * @class egame.Frame
     * @constructor
     * @param {number} index - The index of this Frame within the FrameData set it is being added to.
     * @param {number} x - X position of the frame within the texture image.
     * @param {number} y - Y position of the frame within the texture image.
     * @param {number} width - Width of the frame within the texture image.
     * @param {number} height - Height of the frame within the texture image.
     * @param {string} name - The name of the frame. In Texture Atlas data this is usually set to the filename.
     */
    egame.Frame = function(index, x, y, width, height, name) {

        /**
         * @property {number} index - The index of this Frame within the FrameData set it is being added to.
         */
        this.index = index;

        /**
         * @property {number} x - X position within the image to cut from.
         */
        this.x = x;

        /**
         * @property {number} y - Y position within the image to cut from.
         */
        this.y = y;

        /**
         * @property {number} width - Width of the frame.
         */
        this.width = width;

        /**
         * @property {number} height - Height of the frame.
         */
        this.height = height;

        /**
         * @property {string} name - Useful for Texture Atlas files (is set to the filename value).
         */
        this.name = name;

        /**
         * @property {number} centerX - Center X position within the image to cut from.
         */
        this.centerX = Math.floor(width / 2);

        /**
         * @property {number} centerY - Center Y position within the image to cut from.
         */
        this.centerY = Math.floor(height / 2);

        /**
         * @property {number} distance - The distance from the top left to the bottom-right of this Frame.
         */
        this.distance = distance(0, 0, width, height);

        /**
         * @property {boolean} rotated - Rotated? (not yet implemented)
         * @default
         */
        this.rotated = false;

        /**
         * @property {string} rotationDirection - Either 'cw' or 'ccw', rotation is always 90 degrees.
         * @default 'cw'
         */
        this.rotationDirection = 'cw';

        /**
         * @property {boolean} trimmed - Was it trimmed when packed?
         * @default
         */
        this.trimmed = false;

        /**
         * @property {number} sourceSizeW - Width of the original sprite before it was trimmed.
         */
        this.sourceSizeW = width;

        /**
         * @property {number} sourceSizeH - Height of the original sprite before it was trimmed.
         */
        this.sourceSizeH = height;

        /**
         * @property {number} spriteSourceSizeX - X position of the trimmed sprite inside original sprite.
         * @default
         */
        this.spriteSourceSizeX = 0;

        /**
         * @property {number} spriteSourceSizeY - Y position of the trimmed sprite inside original sprite.
         * @default
         */
        this.spriteSourceSizeY = 0;

        /**
         * @property {number} spriteSourceSizeW - Width of the trimmed sprite.
         * @default
         */
        this.spriteSourceSizeW = 0;

        /**
         * @property {number} spriteSourceSizeH - Height of the trimmed sprite.
         * @default
         */
        this.spriteSourceSizeH = 0;

        /**
         * @property {number} right - The right of the Frame (x + width).
         */
        this.right = this.x + this.width;

        /**
         * @property {number} bottom - The bottom of the frame (y + height).
         */
        this.bottom = this.y + this.height;

    };

    egame.Frame.prototype = {

        /**
         * Adjusts of all the Frame properties based on the given width and height values.
         *
         * @method egame.Frame#resize
         * @param {integer} width - The new width of the Frame.
         * @param {integer} height - The new height of the Frame.
         */
        resize: function(width, height) {

            this.width = width;
            this.height = height;
            this.centerX = Math.floor(width / 2);
            this.centerY = Math.floor(height / 2);
            this.distance = egame.Math.distance(0, 0, width, height);
            this.sourceSizeW = width;
            this.sourceSizeH = height;
            this.right = this.x + width;
            this.bottom = this.y + height;

        },

        /**
         * If the frame was trimmed when added to the Texture Atlas this records the trim and source data.
         *
         * @method egame.Frame#setTrim
         * @param {boolean} trimmed - If this frame was trimmed or not.
         * @param {number} actualWidth - The width of the frame before being trimmed.
         * @param {number} actualHeight - The height of the frame before being trimmed.
         * @param {number} destX - The destination X position of the trimmed frame for display.
         * @param {number} destY - The destination Y position of the trimmed frame for display.
         * @param {number} destWidth - The destination width of the trimmed frame for display.
         * @param {number} destHeight - The destination height of the trimmed frame for display.
         */
        setTrim: function(trimmed, actualWidth, actualHeight, destX, destY, destWidth, destHeight) {

            this.trimmed = trimmed;

            if (trimmed) {
                this.sourceSizeW = actualWidth;
                this.sourceSizeH = actualHeight;
                this.centerX = Math.floor(actualWidth / 2);
                this.centerY = Math.floor(actualHeight / 2);
                this.spriteSourceSizeX = destX;
                this.spriteSourceSizeY = destY;
                this.spriteSourceSizeW = destWidth;
                this.spriteSourceSizeH = destHeight;
            }

        },

        /**
         * Clones this Frame into a new egame.Frame object and returns it.
         * Note that all properties are cloned, including the name, index and UUID.
         *
         * @method egame.Frame#clone
         * @return {egame.Frame} An exact copy of this Frame object.
         */
        clone: function() {

            var output = new egame.Frame(this.index, this.x, this.y, this.width, this.height, this.name);

            for (var prop in this) {
                if (this.hasOwnProperty(prop)) {
                    output[prop] = this[prop];
                }
            }

            return output;

        },

        /**
         * Returns a Rectangle set to the dimensions of this Frame.
         *
         * @method egame.Frame#getRect
         * @param {egame.Rectangle} [out] - A rectangle to copy the frame dimensions to.
         * @return {egame.Rectangle} A rectangle.
         */
        getRect: function(out) {

            if (out === undefined) {
                out = new egame.Rectangle(this.x, this.y, this.width, this.height);
            } else {
                out.setTo(this.x, this.y, this.width, this.height);
            }

            return out;

        }

    };

    egame.Frame.prototype.constructor = egame.Frame;

    return egame.Frame;
});