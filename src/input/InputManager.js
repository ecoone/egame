egame.define("InputManager", ["InputUtils", "TouchAction", "Input", "Recognizer", "ArraySet"], function(InputUtils, TouchAction, Input, Recognizer, ArraySet) {
    var STOP = 1;
    var FORCED_STOP = 2;

    /**
     * Manager
     * @param {HTMLElement} element
     * @param {Object} [options]
     * @constructor
     */
    function InputManager(game, options, element) {
        this.game = game;
        this.options = InputUtils.assign({}, InputManager.defaults, options || {});

        this.element = element || this.game.stage.canvas;
        this.options.inputTarget = this.options.inputTarget || this.element;
        this.handlers = {};
        this.session = {};
        this.recognizers = [];
        this.pointers = null;
        this.input = Input.createInputInstance(this);
        this.touchAction = new TouchAction(this, this.options.touchAction);

        toggleCssProps(this, true);

        InputUtils.each(this.options.recognizers, function(item) {
            var recognizer = this.add(new(item[0])(item[1]));
            item[2] && recognizer.recognizeWith(item[2]);
            item[3] && recognizer.requireFailure(item[3]);
        }, this);

        this.interactiveItems = new ArraySet();
        this._localPoint = new egame.Point();
        this.game.input = this;
    }

    InputManager.prototype = {
        /**
         * set options
         * @param {Object} options
         * @returns {Manager}
         */
        set: function(options) {
            InputUtils.assign(this.options, options);

            // Options that need a little more setup
            if (options.touchAction) {
                this.touchAction.update();
            }
            if (options.inputTarget) {
                // Clean up existing event listeners and reinitialize
                this.input.destroy();
                this.input.target = options.inputTarget;
                this.input.init();
            }
            return this;
        },

        /**
         * stop recognizing for this session.
         * This session will be discarded, when a new [input]start event is fired.
         * When forced, the recognizer cycle is stopped immediately.
         * @param {Boolean} [force]
         */
        stop: function(force) {
            this.session.stopped = force ? FORCED_STOP : STOP;
        },

        /**
         * run the recognizers!
         * called by the inputHandler function on every movement of the pointers (touches)
         * it walks through all the recognizers and tries to detect the gesture that is being made
         * @param {Object} inputData
         */
        recognize: function(inputData) {
            var session = this.session;
            if (session.stopped) {
                return;
            }

            // run the touch-action polyfill
            this.touchAction.preventDefaults(inputData);

            var recognizer;
            var recognizers = this.recognizers;

            // this holds the recognizer that is being recognized.
            // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
            // if no recognizer is detecting a thing, it is set to `null`
            var curRecognizer = session.curRecognizer;

            // reset when the last recognizer is recognized
            // or when we're in a new session
            if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
                curRecognizer = session.curRecognizer = null;
            }

            var i = 0;
            while (i < recognizers.length) {
                recognizer = recognizers[i];

                // find out if we are allowed try to recognize the input for this one.
                // 1.   allow if the session is NOT forced stopped (see the .stop() method)
                // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
                //      that is being recognized.
                // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
                //      this can be setup with the `recognizeWith()` method on the recognizer.
                if (session.stopped !== FORCED_STOP && ( // 1
                        !curRecognizer || recognizer == curRecognizer || // 2
                        recognizer.canRecognizeWith(curRecognizer))) { // 3
                    recognizer.recognize(inputData);
                } else {
                    recognizer.reset();
                }

                // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
                // current active recognizer. but only if we don't already have an active recognizer
                if (!curRecognizer && recognizer.state & (Recognizer.STATE_BEGAN | Recognizer.STATE_CHANGED | Recognizer.STATE_ENDED)) {
                    curRecognizer = session.curRecognizer = recognizer;
                }
                i++;
            }
        },

        /**
         * get a recognizer by its event name.
         * @param {Recognizer|String} recognizer
         * @returns {Recognizer|Null}
         */
        get: function(recognizer) {
            if (recognizer instanceof Recognizer) {
                return recognizer;
            }

            var recognizers = this.recognizers;
            for (var i = 0; i < recognizers.length; i++) {
                if (recognizers[i].options.event == recognizer) {
                    return recognizers[i];
                }
            }
            return null;
        },

        /**
         * add a recognizer to the manager
         * existing recognizers with the same event name will be removed
         * @param {Recognizer} recognizer
         * @returns {Recognizer|Manager}
         */
        add: function(recognizer) {
            if (InputUtils.invokeArrayArg(recognizer, 'add', this)) {
                return this;
            }

            // remove existing
            var existing = this.get(recognizer.options.event);
            if (existing) {
                this.remove(existing);
            }

            this.recognizers.push(recognizer);
            recognizer.manager = this;

            this.touchAction.update();
            return recognizer;
        },

        /**
         * remove a recognizer by name or instance
         * @param {Recognizer|String} recognizer
         * @returns {Manager}
         */
        remove: function(recognizer) {
            if (InputUtils.invokeArrayArg(recognizer, 'remove', this)) {
                return this;
            }

            recognizer = this.get(recognizer);

            // let's make sure this recognizer exists
            if (recognizer) {
                var recognizers = this.recognizers;
                var index = InputUtils.inArray(recognizers, recognizer);

                if (index !== -1) {
                    recognizers.splice(index, 1);
                    this.touchAction.update();
                }
            }

            return this;
        },

        /**
         * bind event
         * @param {String} events
         * @param {Function} handler
         * @returns {EventEmitter} this
         */
        on: function(events, handler) {
            var handlers = this.handlers;
            InputUtils.each(InputUtils.splitStr(events), function(event) {
                handlers[event] = handlers[event] || [];
                handlers[event].push(handler);
            });
            return this;
        },

        /**
         * unbind event, leave emit blank to remove all handlers
         * @param {String} events
         * @param {Function} [handler]
         * @returns {EventEmitter} this
         */
        off: function(events, handler) {
            var handlers = this.handlers;
            InputUtils.each(InputUtils.splitStr(events), function(event) {
                if (!handler) {
                    delete handlers[event];
                } else {
                    handlers[event] && handlers[event].splice(InputUtils.inArray(handlers[event], handler), 1);
                }
            });
            return this;
        },

        /**
         * emit event to the listeners
         * @param {String} event
         * @param {Object} data
         */
        emit: function(event, data) {
            // we also want to trigger dom events
            if (this.options.domEvents) {
                triggerDomEvent(event, data);
            }
            var inputHandler = this.processInteractiveObjects(data.firstInputData.pointers[0]);
            if (inputHandler) inputHandler.sprite.emit(event,data);
            // no handlers, so skip it all
            var handlers = this.handlers[event] && this.handlers[event].slice();
            if (!handlers || !handlers.length) {
                return;
            }

            data.type = event;
            data.preventDefault = function() {
                data.srcEvent.preventDefault();
            };
            var i = 0;
            while (i < handlers.length) {
                handlers[i](data);
                i++;
            }
        },

        /**
         * destroy the manager and unbinds all events
         * it doesn't unbind dom events, that is the user own responsibility
         */
        destroy: function() {
            this.element && toggleCssProps(this, false);

            this.handlers = {};
            this.session = {};
            this.input.destroy();
            this.element = null;
        },
        //Niu 用于检测
        /**
         * 将鼠标或者触摸位置转化为游戏内部使用的坐标
         * @param  {[type]} x     [description]
         * @param  {[type]} y     [description]
         * @param  {[type]} point [description]
         * @return {[type]}       [description]
         */
        mapPositionToPoint: function(x, y, point) {
            point = point || {};
            var rect = this.element.getBoundingClientRect();
            point.x = ((x - rect.left) * (this.element.width / rect.width)) / this.game.stage.renderer.resolution;
            point.y = ((y - rect.top) * (this.element.height / rect.height)) / this.game.stage.renderer.resolution;
            return point;
        },
        /**
         * 获去给定指针在显示对象的局部坐标
         * @method egame.Input#getLocalPosition
         * @param {egame.DisplayObject} displayObject - 用于得到局部坐标的显示对象
         * @param {egame.Pointer} pointer - 相对于显示对象的指针
         * @return {egame.Point} 指针相对于显示对象的坐标
         */
        getLocalPosition: function(displayObject, pointer, output) {
            if (output === undefined) {
                output = new egame.Point();
            }

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
        hitTest: function(displayObject, pointer, localPoint) {
            if (!displayObject.worldVisible) {
                return false;
            }
            this.getLocalPosition(displayObject, pointer, this._localPoint);
            localPoint = localPoint || new egame.Point();
            localPoint.copyFrom(this._localPoint);

            //碰撞区域，精准碰撞检测
            if (displayObject.hitArea && displayObject.hitArea.contains) {
                return (displayObject.hitArea.contains(this._localPoint.x, this._localPoint.y));
            } else if (displayObject.containsPoint) {

                return displayObject.containsPoint(pointer);

            }

            // 自己没碰撞，看看孩子有碰撞的没有，假设孩子都在parent内部，这个步骤是不需哟的
            for (var i = 0, len = displayObject.children.length; i < len; i++) {
                if (this.hitTest(displayObject.children[i], pointer, localPoint)) {
                    return true;
                }
            }

            return false;
        },
        /**
         * 处理所有的交互对象来发现哪一个被更新在最近一次指针移动中
         * @method egame.Pointer#processInteractiveObjects
         * @protected
         * @return {boolean} 如果处理了一个对象，那么就返回true
         */
        processInteractiveObjects: function(pointer) {
            //  算出哪个对象在顶部
            var highestRenderOrderID = Number.MAX_VALUE;
            var highestInputPriorityID = -1;
            var candidateTarget = null;

            //  First pass gets all objects that the pointer is over that DON'T use pixelPerfect checks and get the highest ID
            //  We know they'll be valid for input detection but not which is the top just yet

            var currentNode = this.game.input.interactiveItems.first;

            while (currentNode) {
                //  Reset checked status
                currentNode.checked = false;

                if (currentNode.validForInput(highestInputPriorityID, highestRenderOrderID)) {
                    //  Flag it as checked so we don't re-scan it on the next phase
                    currentNode.checked = true;
                    if (this.hitTest(currentNode.sprite, pointer)) {
                        highestRenderOrderID = currentNode.sprite.renderOrderID;
                        highestInputPriorityID = currentNode.priorityID;
                        candidateTarget = currentNode;
                    }
                }

                currentNode = this.game.input.interactiveItems.next;
            }
            return candidateTarget;
        }
    };

    /**
     * add/remove the css properties as defined in manager.options.cssProps
     * @param {Manager} manager
     * @param {Boolean} add
     */
    function toggleCssProps(manager, add) {
        var element = manager.element;
        if (!element.style) {
            return;
        }
        InputUtils.each(manager.options.cssProps, function(value, name) {
            element.style[InputUtils.prefixed(element.style, name)] = add ? value : '';
        });
    }

    /**
     * trigger dom event
     * @param {String} event
     * @param {Object} data
     */
    function triggerDomEvent(event, data) {
        var gestureEvent = document.createEvent('Event');
        gestureEvent.initEvent(event, true, true);
        gestureEvent.gesture = data;
        data.target.dispatchEvent(gestureEvent);
    }
    /**
     * default settings
     * @namespace
     */
    InputManager.defaults = {
        /**
         * set if DOM events are being triggered.
         * But this is slower and unused by simple implementations, so disabled by default.
         * @type {Boolean}
         * @default false
         */
        domEvents: false,

        /**
         * The value for the touchAction property/fallback.,即TOUCH_ACTION_COMPUTE
         * When set to `compute` it will magically set the correct value based on the added recognizers.
         * @type {String}
         * @default compute
         */
        touchAction: 'compute',

        /**
         * @type {Boolean}
         * @default true
         */
        enable: true,

        /**
         * EXPERIMENTAL FEATURE -- can be removed/changed
         * Change the parent input target element.
         * If Null, then it is being set the to main element.
         * @type {Null|EventTarget}
         * @default null
         */
        inputTarget: null,

        /**
         * force an input class
         * @type {Null|Function}
         * @default null
         */
        inputClass: 'TouchInput',

        /**
         * Default recognizer setup when calling `Hammer()`
         * When creating a new Manager these will be skipped.
         * @type {Array}
         */
        preset: [
            // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
            // [RotateRecognizer, {
            //     enable: false
            // }],
            // [PinchRecognizer, {
            //         enable: false
            //     },
            //     ['rotate']
            // ],
            // [Swipe, {
            //     direction: DIRECTION_HORIZONTAL
            // }],
            // [Pan, {
            //         direction: DIRECTION_HORIZONTAL
            //     },
            //     ['swipe']
            // ],
            // [Tap],
            // [Tap, {
            //         event: 'doubletap',
            //         taps: 2
            //     },
            //     ['tap']
            // ],
            // [Press]
        ],

        /**
         * Some CSS properties can be used to improve the working of Hammer.
         * Add them to this method and they will be set when creating a new Manager.
         * @namespace
         */
        cssProps: {
            /**
             * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
             * @type {String}
             * @default 'none'
             */
            userSelect: 'none',

            /**
             * Disable the Windows Phone grippers when pressing an element.
             * @type {String}
             * @default 'none'
             */
            touchSelect: 'none',

            /**
             * Disables the default callout shown when you touch and hold a touch target.
             * On iOS, when you touch and hold a touch target such as a link, Safari displays
             * a callout containing information about the link. This property allows you to disable that callout.
             * @type {String}
             * @default 'none'
             */
            touchCallout: 'none',

            /**
             * Specifies whether zooming is enabled. Used by IE10>
             * @type {String}
             * @default 'none'
             */
            contentZooming: 'none',

            /**
             * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
             * @type {String}
             * @default 'none'
             */
            userDrag: 'none',

            /**
             * Overrides the highlight color shown when the user taps a link or a JavaScript
             * clickable element in iOS. This property obeys the alpha value, if specified.
             * @type {String}
             * @default 'rgba(0,0,0,0)'
             */
            tapHighlightColor: 'rgba(0,0,0,0)'
        }
    };

    egame.InputManager = InputManager;
    return InputManager;
});