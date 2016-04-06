/**
* 输入管理器
* @class egame.Input
* @constructor
* @param {egame.Game} game - 引用的游戏对象
*/
egame.Input = function (game) {

    /**
    * @property {egame.Game} game - 引用的游戏对象
    */
    this.game = game;

    /**
    * @property {HTMLCanvasElement} hitCanvas - The canvas to which single pixels are drawn in order to perform pixel-perfect hit detection.
    * @default
    */
    this.hitCanvas = null;

    /**
    * @property {CanvasRenderingContext2D} hitContext - The context of the pixel perfect hit canvas.
    * @default
    */
    this.hitContext = null;

    /**
    * An array of callbacks that will be fired every time the activePointer receives a move event from the DOM.
    * To add a callback to this array please use `Input.addMoveCallback`.
    * @property {array} moveCallbacks
    * @protected
    */
    this.moveCallbacks = [];

    /**
    * @property {number} pollRate - How often should the input pointers be checked for updates? A value of 0 means every single frame (60fps); a value of 1 means every other frame (30fps) and so on.
    * @default
    */
    this.pollRate = 0;

    /**
    * When enabled, input (eg. Keyboard, Mouse, Touch) will be processed - as long as the individual sources are enabled themselves.
    *
    * When not enabled, _all_ input sources are ignored. To disable just one type of input; for example, the Mouse, use `input.mouse.enabled = false`.
    * @property {boolean} enabled
    * @default
    */
    this.enabled = true;

    /**
    * @property {number} multiInputOverride - Controls the expected behavior when using a mouse and touch together on a multi-input device.
    * @default
    */
    this.multiInputOverride = egame.Input.MOUSE_TOUCH_COMBINE;

    /**
    * @property {egame.Point} position - A point object representing the current position of the Pointer.
    * @default
    */
    this.position = null;

    /**
    * @property {egame.Point} speed - A point object representing the speed of the Pointer. Only really useful in single Pointer games; otherwise see the Pointer objects directly.
    */
    this.speed = null;

    /**
    * A Circle object centered on the x/y screen coordinates of the Input.
    * Default size of 44px (Apples recommended "finger tip" size) but can be changed to anything.
    * @property {egame.Circle} circle
    */
    this.circle = null;

    /**
    * @property {egame.Point} scale - The scale by which all input coordinates are multiplied; calculated by the ScaleManager. In an un-scaled game the values will be x = 1 and y = 1.
    */
    this.scale = null;

    /**
    * @property {integer} maxPointers - The maximum number of Pointers allowed to be active at any one time. A value of -1 is only limited by the total number of pointers. For lots of games it's useful to set this to 1.
    * @default -1 (Limited by total pointers.)
    */
    this.maxPointers = -1;

    /**
    * @property {number} tapRate - The number of milliseconds that the Pointer has to be pressed down and then released to be considered a tap or click.
    * @default
    */
    this.tapRate = 200;

    /**
    * @property {number} doubleTapRate - The number of milliseconds between taps of the same Pointer for it to be considered a double tap / click.
    * @default
    */
    this.doubleTapRate = 300;

    /**
    * @property {number} holdRate - 按下多久触发onHold事件
    * @default
    */
    this.holdRate = 2000;

    /**
    * @property {number} justPressedRate - The number of milliseconds below which the Pointer is considered justPressed.
    * @default
    */
    this.justPressedRate = 200;

    /**
    * @property {number} justReleasedRate - The number of milliseconds below which the Pointer is considered justReleased .
    * @default
    */
    this.justReleasedRate = 200;

    /**
    * Sets if the Pointer objects should record a history of x/y coordinates they have passed through.
    * The history is cleared each time the Pointer is pressed down.
    * The history is updated at the rate specified in Input.pollRate
    * @property {boolean} recordPointerHistory
    * @default
    */
    this.recordPointerHistory = false;

    /**
    * @property {number} recordRate - 记录路径的频率
    * @default
    */
    this.recordRate = 100;

    /**
    * The total number of entries that can be recorded into the Pointer objects tracking history.
    * If the Pointer is tracking one event every 100ms; then a trackLimit of 100 would store the last 10 seconds worth of history.
    * @property {number} recordLimit
    * @default
    */
    this.recordLimit = 100;

    /**
    * @property {egame.Pointer} pointer1 - A Pointer object.
    */
    this.pointer1 = null;

    /**
    * @property {egame.Pointer} pointer2 - A Pointer object.
    */
    this.pointer2 = null;

    /**
    * @property {egame.Pointer} pointer3 - A Pointer object.
    */
    this.pointer3 = null;

    /**
    * @property {egame.Pointer} pointer4 - A Pointer object.
    */
    this.pointer4 = null;

    /**
    * @property {egame.Pointer} pointer5 - A Pointer object.
    */
    this.pointer5 = null;

    /**
    * @property {egame.Pointer} pointer6 - A Pointer object.
    */
    this.pointer6 = null;

    /**
    * @property {egame.Pointer} pointer7 - A Pointer object.
    */
    this.pointer7 = null;

    /**
    * @property {egame.Pointer} pointer8 - A Pointer object.
    */
    this.pointer8 = null;

    /**
    * @property {egame.Pointer} pointer9 - A Pointer object.
    */
    this.pointer9 = null;

    /**
    * @property {egame.Pointer} pointer10 - A Pointer object.
    */
    this.pointer10 = null;

    /**
    * An array of non-mouse pointers that have been added to the game.
    * The properties `pointer1..N` are aliases for `pointers[0..N-1]`.
    * @property {egame.Pointer[]} pointers
    * @public
    * @readonly
    */
    this.pointers = [];

    /**
    * The most recently active Pointer object.
    * 
    * When you've limited max pointers to 1 this will accurately be either the first finger touched or mouse.
    * 
    * @property {egame.Pointer} activePointer
    */
    this.activePointer = null;

    /**
    * The mouse has its own unique egame.Pointer object which you can use if making a desktop specific game.
    * 
    * @property {Pointer} mousePointer
    */
    this.mousePointer = null;

    /**
    * The Mouse Input manager.
    * 
    * You should not usually access this manager directly, but instead use Input.mousePointer or Input.activePointer 
    * which normalizes all the input values for you, regardless of browser.
    * 
    * @property {egame.Mouse} mouse
    */
    this.mouse = null;

    /**
    * The Keyboard Input manager.
    * 
    * @property {egame.Keyboard} keyboard
    */
    this.keyboard = null;

    /**
    * The Touch Input manager.
    * 
    * You should not usually access this manager directly, but instead use Input.activePointer 
    * which normalizes all the input values for you, regardless of browser.
    * 
    * @property {egame.Touch} touch
    */
    this.touch = null;

    /**
    * The MSPointer Input manager.
    * 
    * You should not usually access this manager directly, but instead use Input.activePointer 
    * which normalizes all the input values for you, regardless of browser.
    * 
    * @property {egame.MSPointer} mspointer
    */
    this.mspointer = null;

    /**
    * If the Input Manager has been reset locked then all calls made to InputManager.reset, 
    * such as from a State change, are ignored.
    * @property {boolean} resetLocked
    * @default
    */
    this.resetLocked = false;

    /**
    * A Signal that is dispatched each time a pointer is pressed down.
    * @property {egame.Signal} onDown
    */
    this.onDown = null;

    /**
    * A Signal that is dispatched each time a pointer is released.
    * @property {egame.Signal} onUp
    */
    this.onUp = null;

    /**
    * A Signal that is dispatched each time a pointer is tapped.
    * @property {egame.Signal} onTap
    */
    this.onTap = null;

    /**
    * A Signal that is dispatched each time a pointer is held down.
    * @property {egame.Signal} onHold
    */
    this.onHold = null;

    /**
    *  你可以告诉所有的指针对象忽略`priorityID` 属性低于这个值的游戏对象。
    * @property {number} minPriorityID
    * @default
    */
    this.minPriorityID = 0;

    /**
    * A list of interactive objects. The InputHandler components add and remove themselves from this list.
    * @property {egame.ArraySet} interactiveItems
    */
    this.interactiveItems = new egame.ArraySet();

    /**
    * @property {egame.Point} _localPoint - Internal cache var.
    * @private
    */
    this._localPoint = new egame.Point();

    /**
    * @property {number} _pollCounter - Internal var holding the current poll counter.
    * @private
    */
    this._pollCounter = 0;

    /**
    * @property {egame.Point} _oldPosition - A point object representing the previous position of the Pointer.
    * @private
    */
    this._oldPosition = null;

    /**
    * @property {number} _x - x coordinate of the most recent Pointer event
    * @private
    */
    this._x = 0;

    /**
    * @property {number} _y - Y coordinate of the most recent Pointer event
    * @private
    */
    this._y = 0;

};

