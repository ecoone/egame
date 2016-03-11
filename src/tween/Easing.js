egame.define("Easing", function() {
    /* jshint curly: false */

    /**
     * @author       Richard Davey <rich@photonstorm.com>
     * @copyright    2015 Photon Storm Ltd.
     * @license      {@link https://github.com/photonstorm/egame/blob/master/license.txt|MIT License}
     */

    /**
     * A collection of easing methods defining ease-in and ease-out curves.
     *
     * @class egame.Easing
     */
    egame.Easing = {

        /**
         * Linear easing.
         *
         * @class egame.Easing.Linear
         */
        Linear: {

            /**
             * Linear Easing (no variation).
             *
             * @method egame.Easing.Linear#None
             * @param {number} k - The value to be tweened.
             * @returns {number} k.
             */
            None: function(k) {

                return k;

            }

        },

        /**
         * Quadratic easing.
         *
         * @class egame.Easing.Quadratic
         */
        Quadratic: {

            /**
             * Ease-in.
             *
             * @method egame.Easing.Quadratic#In
             * @param {number} k - The value to be tweened.
             * @returns {number} k^2.
             */
            In: function(k) {

                return k * k;

            },

            /**
             * Ease-out.
             *
             * @method egame.Easing.Quadratic#Out
             * @param {number} k - The value to be tweened.
             * @returns {number} k* (2-k).
             */
            Out: function(k) {

                return k * (2 - k);

            },

            /**
             * Ease-in/out.
             *
             * @method egame.Easing.Quadratic#InOut
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            InOut: function(k) {

                if ((k *= 2) < 1) return 0.5 * k * k;
                return -0.5 * (--k * (k - 2) - 1);

            }

        },

        /**
         * Cubic easing.
         *
         * @class egame.Easing.Cubic
         */
        Cubic: {

            /**
             * Cubic ease-in.
             *
             * @method egame.Easing.Cubic#In
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            In: function(k) {

                return k * k * k;

            },

            /**
             * Cubic ease-out.
             *
             * @method egame.Easing.Cubic#Out
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            Out: function(k) {

                return --k * k * k + 1;

            },

            /**
             * Cubic ease-in/out.
             *
             * @method egame.Easing.Cubic#InOut
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            InOut: function(k) {

                if ((k *= 2) < 1) return 0.5 * k * k * k;
                return 0.5 * ((k -= 2) * k * k + 2);

            }

        },

        /**
         * Quartic easing.
         *
         * @class egame.Easing.Quartic
         */
        Quartic: {

            /**
             * Quartic ease-in.
             *
             * @method egame.Easing.Quartic#In
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            In: function(k) {

                return k * k * k * k;

            },

            /**
             * Quartic ease-out.
             *
             * @method egame.Easing.Quartic#Out
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            Out: function(k) {

                return 1 - (--k * k * k * k);

            },

            /**
             * Quartic ease-in/out.
             *
             * @method egame.Easing.Quartic#InOut
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            InOut: function(k) {

                if ((k *= 2) < 1) return 0.5 * k * k * k * k;
                return -0.5 * ((k -= 2) * k * k * k - 2);

            }

        },

        /**
         * Quintic easing.
         *
         * @class egame.Easing.Quintic
         */
        Quintic: {

            /**
             * Quintic ease-in.
             *
             * @method egame.Easing.Quintic#In
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            In: function(k) {

                return k * k * k * k * k;

            },

            /**
             * Quintic ease-out.
             *
             * @method egame.Easing.Quintic#Out
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            Out: function(k) {

                return --k * k * k * k * k + 1;

            },

            /**
             * Quintic ease-in/out.
             *
             * @method egame.Easing.Quintic#InOut
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            InOut: function(k) {

                if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
                return 0.5 * ((k -= 2) * k * k * k * k + 2);

            }

        },

        /**
         * Sinusoidal easing.
         *
         * @class egame.Easing.Sinusoidal
         */
        Sinusoidal: {

            /**
             * Sinusoidal ease-in.
             *
             * @method egame.Easing.Sinusoidal#In
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            In: function(k) {

                if (k === 0) return 0;
                if (k === 1) return 1;
                return 1 - Math.cos(k * Math.PI / 2);

            },

            /**
             * Sinusoidal ease-out.
             *
             * @method egame.Easing.Sinusoidal#Out
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            Out: function(k) {

                if (k === 0) return 0;
                if (k === 1) return 1;
                return Math.sin(k * Math.PI / 2);

            },

            /**
             * Sinusoidal ease-in/out.
             *
             * @method egame.Easing.Sinusoidal#InOut
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            InOut: function(k) {

                if (k === 0) return 0;
                if (k === 1) return 1;
                return 0.5 * (1 - Math.cos(Math.PI * k));

            }

        },

        /**
         * Exponential easing.
         *
         * @class egame.Easing.Exponential
         */
        Exponential: {

            /**
             * Exponential ease-in.
             *
             * @method egame.Easing.Exponential#In
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            In: function(k) {

                return k === 0 ? 0 : Math.pow(1024, k - 1);

            },

            /**
             * Exponential ease-out.
             *
             * @method egame.Easing.Exponential#Out
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            Out: function(k) {

                return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);

            },

            /**
             * Exponential ease-in/out.
             *
             * @method egame.Easing.Exponential#InOut
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            InOut: function(k) {

                if (k === 0) return 0;
                if (k === 1) return 1;
                if ((k *= 2) < 1) return 0.5 * Math.pow(1024, k - 1);
                return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);

            }

        },

        /**
         * Circular easing.
         *
         * @class egame.Easing.Circular
         */
        Circular: {

            /**
             * Circular ease-in.
             *
             * @method egame.Easing.Circular#In
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            In: function(k) {

                return 1 - Math.sqrt(1 - k * k);

            },

            /**
             * Circular ease-out.
             *
             * @method egame.Easing.Circular#Out
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            Out: function(k) {

                return Math.sqrt(1 - (--k * k));

            },

            /**
             * Circular ease-in/out.
             *
             * @method egame.Easing.Circular#InOut
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            InOut: function(k) {

                if ((k *= 2) < 1) return -0.5 * (Math.sqrt(1 - k * k) - 1);
                return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);

            }

        },

        /**
         * Elastic easing.
         *
         * @class egame.Easing.Elastic
         */
        Elastic: {

            /**
             * Elastic ease-in.
             *
             * @method egame.Easing.Elastic#In
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            In: function(k) {

                var s, a = 0.1,
                    p = 0.4;
                if (k === 0) return 0;
                if (k === 1) return 1;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                } else s = p * Math.asin(1 / a) / (2 * Math.PI);
                return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));

            },

            /**
             * Elastic ease-out.
             *
             * @method egame.Easing.Elastic#Out
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            Out: function(k) {

                var s, a = 0.1,
                    p = 0.4;
                if (k === 0) return 0;
                if (k === 1) return 1;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                } else s = p * Math.asin(1 / a) / (2 * Math.PI);
                return (a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);

            },

            /**
             * Elastic ease-in/out.
             *
             * @method egame.Easing.Elastic#InOut
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            InOut: function(k) {

                var s, a = 0.1,
                    p = 0.4;
                if (k === 0) return 0;
                if (k === 1) return 1;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                } else s = p * Math.asin(1 / a) / (2 * Math.PI);
                if ((k *= 2) < 1) return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
                return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;

            }

        },

        /**
         * Back easing.
         *
         * @class egame.Easing.Back
         */
        Back: {

            /**
             * Back ease-in.
             *
             * @method egame.Easing.Back#In
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            In: function(k) {

                var s = 1.70158;
                return k * k * ((s + 1) * k - s);

            },

            /**
             * Back ease-out.
             *
             * @method egame.Easing.Back#Out
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            Out: function(k) {

                var s = 1.70158;
                return --k * k * ((s + 1) * k + s) + 1;

            },

            /**
             * Back ease-in/out.
             *
             * @method egame.Easing.Back#InOut
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            InOut: function(k) {

                var s = 1.70158 * 1.525;
                if ((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
                return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);

            }

        },

        /**
         * Bounce easing.
         *
         * @class egame.Easing.Bounce
         */
        Bounce: {

            /**
             * Bounce ease-in.
             *
             * @method egame.Easing.Bounce#In
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            In: function(k) {

                return 1 - egame.Easing.Bounce.Out(1 - k);

            },

            /**
             * Bounce ease-out.
             *
             * @method egame.Easing.Bounce#Out
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            Out: function(k) {

                if (k < (1 / 2.75)) {

                    return 7.5625 * k * k;

                } else if (k < (2 / 2.75)) {

                    return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;

                } else if (k < (2.5 / 2.75)) {

                    return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;

                } else {

                    return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;

                }

            },

            /**
             * Bounce ease-in/out.
             *
             * @method egame.Easing.Bounce#InOut
             * @param {number} k - The value to be tweened.
             * @returns {number} The tweened value.
             */
            InOut: function(k) {

                if (k < 0.5) return egame.Easing.Bounce.In(k * 2) * 0.5;
                return egame.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;

            }

        }

    };

    egame.Easing.Default = egame.Easing.Linear.None;
    egame.Easing.Power0 = egame.Easing.Linear.None;
    egame.Easing.Power1 = egame.Easing.Quadratic.Out;
    egame.Easing.Power2 = egame.Easing.Cubic.Out;
    egame.Easing.Power3 = egame.Easing.Quartic.Out;
    egame.Easing.Power4 = egame.Easing.Quintic.Out;

    return egame.Easing;
});