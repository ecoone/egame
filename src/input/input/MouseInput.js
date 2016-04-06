egame.define("MouseInput", ["InputUtils", "Input"], function(InputUtils,Input) {
    var MOUSE_INPUT_MAP = {
        mousedown: Input.INPUT_START,
        mousemove: Input.INPUT_MOVE,
        mouseup: Input.INPUT_END
    };

    var MOUSE_ELEMENT_EVENTS = 'mousedown';
    var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

    /**
     * Mouse events input
     * @constructor
     * @extends Input
     */
    function MouseInput() {
        this.evEl = MOUSE_ELEMENT_EVENTS;
        this.evWin = MOUSE_WINDOW_EVENTS;

        this.allow = true; // used by Input.TouchMouse to disable mouse events
        this.pressed = false; // mousedown state

        Input.apply(this, arguments);
    }

    InputUtils.inherit(MouseInput, Input, {
        /**
         * handle mouse events
         * @param {Object} ev
         */
        handler: function MEhandler(ev) {
            var eventType = MOUSE_INPUT_MAP[ev.type];

            // on start we want to have the left mouse button down
            if (eventType & Input.INPUT_START && ev.button === 0) {
                this.pressed = true;
            }

            if (eventType & Input.INPUT_MOVE && ev.which !== 1) {
                eventType = Input.INPUT_END;
            }

            // mouse must be down, and mouse events are allowed (see the TouchMouse input)
            if (!this.pressed || !this.allow) {
                return;
            }

            if (eventType & Input.INPUT_END) {
                this.pressed = false;
            }

            this.callback(this.manager, eventType, {
                pointers: [ev],
                changedPointers: [ev],
                pointerType: Input.INPUT_TYPE_MOUSE,
                srcEvent: ev
            });
        }
    });

    egame.MouseInput = MouseInput;
    return MouseInput;
});