/**
* @constant
* @type {number}
*/
egame.Input.MOUSE_OVERRIDES_TOUCH = 0;

/**
* @constant
* @type {number}
*/
egame.Input.TOUCH_OVERRIDES_MOUSE = 1;

/**
* @constant
* @type {number}
*/
egame.Input.MOUSE_TOUCH_COMBINE = 2;

/**
* The maximum number of pointers that can be added. This excludes the mouse pointer.
* @constant
* @type {integer}
*/
egame.Input.MAX_POINTERS = 10;

egame.Input.prototype = {

    /**
    * 启动输入管理
    * @method egame.Input#boot
    * @protected
    */
    boot: function () {

        this.mousePointer = new egame.Pointer(this.game, 0, egame.PointerMode.CURSOR);
        this.addPointer();
        this.addPointer();

        this.mouse = new egame.Mouse(this.game);
        this.touch = new egame.Touch(this.game);
        this.mspointer = new egame.MSPointer(this.game);

        if (egame.Keyboard)
        {
            this.keyboard = new egame.Keyboard(this.game);
        }


        this.onDown = new egame.Signal();
        this.onUp = new egame.Signal();
        this.onTap = new egame.Signal();
        this.onHold = new egame.Signal();

        this.scale = new egame.Point(1, 1);
        this.speed = new egame.Point();
        this.position = new egame.Point();
        this._oldPosition = new egame.Point();

        this.circle = new egame.Circle(0, 0, 44);

        this.activePointer = this.mousePointer;

        this.hitCanvas = PIXI.CanvasPool.create(this, 1, 1);
        this.hitContext = this.hitCanvas.getContext('2d');

        this.mouse.start();
        this.touch.start();
        this.mspointer.start();
        this.mousePointer.active = true;

        if (this.keyboard)
        {
            this.keyboard.start();
        }

    },

    /**
    * 停止输入管理的运行
    * @method egame.Input#destroy
    */
    destroy: function () {

        this.mouse.stop();
        this.touch.stop();
        this.mspointer.stop();

        if (this.keyboard)
        {
            this.keyboard.stop();
        }

        this.moveCallbacks = [];

        PIXI.CanvasPool.remove(this);

    },

    /**
    * 当激活指针收到DOM移动事件，如：mousemove或者touchmove的时候触发的回掉
    * @method egame.Input#addMoveCallback
    * @param {function} callback - 事件回调
    * @param {object} context - 回调上下问
    */
    addMoveCallback: function (callback, context) {

        this.moveCallbacks.push({ callback: callback, context: context });

    },

    /**
    * 移除移动事件回调
    * @method egame.Input#deleteMoveCallback
    * @param {function} callback - 被移除事件回调的函数
    * @param {object} context -被移除事件回调的执行上下文
    */
    deleteMoveCallback: function (callback, context) {

        var i = this.moveCallbacks.length;

        while (i--)
        {
            if (this.moveCallbacks[i].callback === callback && this.moveCallbacks[i].context === context)
            {
                this.moveCallbacks.splice(i, 1);
                return;
            }
        }

    },

    /**
    * Add a new Pointer object to the Input Manager.
    * By default Input creates 3 pointer objects: `mousePointer` (not include in part of general pointer pool), `pointer1` and `pointer2`.
    * This method adds an additional pointer, up to a maximum of egame.Input.MAX_POINTERS (default of 10).
    *
    * @method egame.Input#addPointer
    * @return {egame.Pointer|null} The new Pointer object that was created; null if a new pointer could not be added.
    */
    addPointer: function () {

        if (this.pointers.length >= egame.Input.MAX_POINTERS)
        {
            console.warn("egame.Input.addPointer: Maximum limit of " + egame.Input.MAX_POINTERS + " pointers reached.");
            return null;
        }

        var id = this.pointers.length + 1;
        var pointer = new egame.Pointer(this.game, id, egame.PointerMode.TOUCH);

        this.pointers.push(pointer);
        this['pointer' + id] = pointer;

        return pointer;

    },

    /**
    *  更新输入管理器，由游戏循环自动调用
    * @method egame.Input#update
    * @protected
    */
    update: function () {

        if (this.keyboard)
        {
            this.keyboard.update();
        }

        if (this.pollRate > 0 && this._pollCounter < this.pollRate)
        {
            this._pollCounter++;
            return;
        }

        this.speed.x = this.position.x - this._oldPosition.x;
        this.speed.y = this.position.y - this._oldPosition.y;

        this._oldPosition.copyFrom(this.position);
        this.mousePointer.update();


        for (var i = 0; i < this.pointers.length; i++)
        {
            this.pointers[i].update();
        }

        this._pollCounter = 0;

    },

    /**
    * 重置所有指针和输入状态，hard为true重置所有事件和回掉函数，Input.reset在状态改变的时候自动重置
    * @method egame.Input#reset
    * @public
    * @param {boolean} [hard=false] -是否强制重置
    */
    reset: function (hard) {

        if (!this.game.isBooted || this.resetLocked)
        {
            return;
        }

        if (hard === undefined) { hard = false; }

        this.mousePointer.reset();

        if (this.keyboard)
        {
            this.keyboard.reset(hard);
        }


        for (var i = 0; i < this.pointers.length; i++)
        {
            this.pointers[i].reset();
        }

        if (this.game.canvas.style.cursor !== 'none')
        {
            this.game.canvas.style.cursor = 'inherit';
        }

        if (hard)
        {
            this.onDown.dispose();
            this.onUp.dispose();
            this.onTap.dispose();
            this.onHold.dispose();
            this.onDown = new egame.Signal();
            this.onUp = new egame.Signal();
            this.onTap = new egame.Signal();
            this.onHold = new egame.Signal();
            this.moveCallbacks = [];
        }

        this._pollCounter = 0;

    },

    /**
    * 重置速度和设置oldPosition属性
    * @method egame.Input#resetSpeed
    * @param {number} x - 设置oldPosition.x值.
    * @param {number} y - 设置oldPosition.y值
    */
    resetSpeed: function (x, y) {

        this._oldPosition.setTo(x, y);
        this.speed.setTo(0, 0);

    },

    /**
    * 开启一个指针，由egame.Touch和egame.MSPointer自动调用
    * @method egame.Input#startPointer
    * @protected
    * @param {any} event - 事件对象
    * @return {egame.Pointer} 被启动的指针
    */
    startPointer: function (event) {

        if (this.maxPointers >= 0 && this.countActivePointers(this.maxPointers) >= this.maxPointers)
        {
            return null;
        }

        if (!this.pointer1.active)
        {
            return this.pointer1.start(event);
        }

        if (!this.pointer2.active)
        {
            return this.pointer2.start(event);
        }

        for (var i = 2; i < this.pointers.length; i++)
        {
            var pointer = this.pointers[i];

            if (!pointer.active)
            {
                return pointer.start(event);
            }
        }

        return null;

    },

    /**
    * 更新激活的指针对象，并传入事件对象
    * @method egame.Input#updatePointer
    * @protected
    * @param {any} event - 事件对象
    * @return {egame.Pointer}  被更新的指针
    */
    updatePointer: function (event) {

        if (this.pointer1.active && this.pointer1.identifier === event.identifier)
        {
            return this.pointer1.move(event);
        }

        if (this.pointer2.active && this.pointer2.identifier === event.identifier)
        {
            return this.pointer2.move(event);
        }

        for (var i = 2; i < this.pointers.length; i++)
        {
            var pointer = this.pointers[i];

            if (pointer.active && pointer.identifier === event.identifier)
            {
                return pointer.move(event);
            }
        }

        return null;

    },

    /**
    * 停止激活的指针对象，并传入事件对象
    * @method egame.Input#stopPointer
    * @protected
    * @param {any} event -  事件对象
    * @return {egame.Pointer}  被停止的指针
    */
    stopPointer: function (event) {

        if (this.pointer1.active && this.pointer1.identifier === event.identifier)
        {
            return this.pointer1.stop(event);
        }

        if (this.pointer2.active && this.pointer2.identifier === event.identifier)
        {
            return this.pointer2.stop(event);
        }

        for (var i = 2; i < this.pointers.length; i++)
        {
            var pointer = this.pointers[i];

            if (pointer.active && pointer.identifier === event.identifier)
            {
                return pointer.stop(event);
            }
        }

        return null;

    },

    /**
    * 获取激活的指针的数目
    * @name egame.Input#countActivePointers
    * @private
    * @property {integer} [limit=(max pointers)] -最大激活数目的上线
    * @return {integer} 激活的指针的数目
    */
    countActivePointers: function (limit) {

        if (limit === undefined) { limit = this.pointers.length; }

        var count = limit;

        for (var i = 0; i < this.pointers.length && count > 0; i++)
        {
            var pointer = this.pointers[i];

            if (pointer.active)
            {
                count--;
            }
        }

        return (limit - count);

    },

    /**
    * 获取第一个指定状态的指针
    * @method egame.Input#getPointer
    * @param {boolean} [isActive=false] - 指针状态
    * @return {egame.Pointer} 获得的指针
    */
    getPointer: function (isActive) {

        if (isActive === undefined) { isActive = false; }

        for (var i = 0; i < this.pointers.length; i++)
        {
            var pointer = this.pointers[i];

            if (pointer.active === isActive)
            {
                return pointer;
            }
        }

        return null;

    },

    /**
    * 通过`identifier`标识，获取指针
    * @method egame.Input#getPointerFromIdentifier
    * @param {number} identifier - 要搜寻的`identifier`标识
    * @return {egame.Pointer} 指针对象
    */
    getPointerFromIdentifier: function (identifier) {

        for (var i = 0; i < this.pointers.length; i++)
        {
            var pointer = this.pointers[i];

            if (pointer.identifier === identifier)
            {
                return pointer;
            }
        }

        return null;
    },

    /**
    * 通过pointerId获取指针
    * @method egame.Input#getPointerFromId
    * @param {number} pointerId - 要搜寻的pointerId
    * @return {egame.Pointer} 指针对象
    */
    getPointerFromId: function (pointerId) {

        for (var i = 0; i < this.pointers.length; i++)
        {
            var pointer = this.pointers[i];

            if (pointer.pointerId === pointerId)
            {
                return pointer;
            }
        }

        return null;

    },

    /**
    * 获去给定指针在显示对象的局部坐标
    * @method egame.Input#getLocalPosition
    * @param {egame.DisplayObject} displayObject - 用于得到局部坐标的显示对象
    * @param {egame.Pointer} pointer - 相对于显示对象的指针
    * @return {egame.Point} 指针相对于显示对象的坐标
    */
    getLocalPosition: function (displayObject, pointer, output) {

        if (output === undefined) { output = new egame.Point(); }

        var wt = displayObject.worldTransform;
        var id = 1 / (wt.a * wt.d + wt.c * -wt.b);

        return output.setTo(
            wt.d * id * pointer.x + -wt.c * id * pointer.y + (wt.ty * wt.c - wt.tx * wt.d) * id,
            wt.a * id * pointer.y + -wt.b * id * pointer.x + (-wt.ty * wt.a + wt.tx * wt.b) * id
        );

    },

    /**
    * 检测指针是否和给定的显示对象碰撞
    * @method egame.Input#hitTest
    * @param {DisplayObject} displayObject - 用于检测的显示对象
    * @param {egame.Pointer} pointer - 用于检测的指针
    * @param {egame.Point} localPoint - 指针在这个显示对象的局部坐标
    */
    hitTest: function (displayObject, pointer, localPoint) {

        if (!displayObject.worldVisible)
        {
            return false;
        }

        this.getLocalPosition(displayObject, pointer, this._localPoint);

        if(!localPoint) localPoint = egame.Point();
         localPoint.copyFrom(this._localPoint);
        //碰撞区域，精准碰撞检测
        if (displayObject.hitArea && displayObject.hitArea.contains)
        {
            return (displayObject.hitArea.contains(this._localPoint.x, this._localPoint.y));
        }else if(displayObject.containsPoint){

            return displayObject.containsPoint(point);

        }

        // 自己没碰撞，看看孩子有碰撞的没有，假设孩子都在parent内部，这个步骤是不需哟的
        for (var i = 0, len = displayObject.children.length; i < len; i++)
        {
            if (this.hitTest(displayObject.children[i], pointer, localPoint))
            {
                return true;
            }
        }

        return false;
    }

};

