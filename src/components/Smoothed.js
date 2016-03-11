
egame.define("Smoothed", ["Component"], function(Component) {
    /**
    * 渲染纹理是否平滑
    *
    * @class
    */
    egame.Component.Smoothed = function () {};
    /**
     * 初始化函数
     */
    egame.Component.InCamera.init = function(){
        Object.defineProperty(this,'smoothed',this.smoothed);
    }
    egame.Component.Smoothed.prototype = {

        /**
        * 渲染纹理是否平滑
        *
        * @property {boolean} smoothed
        */
        smoothed: {

            get: function () {

                return !this.texture.baseTexture.scaleMode;

            },

            set: function (value) {

                if (value)
                {
                    if (this.texture)
                    {
                        this.texture.baseTexture.scaleMode = 0;
                    }
                }
                else
                {
                    if (this.texture)
                    {
                        this.texture.baseTexture.scaleMode = 1;
                    }
                }
            }

        }

    };
    return egame.Component.Smoothed;
});