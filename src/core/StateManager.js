egame.define("StateManager",["EventEmitter"],function(EventEmitter){
    //游戏状态管理器,触发的事件有stateChanged
    egame.StateManager = function (game, pendingState) {
        EventEmitter.call(this);
        /**
         * 关联的game对象
        */
        this.game = game;

        /**
        * 用来存储state对象
        */
        this.states = {};

        /**
        *  当前使用的状态
        */
        this._pendingState = null;

        if (typeof pendingState !== 'undefined' && pendingState !== null)
        {
            this._pendingState = pendingState;
        }

        /**
        * 切换状态是否清除world
        */
        this._clearStage = false;

        /**
        *  切换状态是否清除缓存
        */
        this._clearCache = false;

        /**
        * 用来标志状态是否创建完成（当所有资源加载完成的时候创建就完成了）
        */
        this._created = false;

        /**
         * 用来表示当前状态是否加载完成
         */
        this._loaded = false;

        /**
        * 缓存给状态传入的变量
        */
        this._args = [];

        /**
        * 当前激活的状态对象
        */
        this.current = '';

        /**
        * 激活一个状态的时候调用
        */
        this.onInitCallback = null;

        /**
        * 开始加载资源的状态回调
        */
        this.onPreloadCallback = null;

        /**
        * 资源加载完成的回调方法
        */
        this.onCreateCallback = null;

        /**
        * 每个游戏循环中的状态更新方法，资源加载完成后才会调用这个方法
        */
        this.onUpdateCallback = null;

        /**
        * 每个游戏循环中的渲染方法，资源加载完成后才会调用这个方法
        */
        this.onRenderCallback = null;

        /**
        * ScaleManager.scalemode是RESIZE且一个resize事件发生调用
        */
        this.onResizeCallback = null;

        /**
        * 在状态渲染前出发，在stage清除之前，在所有显示对象属性调整之后
        */
        this.onPreRenderCallback = null;

        /**
        * 加载时的更新逻辑
        */
        this.onLoadUpdateCallback = null;

        /**
        * 加载时候的渲染回调
        */
        this.onLoadRenderCallback = null;

        /**
        * 暂停的回调
        */
        this.onPausedCallback = null;

        /**
        * 恢复的回调
        */
        this.onResumedCallback = null;

        /**
        * 暂停时的更新逻辑
        */
        this.onPauseUpdateCallback = null;

        /**
        * 状态shutdown的时候调用。比如切换状态   
        */
        this.onShutDownCallback = null;
    };
    
    egame.StateManager.prototype = Object.create(EventEmitter.prototype);
    egame.util.extend(egame.StateManager.prototype,{

        /**
        * 在游戏启动的时候，启动状态管理器
        */
        boot: function () {
            this.game.on("paused",this.pause,this);
            this.game.on("resumed",this.resume,this);
            if (this._pendingState !== null && typeof this._pendingState !== 'string')
            {
                this.add('default', this._pendingState, true);
            }

        },

        /**
        * 添加一个新的状态到状态管理器中,你必须要给这个状态一个名字。状态可以是egame.State对象，原始的javascript对象,也可以是一个返回状态对象的一个方法
        * @param {string} key - 状态标识比如 "MainMenu", "Level1".
        * @param {egame.State|object|function} state  - 状态
        * @param {boolean} [autoStart=false]  - 是否自动启动这个添加的状态
        */
        add: function (key, state, autoStart) {

            if (autoStart === undefined) { autoStart = false; }

            var newState;

            if (state instanceof egame.State)
            {
                newState = state;
            }
            else if (typeof state === 'object')
            {
                newState = state;
                newState.game = this.game;
            }
            else if (typeof state === 'function')
            {
                newState = new state(this.game);
            }

            this.states[key] = newState;

            if (autoStart)
            {
                if (this.game.isBooted)
                {
                    this.start(key);
                }
                else
                {
                    this._pendingState = key;
                }
            }

            return newState;

        },

        /**
        * 删除给定的状态
        */
        remove: function (key) {

            if (this.current === key)
            {
                this.callbackContext = null;

                this.onInitCallback = null;
                this.onShutDownCallback = null;

                this.onPreloadCallback = null;
                this.onLoadRenderCallback = null;
                this.onLoadUpdateCallback = null;
                this.onCreateCallback = null;
                this.onUpdateCallback = null;
                this.onPreRenderCallback = null;
                this.onRenderCallback = null;
                this.onResizeCallback = null;
                this.onPausedCallback = null;
                this.onResumedCallback = null;
                this.onPauseUpdateCallback = null;
            }

            delete this.states[key];

        },

        /**
        *  启动给定的状态,如果已经有一个状态在运行会调用这个状态的shutdown
        * @param {string} key - 你想启动状态的key
        * @param {boolean} [clearStage=true] - Clear everything in the world? This clears the World display list fully (but not the Stage, so if you've added your own objects to the Stage they will need managing directly)
        * @param {boolean} [clearCache=false] - Clear the Game.Cache? This purges out all loaded assets. The default is false and you must have clearStage=true if you want to clearCache as well.
        * @param {...*} parameter -更多的参数，传给state.init方法
        */
        start: function (key, clearStage, clearCache) {

            if (clearStage === undefined) { clearStage = true; }
            if (clearCache === undefined) { clearCache = false; }

            if (this.checkState(key))
            {
                // 把状态放入队列中，在游戏循环中会开始运行
                this._pendingState = key;
                this._clearStage = clearStage;
                this._clearCache = clearCache;

                if (arguments.length > 3)
                {
                    this._args = Array.prototype.splice.call(arguments, 3);
                }
            }
        },

        /**
        * 重新启动当前状态，在启动前State.shutDown方法会被调用
        * @param {boolean} [clearStage=true] - Clear everything in the world? This clears the World display list fully (but not the Stage, so if you've added your own objects to the Stage they will need managing directly)
        * @param {boolean} [clearCache=false] - Clear the Game.Cache? This purges out all loaded assets. The default is false and you must have clearStage=true if you want to clearCache as well.
        * @param {...*} parameter - 更多的参数，传给state.init方法
        */
        restart: function (clearStage, clearCache) {

            if (clearStage === undefined) { clearStage = true; }
            if (clearCache === undefined) { clearCache = false; }

            // 把状态放入队列中，在游戏循环中会开始运行
            this._pendingState = this.current;
            this._clearStage = clearStage;
            this._clearCache = clearCache;

            if (arguments.length > 2)
            {
                this._args = Array.prototype.slice.call(arguments, 2);
            }

        },

        /**
        * 当init和shutdwon不存在的时候调用这个空方法
        */
        dummy: function () {
        },

        /**
        * 在游戏循环的最开始调用，主要职责是切换状态
        */
        preUpdate: function () {

            if (this._pendingState && this.game.isBooted)
            {
                //
                var previousStateKey = this.current;

                //清除当前状态，会调用shutdown
                this.clearCurrentState();

                this.setCurrentState(this._pendingState);

                //状态变化触发事件
                this.emit("stateChanged",this.current, previousStateKey);
                if (this.current !== this._pendingState)
                {
                    return;
                }
                else
                {
                    //没有要切换的状态了
                    this._pendingState = null;
                }

                // 需要加载资源就要给状态设置preload
                if (this.onPreloadCallback)
                {   
                    this.game.load.reset(true);
                    this.onPreloadCallback.call(this.callbackContext, this.game);

                    // 加载完毕
                    if (this.game.load.totalQueuedFiles() === 0)
                    {
                        this.loadComplete();
                    }
                    else
                    {
                        //开始加载
                        this.game.load.start();
                    }
                }
                else
                {
                    //没有要加载的资源直接触发加载完成函数
                    this.loadComplete();
                }
            }
        },

        /**
        * 这个方法是用来清除当前状态，调用这个状态的shutdown回调
        */
        clearCurrentState: function () {

            if (this.current)
            {
                if (this.onShutDownCallback)
                {
                    this.onShutDownCallback.call(this.callbackContext, this.game);
                }

                this.game.time.removeAll();

                if (this._clearStage)
                {
                    if(this.game.stage) this.game.stage.removeChildren();

                    if (this._clearCache === true)
                    {
                        this.game.cache.destroy();
                    }
                }
            }
        },

        /**
        * 检测这个状态是否有效.只有至少有下面核心方法preload, create, update or render中的一个才能算是一个有效的状态。
        */
        checkState: function (key) {

            if (this.states[key])
            {
                var valid = false;

                if (this.states[key]['preload'] || this.states[key]['create'] || this.states[key]['update'] || this.states[key]['render'])
                {
                    valid = true;
                }

                if (valid === false)
                {
                    console.warn("Invalid egame State object given. Must contain at least a one of the required functions: preload, create, update or render");
                    return false;
                }

                return true;
            }
            else
            {
                console.warn("egame.StateManager - No state found with the key: " + key);
                return false;
            }
        },
        /**
        * 链接game的属性到指定的State上面
        */
        link: function (key) {

            this.states[key].game = this.game;
            this.states[key].add = this.game.add;
            this.states[key].make = this.game.make;
            this.states[key].camera = this.game.camera;
            this.states[key].cache = this.game.cache;
            this.states[key].input = this.game.input;
            this.states[key].load = this.game.load;
            this.states[key].math = this.game.math;
            this.states[key].sound = this.game.sound;
            this.states[key].scale = this.game.scale;
            this.states[key].state = this;
            this.states[key].stage = this.game.stage;
            this.states[key].time = this.game.time;
            this.states[key].tweens = this.game.tweens;
            this.states[key].world = this.game.world;
            this.states[key].particles = this.game.particles;
            this.states[key].rnd = this.game.rnd;
            this.states[key].physics = this.game.physics;
            this.states[key].key = key;
        },

        /**
        * 所有从game上引用的属性全部赋值为null
        */
        unlink: function (key) {

            if (this.states[key])
            {
                this.states[key].game = null;
                this.states[key].add = null;
                this.states[key].make = null;
                this.states[key].camera = null;
                this.states[key].cache = null;
                this.states[key].input = null;
                this.states[key].load = null;
                this.states[key].math = null;
                this.states[key].sound = null;
                this.states[key].scale = null;
                this.states[key].state = null;
                this.states[key].stage = null;
                this.states[key].time = null;
                this.states[key].tweens = null;
                this.states[key].world = null;
                this.states[key].particles = null;
                this.states[key].rnd = null;
                this.states[key].physics = null;
            }

        },
        /**
        * 设置当前状态，请不要直接调用这个方法
        */
        setCurrentState: function (key) {

            //状态回调的执行环境
            this.callbackContext = this.states[key];

            this.link(key);

            //  当状态被设置为活动状态调用初始函数
            this.onInitCallback = this.states[key]['init'] || this.dummy;

            this.onPreloadCallback = this.states[key]['preload'] || null;
            this.onLoadRenderCallback = this.states[key]['loadRender'] || null;
            this.onLoadUpdateCallback = this.states[key]['loadUpdate'] || null;
            this.onCreateCallback = this.states[key]['create'] || null;
            this.onUpdateCallback = this.states[key]['update'] || null;
            this.onPreRenderCallback = this.states[key]['preRender'] || null;
            this.onRenderCallback = this.states[key]['render'] || null;
            this.onResizeCallback = this.states[key]['resize'] || null;
            this.onPausedCallback = this.states[key]['paused'] || null;
            this.onResumedCallback = this.states[key]['resumed'] || null;
            this.onPauseUpdateCallback = this.states[key]['pauseUpdate'] || null;

            //  当状态不在是激活状态的时候调用
            this.onShutDownCallback = this.states[key]['shutdown'] || this.dummy;


            this.current = key;
            this._created = false;
            this._loaded = false;

            this.onInitCallback.apply(this.callbackContext, this._args);

            //清空回调参数
            if (key === this._pendingState)
            {
                this._args = [];
            }

            this.game._kickstart = true;

        },

        /**
         * 获取当前状态对象
         */
        getCurrentState: function() {
            return this.states[this.current];
        },

        /**
        * 资源加载完成
        */
        loadComplete: function () {
            if(this._loaded==false){
                this._loaded = true;
            }
        },

        /**
        * 游戏暂停的时候调用状态的暂停回调
        */
        pause: function () {

            if (this._created && this.onPausedCallback)
            {
                this.onPausedCallback.call(this.callbackContext, this.game);
            }

        },

        /**
        * 游戏恢复的时候调用状态的恢复回调
        */
        resume: function () {

            if (this._created && this.onResumedCallback)
            {
                this.onResumedCallback.call(this.callbackContext, this.game);
            }

        },

        /**
        * 状态更新逻辑
        */
        update: function () {
            if (this._created)
            {
                if (this.onUpdateCallback)
                {
                    this.onUpdateCallback.call(this.callbackContext, this.game);
                }
            }
            else
            {
                //资源加载的更新逻辑
                if (this.onLoadUpdateCallback)
                {
                    this.onLoadUpdateCallback.call(this.callbackContext, this.game);
                }
            }

        },

        /**
        * 游戏暂停时的更新
        */
        pauseUpdate: function () {

            if (this._created)
            {
                if (this.onPauseUpdateCallback)
                {
                    this.onPauseUpdateCallback.call(this.callbackContext, this.game);
                }
            }
            else
            {
                if (this.onLoadUpdateCallback)
                {
                    this.onLoadUpdateCallback.call(this.callbackContext, this.game);
                }
            }
        },

        /**
        * 在渲染前调用的函数
        */
        preRender: function (elapsedTime) {

            if (this._created && this.onPreRenderCallback)
            {
                this.onPreRenderCallback.call(this.callbackContext, this.game, elapsedTime);
            }

        },

        /**
        * 当页面resize的时候调用
        */
        resize: function (width, height) {

            if (this.onResizeCallback)
            {
                this.onResizeCallback.call(this.callbackContext, width, height);
            }

        },

        /**
        * 渲染的逻辑
        */
        render: function () {

            if (this._created)
            {
                if (this.onRenderCallback)
                {
                    this.onRenderCallback.call(this.callbackContext, this.game);
                }
            }
            else
            {   
                //资源没有加载好时的渲染逻辑
                if (this.onLoadRenderCallback)
                {
                    this.onLoadRenderCallback.call(this.callbackContext, this.game);
                }
                if(this._loaded){
                    if (this._created === false && this.onCreateCallback)
                    {
                        this._created = true;
                        this.onCreateCallback.call(this.callbackContext, this.game);
                        if(this.game.stage) this.game.stage.updateTransform();
                    }
                    else
                    {
                        this._created = true;
                    }
                }
            }

        },

        /**
        * 销毁状态管理器，无法恢复
        */
        destroy: function () {

            this.clearCurrentState();

            this.callbackContext = null;

            this.onInitCallback = null;
            this.onShutDownCallback = null;

            this.onPreloadCallback = null;
            this.onLoadRenderCallback = null;
            this.onLoadUpdateCallback = null;
            this.onCreateCallback = null;
            this.onUpdateCallback = null;
            this.onRenderCallback = null;
            this.onPausedCallback = null;
            this.onResumedCallback = null;
            this.onPauseUpdateCallback = null;

            this.game = null;
            this.states = {};
            this._pendingState = null;
            this.current = '';

        }
    });
    egame.StateManager.prototype.constructor = egame.StateManager;

    /**
    * 获取当前状态是否created的状态
    */
    Object.defineProperty(egame.StateManager.prototype, "created", {

        get: function () {

            return this._created;

        }

    });



    /**
    * 游戏状态基础类
    */
    egame.State = function () {

        /**
        * 关联的游戏对象
        */
        this.game = null;

        /**
        * 状态标识
        */
        this.key = '';

        /**
        * 资源加载器
        */
        this.load = null;



    };

    egame.State.prototype = {
        /**
         * 状态启动是调用
         * 比如你可以在里面做状态路由和设置一些基础变量
        */
        init: function () {
        },

        /**
        * 资源加载
        */
        preload: function () {
        },

        /**
        * 资源加载过程中的update方法
        */
        loadUpdate: function () {
        },

        /**
        * 资源加载过程中的render
        */
        loadRender: function () {
        },

        /**
        * 资源加载完成调用
        */
        create: function () {
        },

        /**
        * 游戏循环的update方法
        */
        update: function () {
        },

        /**
        * 渲染前调用的方法
        */
        preRender: function () {
        },

        /**
        * 渲染方法
        */
        render: function () {
        },

        /**
        * resize时调用的回调
        */
        resize: function () {
        },

        /**
        *游戏暂停时掉用的回调
        */
        paused: function () {
        },

        /**
        *游戏恢复时掉用的回调
        */
        resumed: function () {
        },

        /**
        * 游戏暂停是update方法
        */
        pauseUpdate: function () {
        },

        /**
        * 这个方法在状态被关闭的时候调用，比如说：一个状态切换到另外一个状态
        */
        shutdown: function () {
        }
    };

    egame.State.prototype.constructor = egame.State;

    return egame.StateManager;

});