egame.Input.prototype.constructor = egame.Input;

/**
* 最近活动指针的x坐标
* @name egame.Input#x
* @property {number} x
*/
Object.defineProperty(egame.Input.prototype, "x", {

    get: function () {
        return this._x;
    },

    set: function (value) {
        this._x = Math.floor(value);
    }

});

/**
* 最近活动指针的y坐标
* @name egame.Input#y
* @property {number} y
*/
Object.defineProperty(egame.Input.prototype, "y", {

    get: function () {
        return this._y;
    },

    set: function (value) {
        this._y = Math.floor(value);
    }

});

/**
* 如果是真的那么现在输入检查受制于poll rate被锁住。
* @name egame.Input#pollLocked
* @property {boolean} pollLocked
* @readonly
*/
Object.defineProperty(egame.Input.prototype, "pollLocked", {

    get: function () {
        return (this.pollRate > 0 && this._pollCounter < this.pollRate);
    }

});

/**
* 所有没有激活的指针
* @name egame.Input#totalInactivePointers
* @property {number} totalInactivePointers
* @readonly
*/
Object.defineProperty(egame.Input.prototype, "totalInactivePointers", {

    get: function () {
        return this.pointers.length - this.countActivePointers();
    }

});

/**
* 所有激活的指针，不统计鼠标指针
* @name egame.Input#totalActivePointers
* @property {integers} totalActivePointers
* @readonly
*/
Object.defineProperty(egame.Input.prototype, "totalActivePointers", {

    get: function () {
        return this.countActivePointers();
    }

});

/**
* 最近活动指针的世界x坐标
* @name egame.Input#worldX
* @property {number} worldX - 最近活动指针的世界x坐标
* @readonly
*/
Object.defineProperty(egame.Input.prototype, "worldX", {

    get: function () {
        return this.game.camera.view.x + this.x;
    }

});

/**
* 最近活动指针的世界y坐标
* @name egame.Input#worldY
* @property {number} worldY - 最近活动指针的世界y坐标
* @readonly
*/
Object.defineProperty(egame.Input.prototype, "worldY", {

    get: function () {
        return this.game.camera.view.y + this.y;
    }

});
