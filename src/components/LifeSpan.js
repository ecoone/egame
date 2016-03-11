egame.define("LifeSpan", ["Component"], function(Component) {

    /**
     * 生命期管理组件
     * @class
     */
    egame.Component.LifeSpan = function() {};

    /**
     * 更新前处理
     * @method
     */
    egame.Component.LifeSpan.preUpdate = function() {

        if (this.lifespan > 0) {
            this.lifespan -= this.game.time.physicsElapsedMS;
            if (this.lifespan <= 0) {
                this.kill();
                return false;
            }
        }

        return true;

    };

    egame.Component.LifeSpan.prototype = {

        /**
         * 用来标志显示对象是否存活
         *
         * @property {boolean} alive
         * @default
         */
        alive: true,

        /**
         * 显示对象的生命期，单位毫秒
         * 
         * @property {number} lifespan
         * @default
         */
        lifespan: 0,

        /**
         *将死掉的显示对象重新复活
         * 
         * @method
         * @param {number} [health=1] - 健康值
         * @return {egame.DisplayObject} 显示对象
         */
        revive: function(health) {

            if (health === undefined) {
                health = 1;
            }

            this.alive = true;
            this.exists = true;
            this.visible = true;
            this.visible = true;

            if (typeof this.heal === 'function') {
                this.heal(health);
            }
            this.emit("revived");
            return this;

        },

        /**
         * 杀死一个显示对象，但这个对象并未销毁
         *
         * @method
         * @return {egame.DisplayObject} 显示对象实体
         */
        kill: function() {

            this.alive = false;
            this.exists = false;
            this.visible = false;
            this.health = 0;
            this.emit("damaged");
            this.emit("killed");
            return this;

        },
        /**
        * 显示对象的生命值
        * @property {number} health
        * @default
        */
        health: 1,
        /**
        * 最大的生命值 
        * @property {number} maxHealth
        * @default
        */
        maxHealth: 100,

        /**
        * 受到伤害
        * @member
        * @param {number} amount - 一次减少的生命值
        * @return {Phaser.Sprite} This instance.
        */
        damage: function(amount) {

            if (this.alive)
            {
                this.health -= amount;

                if (this.health <= 0)
                {
                    this.kill();
                }
            }
            this.emit("damaged");
            return this;

        },

        /**
        * 治愈
        * @member
        * @param {number} amount - 增加的生命值
        * @return {Phaser.Sprite} This instance.
        */
        heal: function(amount) {

            if (this.alive)
            {
                this.health += amount;

                if (this.health > this.maxHealth)
                {
                    this.health = this.maxHealth;
                }
            }
            this.emit("healed");
            return this;

        }

    };

    return egame.Component.LifeSpan;
    
});