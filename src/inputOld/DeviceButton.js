
/**
* 指针按键，比如鼠标的左键，右键，中键和其他高级按键，像前进后退
* 使用他们 通过`Pointer.leftbutton`, `Pointer.rightButton`等、

* @class egame.DeviceButton
* @constructor
* @param {egame.Pointer} parent - 引用button的指针
* @param {number} buttonCode - 按键码
*/
egame.DeviceButton = function (parent, buttonCode) {

    /**
    * @property {egame.Pointer} parent - 引用button的指针
    */
    this.parent = parent;

    /**
    * @property {egame.Game} game - 游戏引用
    */
    this.game = parent.game;

    /**
    * @property {object} event - dom事件对象
    * @default
    */
    this.event = null;

    /**
    * @property {boolean} isDown - The "down" state of the button.
    * @default
    */
    this.isDown = false;

    /**
    * @property {boolean} isUp - The "up" state of the button.
    * @default
    */
    this.isUp = true;

    /**
    * @property {number} timeDown - The timestamp when the button was last pressed down.
    * @default
    */
    this.timeDown = 0;

    /**
    * @property {number} timeUp - The timestamp when the button was last released.
    * @default
    */
    this.timeUp = 0;

    /**
    * Gamepad only.
    * If a button is held down this holds down the number of times the button has 'repeated'.
    * @property {number} repeats
    * @default
    */
    this.repeats = 0;

    /**
    * True if the alt key was held down when this button was last pressed or released.
    * Not supported on Gamepads.
    * @property {boolean} altKey
    * @default
    */
    this.altKey = false;

    /**
    * True if the shift key was held down when this button was last pressed or released.
    * Not supported on Gamepads.
    * @property {boolean} shiftKey
    * @default
    */
    this.shiftKey = false;

    /**
    * True if the control key was held down when this button was last pressed or released.
    * Not supported on Gamepads.
    * @property {boolean} ctrlKey
    * @default
    */
    this.ctrlKey = false;

    /**
    * @property {number} value - Button value. Mainly useful for checking analog buttons (like shoulder triggers) on Gamepads.
    * @default
    */
    this.value = 0;

    /**
    * @property {number} buttonCode - The buttoncode of this button if a Gamepad, or the DOM button event value if a Pointer.
    */
    this.buttonCode = buttonCode;

    /**
    * This Signal is dispatched every time this DeviceButton is pressed down.
    * It is only dispatched once (until the button is released again).
    * When dispatched it sends 2 arguments: A reference to this DeviceButton and the value of the button.
    * @property {egame.Signal} onDown
    */
    this.onDown = new egame.Signal();

    /**
    * This Signal is dispatched every time this DeviceButton is released from a down state.
    * It is only dispatched once (until the button is pressed again).
    * When dispatched it sends 2 arguments: A reference to this DeviceButton and the value of the button.
    * @property {egame.Signal} onUp
    */
    this.onUp = new egame.Signal();

};

egame.DeviceButton.prototype = {

    /**
    * Called automatically by egame.Pointer and egame.SinglePad.
    * Handles the button down state.
    * 
    * @method egame.DeviceButton#start
    * @protected
    * @param {object} [event] - The DOM event that triggered the button change.
    * @param {number} [value] - The button value. Only get for Gamepads.
    */
    start: function (event, value) {

        if (this.isDown)
        {
            return;
        }

        this.isDown = true;
        this.isUp = false;
        this.timeDown = this.game.time.time;
        this.repeats = 0;

        this.event = event;
        this.value = value;

        if (event)
        {
            this.altKey = event.altKey;
            this.shiftKey = event.shiftKey;
            this.ctrlKey = event.ctrlKey;
        }

        this.onDown.dispatch(this, value);

    },

    /**
    * Called automatically by egame.Pointer and egame.SinglePad.
    * Handles the button up state.
    * 
    * @method egame.DeviceButton#stop
    * @protected
    * @param {object} [event] - The DOM event that triggered the button change.
    * @param {number} [value] - The button value. Only get for Gamepads.
    */
    stop: function (event, value) {

        if (this.isUp)
        {
            return;
        }

        this.isDown = false;
        this.isUp = true;
        this.timeUp = this.game.time.time;

        this.event = event;
        this.value = value;

        if (event)
        {
            this.altKey = event.altKey;
            this.shiftKey = event.shiftKey;
            this.ctrlKey = event.ctrlKey;
        }

        this.onUp.dispatch(this, value);

    },

    /**
    * Resets this DeviceButton, changing it to an isUp state and resetting the duration and repeats counters.
    * 
    * @method egame.DeviceButton#reset
    */
    reset: function () {

        this.isDown = false;
        this.isUp = true;

        this.timeDown = this.game.time.time;
        this.repeats = 0;

        this.altKey = false;
        this.shiftKey = false;
        this.ctrlKey = false;

    },

    /**
    * Destroys this DeviceButton, this disposes of the onDown, onUp and onFloat signals 
    * and clears the parent and game references.
    * 
    * @method egame.DeviceButton#destroy
    */
    destroy: function () {

        this.onDown.dispose();
        this.onUp.dispose();

        this.parent = null;
        this.game = null;

    }

};

egame.DeviceButton.prototype.constructor = egame.DeviceButton;

/**
* How long the button has been held down for in milliseconds.
* If not currently down it returns -1.
* 
* @name egame.DeviceButton#duration
* @property {number} duration
* @readonly
*/
Object.defineProperty(egame.DeviceButton.prototype, "duration", {

    get: function () {

        if (this.isUp)
        {
            return -1;
        }

        return this.game.time.time - this.timeDown;

    }
});
