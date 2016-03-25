egame.define("InteractionManager", ["Point","DisplayObject","interactiveTarget","InteractionData","CanvasRenderer"], function(Point,DisplayObject,interactiveTarget,InteractionData,CanvasRenderer) {
// 混合交互目标到显示对象原型
 egame.util.extend(
    DisplayObject.prototype,
    interactiveTarget
);

/**
 * 交互对象管理，用于处理鼠标和触摸事件。任何的显示对象是可交互，如果他的interactive参数设置为true
 * @class
 * @memberof egame.interaction
 * @param renderer {egame.CanvasRenderer|egame.WebGLRenderer} 渲染器引用
 * @param [options] {object}
 * @param [options.autoPreventDefault=true] {boolean} 是否默认自动组织浏览器默认动作
 * @param [options.interactionFrequency=10] {number} Frequency increases the interaction events will be checked.
 */
function InteractionManager(renderer, options)
{
    options = options || {};

    /**
     * 交互管理对象工作的渲染器
     * @member {egame.SystemRenderer}
     */
    this.renderer = renderer;

    /**
     * 是否默认自动组织浏览器默认动作
     * @member {boolean}
     * @default true
     */
    this.autoPreventDefault = options.autoPreventDefault !== undefined ? options.autoPreventDefault : true;

    /**
     * 交互更新频率
     * @member {number}
     * @default 10
     */
    this.interactionFrequency = options.interactionFrequency || 10;

    /**
     * 鼠标交互数据
     * @member {egame.interaction.InteractionData}
     */
    this.mouse = new InteractionData();

    /**
     *  事件数据对象用于处理事件的跟踪/分发
     * @member {object}
     */
    this.eventData = {
        stopped: false,
        target: null,
        type: null,
        data: this.mouse,
        stopPropagation:function(){
            this.stopped = true;
        }
    };

    /**
     * 小的交互信息对象池
     * @member {egame.interaction.InteractionData[]}
     */
    this.interactiveDataPool = [];

    /**
     * 绑定事件的DOM元素
     * @member {HTMLElement}
     * @private
     */
    this.interactionDOMElement = null;

    /**
     * 是否有事件绑定到dom元素上
     * @member {boolean}
     * @private
     */
    this.eventsAdded = false;

    //这样做你不用总是调用bind函数
    /**
     * @member {Function}
     */
    this.onMouseUp = this.onMouseUp.bind(this);
    this.processMouseUp = this.processMouseUp.bind( this );


    /**
     * @member {Function}
     */
    this.onMouseDown = this.onMouseDown.bind(this);
    this.processMouseDown = this.processMouseDown.bind( this );

    /**
     * @member {Function}
     */
    this.onMouseMove = this.onMouseMove.bind( this );
    this.processMouseMove = this.processMouseMove.bind( this );

    /**
     * @member {Function}
     */
    this.onMouseOut = this.onMouseOut.bind(this);
    this.processMouseOverOut = this.processMouseOverOut.bind( this );


    /**
     * @member {Function}
     */
    this.onTouchStart = this.onTouchStart.bind(this);
    this.processTouchStart = this.processTouchStart.bind(this);

    /**
     * @member {Function}
     */
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.processTouchEnd = this.processTouchEnd.bind(this);

    /**
     * @member {Function}
     */
    this.onTouchMove = this.onTouchMove.bind(this);
    this.processTouchMove = this.processTouchMove.bind(this);

    /**
     * @member {number}
     */
    this.last = 0;

    /**
     * 光标样式
     * @member {string}
     */
    this.currentCursorStyle = 'inherit';

    /**
     * Internal cached var
     * @member {egame.Point}
     * @private
     */
    this._tempPoint = new Point();

    /**
     * The current ·resolution
     * @member {number}
     */
    this.resolution = 1;

    this.setTargetElement(this.renderer.view, this.renderer.resolution);
}

InteractionManager.prototype.constructor = InteractionManager;

/**
 * 设置接受鼠标触摸事件的DOM对象，这个非常有用的当有DOM元素在渲染器canvas元素的上面。你可以将事件脱光到另外一个DOM元素上
 * @param element {HTMLElement} 要接受鼠标触摸事件的DOM元素
 * @param [resolution=1] {number} 新元素的分辨率
 * @private
 */
InteractionManager.prototype.setTargetElement = function (element, resolution)
{
    this.removeEvents();

    this.interactionDOMElement = element;

    this.resolution = resolution || 1;

    this.addEvents();
};

/**
 * 注册所有DOM事件
 *
 * @private
 */
InteractionManager.prototype.addEvents = function ()
{
    if (!this.interactionDOMElement)
    {
        return;
    }

    // core.ticker.shared.add(this.update, this);

    if (window.navigator.msPointerEnabled)
    {
        this.interactionDOMElement.style['-ms-content-zooming'] = 'none';
        this.interactionDOMElement.style['-ms-touch-action'] = 'none';
    }

    window.document.addEventListener('mousemove',    this.onMouseMove, true);
    this.interactionDOMElement.addEventListener('mousedown',    this.onMouseDown, true);
    this.interactionDOMElement.addEventListener('mouseout',     this.onMouseOut, true);

    this.interactionDOMElement.addEventListener('touchstart',   this.onTouchStart, true);
    this.interactionDOMElement.addEventListener('touchend',     this.onTouchEnd, true);
    this.interactionDOMElement.addEventListener('touchmove',    this.onTouchMove, true);

    window.addEventListener('mouseup',  this.onMouseUp, true);

    this.eventsAdded = true;
};

/**
 * 移除所有的DOM事件
 *
 * @private
 */
InteractionManager.prototype.removeEvents = function ()
{
    if (!this.interactionDOMElement)
    {
        return;
    }

    // core.ticker.shared.remove(this.update);

    if (window.navigator.msPointerEnabled)
    {
        this.interactionDOMElement.style['-ms-content-zooming'] = '';
        this.interactionDOMElement.style['-ms-touch-action'] = '';
    }

    window.document.removeEventListener('mousemove', this.onMouseMove, true);
    this.interactionDOMElement.removeEventListener('mousedown', this.onMouseDown, true);
    this.interactionDOMElement.removeEventListener('mouseout',  this.onMouseOut, true);

    this.interactionDOMElement.removeEventListener('touchstart', this.onTouchStart, true);
    this.interactionDOMElement.removeEventListener('touchend',  this.onTouchEnd, true);
    this.interactionDOMElement.removeEventListener('touchmove', this.onTouchMove, true);

    this.interactionDOMElement = null;

    window.removeEventListener('mouseup',  this.onMouseUp, true);

    this.eventsAdded = false;
};

/**
 * 更新交互对象的状态，通过ticker update调用
 * {@link egame.ticker.shared}.
 * @param deltaTime {number}
 */
InteractionManager.prototype.update = function (deltaTime)
{
    this._deltaTime += deltaTime;

    if (this._deltaTime < this.interactionFrequency)
    {
        return;
    }

    this._deltaTime = 0;

    if (!this.interactionDOMElement)
    {
        return;
    }

    // 如果用户鼠标移动已经被触发了，那么就返回
    if(this.didMove)
    {
        this.didMove = false;
        return;
    }

    this.cursor = 'inherit';

    //处理鼠标移动,这里可能是显示对象移动
    this.processInteractive(this.mouse.global, this.renderer._lastObjectRendered, this.processMouseOverOut, true );

    //更新当前光标
    if (this.currentCursorStyle !== this.cursor)
    {
        this.currentCursorStyle = this.cursor;
        this.interactionDOMElement.style.cursor = this.cursor;
    }

};

/**
 * 分发事件到显示对象上
 * @param displayObject {egame.Container|egame.Sprite|egame.extras.TilingSprite} 显示对象
 * @param eventString {string} 事件名称 (e.g, mousedown)
 * @param eventData {object} 事件数据对象
 * @private
 */
InteractionManager.prototype.dispatchEvent = function ( displayObject, eventString, eventData )
{
    if(!eventData.stopped)
    {
        eventData.target = displayObject;
        eventData.type = eventString;

        displayObject.emit( eventString, eventData );

        if( displayObject[eventString] )
        {
            displayObject[eventString]( eventData );
        }
    }
};

/**
 * 将dom事件x,y坐标对应到egame游戏视图中。这个结果值会被存储到point点中，这个点计算考虑到了dom元素缩放和定位
 * @param  {egame.Point} point the point that the result will be stored in
 * @param  {number} x     the x coord of the position to map
 * @param  {number} y     the y coord of the position to map
 */
InteractionManager.prototype.mapPositionToPoint = function ( point, x, y )
{
    var rect = this.interactionDOMElement.getBoundingClientRect();
    point.x = ( ( x - rect.left ) * (this.interactionDOMElement.width  / rect.width  ) ) / this.resolution;
    point.y = ( ( y - rect.top  ) * (this.interactionDOMElement.height / rect.height ) ) / this.resolution;
};

/**
 * 处理交互对象，并进行碰撞检测结果
 * @param  {egame.Point} point 用于碰撞检测的点
 * @param  {egame.Container|egame.Sprite|egame.extras.TilingSprite} displayObject 用于碰撞检测的显示对象（递归搜索他的孩子）
 * @param  {Function}  func 函数将会在每个交互对象上调用。显示对象和hit会被传入
 * @param  {boolean} hitTest 意味着这个对象需要进行碰撞检测
 * @return {boolean} 如果发生了碰撞那么就返回true
 */
InteractionManager.prototype.processInteractive = function (point, displayObject, func, hitTest, interactive)
{
    //隐藏的交互对象不就行碰撞检测
    if(!displayObject || !displayObject.visible)
    {
        return false;
    }

    // 所有元素都会循环，但是碰撞检测不是
    // 需要进行碰撞检测的条件：
    // 1: 自己是可交互的
    // 2: 父元素是可交互的，且父元素还为发生碰撞
    var hit = false,
        interactiveParent = interactive = displayObject.interactive || interactive;

    // 如果有碰撞区域不需要让孩子进行碰撞检测
    if(displayObject.hitArea)
    {
        interactiveParent = false;
    }

    //检测子对象
    if(displayObject.interactiveChildren)
    {       
        var children = displayObject.children;
        for (var i = children.length-1; i >= 0; i--)
        {
            // 递归调用
            if( this.processInteractive(point, children[i], func, hitTest, interactiveParent) )
            {
                //孩子发生碰撞那么parent也发生了碰撞
                hit = true;

                //不在需要给这个容器中的更多对象进行碰撞检测了，因为我们知道parent已经发生了碰撞
                interactiveParent = false;
                
                //如果孩子是可交互，这意味发生了碰撞的对象是可交互对象
                //这意味着我们不在需要进行碰撞检测了，我们任然需要运行所有对象，但不必要进行碰撞检测了
                if(children[i].interactive)
                {
                    hitTest = false;
                }
            }
        }
    }
    // 如果是不可交互的或者父元素是不可交互的
    if(interactive)
    {
        //需要进行碰撞检测，我们不需要担心子元素已经发生过碰撞检测
        if(hitTest && !hit)
        {  
            if(displayObject.hitArea)
            {
                displayObject.worldTransform.applyInverse(point,  this._tempPoint);
                hit = displayObject.hitArea.contains( this._tempPoint.x, this._tempPoint.y );
            }
            else if(displayObject.containsPoint)
            {
                hit = displayObject.containsPoint(point);
            }
        }
        //如果对象是可交互的那么运行交互回掉
        if(displayObject.interactive)
        {
            func(displayObject, hit); 
        }
    }

    return hit;
  
};


/**
 * 在鼠标在渲染元素上被按下的时候触发
 * @param event {Event} 鼠标被按下的DOM事件
 * @private
 */
InteractionManager.prototype.onMouseDown = function (event)
{
    this.mouse.originalEvent = event;
    this.eventData.data = this.mouse;
    this.eventData.stopped = false;
    // 更新坐标点
    this.mapPositionToPoint( this.mouse.global, event.clientX, event.clientY);

    if (this.autoPreventDefault)
    {
        this.mouse.originalEvent.preventDefault();
    }

    this.processInteractive(this.mouse.global, this.renderer._lastObjectRendered, this.processMouseDown, true );
};

/**
 * 处理鼠标被按下的检测和分发事件
 * @param displayObject {egame.Container|egame.Sprite|egame.extras.TilingSprite} 被检测的显示对象
 * @param hit {boolean} 是否发生碰撞
 * @private
 */
InteractionManager.prototype.processMouseDown = function ( displayObject, hit )
{
    var e = this.mouse.originalEvent;
    
    var isRightButton = e.button === 2 || e.which === 3;

    if(hit)
    {
        displayObject[ isRightButton ? '_isRightDown' : '_isLeftDown' ] = true;
        this.dispatchEvent( displayObject, isRightButton ? 'rightdown' : 'mousedown', this.eventData );
    }
};



/**
 * Is called when the mouse button is released on the renderer element
 *
 * @param event {Event} The DOM event of a mouse button being released
 * @private
 */
InteractionManager.prototype.onMouseUp = function (event)
{
    this.mouse.originalEvent = event;
    this.eventData.data = this.mouse;
    this.eventData.stopped = false;

    // Update internal mouse reference
    this.mapPositionToPoint( this.mouse.global, event.clientX, event.clientY);

    this.processInteractive(this.mouse.global, this.renderer._lastObjectRendered, this.processMouseUp, true );
};

/**
 * Processes the result of the mouse up check and dispatches the event if need be
 *
 * @param displayObject {egame.Container|egame.Sprite|egame.extras.TilingSprite} The display object that was tested
 * @param hit {boolean} the result of the hit test on the display object
 * @private
 */
InteractionManager.prototype.processMouseUp = function ( displayObject, hit )
{
    var e = this.mouse.originalEvent;

    var isRightButton = e.button === 2 || e.which === 3;
    var isDown =  isRightButton ? '_isRightDown' : '_isLeftDown';

    if(hit)
    {
        this.dispatchEvent( displayObject, isRightButton ? 'rightup' : 'mouseup', this.eventData );

        if( displayObject[ isDown ] )
        {
            displayObject[ isDown ] = false;
            this.dispatchEvent( displayObject, isRightButton ? 'rightclick' : 'click', this.eventData );
        }
    }
    else
    {
        if( displayObject[ isDown ] )
        {
            displayObject[ isDown ] = false;
            this.dispatchEvent( displayObject, isRightButton ? 'rightupoutside' : 'mouseupoutside', this.eventData );
        }
    }
};


/**
 * Is called when the mouse moves across the renderer element
 *
 * @param event {Event} The DOM event of the mouse moving
 * @private
 */
InteractionManager.prototype.onMouseMove = function (event)
{
    this.mouse.originalEvent = event;
    this.eventData.data = this.mouse;
    this.eventData.stopped = false;

    this.mapPositionToPoint( this.mouse.global, event.clientX, event.clientY);

    this.didMove = true;

    this.cursor = 'inherit';

    this.processInteractive(this.mouse.global, this.renderer._lastObjectRendered, this.processMouseMove, true );

    if (this.currentCursorStyle !== this.cursor)
    {
        this.currentCursorStyle = this.cursor;
        this.interactionDOMElement.style.cursor = this.cursor;
    }

    //TODO BUG for parents ineractive object (border order issue)
};

/**
 * Processes the result of the mouse move check and dispatches the event if need be
 *
 * @param displayObject {egame.Container|egame.Sprite|egame.extras.TilingSprite} The display object that was tested
 * @param hit {boolean} the result of the hit test on the display object
 * @private
 */
InteractionManager.prototype.processMouseMove = function ( displayObject, hit )
{
    this.dispatchEvent( displayObject, 'mousemove', this.eventData);
    this.processMouseOverOut(displayObject, hit);
};


/**
 * Is called when the mouse is moved out of the renderer element
 *
 * @param event {Event} The DOM event of a mouse being moved out
 * @private
 */
InteractionManager.prototype.onMouseOut = function (event)
{
    this.mouse.originalEvent = event;
    this.eventData.stopped = false;

    // Update internal mouse reference
    this.mapPositionToPoint( this.mouse.global, event.clientX, event.clientY);

    this.interactionDOMElement.style.cursor = 'inherit';

    // TODO optimize by not check EVERY TIME! maybe half as often? //
    this.mapPositionToPoint( this.mouse.global, event.clientX, event.clientY );

    this.processInteractive( this.mouse.global, this.renderer._lastObjectRendered, this.processMouseOverOut, false );
};

/**
 * Processes the result of the mouse over/out check and dispatches the event if need be
 *
 * @param displayObject {egame.Container|egame.Sprite|egame.extras.TilingSprite} The display object that was tested
 * @param hit {boolean} the result of the hit test on the display object
 * @private
 */
InteractionManager.prototype.processMouseOverOut = function ( displayObject, hit )
{
    if(hit)
    {
        if(!displayObject._over)
        {
            displayObject._over = true;
            this.dispatchEvent( displayObject, 'mouseover', this.eventData );
        }

        if (displayObject.buttonMode)
        {
            this.cursor = displayObject.defaultCursor;
        }
    }
    else
    {
        if(displayObject._over)
        {
            displayObject._over = false;
            this.dispatchEvent( displayObject, 'mouseout', this.eventData);
        }
    }
};


/**
 * Is called when a touch is started on the renderer element
 *
 * @param event {Event} The DOM event of a touch starting on the renderer view
 * @private
 */
InteractionManager.prototype.onTouchStart = function (event)
{
    if (this.autoPreventDefault)
    {
        event.preventDefault();
    }

    var changedTouches = event.changedTouches;
    var cLength = changedTouches.length;

    for (var i=0; i < cLength; i++)
    {
        var touchEvent = changedTouches[i];
        //TODO POOL
        var touchData = this.getTouchData( touchEvent );

        touchData.originalEvent = event;

        this.eventData.data = touchData;
        this.eventData.stopped = false;
        this.processInteractive( touchData.global, this.renderer._lastObjectRendered, this.processTouchStart, true );
        this.returnTouchData( touchData );
    }
};

/**
 * Processes the result of a touch check and dispatches the event if need be
 *
 * @param displayObject {egame.Container|egame.Sprite|egame.extras.TilingSprite} The display object that was tested
 * @param hit {boolean} the result of the hit test on the display object
 * @private
 */
InteractionManager.prototype.processTouchStart = function ( displayObject, hit )
{
    if(hit)
    {
        displayObject._touchDown = true;
        this.dispatchEvent( displayObject, 'touchstart', this.eventData );
    }
};


/**
 * Is called when a touch ends on the renderer element
 *
 * @param event {Event} The DOM event of a touch ending on the renderer view
 */
InteractionManager.prototype.onTouchEnd = function (event)
{
    if (this.autoPreventDefault)
    {
        event.preventDefault();
    }

    var changedTouches = event.changedTouches;
    var cLength = changedTouches.length;

    for (var i=0; i < cLength; i++)
    {
        var touchEvent = changedTouches[i];

        var touchData = this.getTouchData( touchEvent );

        touchData.originalEvent = event;

        //TODO this should be passed along.. no set
        this.eventData.data = touchData;
        this.eventData.stopped = false;


        this.processInteractive( touchData.global, this.renderer._lastObjectRendered, this.processTouchEnd, true );

        this.returnTouchData( touchData );
    }
};

/**
 * Processes the result of the end of a touch and dispatches the event if need be
 *
 * @param displayObject {egame.Container|egame.Sprite|egame.extras.TilingSprite} The display object that was tested
 * @param hit {boolean} the result of the hit test on the display object
 * @private
 */
InteractionManager.prototype.processTouchEnd = function ( displayObject, hit )
{
    if(hit)
    {
        this.dispatchEvent( displayObject, 'touchend', this.eventData );

        if( displayObject._touchDown )
        {
            displayObject._touchDown = false;
            this.dispatchEvent( displayObject, 'tap', this.eventData );
        }
    }
    else
    {
        if( displayObject._touchDown )
        {
            displayObject._touchDown = false;
            this.dispatchEvent( displayObject, 'touchendoutside', this.eventData );
        }
    }
};

/**
 * Is called when a touch is moved across the renderer element
 *
 * @param event {Event} The DOM event of a touch moving across the renderer view
 * @private
 */
InteractionManager.prototype.onTouchMove = function (event)
{
    if (this.autoPreventDefault)
    {
        event.preventDefault();
    }

    var changedTouches = event.changedTouches;
    var cLength = changedTouches.length;

    for (var i=0; i < cLength; i++)
    {
        var touchEvent = changedTouches[i];

        var touchData = this.getTouchData( touchEvent );

        touchData.originalEvent = event;

        this.eventData.data = touchData;
        this.eventData.stopped = false;

        this.processInteractive( touchData.global, this.renderer._lastObjectRendered, this.processTouchMove, true );

        this.returnTouchData( touchData );
    }
};

/**
 * Processes the result of a touch move check and dispatches the event if need be
 *
 * @param displayObject {egame.Container|egame.Sprite|egame.extras.TilingSprite} The display object that was tested
 * @param hit {boolean} the result of the hit test on the display object
 * @private
 */
InteractionManager.prototype.processTouchMove = function ( displayObject, hit )
{
    hit = hit;
    this.dispatchEvent( displayObject, 'touchmove', this.eventData);
};

/**
 * Grabs an interaction data object from the internal pool
 *
 * @param touchEvent {EventData} The touch event we need to pair with an interactionData object
 *
 * @private
 */
InteractionManager.prototype.getTouchData = function (touchEvent)
{
    var touchData = this.interactiveDataPool.pop();

    if(!touchData)
    {
        touchData = new InteractionData();
    }

    touchData.identifier = touchEvent.identifier;
    this.mapPositionToPoint( touchData.global, touchEvent.clientX, touchEvent.clientY );

    if(navigator.isCocoonJS)
    {
        touchData.global.x = touchData.global.x / this.resolution;
        touchData.global.y = touchData.global.y / this.resolution;
    }

    touchEvent.globalX = touchData.global.x;
    touchEvent.globalY = touchData.global.y;

    return touchData;
};

/**
 * Returns an interaction data object to the internal pool
 *
 * @param touchData {egame.interaction.InteractionData} The touch data object we want to return to the pool
 *
 * @private
 */
InteractionManager.prototype.returnTouchData = function ( touchData )
{
    this.interactiveDataPool.push( touchData );
};

/**
 * 销毁交互管理对象
 *
 */
InteractionManager.prototype.destroy = function () {
    this.removeEvents();

    this.renderer = null;

    this.mouse = null;

    this.eventData = null;

    this.interactiveDataPool = null;

    this.interactionDOMElement = null;

    this.onMouseUp = null;
    this.processMouseUp = null;


    this.onMouseDown = null;
    this.processMouseDown = null;

    this.onMouseMove = null;
    this.processMouseMove = null;

    this.onMouseOut = null;
    this.processMouseOverOut = null;


    this.onTouchStart = null;
    this.processTouchStart = null;

    this.onTouchEnd = null;
    this.processTouchEnd = null;

    this.onTouchMove = null;
    this.processTouchMove = null;

    this._tempPoint = null;
};

 //给canvas渲染器注册交互组件
 CanvasRenderer.registerPlugin('interaction', InteractionManager);

    egame.InteractionManager = InteractionManager;
    return InteractionManager;
});
