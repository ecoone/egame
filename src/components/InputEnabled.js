egame.define("InputEnabled", ["Component"], function(Component) {
    /**
     * 给显示对象添加输入功能
     *
     * @class
     */
    egame.Component.InputEnabled = function() {};

    /**
     * 初始化函数
     */
    egame.Component.InputEnabled.init = function() {
        Object.defineProperty(this, 'inputEnabled', this.inputEnabled);
    }

    egame.Component.InputEnabled.prototype = {

        /**
         * 显示对象的输入处理器
         * @property {egame.InputHandler|null} input 
         */
        input: null,

        /**
         * 设置为true后，具有接受输入的功能,这个值设置的时机一定是显示对象已经被add到stage上面了
         * @property {boolean} inputEnabled
         */
        inputEnabled: {

            get: function() {

                return (this.input && this.input.enabled);

            },

            set: function(value) {

                if (value) {
                    if (this.input === null) {
                        this.input = new egame.InputHandler(this);
                        this.input.start();
                    } else if (this.input && !this.input.enabled) {
                        this.input.start();
                    }
                } else {
                    if (this.input && this.input.enabled) {
                        this.input.stop();
                    }
                }

            }

        }

    };
    return egame.Component.InputEnabled;
});