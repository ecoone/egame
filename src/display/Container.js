egame.define("Container", ["RenderTexture", "DisplayObject", "Rectangle", "Matrix", "CONST", "Utils","Point"], function(RenderTexture, DisplayObject, Rectangle, Matrix, CONST, Utils,Point) {
    /**
     * 容器代表显示对象的集合
     * 这是所有作为显示容器的显示对象基类
     *```js
     * var container = new .Container();
     * container.addChild(sprite);
     * ```
     */
    function Container() {
        DisplayObject.call(this);

        /**
         * 容器中的子元素
         * @member {.DisplayObject[]}
         */
        this.children = [];
    }

    Container.prototype = Object.create(DisplayObject.prototype);
    Container.prototype.constructor = Container;

    Object.defineProperties(Container.prototype, {
        /**
         * 容器的宽度，设置这个值会导致容器的scale属性被修改
         */
        width: {
            get: function() {
                return this.scale.x * this.getLocalBounds().width;
            },
            set: function(value) {

                var width = this.getLocalBounds().width;

                if (width !== 0) {
                    this.scale.x = value / width;
                } else {
                    this.scale.x = 1;
                }


                this._width = value;
            }
        },

        /**
         * 容器的高度，设置这个值会导致容器的scale属性被修改
         */
        height: {
            get: function() {
                return this.scale.y * this.getLocalBounds().height;
            },
            set: function(value) {

                var height = this.getLocalBounds().height;

                if (height !== 0) {
                    this.scale.y = value / height;
                } else {
                    this.scale.y = 1;
                }

                this._height = value;
            }
        }
    });

    /**
     * 子元素发生变化的接口
     */
    Container.prototype.onChildrenChange = function() {};

    /**
     * 添加子元素到容器，可以添加很多个像这样myContainer.addChild(thinkOne, thingTwo, thingThree)
     * @param child {.DisplayObject}被添加的显示对象
     * @return {.DisplayObject} 被添加的显示对象
     */
    Container.prototype.addChild = function(child) {
        var argumentsLength = arguments.length;

        // if there is only one argument we can bypass looping through the them
        if (argumentsLength > 1) {
            // loop through the arguments property and add all children
            // use it the right way (.length and [i]) so that this function can still be optimised by JS runtimes
            for (var i = 0; i < argumentsLength; i++) {
                this.addChild(arguments[i]);
            }
        } else {
            // if the child has a parent then lets remove it as Pixi objects can only exist in one place
            if (child.parent) {
                child.parent.removeChild(child);
            }

            child.parent = this;

            this.children.push(child);

            // TODO - lets either do all callbacks or all events.. not both!
            this.onChildrenChange(this.children.length - 1);
            child.emit('added', this);
        }

        return child;
    };

    /**
     * Adds a child to the container at a specified index. If the index is out of bounds an error will be thrown
     *
     * @param child {.DisplayObject} The child to add
     * @param index {number} The index to place the child in
     * @return {.DisplayObject} The child that was added.
     */
    Container.prototype.addChildAt = function(child, index) {
        if (index >= 0 && index <= this.children.length) {
            if (child.parent) {
                child.parent.removeChild(child);
            }

            child.parent = this;

            this.children.splice(index, 0, child);

            // TODO - lets either do all callbacks or all events.. not both!
            this.onChildrenChange(index);
            child.emit('added', this);

            return child;
        } else {
            throw new Error(child + 'addChildAt: The index ' + index + ' supplied is out of bounds ' + this.children.length);
        }
    };

    /**
     * Swaps the position of 2 Display Objects within this container.
     *
     * @param child {.DisplayObject}
     * @param child2 {.DisplayObject}
     */
    Container.prototype.swapChildren = function(child, child2) {
        if (child === child2) {
            return;
        }

        var index1 = this.getChildIndex(child);
        var index2 = this.getChildIndex(child2);

        if (index1 < 0 || index2 < 0) {
            throw new Error('swapChildren: Both the supplied DisplayObjects must be children of the caller.');
        }

        this.children[index1] = child2;
        this.children[index2] = child;
        this.onChildrenChange(index1 < index2 ? index1 : index2);
    };

    /**
     * Returns the index position of a child DisplayObject instance
     *
     * @param child {.DisplayObject} The DisplayObject instance to identify
     * @return {number} The index position of the child display object to identify
     */
    Container.prototype.getChildIndex = function(child) {
        var index = this.children.indexOf(child);

        if (index === -1) {
            throw new Error('The supplied DisplayObject must be a child of the caller');
        }

        return index;
    };

    /**
     * Changes the position of an existing child in the display object container
     *
     * @param child {.DisplayObject} The child DisplayObject instance for which you want to change the index number
     * @param index {number} The resulting index number for the child display object
     */
    Container.prototype.setChildIndex = function(child, index) {
        if (index < 0 || index >= this.children.length) {
            throw new Error('The supplied index is out of bounds');
        }

        var currentIndex = this.getChildIndex(child);

        Utils.removeItems(this.children, currentIndex, 1); // remove from old position
        this.children.splice(index, 0, child); //add at new position
        this.onChildrenChange(index);
    };

    /**
     * Returns the child at the specified index
     *
     * @param index {number} The index to get the child at
     * @return {.DisplayObject} The child at the given index, if any.
     */
    Container.prototype.getChildAt = function(index) {
        if (index < 0 || index >= this.children.length) {
            throw new Error('getChildAt: Supplied index ' + index + ' does not exist in the child list, or the supplied DisplayObject is not a child of the caller');
        }

        return this.children[index];
    };

    /**
     * Removes a child from the container.
     *
     * @param child {.DisplayObject} The DisplayObject to remove
     * @return {.DisplayObject} The child that was removed.
     */
    Container.prototype.removeChild = function(child) {
        var argumentsLength = arguments.length;

        // if there is only one argument we can bypass looping through the them
        if (argumentsLength > 1) {
            // loop through the arguments property and add all children
            // use it the right way (.length and [i]) so that this function can still be optimised by JS runtimes
            for (var i = 0; i < argumentsLength; i++) {
                this.removeChild(arguments[i]);
            }
        } else {
            var index = this.children.indexOf(child);

            if (index === -1) {
                return;
            }

            child.parent = null;
            Utils.removeItems(this.children, index, 1);

            // TODO - lets either do all callbacks or all events.. not both!
            this.onChildrenChange(index);
            child.emit('removed', this);
        }

        return child;
    };

    /**
     * Removes a child from the specified index position.
     *
     * @param index {number} The index to get the child from
     * @return {.DisplayObject} The child that was removed.
     */
    Container.prototype.removeChildAt = function(index) {
        var child = this.getChildAt(index);

        child.parent = null;
        Utils.removeItems(this.children, index, 1);

        // TODO - lets either do all callbacks or all events.. not both!
        this.onChildrenChange(index);
        child.emit('removed', this);

        return child;
    };

    /**
     * Removes all children from this container that are within the begin and end indexes.
     *
     * @param beginIndex {number} The beginning position. Default value is 0.
     * @param endIndex {number} The ending position. Default value is size of the container.
     */
    Container.prototype.removeChildren = function(beginIndex, endIndex) {
        var begin = beginIndex || 0;
        var end = typeof endIndex === 'number' ? endIndex : this.children.length;
        var range = end - begin;
        var removed, i;

        if (range > 0 && range <= end) {
            removed = this.children.splice(begin, range);

            for (i = 0; i < removed.length; ++i) {
                removed[i].parent = null;
            }

            this.onChildrenChange(beginIndex);

            for (i = 0; i < removed.length; ++i) {
                removed[i].emit('removed', this);
            }

            return removed;
        } else if (range === 0 && this.children.length === 0) {
            return [];
        } else {
            throw new RangeError('removeChildren: numeric values are outside the acceptable range.');
        }
    };

    /*
     * 更新全局变换，更新当前容器的全局变换和所有子元素的全局变换用来渲染显示对象
     * @private
     */
    Container.prototype.updateTransform = function() {
        if (!this.visible) {
            return;
        }

        this.displayObjectUpdateTransform();

        for (var i = 0, j = this.children.length; i < j; ++i) {
            this.children[i].updateTransform();
        }
    };

    //  提高性能避免使用call（快10倍）
    Container.prototype.containerUpdateTransform = Container.prototype.updateTransform;

    /**
     * 检索容器的矩形边界。边界计算考虑到所有的可见子元素
     * @return {.Rectangle} 矩形边界区域
     */
    Container.prototype.getBounds = function() {
        if (!this._currentBounds) {

            if (this.children.length === 0) {
                return Rectangle.EMPTY;
            }


            var minX = Infinity;
            var minY = Infinity;

            var maxX = -Infinity;
            var maxY = -Infinity;

            var childBounds;
            var childMaxX;
            var childMaxY;

            var childVisible = false;

            for (var i = 0, j = this.children.length; i < j; ++i) {
                var child = this.children[i];

                if (!child.visible) {
                    continue;
                }

                childVisible = true;

                childBounds = this.children[i].getBounds();

                minX = minX < childBounds.x ? minX : childBounds.x;
                minY = minY < childBounds.y ? minY : childBounds.y;

                childMaxX = childBounds.width + childBounds.x;
                childMaxY = childBounds.height + childBounds.y;

                maxX = maxX > childMaxX ? maxX : childMaxX;
                maxY = maxY > childMaxY ? maxY : childMaxY;
            }

            if (!childVisible) {
                return Rectangle.EMPTY;
            }

            var bounds = this._bounds;

            bounds.x = minX;
            bounds.y = minY;
            bounds.width = maxX - minX;
            bounds.height = maxY - minY;

            this._currentBounds = bounds;
        }

        return this._currentBounds;
    };

    Container.prototype.containerGetBounds = Container.prototype.getBounds;

    /**
     * 检索容器的局部边界，这个矩形的计算考虑到了所有子元素
     * @return {.Rectangle}矩形边界区域
     */
    Container.prototype.getLocalBounds = function() {
        var matrixCache = this.worldTransform;

        this.worldTransform = Matrix.IDENTITY;

        for (var i = 0, j = this.children.length; i < j; ++i) {
            this.children[i].updateTransform();
        }

        this.worldTransform = matrixCache;

        this._currentBounds = null;

        return this.getBounds(Matrix.IDENTITY);
    };

    /**
     * 渲染容器接口
     * @param renderer {.CanvasRenderer} 渲染器
     * @private
     */
    Container.prototype._renderCanvas = function(renderer) {};


    /**
     * 使用canvas渲染器渲染对象
     * @param renderer {.CanvasRenderer} 渲染器
     */
    Container.prototype.renderCanvas = function(renderer) {
        //如果不可见，不可渲染，透明度为0不渲染
        if (!this.visible || this.alpha <= 0 || !this.renderable) {
            return;
        }
        //如果有遮罩
        if (this._mask) {
            renderer.maskManager.pushMask(this._mask, renderer);
        }
        //渲染当前元素
        this._renderCanvas(renderer);

        //渲染子元素
        for (var i = 0, j = this.children.length; i < j; ++i) {
            this.children[i].renderCanvas(renderer);
        }

        //如果有遮罩
        if (this._mask) {
            renderer.maskManager.popMask(renderer);
        }
    };

    /**
     * 清除容器
     * @param [destroyChildren=false] {boolean} 如果是true子元素也会被销毁
     */
    Container.prototype.destroy = function(destroyChildren) {
        DisplayObject.prototype.destroy.call(this);

        if (destroyChildren) {
            for (var i = 0, j = this.children.length; i < j; ++i) {
                this.children[i].destroy(destroyChildren);
            }
        }
        //移除所有子元素
        this.removeChildren();

        this.children = null;
    };

    Container.prototype.containsPoint = function(point) {
        var tempPoint = new Point();
        this.worldTransform.applyInverse(point, tempPoint);

        var width = this.getLocalBounds().width;
        var height = this.getLocalBounds().height;
        var x1 = 0;
        var y1;

        if (tempPoint.x > x1 && tempPoint.x < x1 + width) {
            y1 = 0;

            if (tempPoint.y > y1 && tempPoint.y < y1 + height) {
                return true;
            }
        }

        return false;
    };

    egame.Container = Container;
    return Container;
});