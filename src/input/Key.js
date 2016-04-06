egame.define("Key", ["EventEmitter"], function(EventEmitter) {
    /**
     * 按键对象可以更好的控制按键处理
     * @class egame.Key
     * @constructor
     * @param {egame.Game} game - 当前游戏对象引用
     * @param {integer} keycode - 按键码
     * @event
     *  down 按下的时候触发
     *  up 放起来时候触发
     *  press 按下的时候触发
     */
    egame.Key = function(game, keycode) {

        /**
         * @property {egame.Game} game - 游戏对象引用
         */
        this.game = game;

        /**
         * 是否允许监听事件,参见enabled
         * @property {boolean} _enabled
         * @private
         */
        this._enabled = true;

        /**
         * @property {object} event - 存储最近的dom事件
         * @readonly
         */
        this.event = null;

        /**
         * @property {boolean} isDown - 这个键是否被按下
         * @default
         */
        this.isDown = false;

        /**
         * @property {boolean} isUp - 是个键是否处于没被按下的状态
         * @default
         */
        this.isUp = true;

        /**
         * @property {boolean} altKey - 是否同时按下了ALT键
         * @default
         */
        this.altKey = false;

        /**
         * @property {boolean} ctrlKey - 是否同时按下了CTRL键
         * @default
         */
        this.ctrlKey = false;

        /**
         * @property {boolean} shiftKey - 是否同时按下了SHIFT键
         * @default
         */
        this.shiftKey = false;

        /**
         * @property {number} timeDown - 最后一次被按下的时间
         */
        this.timeDown = 0;

        /**
         * 如果按键被按下那么这个时间是press的持续时间。如果按键是释放状态，那么是上次按键回话的事件
         * 
         * @property {number} duration - 单位毫秒
         * @default
         */
        this.duration = 0;

        /**
         * @property {number} timeUp - 最后一次按键释放的时间
         * @default
         */
        this.timeUp = -2500;

        /**
         * @property {number} repeats - 记录keypress触发的次数
         * @default
         */
        this.repeats = 0;

        /**
         * @property {number} keyCode - 按键的值
         */
        this.keyCode = keycode;

    };
    egame.Key.prototype = Object.create(EventEmitter.prototype);
    egame.util.extend(egame.Key.prototype, {

        /**
         * update或者keypress的时候触发
         * 
         * @method egame.Key#processKeyPress
         * @protected
         */
        update: function() {

            if (!this._enabled) {
                return;
            }

            if (this.isDown) {
                this.duration = this.game.time.time - this.timeDown;
                this.repeats++;
                this.emit("press");
            }

        },

        /**
         * Called automatically by egame.Keyboard.
         * 
         * @method egame.Key#processKeyDown
         * @param {KeyboardEvent} event - The DOM event that triggered this.
         * @protected
         */
        processKeyDown: function(event) {

            if (!this._enabled) {
                return;
            }

            this.event = event;

            // exit if this key down is from auto-repeat
            if (this.isDown) {
                return;
            }

            this.altKey = event.altKey;
            this.ctrlKey = event.ctrlKey;
            this.shiftKey = event.shiftKey;

            this.isDown = true;
            this.isUp = false;
            this.timeDown = this.game.time.time;
            this.duration = 0;
            this.repeats = 0;
            this.emit("down");
        },

        /**
         * Called automatically by egame.Keyboard.
         * 
         * @method egame.Key#processKeyUp
         * @param {KeyboardEvent} event - The DOM event that triggered this.
         * @protected
         */
        processKeyUp: function(event) {

            if (!this._enabled) {
                return;
            }

            this.event = event;

            if (this.isUp) {
                return;
            }

            this.isDown = false;
            this.isUp = true;
            this.timeUp = this.game.time.time;
            this.duration = this.game.time.time - this.timeDown;
            this.emit("up");
        },

        /**
         * Resets the state of this Key.
         *
         * This sets isDown to false, isUp to true, resets the time to be the current time, and _enables_ the key.
         * In addition, if it is a "hard reset", it clears clears any callbacks associated with the onDown and onUp events and removes the onHoldCallback.
         *
         * @method egame.Key#reset
         * @param {boolean} [hard=true] - A soft reset won't reset any events or callbacks; a hard reset will.
         */
        reset: function(hard) {

            if (hard === undefined) {
                hard = true;
            }

            this.isDown = false;
            this.isUp = true;
            this.timeUp = this.game.time.time;
            this.duration = 0;
            this._enabled = true;

            if (hard) {
                this.off("down");
                this.off("up");
                this.off("press");
            }

        },

        /**
         * Returns `true` if the Key was pressed down within the `duration` value given, or `false` if it either isn't down,
         * or was pressed down longer ago than then given duration.
         * 
         * @method egame.Key#downDuration
         * @param {number} [duration=50] - The duration within which the key is considered as being just pressed. Given in ms.
         * @return {boolean} True if the key was pressed down within the given duration.
         */
        downDuration: function(duration) {

            if (duration === undefined) {
                duration = 50;
            }

            return (this.isDown && this.duration < duration);

        },

        /**
         * Returns `true` if the Key was pressed down within the `duration` value given, or `false` if it either isn't down,
         * or was pressed down longer ago than then given duration.
         * 
         * @method egame.Key#upDuration
         * @param {number} [duration=50] - The duration within which the key is considered as being just released. Given in ms.
         * @return {boolean} True if the key was released within the given duration.
         */
        upDuration: function(duration) {

            if (duration === undefined) {
                duration = 50;
            }

            return (!this.isDown && ((this.game.time.time - this.timeUp) < duration));

        }
    });
    /**
     * An enabled key processes its update and dispatches events.
     * A key can be disabled momentarily at runtime instead of deleting it.
     * 
     * @property {boolean} enabled
     * @memberof egame.Key
     * @default true
     */
    Object.defineProperty(egame.Key.prototype, "enabled", {

        get: function() {
            return this._enabled;
        },

        set: function(value) {

            value = !!value;

            if (value !== this._enabled) {
                if (!value) {
                    this.reset(false);
                }

                this._enabled = value;
            }
        }
    });

    egame.Key.prototype.constructor = egame.Key;
    return egame.Key;
});