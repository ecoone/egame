egame.define("Swipe", ["AttrRecognizer","Input","InputUtils"], function(AttrRecognizer,Input,InputUtils) {

    /**
     * Swipe
     * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
     * @constructor
     * @extends AttrRecognizer
     */
    function Swipe() {
        AttrRecognizer.apply(this, arguments);
    }

    InputUtils.inherit(Swipe, AttrRecognizer, {
        /**
         * @namespace
         * @memberof Swipe
         */
        defaults: {
            event: 'swipe',
            threshold: 10,
            velocity: 0.3,
            direction: Input.DIRECTION_HORIZONTAL | Input.DIRECTION_VERTICAL,
            pointers: 1
        },

        getTouchAction: function() {
            return Pan.prototype.getTouchAction.call(this);
        },

        attrTest: function(input) {
            var direction = this.options.direction;
            var velocity;

            if (direction & (Input.DIRECTION_HORIZONTAL | Input.DIRECTION_VERTICAL)) {
                velocity = input.overallVelocity;
            } else if (direction & Input.DIRECTION_HORIZONTAL) {
                velocity = input.overallVelocityX;
            } else if (direction & Input.DIRECTION_VERTICAL) {
                velocity = input.overallVelocityY;
            }

            return this._super.attrTest.call(this, input) &&
                direction & input.offsetDirection &&
                input.distance > this.options.threshold &&
                input.maxPointers == this.options.pointers &&
                abs(velocity) > this.options.velocity && input.eventType & Input.INPUT_END;
        },

        emit: function(input) {
            var direction = directionStr(input.offsetDirection);
            if (direction) {
                this.manager.emit(this.options.event + direction, input);
            }

            this.manager.emit(this.options.event, input);
        }
    });
    egame.Swipe = Swipe;
    return Swipe;
});