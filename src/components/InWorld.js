egame.define("InWorld", ["Component"], function(Component) {

    /**
     * InWorld组件是用来检测游戏对象是否在游戏世界的边界里面，这里的在游戏边界里面是只要和世界相交就算。
     * If the AutoCull component is enabled on the Game Object then it will check the Game Object against the Camera bounds as well.
     *
     * @class
     */
    egame.Component.InWorld = function() {};
    egame.Component.InWorld.init = function(){
        Object.defineProperty(this,'inWorld',this.inWorld);
    }
    /**
     * InWorld组件preUpdate处理函数
     *
     * @method
     */
    egame.Component.InWorld.preUpdate = function() {
        if (this.autoCull || this.checkWorldBounds) {
            this._bounds.copyFrom(this.getBounds());

            this._bounds.x += this.game.camera.view.x;
            this._bounds.y += this.game.camera.view.y;

            // if (this.autoCull) {
            //     //  Won't get rendered but will still get its transform updated
            //     if (this.game.world.camera.view.intersects(this._bounds)) {
            //         this.renderable = true;
            //         this.game.world.camera.totalInView++;
            //     } else {
            //         this.renderable = false;
            //     }
            // }

            if (this.checkWorldBounds) {
                //精灵回到了世界内部
                if (this._outOfBoundsFired && this.game.world.bounds.intersects(this._bounds)) {
                    this._outOfBoundsFired = false;
                    this.emit("enterBounds");
                } else if (!this._outOfBoundsFired && !this.game.world.bounds.intersects(this._bounds)) {
                    // 精灵不在世界内部了
                    this._outOfBoundsFired = true;
                    this.emit("outOfBounds");
                    if (this.outOfBoundsKill) {
                        this.kill();
                        return false;
                    }
                }
            }
        }

        return true;

    };

    egame.Component.InWorld.prototype = {

        /**
         * 如果设置为true那么就会在每个游戏循环中去检测游戏对象与世界的相交情况。当不在与世间相交的时候触发'onOutOfBounds'事件
         * 
         * @property {boolean} checkWorldBounds
         * @default
         */
        checkWorldBounds: false,

        /**
         * 如果'checkWorldBounds'和这个属性都设置为true，那么游戏对象会在不在世界的时候被kill掉
         * @property {boolean} outOfBoundsKill
         * @default
         */
        outOfBoundsKill: false,

        /**
         * @property {boolean} _outOfBoundsFired - 是否在世界外
         * @private
         */
        _outOfBoundsFired: false,

        /**
         * 检测游戏对象是否在世界内部
         * @property {boolean} inWorld
         * @readonly
         */
        inWorld: {

            get: function() {

                return this.game.world.bounds.intersects(this.getBounds());

            }

        }

    };
    return egame.Component.InCamera;
});