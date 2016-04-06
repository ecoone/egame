egame.define("AttrRecognizer", ["Recognizer","Input","InputUtils"], function(Recognizer,Input,InputUtils) {
    /**
     * This recognizer is just used as a base for the simple attribute recognizers.
     * @constructor
     * @extends Recognizer
     */
    function AttrRecognizer() {
        Recognizer.apply(this, arguments);
    }

    InputUtils.inherit(AttrRecognizer, Recognizer, {
        /**
         * @namespace
         * @memberof AttrRecognizer
         */
        defaults: {
            /**
             * @type {Number}
             * @default 1
             */
            pointers: 1
        },

        /**
         * Used to check if it the recognizer receives valid input, like input.distance > 10.
         * @memberof AttrRecognizer
         * @param {Object} input
         * @returns {Boolean} recognized
         */
        attrTest: function(input) {
            var optionPointers = this.options.pointers;
            return optionPointers === 0 || input.pointers.length === optionPointers;
        },

        /**
         * Process the input and return the state for the recognizer
         * @memberof AttrRecognizer
         * @param {Object} input
         * @returns {*} State
         */
        process: function(input) {
            var state = this.state;
            var eventType = input.eventType;

            var isRecognized = state & (Recognizer.STATE_BEGAN | Recognizer.STATE_CHANGED);
            var isValid = this.attrTest(input);

            // on cancel input and we've recognized before, return Recognizer.STATE_CANCELLED
            if (isRecognized && (eventType & Input.INPUT_CANCEL || !isValid)) {
                return state | Recognizer.STATE_CANCELLED;
            } else if (isRecognized || isValid) {
                if (eventType & Input.INPUT_END) {
                    return state | Recognizer.STATE_ENDED;
                } else if (!(state & Recognizer.STATE_BEGAN)) {
                    return Recognizer.STATE_BEGAN;
                }
                return state | Recognizer.STATE_CHANGED;
            }
            return Recognizer.STATE_FAILED;
        }
    });

    egame.AttrRecognizer = AttrRecognizer;
    return AttrRecognizer;
});