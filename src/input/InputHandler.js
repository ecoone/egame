egame.define("InputHandler", ["Point"], function(Point) {

    /**
     *  
     * Input处理器会绑定到一个特定的显示对象并负责这个显示对象上的所有输入
     * @class egame.InputHandler
     * @constructor
     * @param {egame.Sprite} sprite - Input处理器所属的sprite
     */
    egame.InputHandler = function(sprite) {

        /**
         * @property {egame.Sprite} sprite - Input处理器所属的sprite
         */
        this.sprite = sprite;

        /**
         * 游戏对象引用
         * @type {Game}
         */
        this.game = sprite.game;

        /**
        * @property {egame.Game} game - 游戏对象引用
        this.game = sprite.game;

        /**
        * @property {boolean} enabled - 如果为true Input Handler 会处理输入请求并监控活动的指针
        * @default
        */
        this.enabled = false;


        /**
         * 显示对象的接受事件的优先级
         * @property {number} priorityID
         * @default
         */
        this.priorityID = 0;

        /**
         * @property {boolean} useHandCursor - 是否在移动的时候使用手形，这个是桌面浏览器上的。
         * @default
         */
        this.useHandCursor = false;

        /**
         * @property {boolean} _setHandCursor - 是否设置了手形光标
         * @private
         */
        this._setHandCursor = false;

        /**



        /**
         * @property {boolean} _wasEnabled - Internal cache var.
         * @private
         */
        this._wasEnabled = false;


    };

    egame.InputHandler.prototype = {

        /**
         * Starts the Input Handler running. This is called automatically when you enable input on a Sprite, or can be called directly if you need to set a specific priority.
         * @method egame.InputHandler#start
         * @param {number} priority - Higher priority sprites take click priority over low-priority sprites when they are stacked on-top of each other.
         * @param {boolean} useHandCursor - If true the Sprite will show the hand cursor on mouse-over (doesn't apply to mobile browsers)
         * @return {egame.Sprite} The Sprite object to which the Input Handler is bound.
         */
        start: function(priority, useHandCursor) {

            priority = priority || 0;
            if (useHandCursor === undefined) {
                useHandCursor = false;
            }

            //  Turning on
            if (this.enabled === false) {
                //  Register, etc
                this.game.input.interactiveItems.add(this);
                this.useHandCursor = useHandCursor;
                this.priorityID = priority;
                this.enabled = true;
                this._wasEnabled = true;

            }



            return this.sprite;

        },
        /**
         * Resets the Input Handler and disables it.
         * @method egame.InputHandler#reset
         */
        reset: function() {

            this.enabled = false;
        },

        /**
         * Stops the Input Handler from running.
         * @method egame.InputHandler#stop
         */
        stop: function() {

            //  Turning off
            if (this.enabled === false) {
                return;
            } else {
                //  De-register, etc
                this.enabled = false;
                this.game.input.interactiveItems.remove(this);
            }

        },

        /**
         * Clean up memory.
         * @method egame.InputHandler#destroy
         */
        destroy: function() {

            if (this.sprite) {
                if (this._setHandCursor) {
                    this.game.canvas.style.cursor = "default";
                    this._setHandCursor = false;
                }

                this.enabled = false;

                this.game.input.interactiveItems.remove(this);
                this.sprite = null;
            }

        },

        /**
         * Checks if the object this InputHandler is bound to is valid for consideration in the Pointer move event.
         * This is called by egame.Pointer and shouldn't typically be called directly.
         *
         * @method egame.InputHandler#validForInput
         * @protected
         * @param {number} highestID - 指针现在处理的，最高的id
         * @param {number} highestRenderID - 指针处理的，最高的渲染顺序id
         * @return {boolean} True if the object this InputHandler is bound to should be considered as valid for input detection.
         */
        validForInput: function(highestID, highestRenderID) {

            if (!this.enabled || this.sprite.scale.x === 0 || this.sprite.scale.y === 0 || this.priorityID < this.game.input.minPriorityID) {
                return false;
            }

            if (this.priorityID > highestID || (this.priorityID === highestID && this.sprite.renderOrderID < highestRenderID)) {
                return true;
            }

            return false;

        }
    };

    egame.InputHandler.prototype.constructor = egame.InputHandler;
    return egame.InputHandler;
});