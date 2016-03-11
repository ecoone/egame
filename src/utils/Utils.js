egame.define("Utils",["CONST"],function(CONST) {
    /**
     * @namespace egame.Utils
     */
    var Utils  = {
        _uid: 0,
        _saidHello: false,
        /**
         * Gets the next unique identifier
         *
         * @return {number} The next unique identifier to use.
         */
        uid: function ()
        {
            return ++Utils._uid;
        },

        /**
         * Converts a hex color number to an [R, G, B] array
         *
         * @param hex {number}
         * @param  {number[]} [out=[]]
         * @return {number[]} An array representing the [R, G, B] of the color.
         */
        hex2rgb: function (hex, out)
        {
            out = out || [];

            out[0] = (hex >> 16 & 0xFF) / 255;
            out[1] = (hex >> 8 & 0xFF) / 255;
            out[2] = (hex & 0xFF) / 255;

            return out;
        },

        /**
         * Converts a hex color number to a string.
         *
         * @param hex {number}
         * @return {string} The string color.
         */
        hex2string: function (hex)
        {
            hex = hex.toString(16);
            hex = '000000'.substr(0, 6 - hex.length) + hex;

            return '#' + hex;
        },

        /**
         * Converts a color as an [R, G, B] array to a hex number
         *
         * @param rgb {number[]}
         * @return {number} The color number
         */
        rgb2hex: function (rgb)
        {
            return ((rgb[0]*255 << 16) + (rgb[1]*255 << 8) + rgb[2]*255);
        },

        /**
         * Checks whether the Canvas BlendModes are supported by the current browser
         *
         * @return {boolean} whether they are supported
         */
        canUseNewCanvasBlendModes: function ()
        {
            if (typeof document === 'undefined')
            {
                return false;
            }

            var pngHead = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAABAQMAAADD8p2OAAAAA1BMVEX/';
            var pngEnd = 'AAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==';

            var magenta = new Image();
            magenta.src = pngHead + 'AP804Oa6' + pngEnd;

            var yellow = new Image();
            yellow.src = pngHead + '/wCKxvRF' + pngEnd;

            var canvas = document.createElement('canvas');
            canvas.width = 6;
            canvas.height = 1;

            var context = canvas.getContext('2d');
            context.globalCompositeOperation = 'multiply';
            context.drawImage(magenta, 0, 0);
            context.drawImage(yellow, 2, 0);

            var data = context.getImageData(2,0,1,1).data;

            return (data[0] === 255 && data[1] === 0 && data[2] === 0);
        },

        /**
         * Given a number, this function returns the closest number that is a power of two
         * this function is taken from Starling Framework as its pretty neat ;)
         *
         * @param number {number}
         * @return {number} the closest number that is a power of two
         */
        getNextPowerOfTwo: function (number)
        {
            // see: http://en.wikipedia.org/wiki/Power_of_two#Fast_algorithm_to_check_if_a_positive_number_is_a_power_of_two
            if (number > 0 && (number & (number - 1)) === 0)
            {
                return number;
            }
            else
            {
                var result = 1;

                while (result < number)
                {
                    result <<= 1;
                }

                return result;
            }
        },

        /**
         * checks if the given width and height make a power of two rectangle
         *
         * @param width {number}
         * @param height {number}
         * @return {boolean}
         */
        isPowerOfTwo: function (width, height)
        {
            return (width > 0 && (width & (width - 1)) === 0 && height > 0 && (height & (height - 1)) === 0);
        },

        /**
         * get the resolution of an asset by looking for the prefix
         * used by spritesheets and image urls
         *
         * @param url {string} the image path
         * @return {number}
         */
        getResolutionOfUrl: function (url)
        {
            var resolution = CONST.RETINA_PREFIX.exec(url);

            if (resolution)
            {
               return parseFloat(resolution[1]);
            }

            return 1;
        },

        /**
         * Logs out the version and renderer information for this running instance of egame.
         * If you don't want to see this message you can set `egame.Utils._saidHello = true;`
         * so the library thinks it already said it. Keep in mind that doing that will forever
         * makes you a jerk face.
         *
         * @param {string} type - The string renderer type to log.
         * @constant
         * @static
         */
        sayHello: function (type)
        {
            if (Utils._saidHello)
            {
                return;
            }

            if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1)
            {
                var args = [
                    '\n %c %c %c egame.js ' + CONST.VERSION + ' - ✰ ' + type + ' ✰  %c ' + ' %c ' + ' http://www.mniya.com/  %c %c ♥%c♥%c♥ \n\n',
                    'background: #ff66a5; padding:5px 0;',
                    'background: #ff66a5; padding:5px 0;',
                    'color: #ff66a5; background: #030307; padding:5px 0;',
                    'background: #ff66a5; padding:5px 0;',
                    'background: #ffc3dc; padding:5px 0;',
                    'background: #ff66a5; padding:5px 0;',
                    'color: #ff2424; background: #fff; padding:5px 0;',
                    'color: #ff2424; background: #fff; padding:5px 0;',
                    'color: #ff2424; background: #fff; padding:5px 0;'
                ];

                window.console.log.apply(console, args); //jshint ignore:line
            }
            else if (window.console)
            {
                window.console.log('egame.js ' + CONST.VERSION + ' - ' + type + ' - http://www.egamejs.com/'); //jshint ignore:line
            }

            Utils._saidHello = true;
        },

        /**
         * Helper for checking for webgl support
         *
         * @return {boolean}
         */
        isWebGLSupported: function ()
        {
            var contextOptions = { stencil: true };
            try
            {
                if (!window.WebGLRenderingContext)
                {
                    return false;
                }

                var canvas = document.createElement('canvas'),
                    gl = canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions);

                return !!(gl && gl.getContextAttributes().stencil);
            }
            catch (e)
            {
                return false;
            }
        },

        /**
         * Returns sign of number
         *
         * @param n {number}
         * @returns {number} 0 if n is 0, -1 if n is negative, 1 if n i positive
         */
        sign: function (n)
        {
            return n ? (n < 0 ? -1 : 1) : 0;
        },

        /**
         * removeItems
         *
         * @param {array} arr The target array
         * @param {number} startIdx The index to begin removing from (inclusive)
         * @param {number} removeCount How many items to remove
         */
        removeItems: function (arr, startIdx, removeCount)
        {
            var length = arr.length;

            if (startIdx >= length || removeCount === 0)
            {
                return;
            }

            removeCount = (startIdx+removeCount > length ? length-startIdx : removeCount);
            for (var i = startIdx, len = length-removeCount; i < len; ++i)
            {
                arr[i] = arr[i + removeCount];
            }

            arr.length = len;
        },

        /**
         * @todo Describe property usage
         * @private
         */
        TextureCache: {},

        /**
         * @todo Describe property usage
         * @private
         */
        BaseTextureCache: {}
    };
    //插件对象
    function pluginTarget(obj) {
        obj.__plugins = {};

        /**
         * 添加一个插件到一个对象
         * @param pluginName {string} 插件名称
         * @param ctor {Function} 插件构造方法
         */
        obj.registerPlugin = function(pluginName, ctor) {
            obj.__plugins[pluginName] = ctor;
        };

        /**
         * 实例化所有组件对象
         */
        obj.prototype.initPlugins = function() {
            this.plugins = this.plugins || {};

            for (var o in obj.__plugins) {
                this.plugins[o] = new(obj.__plugins[o])(this);
            }
        };

        /**
         * 移除所有组件
         */
        obj.prototype.destroyPlugins = function() {
            for (var o in this.plugins) {
                this.plugins[o].destroy();
                this.plugins[o] = null;
            }

            this.plugins = null;
        };
    }
    Utils.pluginTarget = {
        /**
         * 将插件对象混合入另外一个对象
         * @example
         * Utils.pluginTarget.mixin(CanvasRenderer);
         * @param object {object} 要被混合功能的对象
         */
        mixin: function mixin(obj) {
            pluginTarget(obj);
        }
    };

    egame.Utils = Utils;
    return Utils;
});
