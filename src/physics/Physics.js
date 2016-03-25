egame.define("Physics", function() {
    /**
     * The Physics Manager is responsible for looking after all of the running physics systems.
     * egame supports 4 physics systems: Arcade Physics, P2, Ninja Physics and Box2D via a commercial plugin.
     * 
     * Game Objects (such as Sprites) can only belong to 1 physics system, but you can have multiple systems active in a single game.
     *
     * For example you could have P2 managing a polygon-built terrain landscape that an vehicle drives over, while it could be firing bullets that use the
     * faster (due to being much simpler) Arcade Physics system.
     *
     * @class egame.Physics
     * @constructor
     * @param {egame.Game} game - A reference to the currently running game.
     * @param {object} [physicsConfig=null] - A physics configuration object to pass to the Physics world on creation.
     */
    egame.Physics = function(game, system) {
        /**
         * @property {egame.Game} game - Local reference to game.
         */
        this.game = game;
     
        if(game) game.physics = this;
      
        /**
         * @property {egame.Physics.Arcade} arcade - The Arcade Physics system.
         */
        this.arcade = null;

        /**
         * @property {egame.Physics.P2} p2 - The P2.JS Physics system.
         */
        this.p2 = null;

        /**
         * @property {egame.Physics.Ninja} ninja - The N+ Ninja Physics system.
         */
        this.ninja = null;

        /**
         * @property {egame.Physics.Box2D} box2d - The Box2D Physics system.
         */
        this.box2d = null;

        /**
         * @property {egame.Physics.Chipmunk} chipmunk - The Chipmunk Physics system (to be done).
         */
        this.chipmunk = null;

        /**
         * @property {egame.Physics.Matter} matter - The MatterJS Physics system (coming soon).
         */
        this.matter = null;

        game.physics = this;

        this.startSystem(system||0);
    };

    /**
     * @const
     * @type {number}
     */
    egame.Physics.ARCADE = 0;

    /**
     * @const
     * @type {number}
     */
    egame.Physics.P2JS = 1;

    /**
     * @const
     * @type {number}
     */
    egame.Physics.NINJA = 2;

    /**
     * @const
     * @type {number}
     */
    egame.Physics.BOX2D = 3;

    /**
     * @const
     * @type {number}
     */
    egame.Physics.CHIPMUNK = 4;

    /**
     * @const
     * @type {number}
     */
    egame.Physics.MATTERJS = 5;

    egame.Physics.prototype = {

        /**
         * This will create an instance of the requested physics simulation.
         * egame.Physics.Arcade is running by default, but all others need activating directly.
         * 
         * You can start the following physics systems:
         * 
         * egame.Physics.P2JS - A full-body advanced physics system by Stefan Hedman.
         * egame.Physics.NINJA - A port of Metanet Softwares N+ physics system.
         * egame.Physics.BOX2D - A commercial egame Plugin (see http://phaser.io)
         *
         * Both Ninja Physics and Box2D require their respective plugins to be loaded before you can start them.
         * They are not bundled into the core egame library.
         *
         * If the physics world has already been created (i.e. in another state in your game) then 
         * calling startSystem will reset the physics world, not re-create it. If you need to start them again from their constructors 
         * then set egame.Physics.p2 (or whichever system you want to recreate) to `null` before calling `startSystem`.
         *
         * @method egame.Physics#startSystem
         * @param {number} system - The physics system to start: egame.Physics.ARCADE, egame.Physics.P2JS, egame.Physics.NINJA or egame.Physics.BOX2D.
         */
        startSystem: function(system) {

            if (system === egame.Physics.ARCADE) {
                this.arcade = new egame.Physics.Arcade(this.game);
            } else if (system === egame.Physics.P2JS) {
                if (this.p2 === null) {
                    this.p2 = new egame.Physics.P2(this.game, this.config);
                } else {
                    this.p2.reset();
                }
            } else if (system === egame.Physics.NINJA) {
                this.ninja = new egame.Physics.Ninja(this.game);
            } else if (system === egame.Physics.BOX2D) {
                if (this.box2d === null) {
                    this.box2d = new egame.Physics.Box2D(this.game, this.config);
                } else {
                    this.box2d.reset();
                }
            } else if (system === egame.Physics.MATTERJS) {
                if (this.matter === null) {
                    this.matter = new egame.Physics.Matter(this.game, this.config);
                } else {
                    this.matter.reset();
                }
            }

        },

        /**
         * This will create a default physics body on the given game object or array of objects.
         * A game object can only have 1 physics body active at any one time, and it can't be changed until the object is destroyed.
         * It can be for any of the physics systems that have been started:
         *
         * egame.Physics.Arcade - A light weight AABB based collision system with basic separation.
         * egame.Physics.P2JS - A full-body advanced physics system supporting multiple object shapes, polygon loading, contact materials, springs and constraints.
         * egame.Physics.NINJA - A port of Metanet Softwares N+ physics system. Advanced AABB and Circle vs. Tile collision.
         * egame.Physics.BOX2D - A port of https://code.google.com/p/box2d-html5
         * egame.Physics.MATTER - A full-body and light-weight advanced physics system (still in development)
         * egame.Physics.CHIPMUNK is still in development.
         *
         * If you require more control over what type of body is created, for example to create a Ninja Physics Circle instead of the default AABB, then see the
         * individual physics systems `enable` methods instead of using this generic one.
         *
         * @method egame.Physics#enable
         * @param {object|array} object - The game object to create the physics body on. Can also be an array of objects, a body will be created on every object in the array.
         * @param {number} [system=egame.Physics.ARCADE] - The physics system that will be used to create the body. Defaults to Arcade Physics.
         * @param {boolean} [debug=false] - Enable the debug drawing for this body. Defaults to false.
         */
        enable: function(object, system, debug) {

            if (system === undefined) {
                system = egame.Physics.ARCADE;
            }
            if (debug === undefined) {
                debug = false;
            }

            if (system === egame.Physics.ARCADE) {
                this.arcade.enable(object);
            } else if (system === egame.Physics.P2JS && this.p2) {
                this.p2.enable(object, debug);
            } else if (system === egame.Physics.NINJA && this.ninja) {
                this.ninja.enableAABB(object);
            } else if (system === egame.Physics.BOX2D && this.box2d) {
                this.box2d.enable(object);
            } else if (system === egame.Physics.MATTERJS && this.matter) {
                this.matter.enable(object);
            }

        },

        /**
         * preUpdate checks.
         *
         * @method egame.Physics#preUpdate
         * @protected
         */
        preUpdate: function() {

            //  ArcadePhysics / Ninja don't have a core to preUpdate

            if (this.p2) {
                this.p2.preUpdate();
            }

            if (this.box2d) {
                this.box2d.preUpdate();
            }

            if (this.matter) {
                this.matter.preUpdate();
            }

        },

        /**
         * Updates all running physics systems.
         *
         * @method egame.Physics#update
         * @protected
         */
        update: function() {

            //  ArcadePhysics / Ninja don't have a core to update

            if (this.p2) {
                this.p2.update();
            }

            if (this.box2d) {
                this.box2d.update();
            }

            if (this.matter) {
                this.matter.update();
            }

        },

        /**
         * Updates the physics bounds to match the world dimensions.
         *
         * @method egame.Physics#setBoundsToWorld
         * @protected
         */
        setBoundsToWorld: function() {

            if (this.arcade) {
                this.arcade.setBoundsToWorld();
            }

            if (this.ninja) {
                this.ninja.setBoundsToWorld();
            }

            if (this.p2) {
                this.p2.setBoundsToWorld();
            }

            if (this.box2d) {
                this.box2d.setBoundsToWorld();
            }

            if (this.matter) {
                this.matter.setBoundsToWorld();
            }

        },

        /**
         * Clears down all active physics systems. This doesn't destroy them, it just clears them of objects and is called when the State changes.
         *
         * @method egame.Physics#clear
         * @protected
         */
        clear: function() {

            if (this.p2) {
                this.p2.clear();
            }

            if (this.box2d) {
                this.box2d.clear();
            }

            if (this.matter) {
                this.matter.clear();
            }

        },

        /**
         * Resets the active physics system. Called automatically on a egame.State swap.
         *
         * @method egame.Physics#reset
         * @protected
         */
        reset: function() {

            if (this.p2) {
                this.p2.reset();
            }

            if (this.box2d) {
                this.box2d.reset();
            }

            if (this.matter) {
                this.matter.reset();
            }

        },

        /**
         * Destroys all active physics systems. Usually only called on a Game Shutdown, not on a State swap.
         *
         * @method egame.Physics#destroy
         */
        destroy: function() {

            if (this.p2) {
                this.p2.destroy();
            }

            if (this.box2d) {
                this.box2d.destroy();
            }

            if (this.matter) {
                this.matter.destroy();
            }

            this.arcade = null;
            this.ninja = null;
            this.p2 = null;
            this.box2d = null;
            this.matter = null;

        }

    };

    egame.Physics.prototype.constructor = egame.Physics;

    return egame.Physics;
});