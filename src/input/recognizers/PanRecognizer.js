egame.define("Pan", ["AttrRecognizer","Input","InputUtils"], function(AttrRecognizer,Input,InputUtils) {

    /**
     * Pan
     * Recognized when the pointer is down and moved in the allowed direction.
     * @constructor
     * @extends AttrRecognizer
     */
    function Pan() {
        AttrRecognizer.apply(this, arguments);

        this.pX = null;
        this.pY = null;
    }

    InputUtils.inherit(Pan, AttrRecognizer, {
        /**
         * @namespace
         * @memberof Pan
         */
        defaults: {
            event: 'pan',
            threshold: 10,
            pointers: 1,
            direction: Input.DIRECTION_ALL
        },

        getTouchAction: function() {
            var direction = this.options.direction;
            var actions = [];
            if (direction & Input.DIRECTION_HORIZONTAL) {
                actions.push(TOUCH_ACTION_PAN_Y);
            }
            if (direction & Input.DIRECTION_VERTICAL) {
                actions.push(TOUCH_ACTION_PAN_X);
            }
            return actions;
        },

        directionTest: function(input) {
            var options = this.options;
            var hasMoved = true;
            var distance = input.distance;
            var direction = input.direction;
            var x = input.deltaX;
            var y = input.deltaY;

            // lock to axis?
            if (!(direction & options.direction)) {
                if (options.direction & Input.DIRECTION_HORIZONTAL) {
                    direction = (x === 0) ? Input.DIRECTION_NONE : (x < 0) ? Input.DIRECTION_LEFT : Input.DIRECTION_RIGHT;
                    hasMoved = x != this.pX;
                    distance = Math.abs(input.deltaX);
                } else {
                    direction = (y === 0) ? Input.DIRECTION_NONE : (y < 0) ? Input.DIRECTION_UP : Input.DIRECTION_DOWN;
                    hasMoved = y != this.pY;
                    distance = Math.abs(input.deltaY);
                }
            }
            input.direction = direction;
            return hasMoved && distance > options.threshold && direction & options.direction;
        },

        attrTest: function(input) {
            return AttrRecognizer.prototype.attrTest.call(this, input) &&
                (this.state & Recognizer.STATE_BEGAN || (!(this.state & Recognizer.STATE_BEGAN) && this.directionTest(input)));
        },

        emit: function(input) {

            this.pX = input.deltaX;
            this.pY = input.deltaY;

            var direction = directionStr(input.direction);

            if (direction) {
                input.additionalEvent = this.options.event + direction;
            }
            this._super.emit.call(this, input);
        }
    });

    egame.Pan = Pan;
    return Pan;
});