egame.define("TweenManager",["Tween"],function(Tween) {
    /**
     * egame.Game has a single instance of the TweenManager through which all Tween objects are created and updated.
     * Tweens are hooked into the game clock and pause system, adjusting based on the game state.
     *
     * TweenManager is based heavily on tween.js by http://soledadpenades.com.
     * The difference being that tweens belong to a games instance of TweenManager, rather than to a global TWEEN object.
     * It also has callbacks swapped for Signals and a few issues patched with regard to properties and completion errors.
     * Please see https://github.com/sole/tween.js for a full list of contributors.
     * 
     * @class egame.TweenManager
     * @constructor
     * @param {egame.Game} game - A reference to the currently running game.
     */
    egame.TweenManager = function(game) {

        /**
         * @property {egame.Game} game - Local reference to game.
         */
        this.game = game;
        if(game) this.game.tweens = this;

        /**
         * Are all newly created Tweens frame or time based? A frame based tween will use the physics elapsed timer when updating. This means
         * it will retain the same consistent frame rate, regardless of the speed of the device. The duration value given should
         * be given in frames.
         * 
         * If the Tween uses a time based update (which is the default) then the duration is given in milliseconds.
         * In this situation a 2000ms tween will last exactly 2 seconds, regardless of the device and how many visual updates the tween
         * has actually been through. For very short tweens you may wish to experiment with a frame based update instead.
         * @property {boolean} frameBased
         * @default
         */
        this.frameBased = false;

        /**
         * @property {array<egame.Tween>} _tweens - All of the currently running tweens.
         * @private
         */
        this._tweens = [];

        /**
         * @property {array<egame.Tween>} _add - All of the tweens queued to be added in the next update.
         * @private
         */
        this._add = [];

        this.easeMap = {

            "Power0": egame.Easing.Power0,
            "Power1": egame.Easing.Power1,
            "Power2": egame.Easing.Power2,
            "Power3": egame.Easing.Power3,
            "Power4": egame.Easing.Power4,

            "Linear": egame.Easing.Linear.None,
            "Quad": egame.Easing.Quadratic.Out,
            "Cubic": egame.Easing.Cubic.Out,
            "Quart": egame.Easing.Quartic.Out,
            "Quint": egame.Easing.Quintic.Out,
            "Sine": egame.Easing.Sinusoidal.Out,
            "Expo": egame.Easing.Exponential.Out,
            "Circ": egame.Easing.Circular.Out,
            "Elastic": egame.Easing.Elastic.Out,
            "Back": egame.Easing.Back.Out,
            "Bounce": egame.Easing.Bounce.Out,

            "Quad.easeIn": egame.Easing.Quadratic.In,
            "Cubic.easeIn": egame.Easing.Cubic.In,
            "Quart.easeIn": egame.Easing.Quartic.In,
            "Quint.easeIn": egame.Easing.Quintic.In,
            "Sine.easeIn": egame.Easing.Sinusoidal.In,
            "Expo.easeIn": egame.Easing.Exponential.In,
            "Circ.easeIn": egame.Easing.Circular.In,
            "Elastic.easeIn": egame.Easing.Elastic.In,
            "Back.easeIn": egame.Easing.Back.In,
            "Bounce.easeIn": egame.Easing.Bounce.In,

            "Quad.easeOut": egame.Easing.Quadratic.Out,
            "Cubic.easeOut": egame.Easing.Cubic.Out,
            "Quart.easeOut": egame.Easing.Quartic.Out,
            "Quint.easeOut": egame.Easing.Quintic.Out,
            "Sine.easeOut": egame.Easing.Sinusoidal.Out,
            "Expo.easeOut": egame.Easing.Exponential.Out,
            "Circ.easeOut": egame.Easing.Circular.Out,
            "Elastic.easeOut": egame.Easing.Elastic.Out,
            "Back.easeOut": egame.Easing.Back.Out,
            "Bounce.easeOut": egame.Easing.Bounce.Out,

            "Quad.easeInOut": egame.Easing.Quadratic.InOut,
            "Cubic.easeInOut": egame.Easing.Cubic.InOut,
            "Quart.easeInOut": egame.Easing.Quartic.InOut,
            "Quint.easeInOut": egame.Easing.Quintic.InOut,
            "Sine.easeInOut": egame.Easing.Sinusoidal.InOut,
            "Expo.easeInOut": egame.Easing.Exponential.InOut,
            "Circ.easeInOut": egame.Easing.Circular.InOut,
            "Elastic.easeInOut": egame.Easing.Elastic.InOut,
            "Back.easeInOut": egame.Easing.Back.InOut,
            "Bounce.easeInOut": egame.Easing.Bounce.InOut

        };
        this.game.on("paused",this._pauseAll,this);
        this.game.on("resumed",this._resumeAll,this);
    };

    egame.TweenManager.prototype = {

        /**
         * Get all the tween objects in an array.
         * @method egame.TweenManager#getAll
         * @returns {egame.Tween[]} Array with all tween objects.
         */
        getAll: function() {

            return this._tweens;

        },

        /**
         * Remove all tweens running and in the queue. Doesn't call any of the tween onComplete events.
         * @method egame.TweenManager#removeAll
         */
        removeAll: function() {

            for (var i = 0; i < this._tweens.length; i++) {
                this._tweens[i].pendingDelete = true;
            }

            this._add = [];

        },

        /**
         * Remove all tweens from a specific object, array of objects or Group.
         * 
         * @method egame.TweenManager#removeFrom
         * @param {object|object[]|egame.Group} obj - The object you want to remove the tweens from.
         * @param {boolean} [children=true] - If passing a group, setting this to true will remove the tweens from all of its children instead of the group itself.
         */
        removeFrom: function(obj, children) {

            if (children === undefined) {
                children = true;
            }

            var i;
            var len;

            if (Array.isArray(obj)) {
                for (i = 0, len = obj.length; i < len; i++) {
                    this.removeFrom(obj[i]);
                }
            } else if (obj.type === egame.GROUP && children) {
                for (var i = 0, len = obj.children.length; i < len; i++) {
                    this.removeFrom(obj.children[i]);
                }
            } else {
                for (i = 0, len = this._tweens.length; i < len; i++) {
                    if (obj === this._tweens[i].target) {
                        this.remove(this._tweens[i]);
                    }
                }

                for (i = 0, len = this._add.length; i < len; i++) {
                    if (obj === this._add[i].target) {
                        this.remove(this._add[i]);
                    }
                }
            }

        },

        /**
         * Add a new tween into the TweenManager.
         *
         * @method egame.TweenManager#add
         * @param {egame.Tween} tween - The tween object you want to add.
         * @returns {egame.Tween} The tween object you added to the manager.
         */
        add: function(tween) {

            tween._manager = this;
            this._add.push(tween);

        },

        /**
         * Create a tween object for a specific object. The object can be any JavaScript object or egame object such as Sprite.
         *
         * @method egame.TweenManager#create
         * @param {object} object - Object the tween will be run on.
         * @returns {egame.Tween} The newly created tween object.
         */
        create: function(object) {

            return new egame.Tween(object, this.game, this);

        },

        /**
         * Remove a tween from this manager.
         *
         * @method egame.TweenManager#remove
         * @param {egame.Tween} tween - The tween object you want to remove.
         */
        remove: function(tween) {

            var i = this._tweens.indexOf(tween);

            if (i !== -1) {
                this._tweens[i].pendingDelete = true;
            } else {
                i = this._add.indexOf(tween);

                if (i !== -1) {
                    this._add[i].pendingDelete = true;
                }
            }

        },

        /**
         * Update all the tween objects you added to this manager.
         *
         * @method egame.TweenManager#update
         * @returns {boolean} Return false if there's no tween to update, otherwise return true.
         */
        update: function() {

            var addTweens = this._add.length;
            var numTweens = this._tweens.length;

            if (numTweens === 0 && addTweens === 0) {
                return false;
            }

            var i = 0;

            while (i < numTweens) {
                if (this._tweens[i].update(this.game.time.time)) {
                    i++;
                } else {
                    this._tweens.splice(i, 1);

                    numTweens--;
                }
            }

            //  If there are any new tweens to be added, do so now - otherwise they can be spliced out of the array before ever running
            if (addTweens > 0) {
                this._tweens = this._tweens.concat(this._add);
                this._add.length = 0;
            }

            return true;

        },

        /**
         * Checks to see if a particular Sprite is currently being tweened.
         *
         * @method egame.TweenManager#isTweening
         * @param {object} object - The object to check for tweens against.
         * @returns {boolean} Returns true if the object is currently being tweened, false if not.
         */
        isTweening: function(object) {

            return this._tweens.some(function(tween) {
                return tween.target === object;
            });

        },

        /**
         * Private. Called by game focus loss. Pauses all currently running tweens.
         *
         * @method egame.TweenManager#_pauseAll
         * @private
         */
        _pauseAll: function() {

            for (var i = this._tweens.length - 1; i >= 0; i--) {
                this._tweens[i]._pause();
            }

        },

        /**
         * Private. Called by game focus loss. Resumes all currently paused tweens.
         *
         * @method egame.TweenManager#_resumeAll
         * @private
         */
        _resumeAll: function() {

            for (var i = this._tweens.length - 1; i >= 0; i--) {
                this._tweens[i]._resume();
            }

        },

        /**
         * Pauses all currently running tweens.
         *
         * @method egame.TweenManager#pauseAll
         */
        pauseAll: function() {

            for (var i = this._tweens.length - 1; i >= 0; i--) {
                this._tweens[i].pause();
            }

        },

        /**
         * Resumes all currently paused tweens.
         *
         * @method egame.TweenManager#resumeAll
         */
        resumeAll: function() {

            for (var i = this._tweens.length - 1; i >= 0; i--) {
                this._tweens[i].resume(true);
            }

        }

    };

    egame.TweenManager.prototype.constructor = egame.TweenManager;

    return egame.TweenManager;
});