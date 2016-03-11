egame.define("Group",["Container"],function(Container) {
    /**
     * Group是一个容器用来包含图片或者精灵
     * Groups是显示场景图型的逻辑树当局部变换被应用到Groups也同时应该到了Group的child.
     * 例如，当group移动旋转缩放的时候，所有的孩子也会跟着移动缩放旋转
     * 另外Groups提供快速池和对象回收机制
     * Groups也是显示对象可以做其他Groups的孩子。
     * 
     * @class egame.Group
     * @extends egame.Container
     * @param {egame.Game} game - 游戏对象引用
     * @param {DisplayObject|null} [parent=(game world)] - group会被添加到的祖先
     *     如果undefined/未设置Group会被添加到游戏世界; 如果是null被会被添加到任何父元素
     * @param {string} [name='group'] -group的名字
     * @param {boolean} [addToStage=false] - 如果是group会被添加到舞台，而不是world
     * @param {boolean} [enableBody=false] - 如果是true有物理刚体效果
     * @param {integer} [physicsBodyType=0] -物理刚体类型
     */
    egame.Group = function(game, parent, name, addToStage, enableBody, physicsBodyType) {

        if (addToStage === undefined) {
            addToStage = false;
        }
        if (enableBody === undefined) {
            enableBody = false;
        }
        if (physicsBodyType === undefined) {
            // physicsBodyType = egame.Physics.ARCADE;
        }

        /**
         * 引用当前游戏对象
         * @property {egame.Game} game
         * @protected
         */
        this.game = game;

        if (parent === undefined) {
            parent = game.world;
        }

        /**
         * group的名字
         * @property {string} name
         */
        this.name = name || 'group';

        /**
         * z坐标
         * 这个值必须是唯一对于每个孩子
         * @property {integer} z
         * @readOnly
         */
        this.z = 0;

        egame.Container.call(this);

        if (addToStage) {
            this.game.stage.addChild(this);
            this.z = this.game.stage.children.length;
        } else {
            if (parent) {
                parent.addChild(this);
                this.z = parent.children.length;
            }
        }

        /**
         * 类型
         * @property {integer} type
         * @protected
         */
        this.type = egame.GROUP;

        /**
         * @property {number} physicsType - 物理体类型
         * @readonly
         */
        this.physicsType = egame.GROUP;

        /**
         * alive是一个很有用的属性，当他作为其他组的孩子需要包含排斥的时候像forEachAlive
         */
        this.alive = true;

        /**
         * 如果存在是真的，则该组将被更新，否则将被跳过。
         */
        this.exists = true;

        /**
         * A group with `ignoreDestroy` set to `true` ignores all calls to its `destroy` method.
         * @property {boolean} ignoreDestroy
         * @default
         */
        this.ignoreDestroy = false;

        /**
         * A Group is that has `pendingDestroy` set to `true` is flagged to have its destroy method 
         * called on the next logic update.
         * You can set it directly to flag the Group to be destroyed on its next update.
         * 
         * This is extremely useful if you wish to destroy a Group from within one of its own callbacks 
         * or a callback of one of its children.
         * 
         * @property {boolean} pendingDestroy
         */
        this.pendingDestroy = false;

        /**
         * The type of objects that will be created when using {@link #create} or {@link #createMultiple}.
         *
         * Any object may be used but it should extend either Sprite or Image and accept the same constructor arguments:
         * when a new object is created it is passed the following parameters to its constructor: `(game, x, y, key, frame)`.
         *
         * @property {object} classType
         * @default {@link egame.Sprite}
         */
        this.classType = egame.Sprite;

        /**
         * The current display object that the group cursor is pointing to, if any. (Can be set manually.)
         *
         * The cursor is a way to iterate through the children in a Group using {@link #next} and {@link #previous}.
         * @property {?DisplayObject} cursor
         */
        this.cursor = null;

        /**
         * If true all Sprites created by, or added to this group, will have a physics body enabled on them.
         *
         * The default body type is controlled with {@link #physicsBodyType}.
         * @property {boolean} enableBody
         */
        this.enableBody = enableBody;

        /**
         * If true when a physics body is created (via {@link #enableBody}) it will create a physics debug object as well.
         *
         * This only works for P2 bodies.
         * @property {boolean} enableBodyDebug
         * @default
         */
        this.enableBodyDebug = false;

        /**
         * If {@link #enableBody} is true this is the type of physics body that is created on new Sprites.
         *
         * The valid values are {@link egame.Physics.ARCADE}, {@link egame.Physics.P2JS}, {@link egame.Physics.NINJA}, etc.
         * @property {integer} physicsBodyType
         */
        this.physicsBodyType = physicsBodyType;

        /**
         * If this Group contains Arcade Physics Sprites you can set a custom sort direction via this property.
         * 
         * It should be set to one of the egame.Physics.Arcade sort direction constants: 
         * 
         * egame.Physics.Arcade.SORT_NONE
         * egame.Physics.Arcade.LEFT_RIGHT
         * egame.Physics.Arcade.RIGHT_LEFT
         * egame.Physics.Arcade.TOP_BOTTOM
         * egame.Physics.Arcade.BOTTOM_TOP
         *
         * If set to `null` the Group will use whatever egame.Physics.Arcade.sortDirection is set to. This is the default behavior.
         * 
         * @property {integer} physicsSortDirection
         * @default
         */
        this.physicsSortDirection = null;

        /**
         * This signal is dispatched when the group is destroyed.
         * @property {egame.Signal} onDestroy
         */
        this.onDestroy = new egame.Signal();

        /**
         * @property {integer} cursorIndex - 群游标的当前索引，通过Group.next向前移动
         * @readOnly
         */
        this.cursorIndex = 0;

        /**
         * A Group that is fixed to the camera uses its x/y coordinates as offsets from the top left of the camera. These are stored in Group.cameraOffset.
         * 
         * Note that the cameraOffset values are in addition to any parent in the display list.
         * So if this Group was in a Group that has x: 200, then this will be added to the cameraOffset.x
         * 
         * @property {boolean} fixedToCamera
         */
        this.fixedToCamera = false;

        /**
         * If this object is {@link #fixedToCamera} then this stores the x/y position offset relative to the top-left of the camera view.
         * If the parent of this Group is also `fixedToCamera` then the offset here is in addition to that and should typically be disabled.
         * @property {egame.Point} cameraOffset
         */
        this.cameraOffset = new egame.Point();

        /**
         * The hash array is an array belonging to this Group into which you can add any of its children via Group.addToHash and Group.removeFromHash.
         * 
         * Only children of this Group can be added to and removed from the hash.
         * 
         * This hash is used automatically by egame Arcade Physics in order to perform non z-index based destructive sorting.
         * However if you don't use Arcade Physics, or this isn't a physics enabled Group, then you can use the hash to perform your own
         * sorting and filtering of Group children without touching their z-index (and therefore display draw order)
         * 
         * @property {array} hash
         */
        this.hash = [];

        /**
         * 孩子的排序属性
         * @property {string} _sortProperty
         * @private
         */
        this._sortProperty = 'z';

    };

    egame.Group.prototype = Object.create(egame.Container.prototype);
    egame.Group.prototype.constructor = egame.Group;

    /**
     * A returnType value, as specified in {@link #iterate} eg.
     * @constant
     * @type {integer}
     */
    egame.Group.RETURN_NONE = 0;

    /**
     * A returnType value, as specified in {@link #iterate} eg.
     * @constant
     * @type {integer}
     */
    egame.Group.RETURN_TOTAL = 1;

    /**
     * A returnType value, as specified in {@link #iterate} eg.
     * @constant
     * @type {integer}
     */
    egame.Group.RETURN_CHILD = 2;

    /**
     * A sort ordering value, as specified in {@link #sort} eg.
     * @constant
     * @type {integer}
     */
    egame.Group.SORT_ASCENDING = -1;

    /**
     * A sort ordering value, as specified in {@link #sort} eg.
     * @constant
     * @type {integer}
     */
    egame.Group.SORT_DESCENDING = 1;

    /**
     * 添加一个已经存在的对象作为group的顶部子元素
     * 孩子被自动添加到组的顶部并且显示在所有孩子的上面
     * 如果Group.enableBody被设置，那么物理体将会被创建到这个对象上，只要没有已经存在的。
     * 使用addAt控制在哪里添加孩子。使用create和add添加新孩子
     * @method egame.Group#add
     * @param {DisplayObject} child -显示对象
     * @param {boolean} [silent=false] - 静默添加，不出发onAddedToGroup事件
     * @return {DisplayObject} 返回被添加到组的孩子
     */
    egame.Group.prototype.add = function(child, silent) {

        if (silent === undefined) {
            silent = false;
        }

        if (child.parent !== this) {
            this.addChild(child);

            child.z = this.children.length;

            if (this.enableBody && child.body === null) {
                this.game.physics.enable(child, this.physicsBodyType);
            } else if (child.body) {
                this.addToHash(child);
            }

            if (!silent && child.events) {
                child.events.onAddedToGroup$dispatch(child, this);
            }

            if (this.cursor === null) {
                this.cursor = child;
            }
        }

        return child;

    };

    /**
     * 添加一个孩子到hash数组
     * 如果这个孩子不是这个组的孩子，或者已经在hash数组中会被返回
     * @method egame.Group#addToHash
     * @param {DisplayObject} child 被添加到Groups hash数组中的显示对象
     */
    egame.Group.prototype.addToHash = function(child) {

        if (child.parent === this) {
            var index = this.hash.indexOf(child);

            if (index === -1) {
                this.hash.push(child);
                return true;
            }
        }

        return false;

    };

    /**
     * 移除hash数组中的孩子
     */
    egame.Group.prototype.removeFromHash = function(child) {

        if (child) {
            var index = this.hash.indexOf(child);

            if (index !== -1) {
                this.hash.splice(index, 1);
                return true;
            }
        }

        return false;

    };

    /**
     * 添加一组显示对象数组到Group里面
     *你可以可以传入一个Group这个时候这个Group的所有孩子将被移动到这个组
     */
    egame.Group.prototype.addMultiple = function(children, silent) {

        if (children instanceof egame.Group) {
            children.moveAll(this, silent);
        } else if (Array.isArray(children)) {
            for (var i = 0; i < children.length; i++) {
                this.add(children[i], silent);
            }
        }

        return children;

    };

    /**
     *  添加一个存在对象到组中，孩子会被添加到指定的位置，这允许你控制孩子的顺序
     *
     * @method egame.Group#addAt
     * @param {DisplayObject} child - 显示对象
     * @param {integer} [index=0] - 添加位置
     * @param {boolean} [silent=false] - 如果是真的不触发 `onAddedToGroup` 事件.
     */
    egame.Group.prototype.addAt = function(child, index, silent) {

        if (silent === undefined) {
            silent = false;
        }

        if (child.parent !== this) {
            this.addChildAt(child, index);

            this.updateZ();

            if (this.enableBody && child.body === null) {
                this.game.physics.enable(child, this.physicsBodyType);
            } else if (child.body) {
                this.addToHash(child);
            }

            if (!silent && child.events) {
                child.events.onAddedToGroup$dispatch(child, this);
            }

            if (this.cursor === null) {
                this.cursor = child;
            }
        }

        return child;

    };

    /**
     * 返回给定索引的孩子
     * @method egame.Group#getAt
     */
    egame.Group.prototype.getAt = function(index) {

        if (index < 0 || index >= this.children.length) {
            return -1;
        } else {
            return this.getChildAt(index);
        }

    };

    /**
     * Creates a new egame.Sprite object and adds it to the top of this group.
     *
     * Use {@link #classType} to change the type of object created.
     *
     * @method egame.Group#create
     * @param {number} x - The x coordinate to display the newly created Sprite at. The value is in relation to the group.x point.
     * @param {number} y - The y coordinate to display the newly created Sprite at. The value is in relation to the group.y point.
     * @param {string|egame.RenderTexture|egame.BitmapData|egame.Video|egame.Texture} [key] - This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache Image entry, or an instance of a RenderTexture, BitmapData, Video or egame.Texture.
     * @param {string|number} [frame] - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
     * @param {boolean} [exists=true] - The default exists state of the Sprite.
     * @return {DisplayObject} The child that was created: will be a {@link egame.Sprite} unless {@link #classType} has been changed.
     */
    egame.Group.prototype.create = function(x, y, key, frame, exists) {

        if (exists === undefined) {
            exists = true;
        }

        var child = new this.classType(this.game, x, y, key, frame);

        child.exists = exists;
        child.visible = exists;
        child.alive = exists;

        this.addChild(child);

        child.z = this.children.length;

        if (this.enableBody) {
            this.game.physics.enable(child, this.physicsBodyType, this.enableBodyDebug);
        }

        if (child.events) {
            child.events.onAddedToGroup$dispatch(child, this);
        }

        if (this.cursor === null) {
            this.cursor = child;
        }

        return child;

    };

    /**
     * Creates multiple egame.Sprite objects and adds them to the top of this group.
     *
     * Useful if you need to quickly generate a pool of identical sprites, such as bullets.
     *
     * By default the sprites will be set to not exist and will be positioned at 0, 0 (relative to the group.x/y).
     * Use {@link #classType} to change the type of object created.
     *
     * @method egame.Group#createMultiple
     * @param {integer} quantity - The number of Sprites to create.
     * @param {string} key - The Game.cache key of the image that this Sprite will use.
     * @param {integer|string} [frame] - If the Sprite image contains multiple frames you can specify which one to use here.
     * @param {boolean} [exists=false] - The default exists state of the Sprite.
     */
    egame.Group.prototype.createMultiple = function(quantity, key, frame, exists) {

        if (exists === undefined) {
            exists = false;
        }

        for (var i = 0; i < quantity; i++) {
            this.create(0, 0, key, frame, exists);
        }

    };

    /**
     * 更新孩子的z坐标
     * 这个必须在孩子顺序发生变换的时候调用，以便他们有正确的z坐标
     *
     * @method egame.Group#updateZ
     * @protected
     */
    egame.Group.prototype.updateZ = function() {

        var i = this.children.length;

        while (i--) {
            this.children[i].z = i;
        }

    };

    /**
     * Sets the group cursor to the first child in the group.
     *
     * If the optional index parameter is given it sets the cursor to the object at that index instead.
     *
     * @method egame.Group#resetCursor
     * @param {integer} [index=0] - Set the cursor to point to a specific index.
     * @return {any} The child the cursor now points to.
     */
    egame.Group.prototype.resetCursor = function(index) {

        if (index === undefined) {
            index = 0;
        }

        if (index > this.children.length - 1) {
            index = 0;
        }

        if (this.cursor) {
            this.cursorIndex = index;
            this.cursor = this.children[this.cursorIndex];
            return this.cursor;
        }

    };

    /**
     * Advances the group cursor to the next (higher) object in the group.
     *
     * If the cursor is at the end of the group (top child) it is moved the start of the group (bottom child).
     *
     * @method egame.Group#next
     * @return {any} The child the cursor now points to.
     */
    egame.Group.prototype.next = function() {

        if (this.cursor) {
            //  Wrap the cursor?
            if (this.cursorIndex >= this.children.length - 1) {
                this.cursorIndex = 0;
            } else {
                this.cursorIndex++;
            }

            this.cursor = this.children[this.cursorIndex];

            return this.cursor;
        }

    };

    /**
     * Moves the group cursor to the previous (lower) child in the group.
     *
     * If the cursor is at the start of the group (bottom child) it is moved to the end (top child).
     *
     * @method egame.Group#previous
     * @return {any} The child the cursor now points to.
     */
    egame.Group.prototype.previous = function() {

        if (this.cursor) {
            //  Wrap the cursor?
            if (this.cursorIndex === 0) {
                this.cursorIndex = this.children.length - 1;
            } else {
                this.cursorIndex--;
            }

            this.cursor = this.children[this.cursorIndex];

            return this.cursor;
        }

    };

    /**
     * Swaps the position of two children in this group.
     *
     * Both children must be in this group, a child cannot be swapped with itself, and unparented children cannot be swapped.
     *
     * @method egame.Group#swap
     * @param {any} child1 - The first child to swap.
     * @param {any} child2 - The second child to swap.
     */
    egame.Group.prototype.swap = function(child1, child2) {

        this.swapChildren(child1, child2);
        this.updateZ();

    };

    /**
     * Brings the given child to the top of this group so it renders above all other children.
     *
     * @method egame.Group#bringToTop
     * @param {any} child - The child to bring to the top of this group.
     * @return {any} The child that was moved.
     */
    egame.Group.prototype.bringToTop = function(child) {

        if (child.parent === this && this.getIndex(child) < this.children.length) {
            this.remove(child, false, true);
            this.add(child, true);
        }

        return child;

    };

    /**
     * Sends the given child to the bottom of this group so it renders below all other children.
     *
     * @method egame.Group#sendToBack
     * @param {any} child - The child to send to the bottom of this group.
     * @return {any} The child that was moved.
     */
    egame.Group.prototype.sendToBack = function(child) {

        if (child.parent === this && this.getIndex(child) > 0) {
            this.remove(child, false, true);
            this.addAt(child, 0, true);
        }

        return child;

    };

    /**
     * Moves the given child up one place in this group unless it's already at the top.
     *
     * @method egame.Group#moveUp
     * @param {any} child - The child to move up in the group.
     * @return {any} The child that was moved.
     */
    egame.Group.prototype.moveUp = function(child) {

        if (child.parent === this && this.getIndex(child) < this.children.length - 1) {
            var a = this.getIndex(child);
            var b = this.getAt(a + 1);

            if (b) {
                this.swap(child, b);
            }
        }

        return child;

    };

    /**
     * Moves the given child down one place in this group unless it's already at the bottom.
     *
     * @method egame.Group#moveDown
     * @param {any} child - The child to move down in the group.
     * @return {any} The child that was moved.
     */
    egame.Group.prototype.moveDown = function(child) {

        if (child.parent === this && this.getIndex(child) > 0) {
            var a = this.getIndex(child);
            var b = this.getAt(a - 1);

            if (b) {
                this.swap(child, b);
            }
        }

        return child;

    };

    /**
     * Positions the child found at the given index within this group to the given x and y coordinates.
     *
     * @method egame.Group#xy
     * @param {integer} index - The index of the child in the group to set the position of.
     * @param {number} x - The new x position of the child.
     * @param {number} y - The new y position of the child.
     */
    egame.Group.prototype.xy = function(index, x, y) {

        if (index < 0 || index > this.children.length) {
            return -1;
        } else {
            this.getChildAt(index).x = x;
            this.getChildAt(index).y = y;
        }

    };

    /**
     * Reverses all children in this group.
     *
     * This operaation applies only to immediate children and does not propagate to subgroups.
     *
     * @method egame.Group#reverse
     */
    egame.Group.prototype.reverse = function() {

        this.children.reverse();
        this.updateZ();

    };

    /**
     * Get the index position of the given child in this group, which should match the child's `z` property.
     *
     * @method egame.Group#getIndex
     * @param {any} child - The child to get the index for.
     * @return {integer} The index of the child or -1 if it's not a member of this group.
     */
    egame.Group.prototype.getIndex = function(child) {

        return this.children.indexOf(child);

    };

    /**
     * Replaces a child of this group with the given newChild. The newChild cannot be a member of this group.
     *
     * @method egame.Group#replace
     * @param {any} oldChild - The child in this group that will be replaced.
     * @param {any} newChild - The child to be inserted into this group.
     * @return {any} Returns the oldChild that was replaced within this group.
     */
    egame.Group.prototype.replace = function(oldChild, newChild) {

        var index = this.getIndex(oldChild);

        if (index !== -1) {
            if (newChild.parent) {
                if (newChild.parent instanceof egame.Group) {
                    newChild.parent.remove(newChild);
                } else {
                    newChild.parent.removeChild(newChild);
                }
            }

            this.remove(oldChild);

            this.addAt(newChild, index);

            return oldChild;
        }

    };

    /**
     * Checks if the child has the given property.
     *
     * Will scan up to 4 levels deep only.
     *
     * @method egame.Group#hasProperty
     * @param {any} child - The child to check for the existance of the property on.
     * @param {string[]} key - An array of strings that make up the property.
     * @return {boolean} True if the child has the property, otherwise false.
     */
    egame.Group.prototype.hasProperty = function(child, key) {

        var len = key.length;

        if (len === 1 && key[0] in child) {
            return true;
        } else if (len === 2 && key[0] in child && key[1] in child[key[0]]) {
            return true;
        } else if (len === 3 && key[0] in child && key[1] in child[key[0]] && key[2] in child[key[0]][key[1]]) {
            return true;
        } else if (len === 4 && key[0] in child && key[1] in child[key[0]] && key[2] in child[key[0]][key[1]] && key[3] in child[key[0]][key[1]][key[2]]) {
            return true;
        }

        return false;

    };

    /**
     * Sets a property to the given value on the child. The operation parameter controls how the value is set.
     *
     * The operations are:
     * - 0: set the existing value to the given value; if force is `true` a new property will be created if needed
     * - 1: will add the given value to the value already present.
     * - 2: will subtract the given value from the value already present.
     * - 3: will multiply the value already present by the given value.
     * - 4: will divide the value already present by the given value.
     *
     * @method egame.Group#setProperty
     * @param {any} child - The child to set the property value on.
     * @param {array} key - An array of strings that make up the property that will be set.
     * @param {any} value - The value that will be set.
     * @param {integer} [operation=0] - Controls how the value is assigned. A value of 0 replaces the value with the new one. A value of 1 adds it, 2 subtracts it, 3 multiplies it and 4 divides it.
     * @param {boolean} [force=false] - If `force` is true then the property will be set on the child regardless if it already exists or not. If false and the property doesn't exist, nothing will be set.
     * @return {boolean} True if the property was set, false if not.
     */
    egame.Group.prototype.setProperty = function(child, key, value, operation, force) {

        if (force === undefined) {
            force = false;
        }

        operation = operation || 0;

        //  As ugly as this approach looks, and although it's limited to a depth of only 4, it's much faster than a for loop or object iteration.

        //  0 = Equals
        //  1 = Add
        //  2 = Subtract
        //  3 = Multiply
        //  4 = Divide

        //  We can't force a property in and the child doesn't have it, so abort.
        //  Equally we can't add, subtract, multiply or divide a property value if it doesn't exist, so abort in those cases too.
        if (!this.hasProperty(child, key) && (!force || operation > 0)) {
            return false;
        }

        var len = key.length;

        if (len === 1) {
            if (operation === 0) {
                child[key[0]] = value;
            } else if (operation == 1) {
                child[key[0]] += value;
            } else if (operation == 2) {
                child[key[0]] -= value;
            } else if (operation == 3) {
                child[key[0]] *= value;
            } else if (operation == 4) {
                child[key[0]] /= value;
            }
        } else if (len === 2) {
            if (operation === 0) {
                child[key[0]][key[1]] = value;
            } else if (operation == 1) {
                child[key[0]][key[1]] += value;
            } else if (operation == 2) {
                child[key[0]][key[1]] -= value;
            } else if (operation == 3) {
                child[key[0]][key[1]] *= value;
            } else if (operation == 4) {
                child[key[0]][key[1]] /= value;
            }
        } else if (len === 3) {
            if (operation === 0) {
                child[key[0]][key[1]][key[2]] = value;
            } else if (operation == 1) {
                child[key[0]][key[1]][key[2]] += value;
            } else if (operation == 2) {
                child[key[0]][key[1]][key[2]] -= value;
            } else if (operation == 3) {
                child[key[0]][key[1]][key[2]] *= value;
            } else if (operation == 4) {
                child[key[0]][key[1]][key[2]] /= value;
            }
        } else if (len === 4) {
            if (operation === 0) {
                child[key[0]][key[1]][key[2]][key[3]] = value;
            } else if (operation == 1) {
                child[key[0]][key[1]][key[2]][key[3]] += value;
            } else if (operation == 2) {
                child[key[0]][key[1]][key[2]][key[3]] -= value;
            } else if (operation == 3) {
                child[key[0]][key[1]][key[2]][key[3]] *= value;
            } else if (operation == 4) {
                child[key[0]][key[1]][key[2]][key[3]] /= value;
            }
        }

        return true;

    };

    /**
     * Checks a property for the given value on the child.
     *
     * @method egame.Group#checkProperty
     * @param {any} child - The child to check the property value on.
     * @param {array} key - An array of strings that make up the property that will be set.
     * @param {any} value - The value that will be checked.
     * @param {boolean} [force=false] - If `force` is true then the property will be checked on the child regardless if it already exists or not. If true and the property doesn't exist, false will be returned.
     * @return {boolean} True if the property was was equal to value, false if not.
     */
    egame.Group.prototype.checkProperty = function(child, key, value, force) {

        if (force === undefined) {
            force = false;
        }

        //  We can't force a property in and the child doesn't have it, so abort.
        if (!egame.Utils.getProperty(child, key) && force) {
            return false;
        }

        if (egame.Utils.getProperty(child, key) !== value) {
            return false;
        }

        return true;

    };

    /**
     * Quickly set a property on a single child of this group to a new value.
     *
     * The operation parameter controls how the new value is assigned to the property, from simple replacement to addition and multiplication.
     *
     * @method egame.Group#set
     * @param {egame.Sprite} child - The child to set the property on.
     * @param {string} key - The property, as a string, to be set. For example: 'body.velocity.x'
     * @param {any} value - The value that will be set.
     * @param {boolean} [checkAlive=false] - If set then the child will only be updated if alive=true.
     * @param {boolean} [checkVisible=false] - If set then the child will only be updated if visible=true.
     * @param {integer} [operation=0] - Controls how the value is assigned. A value of 0 replaces the value with the new one. A value of 1 adds it, 2 subtracts it, 3 multiplies it and 4 divides it.
     * @param {boolean} [force=false] - If `force` is true then the property will be set on the child regardless if it already exists or not. If false and the property doesn't exist, nothing will be set.
     * @return {boolean} True if the property was set, false if not.
     */
    egame.Group.prototype.set = function(child, key, value, checkAlive, checkVisible, operation, force) {

        if (force === undefined) {
            force = false;
        }

        key = key.split('.');

        if (checkAlive === undefined) {
            checkAlive = false;
        }
        if (checkVisible === undefined) {
            checkVisible = false;
        }

        if ((checkAlive === false || (checkAlive && child.alive)) && (checkVisible === false || (checkVisible && child.visible))) {
            return this.setProperty(child, key, value, operation, force);
        }

    };

    /**
     * Quickly set the same property across all children of this group to a new value.
     *
     * This call doesn't descend down children, so if you have a Group inside of this group, the property will be set on the group but not its children.
     * If you need that ability please see `Group.setAllChildren`.
     *
     * The operation parameter controls how the new value is assigned to the property, from simple replacement to addition and multiplication.
     *
     * @method egame.Group#setAll
     * @param {string} key - The property, as a string, to be set. For example: 'body.velocity.x'
     * @param {any} value - The value that will be set.
     * @param {boolean} [checkAlive=false] - If set then only children with alive=true will be updated. This includes any Groups that are children.
     * @param {boolean} [checkVisible=false] - If set then only children with visible=true will be updated. This includes any Groups that are children.
     * @param {integer} [operation=0] - Controls how the value is assigned. A value of 0 replaces the value with the new one. A value of 1 adds it, 2 subtracts it, 3 multiplies it and 4 divides it.
     * @param {boolean} [force=false] - If `force` is true then the property will be set on the child regardless if it already exists or not. If false and the property doesn't exist, nothing will be set.
     */
    egame.Group.prototype.setAll = function(key, value, checkAlive, checkVisible, operation, force) {

        if (checkAlive === undefined) {
            checkAlive = false;
        }
        if (checkVisible === undefined) {
            checkVisible = false;
        }
        if (force === undefined) {
            force = false;
        }

        key = key.split('.');
        operation = operation || 0;

        for (var i = 0; i < this.children.length; i++) {
            if ((!checkAlive || (checkAlive && this.children[i].alive)) && (!checkVisible || (checkVisible && this.children[i].visible))) {
                this.setProperty(this.children[i], key, value, operation, force);
            }
        }

    };

    /**
     * Quickly set the same property across all children of this group, and any child Groups, to a new value.
     *
     * If this group contains other Groups then the same property is set across their children as well, iterating down until it reaches the bottom.
     * Unlike with `setAll` the property is NOT set on child Groups itself.
     *
     * The operation parameter controls how the new value is assigned to the property, from simple replacement to addition and multiplication.
     *
     * @method egame.Group#setAllChildren
     * @param {string} key - The property, as a string, to be set. For example: 'body.velocity.x'
     * @param {any} value - The value that will be set.
     * @param {boolean} [checkAlive=false] - If set then only children with alive=true will be updated. This includes any Groups that are children.
     * @param {boolean} [checkVisible=false] - If set then only children with visible=true will be updated. This includes any Groups that are children.
     * @param {integer} [operation=0] - Controls how the value is assigned. A value of 0 replaces the value with the new one. A value of 1 adds it, 2 subtracts it, 3 multiplies it and 4 divides it.
     * @param {boolean} [force=false] - If `force` is true then the property will be set on the child regardless if it already exists or not. If false and the property doesn't exist, nothing will be set.
     */
    egame.Group.prototype.setAllChildren = function(key, value, checkAlive, checkVisible, operation, force) {

        if (checkAlive === undefined) {
            checkAlive = false;
        }
        if (checkVisible === undefined) {
            checkVisible = false;
        }
        if (force === undefined) {
            force = false;
        }

        operation = operation || 0;

        for (var i = 0; i < this.children.length; i++) {
            if ((!checkAlive || (checkAlive && this.children[i].alive)) && (!checkVisible || (checkVisible && this.children[i].visible))) {
                if (this.children[i] instanceof egame.Group) {
                    this.children[i].setAllChildren(key, value, checkAlive, checkVisible, operation, force);
                } else {
                    this.setProperty(this.children[i], key.split('.'), value, operation, force);
                }
            }
        }

    };

    /**
     * Quickly check that the same property across all children of this group is equal to the given value.
     *
     * This call doesn't descend down children, so if you have a Group inside of this group, the property will be checked on the group but not its children.
     *
     * @method egame.Group#checkAll
     * @param {string} key - The property, as a string, to be set. For example: 'body.velocity.x'
     * @param {any} value - The value that will be checked.
     * @param {boolean} [checkAlive=false] - If set then only children with alive=true will be checked. This includes any Groups that are children.
     * @param {boolean} [checkVisible=false] - If set then only children with visible=true will be checked. This includes any Groups that are children.
     * @param {boolean} [force=false] - If `force` is true then the property will be checked on the child regardless if it already exists or not. If true and the property doesn't exist, false will be returned.
     */
    egame.Group.prototype.checkAll = function(key, value, checkAlive, checkVisible, force) {

        if (checkAlive === undefined) {
            checkAlive = false;
        }
        if (checkVisible === undefined) {
            checkVisible = false;
        }
        if (force === undefined) {
            force = false;
        }

        for (var i = 0; i < this.children.length; i++) {
            if ((!checkAlive || (checkAlive && this.children[i].alive)) && (!checkVisible || (checkVisible && this.children[i].visible))) {
                if (!this.checkProperty(this.children[i], key, value, force)) {
                    return false;
                }
            }
        }

        return true;

    };

    /**
     * Adds the amount to the given property on all children in this group.
     *
     * `Group.addAll('x', 10)` will add 10 to the child.x value for each child.
     *
     * @method egame.Group#addAll
     * @param {string} property - The property to increment, for example 'body.velocity.x' or 'angle'.
     * @param {number} amount - The amount to increment the property by. If child.x = 10 then addAll('x', 40) would make child.x = 50.
     * @param {boolean} checkAlive - If true the property will only be changed if the child is alive.
     * @param {boolean} checkVisible - If true the property will only be changed if the child is visible.
     */
    egame.Group.prototype.addAll = function(property, amount, checkAlive, checkVisible) {

        this.setAll(property, amount, checkAlive, checkVisible, 1);

    };

    /**
     * Subtracts the amount from the given property on all children in this group.
     *
     * `Group.subAll('x', 10)` will minus 10 from the child.x value for each child.
     *
     * @method egame.Group#subAll
     * @param {string} property - The property to decrement, for example 'body.velocity.x' or 'angle'.
     * @param {number} amount - The amount to subtract from the property. If child.x = 50 then subAll('x', 40) would make child.x = 10.
     * @param {boolean} checkAlive - If true the property will only be changed if the child is alive.
     * @param {boolean} checkVisible - If true the property will only be changed if the child is visible.
     */
    egame.Group.prototype.subAll = function(property, amount, checkAlive, checkVisible) {

        this.setAll(property, amount, checkAlive, checkVisible, 2);

    };

    /**
     * Multiplies the given property by the amount on all children in this group.
     *
     * `Group.multiplyAll('x', 2)` will x2 the child.x value for each child.
     *
     * @method egame.Group#multiplyAll
     * @param {string} property - The property to multiply, for example 'body.velocity.x' or 'angle'.
     * @param {number} amount - The amount to multiply the property by. If child.x = 10 then multiplyAll('x', 2) would make child.x = 20.
     * @param {boolean} checkAlive - If true the property will only be changed if the child is alive.
     * @param {boolean} checkVisible - If true the property will only be changed if the child is visible.
     */
    egame.Group.prototype.multiplyAll = function(property, amount, checkAlive, checkVisible) {

        this.setAll(property, amount, checkAlive, checkVisible, 3);

    };

    /**
     * Divides the given property by the amount on all children in this group.
     *
     * `Group.divideAll('x', 2)` will half the child.x value for each child.
     *
     * @method egame.Group#divideAll
     * @param {string} property - The property to divide, for example 'body.velocity.x' or 'angle'.
     * @param {number} amount - The amount to divide the property by. If child.x = 100 then divideAll('x', 2) would make child.x = 50.
     * @param {boolean} checkAlive - If true the property will only be changed if the child is alive.
     * @param {boolean} checkVisible - If true the property will only be changed if the child is visible.
     */
    egame.Group.prototype.divideAll = function(property, amount, checkAlive, checkVisible) {

        this.setAll(property, amount, checkAlive, checkVisible, 4);

    };

    /**
     * Calls a function, specified by name, on all children in the group who exist (or do not exist).
     *
     * After the existsValue parameter you can add as many parameters as you like, which will all be passed to the child callback.
     *
     * @method egame.Group#callAllExists
     * @param {string} callback - Name of the function on the children to call.
     * @param {boolean} existsValue - Only children with exists=existsValue will be called.
     * @param {...any} parameter - Additional parameters that will be passed to the callback.
     */
    egame.Group.prototype.callAllExists = function(callback, existsValue) {

        var args;

        if (arguments.length > 2) {
            args = [];

            for (var i = 2; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
        }

        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].exists === existsValue && this.children[i][callback]) {
                this.children[i][callback].apply(this.children[i], args);
            }
        }

    };

    /**
     * Returns a reference to a function that exists on a child of the group based on the given callback array.
     *
     * @method egame.Group#callbackFromArray
     * @param {object} child - The object to inspect.
     * @param {array} callback - The array of function names.
     * @param {integer} length - The size of the array (pre-calculated in callAll).
     * @protected
     */
    egame.Group.prototype.callbackFromArray = function(child, callback, length) {

        //  Kinda looks like a Christmas tree

        if (length == 1) {
            if (child[callback[0]]) {
                return child[callback[0]];
            }
        } else if (length == 2) {
            if (child[callback[0]][callback[1]]) {
                return child[callback[0]][callback[1]];
            }
        } else if (length == 3) {
            if (child[callback[0]][callback[1]][callback[2]]) {
                return child[callback[0]][callback[1]][callback[2]];
            }
        } else if (length == 4) {
            if (child[callback[0]][callback[1]][callback[2]][callback[3]]) {
                return child[callback[0]][callback[1]][callback[2]][callback[3]];
            }
        } else {
            if (child[callback]) {
                return child[callback];
            }
        }

        return false;

    };

    /**
     * Calls a function, specified by name, on all on children.
     *
     * The function is called for all children regardless if they are dead or alive (see callAllExists for different options).
     * After the method parameter and context you can add as many extra parameters as you like, which will all be passed to the child.
     *
     * @method egame.Group#callAll
     * @param {string} method - Name of the function on the child to call. Deep property lookup is supported.
     * @param {string} [context=null] - A string containing the context under which the method will be executed. Set to null to default to the child.
     * @param {...any} args - Additional parameters that will be passed to the method.
     */
    egame.Group.prototype.callAll = function(method, context) {

        if (method === undefined) {
            return;
        }

        //  Extract the method into an array
        method = method.split('.');

        var methodLength = method.length;

        if (context === undefined || context === null || context === '') {
            context = null;
        } else {
            //  Extract the context into an array
            if (typeof context === 'string') {
                context = context.split('.');
                var contextLength = context.length;
            }
        }

        var args;

        if (arguments.length > 2) {
            args = [];

            for (var i = 2; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
        }

        var callback = null;
        var callbackContext = null;

        for (var i = 0; i < this.children.length; i++) {
            callback = this.callbackFromArray(this.children[i], method, methodLength);

            if (context && callback) {
                callbackContext = this.callbackFromArray(this.children[i], context, contextLength);

                if (callback) {
                    callback.apply(callbackContext, args);
                }
            } else if (callback) {
                callback.apply(this.children[i], args);
            }
        }

    };

    /**
     * The core preUpdate - as called by World.
     * @method egame.Group#preUpdate
     * @protected
     */
    egame.Group.prototype.preUpdate = function() {

        if (this.pendingDestroy) {
            this.destroy();
            return false;
        }

        if (!this.exists || !this.parent.exists) {
            this.renderOrderID = -1;
            return false;
        }

        var i = this.children.length;

        while (i--) {
            this.children[i].preUpdate();
        }

        return true;

    };

    /**
     * The core update - as called by World.
     * @method egame.Group#update
     * @protected
     */
    egame.Group.prototype.update = function() {

        var i = this.children.length;

        while (i--) {
            this.children[i].update();
        }

    };

    /**
     * The core postUpdate - as called by World.
     * @method egame.Group#postUpdate
     * @protected
     */
    egame.Group.prototype.postUpdate = function() {

        //  Fixed to Camera?
        if (this.fixedToCamera) {
            this.x = this.game.camera.view.x + this.cameraOffset.x;
            this.y = this.game.camera.view.y + this.cameraOffset.y;
        }

        var i = this.children.length;

        while (i--) {
            this.children[i].postUpdate();
        }

    };


    /**
     * Find children matching a certain predicate.
     *
     * For example:
     *
     *     var healthyList = Group.filter(function(child, index, children) {
     *         return child.health > 10 ? true : false;
     *     }, true);
     *     healthyList.callAll('attack');
     *
     * Note: Currently this will skip any children which are Groups themselves.
     *
     * @method egame.Group#filter
     * @param {function} predicate - The function that each child will be evaluated against. Each child of the group will be passed to it as its first parameter, the index as the second, and the entire child array as the third
     * @param {boolean} [checkExists=false] - If true, only existing can be selected; otherwise all children can be selected and will be passed to the predicate.
     * @return {egame.ArraySet} Returns an array list containing all the children that the predicate returned true for
     */
    egame.Group.prototype.filter = function(predicate, checkExists) {

        var index = -1;
        var length = this.children.length;
        var results = [];

        while (++index < length) {
            var child = this.children[index];

            if (!checkExists || (checkExists && child.exists)) {
                if (predicate(child, index, this.children)) {
                    results.push(child);
                }
            }
        }

        return new egame.ArraySet(results);

    };

    /**
     * Call a function on each child in this group.
     *
     * Additional arguments for the callback can be specified after the `checkExists` parameter. For example,
     *
     *     Group.forEach(awardBonusGold, this, true, 100, 500)
     *
     * would invoke `awardBonusGold` function with the parameters `(child, 100, 500)`.
     *
     * Note: This check will skip any children which are Groups themselves.
     *
     * @method egame.Group#forEach
     * @param {function} callback - The function that will be called for each applicable child. The child will be passed as the first argument.
     * @param {object} callbackContext - The context in which the function should be called (usually 'this').
     * @param {boolean} [checkExists=false] - If set only children matching for which `exists` is true will be passed to the callback, otherwise all children will be passed.
     * @param {...any} [args=(none)] - Additional arguments to pass to the callback function, after the child item.
     */
    egame.Group.prototype.forEach = function(callback, callbackContext, checkExists) {

        if (checkExists === undefined) {
            checkExists = false;
        }

        if (arguments.length <= 3) {
            for (var i = 0; i < this.children.length; i++) {
                if (!checkExists || (checkExists && this.children[i].exists)) {
                    callback.call(callbackContext, this.children[i]);
                }
            }
        } else {
            // Assigning to arguments properties causes Extreme Deoptimization in Chrome, FF, and IE.
            // Using an array and pushing each element (not a slice!) is _significantly_ faster.
            var args = [null];

            for (var i = 3; i < arguments.length; i++) {
                args.push(arguments[i]);
            }

            for (var i = 0; i < this.children.length; i++) {
                if (!checkExists || (checkExists && this.children[i].exists)) {
                    args[0] = this.children[i];
                    callback.apply(callbackContext, args);
                }
            }
        }

    };

    /**
     * Call a function on each existing child in this group.
     *
     * See {@link egame.Group#forEach forEach} for details.
     *
     * @method egame.Group#forEachExists
     * @param {function} callback - The function that will be called for each applicable child. The child will be passed as the first argument.
     * @param {object} callbackContext - The context in which the function should be called (usually 'this').
     * @param {...any} [args=(none)] - Additional arguments to pass to the callback function, after the child item.
     */
    egame.Group.prototype.forEachExists = function(callback, callbackContext) {

        var args;

        if (arguments.length > 2) {
            args = [null];

            for (var i = 2; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
        }

        this.iterate('exists', true, egame.Group.RETURN_TOTAL, callback, callbackContext, args);

    };

    /**
     * Call a function on each alive child in this group.
     *
     * See {@link egame.Group#forEach forEach} for details.
     *
     * @method egame.Group#forEachAlive
     * @param {function} callback - The function that will be called for each applicable child. The child will be passed as the first argument.
     * @param {object} callbackContext - The context in which the function should be called (usually 'this').
     * @param {...any} [args=(none)] - Additional arguments to pass to the callback function, after the child item.
     */
    egame.Group.prototype.forEachAlive = function(callback, callbackContext) {

        var args;

        if (arguments.length > 2) {
            args = [null];

            for (var i = 2; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
        }

        this.iterate('alive', true, egame.Group.RETURN_TOTAL, callback, callbackContext, args);

    };

    /**
     * Call a function on each dead child in this group.
     *
     * See {@link egame.Group#forEach forEach} for details.
     *
     * @method egame.Group#forEachDead
     * @param {function} callback - The function that will be called for each applicable child. The child will be passed as the first argument.
     * @param {object} callbackContext - The context in which the function should be called (usually 'this').
     * @param {...any} [args=(none)] - Additional arguments to pass to the callback function, after the child item.
     */
    egame.Group.prototype.forEachDead = function(callback, callbackContext) {

        var args;

        if (arguments.length > 2) {
            args = [null];

            for (var i = 2; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
        }

        this.iterate('alive', false, egame.Group.RETURN_TOTAL, callback, callbackContext, args);

    };

    /**
     * Sort the children in the group according to a particular key and ordering.
     *
     * Call this function to sort the group according to a particular key value and order.
     * For example to depth sort Sprites for Zelda-style game you might call `group.sort('y', egame.Group.SORT_ASCENDING)` at the bottom of your `State.update()`.
     *
     * @method egame.Group#sort
     * @param {string} [key='z'] - The name of the property to sort on. Defaults to the objects z-depth value.
     * @param {integer} [order=egame.Group.SORT_ASCENDING] - Order ascending ({@link egame.Group.SORT_ASCENDING SORT_ASCENDING}) or descending ({@link egame.Group.SORT_DESCENDING SORT_DESCENDING}).
     */
    egame.Group.prototype.sort = function(key, order) {

        if (this.children.length < 2) {
            //  Nothing to swap
            return;
        }

        if (key === undefined) {
            key = 'z';
        }
        if (order === undefined) {
            order = egame.Group.SORT_ASCENDING;
        }

        this._sortProperty = key;

        if (order === egame.Group.SORT_ASCENDING) {
            this.children.sort(this.ascendingSortHandler.bind(this));
        } else {
            this.children.sort(this.descendingSortHandler.bind(this));
        }

        this.updateZ();

    };

    /**
     * Sort the children in the group according to custom sort function.
     *
     * The `sortHandler` is provided the two parameters: the two children involved in the comparison (a and b).
     * It should return -1 if `a > b`, 1 if `a < b` or 0 if `a === b`.
     *
     * @method egame.Group#customSort
     * @param {function} sortHandler - The custom sort function.
     * @param {object} [context=undefined] - The context in which the sortHandler is called.
     */
    egame.Group.prototype.customSort = function(sortHandler, context) {

        if (this.children.length < 2) {
            //  Nothing to swap
            return;
        }

        this.children.sort(sortHandler.bind(context));

        this.updateZ();

    };

    /**
     * An internal helper function for the sort process.
     *
     * @method egame.Group#ascendingSortHandler
     * @protected
     * @param {object} a - The first object being sorted.
     * @param {object} b - The second object being sorted.
     */
    egame.Group.prototype.ascendingSortHandler = function(a, b) {

        if (a[this._sortProperty] < b[this._sortProperty]) {
            return -1;
        } else if (a[this._sortProperty] > b[this._sortProperty]) {
            return 1;
        } else {
            if (a.z < b.z) {
                return -1;
            } else {
                return 1;
            }
        }

    };

    /**
     * An internal helper function for the sort process.
     *
     * @method egame.Group#descendingSortHandler
     * @protected
     * @param {object} a - The first object being sorted.
     * @param {object} b - The second object being sorted.
     */
    egame.Group.prototype.descendingSortHandler = function(a, b) {

        if (a[this._sortProperty] < b[this._sortProperty]) {
            return 1;
        } else if (a[this._sortProperty] > b[this._sortProperty]) {
            return -1;
        } else {
            return 0;
        }

    };

    /**
     * Iterates over the children of the group performing one of several actions for matched children.
     *
     * A child is considered a match when it has a property, named `key`, whose value is equal to `value`
     * according to a strict equality comparison.
     *
     * The result depends on the `returnType`:
     *
     * - {@link egame.Group.RETURN_TOTAL RETURN_TOTAL}:
     *     The callback, if any, is applied to all matching children. The number of matched children is returned.
     * - {@link egame.Group.RETURN_NONE RETURN_NONE}:
     *     The callback, if any, is applied to all matching children. No value is returned.
     * - {@link egame.Group.RETURN_CHILD RETURN_CHILD}:
     *     The callback, if any, is applied to the *first* matching child and the *first* matched child is returned.
     *     If there is no matching child then null is returned.
     *
     * If `args` is specified it must be an array. The matched child will be assigned to the first
     * element and the entire array will be applied to the callback function.
     *
     * @method egame.Group#iterate
     * @param {string} key - The child property to check, i.e. 'exists', 'alive', 'health'
     * @param {any} value - A child matches if `child[key] === value` is true.
     * @param {integer} returnType - How to iterate the children and what to return.
     * @param {function} [callback=null] - Optional function that will be called on each matching child. The matched child is supplied as the first argument.
     * @param {object} [callbackContext] - The context in which the function should be called (usually 'this').
     * @param {any[]} [args=(none)] - The arguments supplied to to the callback; the first array index (argument) will be replaced with the matched child.
     * @return {any} Returns either an integer (for RETURN_TOTAL), the first matched child (for RETURN_CHILD), or null.
     */
    egame.Group.prototype.iterate = function(key, value, returnType, callback, callbackContext, args) {

        if (returnType === egame.Group.RETURN_TOTAL && this.children.length === 0) {
            return 0;
        }

        var total = 0;

        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i][key] === value) {
                total++;

                if (callback) {
                    if (args) {
                        args[0] = this.children[i];
                        callback.apply(callbackContext, args);
                    } else {
                        callback.call(callbackContext, this.children[i]);
                    }
                }

                if (returnType === egame.Group.RETURN_CHILD) {
                    return this.children[i];
                }
            }
        }

        if (returnType === egame.Group.RETURN_TOTAL) {
            return total;
        }

        // RETURN_CHILD or RETURN_NONE
        return null;

    };

    /**
     * Get the first display object that exists, or doesn't exist.
     * 
     * You can use the optional argument `createIfNull` to create a new Game Object if none matching your exists argument were found in this Group.
     *
     * It works by calling `Group.create` passing it the parameters given to this method, and returning the new child.
     *
     * If a child *was* found , `createIfNull` is `false` and you provided the additional arguments then the child
     * will be reset and/or have a new texture loaded on it. This is handled by `Group.resetChild`.
     *
     * @method egame.Group#getFirstExists
     * @param {boolean} [exists=true] - If true, find the first existing child; otherwise find the first non-existing child.
     * @param {boolean} [createIfNull=false] - If `true` and no alive children are found a new one is created.
     * @param {number} [x] - The x coordinate to reset the child to. The value is in relation to the group.x point.
     * @param {number} [y] - The y coordinate to reset the child to. The value is in relation to the group.y point.
     * @param {string|egame.RenderTexture|egame.BitmapData|egame.Video|egame.Texture} [key] - This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache Image entry, or an instance of a RenderTexture, BitmapData, Video or egame.Texture.
     * @param {string|number} [frame] - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
     * @return {DisplayObject} The first child, or `null` if none found and `createIfNull` was false.
     */
    egame.Group.prototype.getFirstExists = function(exists, createIfNull, x, y, key, frame) {

        if (createIfNull === undefined) {
            createIfNull = false;
        }

        if (typeof exists !== 'boolean') {
            exists = true;
        }

        var child = this.iterate('exists', exists, egame.Group.RETURN_CHILD);

        return (child === null && createIfNull) ? this.create(x, y, key, frame) : this.resetChild(child, x, y, key, frame);

    };

    /**
     * Get the first child that is alive (`child.alive === true`).
     *
     * This is handy for choosing a squad leader, etc.
     *
     * You can use the optional argument `createIfNull` to create a new Game Object if no alive ones were found in this Group.
     *
     * It works by calling `Group.create` passing it the parameters given to this method, and returning the new child.
     *
     * If a child *was* found , `createIfNull` is `false` and you provided the additional arguments then the child
     * will be reset and/or have a new texture loaded on it. This is handled by `Group.resetChild`.
     *
     * @method egame.Group#getFirstAlive
     * @param {boolean} [createIfNull=false] - If `true` and no alive children are found a new one is created.
     * @param {number} [x] - The x coordinate to reset the child to. The value is in relation to the group.x point.
     * @param {number} [y] - The y coordinate to reset the child to. The value is in relation to the group.y point.
     * @param {string|egame.RenderTexture|egame.BitmapData|egame.Video|egame.Texture} [key] - This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache Image entry, or an instance of a RenderTexture, BitmapData, Video or egame.Texture.
     * @param {string|number} [frame] - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
     * @return {DisplayObject} The alive dead child, or `null` if none found and `createIfNull` was false.
     */
    egame.Group.prototype.getFirstAlive = function(createIfNull, x, y, key, frame) {

        if (createIfNull === undefined) {
            createIfNull = false;
        }

        var child = this.iterate('alive', true, egame.Group.RETURN_CHILD);

        return (child === null && createIfNull) ? this.create(x, y, key, frame) : this.resetChild(child, x, y, key, frame);

    };

    /**
     * Get the first child that is dead (`child.alive === false`).
     *
     * This is handy for checking if everything has been wiped out and adding to the pool as needed.
     *
     * You can use the optional argument `createIfNull` to create a new Game Object if no dead ones were found in this Group.
     *
     * It works by calling `Group.create` passing it the parameters given to this method, and returning the new child.
     *
     * If a child *was* found , `createIfNull` is `false` and you provided the additional arguments then the child
     * will be reset and/or have a new texture loaded on it. This is handled by `Group.resetChild`.
     *
     * @method egame.Group#getFirstDead
     * @param {boolean} [createIfNull=false] - If `true` and no dead children are found a new one is created.
     * @param {number} [x] - The x coordinate to reset the child to. The value is in relation to the group.x point.
     * @param {number} [y] - The y coordinate to reset the child to. The value is in relation to the group.y point.
     * @param {string|egame.RenderTexture|egame.BitmapData|egame.Video|egame.Texture} [key] - This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache Image entry, or an instance of a RenderTexture, BitmapData, Video or egame.Texture.
     * @param {string|number} [frame] - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
     * @return {DisplayObject} The first dead child, or `null` if none found and `createIfNull` was false.
     */
    egame.Group.prototype.getFirstDead = function(createIfNull, x, y, key, frame) {

        if (createIfNull === undefined) {
            createIfNull = false;
        }

        var child = this.iterate('alive', false, egame.Group.RETURN_CHILD);

        return (child === null && createIfNull) ? this.create(x, y, key, frame) : this.resetChild(child, x, y, key, frame);

    };

    /**
     * Takes a child and if the `x` and `y` arguments are given it calls `child.reset(x, y)` on it.
     *
     * If the `key` and optionally the `frame` arguments are given, it calls `child.loadTexture(key, frame)` on it.
     *
     * The two operations are separate. For example if you just wish to load a new texture then pass `null` as the x and y values.
     *
     * @method egame.Group#resetChild
     * @param {DisplayObject} child - The child to reset and/or load the texture on.
     * @param {number} [x] - The x coordinate to reset the child to. The value is in relation to the group.x point.
     * @param {number} [y] - The y coordinate to reset the child to. The value is in relation to the group.y point.
     * @param {string|egame.RenderTexture|egame.BitmapData|egame.Video|egame.Texture} [key] - This is the image or texture used by the Sprite during rendering. It can be a string which is a reference to the Cache Image entry, or an instance of a RenderTexture, BitmapData, Video or egame.Texture.
     * @param {string|number} [frame] - If this Sprite is using part of a sprite sheet or texture atlas you can specify the exact frame to use by giving a string or numeric index.
     * @return {DisplayObject} The child that was reset: usually a {@link egame.Sprite}.
     */
    egame.Group.prototype.resetChild = function(child, x, y, key, frame) {

        if (child === null) {
            return null;
        }

        if (x === undefined) {
            x = null;
        }
        if (y === undefined) {
            y = null;
        }

        if (x !== null && y !== null) {
            child.reset(x, y);
        }

        if (key !== undefined) {
            child.loadTexture(key, frame);
        }

        return child;

    };

    /**
     * Return the child at the top of this group.
     *
     * The top child is the child displayed (rendered) above every other child.
     *
     * @method egame.Group#getTop
     * @return {any} The child at the top of the Group.
     */
    egame.Group.prototype.getTop = function() {

        if (this.children.length > 0) {
            return this.children[this.children.length - 1];
        }

    };

    /**
     * Returns the child at the bottom of this group.
     *
     * The bottom child the child being displayed (rendered) below every other child.
     *
     * @method egame.Group#getBottom
     * @return {any} The child at the bottom of the Group.
     */
    egame.Group.prototype.getBottom = function() {

        if (this.children.length > 0) {
            return this.children[0];
        }

    };

    /**
     * Get the number of living children in this group.
     *
     * @method egame.Group#countLiving
     * @return {integer} The number of children flagged as alive.
     */
    egame.Group.prototype.countLiving = function() {

        return this.iterate('alive', true, egame.Group.RETURN_TOTAL);

    };

    /**
     * Get the number of dead children in this group.
     *
     * @method egame.Group#countDead
     * @return {integer} The number of children flagged as dead.
     */
    egame.Group.prototype.countDead = function() {

        return this.iterate('alive', false, egame.Group.RETURN_TOTAL);

    };

    /**
     * Returns a random child from the group.
     *
     * @method egame.Group#getRandom
     * @param {integer} [startIndex=0] - Offset from the front of the front of the group (lowest child).
     * @param {integer} [length=(to top)] - Restriction on the number of values you want to randomly select from.
     * @return {any} A random child of this Group.
     */
    egame.Group.prototype.getRandom = function(startIndex, length) {

        if (this.children.length === 0) {
            return null;
        }

        startIndex = startIndex || 0;
        length = length || this.children.length;

        return egame.ArrayUtils.getRandomItem(this.children, startIndex, length);

    };

    /**
     * Removes the given child from this group.
     *
     * This will dispatch an `onRemovedFromGroup` event from the child (if it has one), and optionally destroy the child.
     *
     * If the group cursor was referring to the removed child it is updated to refer to the next child.
     *
     * @method egame.Group#remove
     * @param {any} child - The child to remove.
     * @param {boolean} [destroy=false] - If true `destroy` will be invoked on the removed child.
     * @param {boolean} [silent=false] - If true the the child will not dispatch the `onRemovedFromGroup` event.
     * @return {boolean} true if the child was removed from this group, otherwise false.
     */
    egame.Group.prototype.remove = function(child, destroy, silent) {

        if (destroy === undefined) {
            destroy = false;
        }
        if (silent === undefined) {
            silent = false;
        }

        if (this.children.length === 0 || this.children.indexOf(child) === -1) {
            return false;
        }

        if (!silent && child.events && !child.destroyPhase) {
            child.events.onRemovedFromGroup$dispatch(child, this);
        }

        var removed = this.removeChild(child);

        this.removeFromHash(child);

        this.updateZ();

        if (this.cursor === child) {
            this.next();
        }

        if (destroy && removed) {
            removed.destroy(true);
        }

        return true;

    };

    /**
     * 移动所有的孩子从这个Group到给定的group里面
     * @method egame.Group#moveAll
     */
    egame.Group.prototype.moveAll = function(group, silent) {

        if (silent === undefined) {
            silent = false;
        }

        if (this.children.length > 0 && group instanceof egame.Group) {
            do {
                group.add(this.children[0], silent);
            }
            while (this.children.length > 0);

            this.hash = [];

            this.cursor = null;
        }

        return group;

    };

    /**
     * Removes all children from this group, but does not remove the group from its parent.
     *
     * @method egame.Group#removeAll
     * @param {boolean} [destroy=false] - If true `destroy` will be invoked on each removed child.
     * @param {boolean} [silent=false] - If true the children will not dispatch their `onRemovedFromGroup` events.
     */
    egame.Group.prototype.removeAll = function(destroy, silent) {

        if (destroy === undefined) {
            destroy = false;
        }
        if (silent === undefined) {
            silent = false;
        }

        if (this.children.length === 0) {
            return;
        }

        do {
            if (!silent && this.children[0].events) {
                this.children[0].events.onRemovedFromGroup$dispatch(this.children[0], this);
            }

            var removed = this.removeChild(this.children[0]);

            this.removeFromHash(removed);

            if (destroy && removed) {
                removed.destroy(true);
            }
        }
        while (this.children.length > 0);

        this.hash = [];

        this.cursor = null;

    };

    /**
     * Removes all children from this group whose index falls beteen the given startIndex and endIndex values.
     *
     * @method egame.Group#removeBetween
     * @param {integer} startIndex - The index to start removing children from.
     * @param {integer} [endIndex] - The index to stop removing children at. Must be higher than startIndex. If undefined this method will remove all children between startIndex and the end of the group.
     * @param {boolean} [destroy=false] - If true `destroy` will be invoked on each removed child.
     * @param {boolean} [silent=false] - If true the children will not dispatch their `onRemovedFromGroup` events.
     */
    egame.Group.prototype.removeBetween = function(startIndex, endIndex, destroy, silent) {

        if (endIndex === undefined) {
            endIndex = this.children.length - 1;
        }
        if (destroy === undefined) {
            destroy = false;
        }
        if (silent === undefined) {
            silent = false;
        }

        if (this.children.length === 0) {
            return;
        }

        if (startIndex > endIndex || startIndex < 0 || endIndex > this.children.length) {
            return false;
        }

        var i = endIndex;

        while (i >= startIndex) {
            if (!silent && this.children[i].events) {
                this.children[i].events.onRemovedFromGroup$dispatch(this.children[i], this);
            }

            var removed = this.removeChild(this.children[i]);

            this.removeFromHash(removed);

            if (destroy && removed) {
                removed.destroy(true);
            }

            if (this.cursor === this.children[i]) {
                this.cursor = null;
            }

            i--;
        }

        this.updateZ();

    };

    /**
     * Destroys this group.
     *
     * Removes all children, then removes this group from its parent and nulls references.
     *
     * @method egame.Group#destroy
     * @param {boolean} [destroyChildren=true] - If true `destroy` will be invoked on each removed child.
     * @param {boolean} [soft=false] - A 'soft destroy' (set to true) doesn't remove this group from its parent or null the game reference. Set to false and it does.
     */
    egame.Group.prototype.destroy = function(destroyChildren, soft) {

        if (this.game === null || this.ignoreDestroy) {
            return;
        }

        if (destroyChildren === undefined) {
            destroyChildren = true;
        }
        if (soft === undefined) {
            soft = false;
        }

        this.onDestroy.dispatch(this, destroyChildren, soft);

        this.removeAll(destroyChildren);

        this.cursor = null;
        this.filters = null;
        this.pendingDestroy = false;

        if (!soft) {
            if (this.parent) {
                this.parent.removeChild(this);
            }

            this.game = null;
            this.exists = false;
        }

    };

    /**
     * 有多少个孩子在这个Group里面
     */
    Object.defineProperty(egame.Group.prototype, "total", {

        get: function() {

            return this.iterate('exists', true, egame.Group.RETURN_TOTAL);

        }

    });

    /**
     * 不管exists/alive状态group的数量
     * @name egame.Group#length
     * @property {integer} length 
     * @readonly
     */
    Object.defineProperty(egame.Group.prototype, "length", {

        get: function() {

            return this.children.length;

        }

    });

    /**
     * group容器的角度
     * 通过修改局部变换，来调整该组
     * 这对子元素的旋转和角度性能没有影响，他们会更新自己的世界变换和屏幕中的方向和位置
     * @name egame.Group#angle
     * @property {number} angle
     */
    Object.defineProperty(egame.Group.prototype, "angle", {

        get: function() {
            return egame.Math.radToDeg(this.rotation);
        },

        set: function(value) {
            this.rotation = egame.Math.degToRad(value);
        }

    });
    return egame.Group;
});