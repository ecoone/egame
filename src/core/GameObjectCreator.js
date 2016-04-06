egame.define("GameObjectCreator", function() {
    /**
     * 游戏对象创建器，属于创建游戏对象的快速方式
     *
     * @class egame.GameObjectCreator
     * @constructor
     * @param {egame.Game} game - 游戏对象引用
     */
    egame.GameObjectCreator = function(game) {
        /**
         * @property {egame.Game} game -游戏对象引用
         * @protected
         */
        this.game = game;
        this.game.add = this;
    };

    egame.GameObjectCreator.prototype = {
        /**
         * 创建精灵对象
         *
         * @method egame.GameObjectCreator#sprite
         * @param {number} x - 精灵对象的x坐标
         * @param {number} y - 精灵对象的y坐标
         * @param {DisplayObject} parent sprite存放的容器默认为stage
         * @returns {egame.Sprite} 新创建的精灵对象
         */
        sprite: function(resourceKey, x, y, parent) {

            var sprite = new egame.Sprite(resourceKey);
            sprite.x = x || 0;
            sprite.y = y || 0;
            if (parent) {
                parent.addChild(sprite);
            } else {
                this.game.stage.addChild(sprite);
            }
            return sprite;
        },
        /**
         * 创建一个文本对象
         * @method egame.GameObjectCreator#text
         * @param {string} text -文本内容
         * @param {number} x - 文本的x坐标
         * @param {number} y - 文本的y坐标
         * @param {object} style - 文本的样式
         * @param {DisplayObject} parent text存放的容器默认为stage
         * @return {egame.Text} 返回创建的文本对象
         */
        text: function(x, y, text, style, parent) {

            var text = new egame.Text(text,style);
            text.x = x || 0;
            text.y = y || 0;
            if (parent) {
                parent.addChild(text);
            } else {
                this.game.stage.addChild(text);
            }
            return text;
        },
        /**
         * 创建平铺精灵对象
         *
         * @method egame.GameObjectCreator#sprite
         * @param {number} x - 精灵对象的x坐标
         * @param {number} y - 精灵对象的y坐标
         * @param {DisplayObject} parent tilingSprite存放的容器默认为stage
         * @returns {egame.Sprite} 新创建的平铺精灵对象
         */
        tilingSprite: function(resourceKey, width, height, x, y, parent) {
            var tilingSprite = new egame.TilingSprite(resourceKey, width || 0, height || 0);
            tilingSprite.x = x || 0;
            tilingSprite.y = y || 0;
            if (parent) {
                parent.addChild(tilingSprite);
            } else {
                this.game.stage.addChild(tilingSprite);
            }
            return tilingSprite;
        },
        /**
         * 创建图形对象
         *
         * @method egame.GameObjectCreator#graphics
         * @param {number} x - 精灵对象的x坐标
         * @param {number} y - 精灵对象的y坐标
         * @param {DisplayObject} parent graphics存放的容器默认为stage
         * @returns {egame.Sprite} 新创建的图形对象
         */
        graphics: function(x, y, parent) {
            var graphics = new egame.Graphics();
            graphics.x = x || 0;
            graphics.y = y || 0;
            if (parent) {
                parent.addChild(graphics);
            } else {
                this.game.stage.addChild(graphics);
            }
            return graphics;
        },
        /**
         * 创建精灵表对象
         *
         * @method egame.GameObjectCreator#spriteSheet
         * @param {number} x - 精灵对象的x坐标
         * @param {number} y - 精灵对象的y坐标
         * @param {DisplayObject} parent spriteSheet存放的容器默认为stage
         * @returns {egame.SpriteSheet} 新创建的精灵对象
         */
        spriteSheet: function(resourceKey, x, y, parent) {

            var spriteSheet = new egame.SpriteSheet(resourceKey);
            if (arguments[4]) {
                spriteSheet.spriteSheetConfig.apply(spriteSheet, Array.prototype.slice.call(arguments, 4));
            }
            spriteSheet.x = x || 0;
            spriteSheet.y = y || 0;
            if (parent) {
                parent.addChild(spriteSheet);
            } else {
                this.game.stage.addChild(spriteSheet);
            }
            return spriteSheet;
        },
        /**
         * 创建精灵动画对象
         *
         * @method egame.GameObjectCreator#spriteSheetAnimation
         * @param {number} x - 精灵对象的x坐标
         * @param {number} y - 精灵对象的y坐标
         * @param {DisplayObject} parent spriteSheetAnimation存放的容器默认为stage
         * @returns {egame.SpriteSheetAnimation} 新创建的精灵对象
         */
        spriteSheetAnimation: function(resourceKey, x, y, parent) {
            var spriteSheetAnimation = new egame.SpriteSheetAnimation(this.game, resourceKey);
            if (arguments[4]) {
                spriteSheetAnimation.spriteSheetConfig.apply(spriteSheetAnimation, Array.prototype.slice.call(arguments, 4));
            }
            spriteSheetAnimation.x = x || 0;
            spriteSheetAnimation.y = y || 0;
            if (parent) {
                parent.addChild(spriteSheetAnimation);
            } else {
                this.game.stage.addChild(spriteSheetAnimation);
            }
            return spriteSheetAnimation;
        },
        /**
         * 创建一个组对象
         * @method egame.GameObjectCreator#group
         * @param {number} x - 组的x坐标
         * @param {number} y - 组的y坐标
         * @param {object} style - 文本的样式
         * @param {DisplayObject} parent group存放的容器默认为stage
         * @return {egame.Group} 返回创建的组对象
         */
        group: function(x, y, parent, enableBody, physicsBodyType) {
            var group = new egame.Group(this.game, parent, enableBody, physicsBodyType);
            group.x = x || 0;
            group.y = y || 0;
            return group;
        }
    };

    egame.GameObjectCreator.prototype.constructor = egame.GameObjectCreator;

    return egame.GameObjectCreator;
});