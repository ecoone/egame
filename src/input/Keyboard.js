egame.define("Keyboard", ["EventEmitter","Key"], function(EventEmitter,Key) {
    /**
     * The Keyboard class monitors keyboard input and dispatches keyboard events.
     *
     * _Note_: many keyboards are unable to process certain combinations of keys due to hardware limitations known as ghosting.
     * See http://www.html5gamedevs.com/topic/4876-impossible-to-use-more-than-2-keyboard-input-buttons-at-the-same-time/ for more details.
     *
     * @class egame.Keyboard
     * @constructor
     * @param {egame.Game} game - A reference to the currently running game.
     */
    egame.Keyboard = function(game) {

        /**
         * @property {egame.Game} game - Local reference to game.
         */
        this.game = game;
        game.keyboard = this;
        /**
         * Keyboard input will only be processed if enabled.
         * @property {boolean} enabled
         * @default
         */
        this.enabled = true;

        /**
         * @property {object} event - The most recent DOM event from keydown or keyup. This is updated every time a new key is pressed or released.
         */
        this.event = null;

        /**
         * @property {object} pressEvent - The most recent DOM event from keypress.
         */
        this.pressEvent = null;
        /**
         * @property {array<egame.Key>} _keys - The array the egame.Key objects are stored in.
         * @private
         */
        this._keys = [];

        /**
         * @property {array} _capture - The array the key capture values are stored in.
         * @private
         */
        this._capture = [];

        /**
         * @property {function} _onKeyDown
         * @private
         * @default
         */
        this._onKeyDown = null;

        /**
         * @property {function} _onKeyPress
         * @private
         * @default
         */
        this._onKeyPress = null;

        /**
         * @property {function} _onKeyUp
         * @private
         * @default
         */
        this._onKeyUp = null;

        /**
         * @property {number} _i - Internal cache var
         * @private
         */
        this._i = 0;

        /**
         * @property {number} _k - Internal cache var
         * @private
         */
        this._k = 0;

    };
    egame.Keyboard.prototype = Object.create(EventEmitter.prototype);
    egame.util.extend(egame.Keyboard.prototype, {
        /**
         * If you need more fine-grained control over a Key you can create a new egame.Key object via this method.
         * The Key object can then be polled, have events attached to it, etc.
         *
         * @method egame.Keyboard#addKey
         * @param {integer} keycode - The {@link egame.KeyCode keycode} of the key.
         * @return {egame.Key} The Key object which you can store locally and reference directly.
         */
        addKey: function(keycode) {

            if (!this._keys[keycode]) {
                this._keys[keycode] = new egame.Key(this.game, keycode);

                this.addKeyCapture(keycode);
            }

            return this._keys[keycode];

        },

        /**
         * A practical way to create an object containing user selected hotkeys.
         *
         * For example,
         *
         *     addKeys( { 'up': egame.KeyCode.W, 'down': egame.KeyCode.S, 'left': egame.KeyCode.A, 'right': egame.KeyCode.D } );
         *
         * would return an object containing properties (`up`, `down`, `left` and `right`) referring to {@link egame.Key} object.
         *
         * @method egame.Keyboard#addKeys
         * @param {object} keys - A key mapping object, i.e. `{ 'up': egame.KeyCode.W, 'down': egame.KeyCode.S }` or `{ 'up': 52, 'down': 53 }`.
         * @return {object} An object containing the properties mapped to {@link egame.Key} values.
         */
        addKeys: function(keys) {

            var output = {};

            for (var key in keys) {
                output[key] = this.addKey(keys[key]);
            }

            return output;

        },

        /**
         * Removes a Key object from the Keyboard manager.
         *
         * @method egame.Keyboard#removeKey
         * @param {integer} keycode - The {@link egame.KeyCode keycode} of the key to remove.
         */
        removeKey: function(keycode) {

            if (this._keys[keycode]) {
                this._keys[keycode] = null;

                this.removeKeyCapture(keycode);
            }

        },

        /**
         * Creates and returns an object containing 4 hotkeys for Up, Down, Left and Right.
         *
         * @method egame.Keyboard#createCursorKeys
         * @return {object} An object containing properties: `up`, `down`, `left` and `right` of {@link egame.Key} objects.
         */
        createCursorKeys: function() {

            return this.addKeys({
                'up': egame.KeyCode.UP,
                'down': egame.KeyCode.DOWN,
                'left': egame.KeyCode.LEFT,
                'right': egame.KeyCode.RIGHT
            });

        },

        /**
         * Starts the Keyboard event listeners running (keydown and keyup). They are attached to the window.
         * This is called automatically by egame.Input and should not normally be invoked directly.
         *
         * @method egame.Keyboard#start
         * @protected
         */
        start: function() {

            if (this._onKeyDown !== null) {
                //  Avoid setting multiple listeners
                return;
            }

            var _this = this;

            this._onKeyDown = function(event) {
                return _this.processKeyDown(event);
            };

            this._onKeyUp = function(event) {
                return _this.processKeyUp(event);
            };

            this._onKeyPress = function(event) {
                return _this.processKeyPress(event);
            };
            window.addEventListener('keydown', this._onKeyDown, false);
            window.addEventListener('keyup', this._onKeyUp, false);
            window.addEventListener('keypress', this._onKeyPress, false);

        },

        /**
         * Stops the Keyboard event listeners from running (keydown, keyup and keypress). They are removed from the window.
         *
         * @method egame.Keyboard#stop
         */
        stop: function() {

            window.removeEventListener('keydown', this._onKeyDown);
            window.removeEventListener('keyup', this._onKeyUp);
            window.removeEventListener('keypress', this._onKeyPress);

            this._onKeyDown = null;
            this._onKeyUp = null;
            this._onKeyPress = null;

        },
        /**
        * Updates all currently defined keys.
        *
        * @method Phaser.Keyboard#update
        */
        update: function () {

            this._i = this._keys.length;

            while (this._i--)
            {
                if (this._keys[this._i])
                {
                    this._keys[this._i].update();
                }
            }

        },
        /**
         * Stops the Keyboard event listeners from running (keydown and keyup). They are removed from the window.
         * Also clears all key captures and currently created Key objects.
         *
         * @method egame.Keyboard#destroy
         */
        destroy: function() {

            this.stop();

            this.clearCaptures();

            this._keys.length = 0;
            this._i = 0;

        },

        /**
         * By default when a key is pressed egame will not stop the event from propagating up to the browser.
         * There are some keys this can be annoying for, like the arrow keys or space bar, which make the browser window scroll.
         *
         * The `addKeyCapture` method enables consuming keyboard event for specific keys so it doesn't bubble up to the the browser
         * and cause the default browser behavior.
         *
         * Pass in either a single keycode or an array/hash of keycodes.
         *
         * @method egame.Keyboard#addKeyCapture
         * @param {integer|integer[]|object} keycode - Either a single {@link egame.KeyCode keycode} or an array/hash of keycodes such as `[65, 67, 68]`.
         */
        addKeyCapture: function(keycode) {

            if (typeof keycode === 'object') {
                for (var key in keycode) {
                    this._capture[keycode[key]] = true;
                }
            } else {
                this._capture[keycode] = true;
            }
        },

        /**
         * Removes an existing key capture.
         *
         * @method egame.Keyboard#removeKeyCapture
         * @param {integer} keycode - The {@link egame.KeyCode keycode} to remove capturing of.
         */
        removeKeyCapture: function(keycode) {

            delete this._capture[keycode];

        },

        /**
         * Clear all set key captures.
         *
         * @method egame.Keyboard#clearCaptures
         */
        clearCaptures: function() {

            this._capture = {};

        },

        /**
         * Process the keydown event.
         *
         * @method egame.Keyboard#processKeyDown
         * @param {KeyboardEvent} event
         * @protected
         */
        processKeyDown: function(event) {

            this.event = event;

            if (!this.enabled) {
                return;
            }
            //   The event is being captured but another hotkey may need it
            if (this._capture[event.keyCode]) {
                event.preventDefault();
            }

            if (!this._keys[event.keyCode]) {
                this._keys[event.keyCode] = new egame.Key(this.game, event.keyCode);
            }

            this._keys[event.keyCode].processKeyDown(event);

            this._k = event.keyCode;

            this.emit("down");

        },

        /**
         * Process the keypress event.
         *
         * @method egame.Keyboard#processKeyPress
         * @param {KeyboardEvent} event
         * @protected
         */
        processKeyPress: function(event) {

            this.pressEvent = event;

            if (!this.enabled) {
                return;
            }
            var keyCode = event.keyCode;
            if(!this._keys[event.keyCode]){
                var charStr = String.fromCharCode(event.charCode);
                charStr = charStr.toUpperCase();
                keyCode = charStr.charCodeAt(0);
            }
            this._keys[keyCode].update(event);
            this.emit("press",String.fromCharCode(event.charCode));

        },

        /**
         * Process the keyup event.
         *
         * @method egame.Keyboard#processKeyUp
         * @param {KeyboardEvent} event
         * @protected
         */
        processKeyUp: function(event) {

            this.event = event;

            if (!this.enabled) {
                return;
            }

            if (this._capture[event.keyCode]) {
                event.preventDefault();
            }

            if (!this._keys[event.keyCode]) {
                this._keys[event.keyCode] = new egame.Key(this.game, event.keyCode);
            }

            this._keys[event.keyCode].processKeyUp(event);

            this.emit("up");

        },

        /**
         * Resets all Keys.
         *
         * @method egame.Keyboard#reset
         * @param {boolean} [hard=true] - A soft reset won't reset any events or callbacks that are bound to the Keys. A hard reset will.
         */
        reset: function(hard) {

            if (hard === undefined) {
                hard = true;
            }

            this.event = null;

            var i = this._keys.length;

            while (i--) {
                if (this._keys[i]) {
                    this._keys[i].reset(hard);
                }
            }

        },

        /**
         * Returns `true` if the Key was pressed down within the `duration` value given, or `false` if it either isn't down,
         * or was pressed down longer ago than then given duration.
         * 
         * @method egame.Keyboard#downDuration
         * @param {integer} keycode - The {@link egame.KeyCode keycode} of the key to check: i.e. egame.KeyCode.UP or egame.KeyCode.SPACEBAR.
         * @param {number} [duration=50] - The duration within which the key is considered as being just pressed. Given in ms.
         * @return {boolean} True if the key was pressed down within the given duration, false if not or null if the Key wasn't found.
         */
        downDuration: function(keycode, duration) {

            if (this._keys[keycode]) {
                return this._keys[keycode].downDuration(duration);
            } else {
                return null;
            }

        },

        /**
         * Returns `true` if the Key was pressed down within the `duration` value given, or `false` if it either isn't down,
         * or was pressed down longer ago than then given duration.
         * 
         * @method egame.Keyboard#upDuration
         * @param {egame.KeyCode|integer} keycode - The keycode of the key to check, i.e. egame.KeyCode.UP or egame.KeyCode.SPACEBAR.
         * @param {number} [duration=50] - The duration within which the key is considered as being just released. Given in ms.
         * @return {boolean} True if the key was released within the given duration, false if not or null if the Key wasn't found.
         */
        upDuration: function(keycode, duration) {

            if (this._keys[keycode]) {
                return this._keys[keycode].upDuration(duration);
            } else {
                return null;
            }

        },

        /**
         * Returns true of the key is currently pressed down. Note that it can only detect key presses on the web browser.
         *
         * @method egame.Keyboard#isDown
         * @param {integer} keycode - The {@link egame.KeyCode keycode} of the key to check: i.e. egame.KeyCode.UP or egame.KeyCode.SPACEBAR.
         * @return {boolean} True if the key is currently down, false if not or null if the Key wasn't found.
         */
        isDown: function(keycode) {

            if (this._keys[keycode]) {
                return this._keys[keycode].isDown;
            } else {
                return null;
            }

        }
    });

    /**
     * Returns the string value of the most recently pressed key.
     * @name egame.Keyboard#lastChar
     * @property {string} lastChar - The string value of the most recently pressed key.
     * @readonly
     */
    Object.defineProperty(egame.Keyboard.prototype, "lastChar", {

        get: function() {

            if (this.event.charCode === 32) {
                return '';
            } else {
                return String.fromCharCode(this.pressEvent.charCode);
            }

        }

    });

    /**
     * Returns the most recently pressed Key. This is a egame.Key object and it changes every time a key is pressed.
     * @name egame.Keyboard#lastKey
     * @property {egame.Key} lastKey - The most recently pressed Key.
     * @readonly
     */
    Object.defineProperty(egame.Keyboard.prototype, "lastKey", {

        get: function() {

            return this._keys[this._k];

        }

    });

    egame.Keyboard.prototype.constructor = egame.Keyboard;

    /**
     * A key code represents a physical key on a keyboard.
     *
     * The KeyCode class contains commonly supported keyboard key codes which can be used
     * as keycode`-parameters in several {@link egame.Keyboard} and {@link egame.Key} methods.
     *
     * _Note_: These values should only be used indirectly, eg. as `egame.KeyCode.KEY`.
     * Future versions may replace the actual values, such that they remain compatible with `keycode`-parameters.
     * The current implementation maps to the {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode KeyboardEvent.keyCode} property.
     *
     * _Note_: Use `egame.KeyCode.KEY` instead of `egame.Keyboard.KEY` to refer to a key code;
     * the latter approach is supported for compatibility.
     *
     * @namespace
     */
    egame.KeyCode = {
        /** @static */
        A: "A".charCodeAt(0),
        /** @static */
        B: "B".charCodeAt(0),
        /** @static */
        C: "C".charCodeAt(0),
        /** @static */
        D: "D".charCodeAt(0),
        /** @static */
        E: "E".charCodeAt(0),
        /** @static */
        F: "F".charCodeAt(0),
        /** @static */
        G: "G".charCodeAt(0),
        /** @static */
        H: "H".charCodeAt(0),
        /** @static */
        I: "I".charCodeAt(0),
        /** @static */
        J: "J".charCodeAt(0),
        /** @static */
        K: "K".charCodeAt(0),
        /** @static */
        L: "L".charCodeAt(0),
        /** @static */
        M: "M".charCodeAt(0),
        /** @static */
        N: "N".charCodeAt(0),
        /** @static */
        O: "O".charCodeAt(0),
        /** @static */
        P: "P".charCodeAt(0),
        /** @static */
        Q: "Q".charCodeAt(0),
        /** @static */
        R: "R".charCodeAt(0),
        /** @static */
        S: "S".charCodeAt(0),
        /** @static */
        T: "T".charCodeAt(0),
        /** @static */
        U: "U".charCodeAt(0),
        /** @static */
        V: "V".charCodeAt(0),
        /** @static */
        W: "W".charCodeAt(0),
        /** @static */
        X: "X".charCodeAt(0),
        /** @static */
        Y: "Y".charCodeAt(0),
        /** @static */
        Z: "Z".charCodeAt(0),
        /** @static */
        ZERO: "0".charCodeAt(0),
        /** @static */
        ONE: "1".charCodeAt(0),
        /** @static */
        TWO: "2".charCodeAt(0),
        /** @static */
        THREE: "3".charCodeAt(0),
        /** @static */
        FOUR: "4".charCodeAt(0),
        /** @static */
        FIVE: "5".charCodeAt(0),
        /** @static */
        SIX: "6".charCodeAt(0),
        /** @static */
        SEVEN: "7".charCodeAt(0),
        /** @static */
        EIGHT: "8".charCodeAt(0),
        /** @static */
        NINE: "9".charCodeAt(0),
        /** @static */
        NUMPAD_0: 96,
        /** @static */
        NUMPAD_1: 97,
        /** @static */
        NUMPAD_2: 98,
        /** @static */
        NUMPAD_3: 99,
        /** @static */
        NUMPAD_4: 100,
        /** @static */
        NUMPAD_5: 101,
        /** @static */
        NUMPAD_6: 102,
        /** @static */
        NUMPAD_7: 103,
        /** @static */
        NUMPAD_8: 104,
        /** @static */
        NUMPAD_9: 105,
        /** @static */
        NUMPAD_MULTIPLY: 106,
        /** @static */
        NUMPAD_ADD: 107,
        /** @static */
        NUMPAD_ENTER: 108,
        /** @static */
        NUMPAD_SUBTRACT: 109,
        /** @static */
        NUMPAD_DECIMAL: 110,
        /** @static */
        NUMPAD_DIVIDE: 111,
        /** @static */
        F1: 112,
        /** @static */
        F2: 113,
        /** @static */
        F3: 114,
        /** @static */
        F4: 115,
        /** @static */
        F5: 116,
        /** @static */
        F6: 117,
        /** @static */
        F7: 118,
        /** @static */
        F8: 119,
        /** @static */
        F9: 120,
        /** @static */
        F10: 121,
        /** @static */
        F11: 122,
        /** @static */
        F12: 123,
        /** @static */
        F13: 124,
        /** @static */
        F14: 125,
        /** @static */
        F15: 126,
        /** @static */
        COLON: 186,
        /** @static */
        EQUALS: 187,
        /** @static */
        COMMA: 188,
        /** @static */
        UNDERSCORE: 189,
        /** @static */
        PERIOD: 190,
        /** @static */
        QUESTION_MARK: 191,
        /** @static */
        TILDE: 192,
        /** @static */
        OPEN_BRACKET: 219,
        /** @static */
        BACKWARD_SLASH: 220,
        /** @static */
        CLOSED_BRACKET: 221,
        /** @static */
        QUOTES: 222,
        /** @static */
        BACKSPACE: 8,
        /** @static */
        TAB: 9,
        /** @static */
        CLEAR: 12,
        /** @static */
        ENTER: 13,
        /** @static */
        SHIFT: 16,
        /** @static */
        CONTROL: 17,
        /** @static */
        ALT: 18,
        /** @static */
        CAPS_LOCK: 20,
        /** @static */
        ESC: 27,
        /** @static */
        SPACEBAR: 32,
        /** @static */
        PAGE_UP: 33,
        /** @static */
        PAGE_DOWN: 34,
        /** @static */
        END: 35,
        /** @static */
        HOME: 36,
        /** @static */
        LEFT: 37,
        /** @static */
        UP: 38,
        /** @static */
        RIGHT: 39,
        /** @static */
        DOWN: 40,
        /** @static */
        PLUS: 43,
        /** @static */
        MINUS: 44,
        /** @static */
        INSERT: 45,
        /** @static */
        DELETE: 46,
        /** @static */
        HELP: 47,
        /** @static */
        NUM_LOCK: 144
    };

    // Duplicate egame.KeyCode values in egame.Keyboard for compatibility
    for (var key in egame.KeyCode) {
        if (egame.KeyCode.hasOwnProperty(key) && !key.match(/[a-z]/)) {
            egame.Keyboard[key] = egame.KeyCode[key];
        }
    }
    return egame.Keyboard;
});