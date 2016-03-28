egame.define("SpriteSheetAnimation",["SpriteSheet","Animation"],function(SpriteSheet,Animation) {


    /**
     * The Animation Manager is used to add, play and update egame Animations.
     * Any Game Object such as egame.Sprite that supports animation contains a single SpriteSheetAnimation instance.
     *
     * @class egame.SpriteSheetAnimation
     * @constructor
     * @param {egame.Sprite} sprite - A reference to the Game Object that owns this SpriteSheetAnimation.
     */
    egame.SpriteSheetAnimation = function(game,imgResourceKey, frameWidthOrSpriteSheetKey, frameHeight, frameMax, margin, spacing) {
        SpriteSheet.call(this,imgResourceKey, frameWidthOrSpriteSheetKey, frameHeight, frameMax, margin, spacing);
        /**
         * @property {egame.Game} game - A reference to the currently running Game.
         */
        this.game = game;
        this.type= egame.SPRITESHEET_ANIMATION;
        /**
         * @property {egame.Animation} currentAnim - The currently displayed animation, if any.
         * @default
         */
        this.currentAnim = null;

        /**
         * @property {boolean} updateIfVisible - Should the animation data continue to update even if the Sprite.visible is set to false.
         * @default
         */
        this.updateIfVisible = true;

        /**
         * @property {object} _anims - An internal object that stores all of the Animation instances.
         * @private
         */
        this._anims = {};

        /**
         * @property {object} _outputFrames - An internal object to help avoid gc.
         * @private
         */
        this._outputFrames = [];

    };
    egame.SpriteSheetAnimation.prototype = Object.create(SpriteSheet.prototype);
    egame.SpriteSheetAnimation.prototype._loadFrameData = egame.SpriteSheetAnimation.prototype.loadFrameData;
    egame.SpriteSheetAnimation.prototype._copyFrameData = egame.SpriteSheetAnimation.prototype.copyFrameData;
    egame.SpriteSheetAnimation.prototype.constructor = egame.SpriteSheetAnimation;

    egame.util.extend(egame.SpriteSheetAnimation.prototype,{
        /**
         * 重写loadFrameData
         */
        loadFrameData: function(frameData, frame) {
            var flag = this._loadFrameData(frameData, frame);
            if(flag){
                for (var anim in this._anims) {
                    this._anims[anim].updateFrameData(frameData);
                }
            }
            return flag;
        },

        /**
         * 重写copyFrameData
         */
        copyFrameData: function(frameData, frame) {
            var flag = this._copyFrameData(frameData, frame);
            if(flag){
                for (var anim in this._anims) {
                    this._anims[anim].updateFrameData(frameData);
                }
            }
            return flag;
        },

        /**
         * Adds a new animation under the given key. Optionally set the frames, frame rate and loop.
         * Animations added in this way are played back with the play function.
         *
         * @method egame.SpriteSheetAnimation#add
         * @param {string} name - The unique (within this Sprite) name for the animation, i.e. "run", "fire", "walk".
         * @param {Array} [frames=null] - An array of numbers/strings that correspond to the frames to add to this animation and in which order. e.g. [1, 2, 3] or ['run0', 'run1', run2]). If null then all frames will be used.
         * @param {number} [frameRate=60] - The speed at which the animation should play. The speed is given in frames per second.
         * @param {boolean} [loop=false] - Whether or not the animation is looped or just plays once.
         * @param {boolean} [useNumericIndex=true] - Are the given frames using numeric indexes (default) or strings?
         * @return {egame.Animation} The Animation object that was created.
         */
        add: function(name, frames, frameRate, loop, useNumericIndex) {

            frames = frames || [];
            frameRate = frameRate || 60;

            if (loop === undefined) {
                loop = false;
            }

            //  If they didn't set the useNumericIndex then let's at least try and guess it
            if (useNumericIndex === undefined) {
                if (frames && typeof frames[0] === 'number') {
                    useNumericIndex = true;
                } else {
                    useNumericIndex = false;
                }
            }

            this._outputFrames = [];

            this._frameData.getFrameIndexes(frames, useNumericIndex, this._outputFrames);

            this._anims[name] = new egame.Animation(this.game, this, name, this._frameData, this._outputFrames, frameRate, loop);

            this.currentAnim = this._anims[name];

            //  This shouldn't be set until the Animation is played, surely?
            // this.currentFrame = this.currentAnim.currentFrame;

            if (this.tilingTexture) {
                this.refreshTexture = true;
            }

            return this._anims[name];

        },
        /**
         * Play an animation based on the given key. The animation should previously have been added via `animations.add`
         * 
         * If the requested animation is already playing this request will be ignored. 
         * If you need to reset an already running animation do so directly on the Animation object itself.
         *
         * @method egame.SpriteSheetAnimation#play
         * @param {string} name - The name of the animation to be played, e.g. "fire", "walk", "jump".
         * @param {number} [frameRate=null] - The framerate to play the animation at. The speed is given in frames per second. If not provided the previously set frameRate of the Animation is used.
         * @param {boolean} [loop=false] - Should the animation be looped after playback. If not provided the previously set loop value of the Animation is used.
         * @param {boolean} [killOnComplete=false] - If set to true when the animation completes (only happens if loop=false) the parent Sprite will be killed.
         * @return {egame.Animation} A reference to playing Animation instance.
         */
        play: function(name, frameRate, loop, killOnComplete) {

            if (this._anims[name]) {
                if (this.currentAnim === this._anims[name]) {
                    if (this.currentAnim.isPlaying === false) {
                        this.currentAnim.paused = false;
                        return this.currentAnim.play(frameRate, loop, killOnComplete);
                    }

                    return this.currentAnim;
                } else {
                    if (this.currentAnim && this.currentAnim.isPlaying) {
                        this.currentAnim.stop();
                    }

                    this.currentAnim = this._anims[name];
                    this.currentAnim.paused = false;
                    this.currentFrame = this.currentAnim.currentFrame;
                    return this.currentAnim.play(frameRate, loop, killOnComplete);
                }
            }
        },

        /**
         * Stop playback of an animation. If a name is given that specific animation is stopped, otherwise the current animation is stopped.
         * The currentAnim property of the SpriteSheetAnimation is automatically set to the animation given.
         *
         * @method egame.SpriteSheetAnimation#stop
         * @param {string} [name=null] - The name of the animation to be stopped, e.g. "fire". If none is given the currently running animation is stopped.
         * @param {boolean} [resetFrame=false] - When the animation is stopped should the currentFrame be set to the first frame of the animation (true) or paused on the last frame displayed (false)
         */
        stop: function(name, resetFrame) {

            if (resetFrame === undefined) {
                resetFrame = false;
            }

            if (typeof name === 'string') {
                if (this._anims[name]) {
                    this.currentAnim = this._anims[name];
                    this.currentAnim.stop(resetFrame);
                }
            } else {
                if (this.currentAnim) {
                    this.currentAnim.stop(resetFrame);
                }
            }
        },

        /**
         * The main update function is called by the Sprites update loop. It's responsible for updating animation frames and firing related events.
         *
         * @method egame.SpriteSheetAnimation#update
         * @protected
         * @return {boolean} True if a new animation frame has been set, otherwise false.
         */
        updateAnimation: function() {

            if (this.updateIfVisible && !this.visible) {
                return false;
            }

            if (this.currentAnim && this.currentAnim.update()) {
                this.currentFrame = this.currentAnim.currentFrame;
                return true;
            }

            return false;

        },

        /**
         * Advances by the given number of frames in the current animation, taking the loop value into consideration.
         *
         * @method egame.SpriteSheetAnimation#next
         * @param {number} [quantity=1] - The number of frames to advance.
         */
        next: function(quantity) {

            if (this.currentAnim) {
                this.currentAnim.next(quantity);
                this.currentFrame = this.currentAnim.currentFrame;
            }

        },

        /**
         * Moves backwards the given number of frames in the current animation, taking the loop value into consideration.
         *
         * @method egame.SpriteSheetAnimation#previous
         * @param {number} [quantity=1] - The number of frames to move back.
         */
        previous: function(quantity) {

            if (this.currentAnim) {
                this.currentAnim.previous(quantity);
                this.currentFrame = this.currentAnim.currentFrame;
            }

        },

        /**
         * Returns an animation that was previously added by name.
         *
         * @method egame.SpriteSheetAnimation#getAnimation
         * @param {string} name - The name of the animation to be returned, e.g. "fire".
         * @return {egame.Animation} The Animation instance, if found, otherwise null.
         */
        getAnimation: function(name) {

            if (typeof name === 'string') {
                if (this._anims[name]) {
                    return this._anims[name];
                }
            }

            return null;

        },
        /**
         * Destroys all references this SpriteSheetAnimation contains.
         * Iterates through the list of animations stored in this manager and calls destroy on each of them.
         *
         * @method egame.SpriteSheetAnimation#destroy
         */
        destroy: function() {

            var anim = null;

            for (var anim in this._anims) {
                if (this._anims.hasOwnProperty(anim)) {
                    this._anims[anim].destroy();
                }
            }

            this._anims = {};
            this._outputFrames = [];
            this._frameData = null;
            this.currentAnim = null;
            this.currentFrame = null;
            this.game = null;

        }
    });

    /**
     * @name egame.SpriteSheetAnimation#paused
     * @property {boolean} paused - Gets and sets the paused state of the current animation.
     */
    Object.defineProperty(egame.SpriteSheetAnimation.prototype, 'paused', {

        get: function() {

            return this.currentAnim.isPaused;

        },

        set: function(value) {

            this.currentAnim.paused = value;

        }

    });

    /**
     * @name egame.SpriteSheetAnimation#name
     * @property {string} name - Gets the current animation name, if set.
     */
    Object.defineProperty(egame.SpriteSheetAnimation.prototype, 'name', {

        get: function() {

            if (this.currentAnim) {
                return this.currentAnim.name;
            }

        }

    });

    return egame.SpriteSheetAnimation;
});