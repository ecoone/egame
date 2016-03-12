egame.define("Particles", function() {
    /**
     * egame.Particles is the Particle Manager for the game. It is called during the game update loop and in turn updates any Emitters attached to it.
     *
     * @class egame.Particles
     * @constructor
     * @param {egame.Game} game - A reference to the currently running game.
     */
    egame.Particles = function(game) {

        /**
         * @property {egame.Game} game - A reference to the currently running Game.
         */
        this.game = game;

        /**
         * @property {object} emitters - Internal emitters store.
         */
        this.emitters = {};

        /**
         * @property {number} ID -
         * @default
         */
        this.ID = 0;

    };

    egame.Particles.prototype = {

        /**
         * Adds a new Particle Emitter to the Particle Manager.
         * @method egame.Particles#add
         * @param {egame.Emitter} emitter - The emitter to be added to the particle manager.
         * @return {egame.Emitter} The emitter that was added.
         */
        add: function(emitter) {

            this.emitters[emitter.name] = emitter;

            return emitter;

        },

        /**
         * Removes an existing Particle Emitter from the Particle Manager.
         * @method egame.Particles#remove
         * @param {egame.Emitter} emitter - The emitter to remove.
         */
        remove: function(emitter) {

            delete this.emitters[emitter.name];

        },

        /**
         * Called by the core game loop. Updates all Emitters who have their exists value set to true.
         * @method egame.Particles#update
         * @protected
         */
        update: function() {

            for (var key in this.emitters) {
                if (this.emitters[key].exists) {
                    this.emitters[key].update();
                }
            }

        }

    };

    egame.Particles.prototype.constructor = egame.Particles;

     
    return egame.Particles;
});