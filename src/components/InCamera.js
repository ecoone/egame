egame.define("InCamera", ["Component"], function(Component) {
    /**
     * 检测游戏对象是否在相机里面
     * @class
     */
    egame.Component.InCamera = function() {};
    /**
     * 初始化函数
     */
    egame.Component.InCamera.init = function(){
        Object.defineProperty(this,'inCamera',this.inCamera);
    }
    
    egame.Component.InCamera.prototype = {
        inCamera: {

            get: function() {
                return this.game.world.camera.view.intersects(this.getBounds());

            }

        }

    };
    return egame.Component.InCamera;
});