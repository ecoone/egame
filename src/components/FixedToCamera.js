egame.define("FixedToCamera",["Component"], function(Component) {

    /**
     * FixedToCamera组件可以使游戏对象渲染相对于相机坐标而不是世界坐标。
     * @class
     */
    egame.Component.FixedToCamera = function() {};

    /**
     * 初始化函数
     */
    egame.Component.FixedToCamera.init = function(){
        this.cameraOffset = new egame.Point(this.x,this.y);
        Object.defineProperty(this,'fixedToCamera',this.fixedToCamera);
    }

    /**
     *  postUpdate 方法
     *
     * @method
     */
    egame.Component.FixedToCamera.postUpdate = function() {

        if (this.fixedToCamera){
            this.position.x = this.game.camera.view.x + this.cameraOffset.x;
            this.position.y = this.game.camera.view.y + this.cameraOffset.y;
        }

    };

    egame.Component.FixedToCamera.prototype = {

        /**
         * @property {boolean} 是否固定在Camera上面
         * @private
         */
        _fixedToCamera: false,

        /**
         * 是否将对象的x,y坐标作为游戏对象在相机中的偏移
         *
         * @property {boolean} fixedToCamera
         */
        fixedToCamera: {

            get: function() {

                return this._fixedToCamera;

            },

            set: function(value) {

                if (value) {
                    this._fixedToCamera = true;
                    //cameraOffset初始值为自己的世界坐标
                    this.cameraOffset.set(this.x, this.y);
                } else {
                    this._fixedToCamera = false;
                }

            }

        },

        /**
         * 相对于相机的偏移
         * @property {egame.Point} cameraOffset
         */
        cameraOffset: new egame.Point()

    };
    return egame.Component.FixedToCamera;
});