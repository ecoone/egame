egame.define("Particle", ["Sprite","Reset"], function(Sprite,Reset) {

    /**
     * Create a new `Particle` object. Particles are extended Sprites that are emitted by a particle emitter such as egame.Particles.Arcade.Emitter.
     * 
     * @class egame.Particle
     * @constructor
     * @extends egame.Sprite
     * @param {egame.Game} game - A reference to the currently running game.
     * @param {number} x - The x coordinate (in world space) to position the Particle at.
     * @param {number} y - The y coordinate (in world space) to position the Particle at.
     * @param {string|egame.RenderTexture|egame.BitmapData|PIXI.Texture} key - This is the image or texture used by the Particle during rendering. It can be a string which is a reference to the Cache entry, or an instance of a RenderTexture or PIXI.Texture.
     * @param {string|number} frame - If this Particle is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
     */
    egame.Particle = function(game, x, y, texture) {

        egame.Sprite.call(this, texture);
        this.position.x = x;
        this.position.y = y;
        this.game = game;

        /**
         * @property {boolean} autoScale - If this Particle automatically scales this is set to true by Particle.setScaleData.
         * @protected
         */
        this.autoScale = false;

        /**
         * @property {array} scaleData - A reference to the scaleData array owned by the Emitter that emitted this Particle.
         * @protected
         */
        this.scaleData = null;

        /**
         * @property {number} _s - Internal cache var for tracking auto scale.
         * @private
         */
        this._s = 0;

        /**
         * @property {boolean} autoAlpha - If this Particle automatically changes alpha this is set to true by Particle.setAlphaData.
         * @protected
         */
        this.autoAlpha = false;

        /**
         * @property {array} alphaData - A reference to the alphaData array owned by the Emitter that emitted this Particle.
         * @protected
         */
        this.alphaData = null;

        /**
         * @property {number} _a - Internal cache var for tracking auto alpha.
         * @private
         */
        this._a = 0;

    };

    egame.Particle.prototype = Object.create(egame.Sprite.prototype);
    egame.Particle.prototype.constructor = egame.Particle;

    /**
     * Updates the Particle scale or alpha if autoScale and autoAlpha are set.
     *
     * @method egame.Particle#update
     * @memberof egame.Particle
     */
    egame.Particle.prototype.update = function() {

        if (this.autoScale) {
            this._s--;

            if (this._s) {
                this.scale.set(this.scaleData[this._s].x, this.scaleData[this._s].y);
            } else {
                this.autoScale = false;
            }
        }

        if (this.autoAlpha) {
            this._a--;

            if (this._a) {
                this.alpha = this.alphaData[this._a].v;
            } else {
                this.autoAlpha = false;
            }
        }

    };

    /**
     * Called by the Emitter when this particle is emitted. Left empty for you to over-ride as required.
     *
     * @method egame.Particle#onEmit
     * @memberof egame.Particle
     */
    egame.Particle.prototype.onEmit = function() {};

    /**
     * Called by the Emitter if autoAlpha has been enabled. Passes over the alpha ease data and resets the alpha counter.
     *
     * @method egame.Particle#setAlphaData
     * @memberof egame.Particle
     */
    egame.Particle.prototype.setAlphaData = function(data) {

        this.alphaData = data;
        this._a = data.length - 1;
        this.alpha = this.alphaData[this._a].v;
        this.autoAlpha = true;

    };

    /**
     * Called by the Emitter if autoScale has been enabled. Passes over the scale ease data and resets the scale counter.
     *
     * @method egame.Particle#setScaleData
     * @memberof egame.Particle
     */
    egame.Particle.prototype.setScaleData = function(data) {

        this.scaleData = data;
        this._s = data.length - 1;
        this.scale.set(this.scaleData[this._s].x, this.scaleData[this._s].y);
        this.autoScale = true;

    };

    /**
     * Resets the Particle. This places the Particle at the given x/y world coordinates and then
     * sets alive, exists, visible and renderable all to true. Also resets the outOfBounds state and health values.
     * If the Particle has a physics body that too is reset.
     *
     * @method egame.Particle#reset
     * @memberof egame.Particle
     * @param {number} x - The x coordinate (in world space) to position the Particle at.
     * @param {number} y - The y coordinate (in world space) to position the Particle at.
     * @param {number} [health=1] - The health to give the Particle.
     * @return {egame.Particle} This instance.
     */
    egame.Particle.prototype.reset = function(x, y, health) {
        egame.Component.Reset.prototype.reset.call(this, x, y, health); 
  
        this.alpha = 1;
        this.scale.set(1);

        this.autoScale = false;
        this.autoAlpha = false;

        return this;

    };

    return egame.Particle;
});