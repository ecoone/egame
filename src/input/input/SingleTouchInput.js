egame.define("SingleTouchInput", ["InputUtils", "Input"], function(InputUtils, Input) {
    var SINGLE_TOUCH_INPUT_MAP = {
        touchstart: Input.INPUT_START,
        touchmove: Input.INPUT_MOVE,
        touchend: Input.INPUT_END,
        touchcancel: Input.INPUT_CANCEL
    };

    var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
    var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';

    /**
     * Touch events input
     * @constructor
     * @extends Input
     */
    function SingleTouchInput() {
        this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
        this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
        this.started = false;

        Input.apply(this, arguments);
    }

    InputUtils.inherit(SingleTouchInput, Input, {
        handler: function TEhandler(ev) {
            var type = SINGLE_TOUCH_INPUT_MAP[ev.type];

            // should we handle the touch events?
            if (type === Input.INPUT_START) {
                this.started = true;
            }

            if (!this.started) {
                return;
            }

            var touches = normalizeSingleTouches.call(this, ev, type);

            // when done, reset the started state
            if (type & (Input.INPUT_END | Input.INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
                this.started = false;
            }

            this.callback(this.manager, type, {
                pointers: touches[0],
                changedPointers: touches[1],
                pointerType: Input.INPUT_TYPE_TOUCH,
                srcEvent: ev
            });
        }
    });

    /**
     * @this {TouchInput}
     * @param {Object} ev
     * @param {Number} type flag
     * @returns {undefined|Array} [all, changed]
     */
    function normalizeSingleTouches(ev, type) {
        var all = InputUtils.toArray(ev.touches);
        var changed = InputUtils.toArray(ev.changedTouches);

        if (type & (Input.INPUT_END | Input.INPUT_CANCEL)) {
            all = InputUtils.uniqueArray(all.concat(changed), 'identifier', true);
        }

        return [all, changed];
    }

    egame.SingleTouchInput = SingleTouchInput;
    return SingleTouchInput;
});