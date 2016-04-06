egame.define("Core", ["Component", "Point"], function(Component, Point) {
    /**
     * 给显示对象添加游戏对象需要的功能
     * @class
     */
    egame.Component.Core = function() {};
    /**
     * 初始化函数
     */
    egame.Component.Core.init = function() {
        this.world = new Point();
        this.previousPosition = new Point();
        Object.defineProperty(this, 'exists', this.exists);
    }
    egame.Component.Core.prototype = {
        game:null,
        components: {},
        fresh: true,
        previousPosition: null,
        previousRotation: 0,
        world: null,
        //控制游戏对象是否被游戏循环处理
        _exists: true,
        exists: {

            get: function() {

                return this._exists;

            },

            set: function(value) {

                if (value) {
                    this._exists = true;
                    this.visible = true;
                } else {
                    this._exists = false;
                    this.visible = false;
                }

            }
        },
        preUpdate: function() {
            this.previousPosition.set(this.world.x, this.world.y);
            this.previousRotation = this.rotation;

            if (!this._exists || !this.parent.exists)
            {
                this.renderOrderID = -1;
                return false;
            }
            this.world.setTo(this.game.camera.x + this.worldTransform.tx, this.game.camera.y + this.worldTransform.ty);
            // this.world.setTo(this.parent.position.x + this.position.x, this.parent.position.y + this.position.y);
            if (this.visible) {
                this.renderOrderID = this.game.stage.currentRenderOrderID++;
            }
            //精灵表动画
            if (this.type == egame.SPRITESHEET_ANIMATION) {
                this.updateAnimation();
            }
            //物理引擎更新部分
            if (this.body) {
                this.body.preUpdate();
            }
            var flag = false;
            if (this.components && this.components.LifeSpan) {
                flag = egame.Component.LifeSpan.preUpdate.call(this);
                if(!flag) return;
            }
            if (this.components && this.components.InWorld) {
                flag = egame.Component.InWorld.preUpdate.call(this);
                if(!flag) return;
            }
            if (this.children && this.children.length > 0) {
                for (var i = 0; i < this.children.length; i++) {
                    this.children[i].preUpdate();
                }
            }
        },
        update: function() {
            if (this.children && this.children.length > 0) {
                for (var i = 0; i < this.children.length; i++) {
                    this.children[i].update();
                }
            }
        },
        postUpdate: function() {
            //物理引擎更新部分
            if (this.body) {
                this.body.postUpdate();
            }
            if (this.components && this.components.FixedToCamera) {
                egame.Component.FixedToCamera.postUpdate.call(this);
            }

            if (this.children && this.children.length > 0) {
                for (var i = 0; i < this.children.length; i++) {
                    this.children[i].postUpdate();
                }
            }
        }
    };
    return egame.Component.Core;
});