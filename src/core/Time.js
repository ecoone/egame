egame.define("Time",["EventEmitter"],function(EventEmitter){
    /**
     * 游戏时钟
     * 触发的事件有completed所有计时器事件处理完成时候触发
     */
    egame.Time = function (game) {
       /**
        * game对象
        */
        this.game = game;
       /**
        * 最近一次update的Date.now()值
        */
        this.time = 0;

        /**
        * 上次游戏循环更新发生的帧时间
        */
        this.prevTime = 0;

        /**
        * 当前帧时间，如果游戏循环使用setTimeout触发，那么这个值是Date().now()否则是raf的回调入参当前帧时间
        */
        this.now = 0;

        /**
        * 基于now的两次update的时间差值，单位毫秒
        */
        this.elapsed = 0;

        /**
        * 基于time的两次update的时间差值，单位毫秒
        */
        this.elapsedMS = 0;

        /**
        * 物理更新增量，以秒为单位，每次逻辑更新的时候使用
        */
        this.physicsElapsed = 1 / 60;

        /**
        * 物理更新增量，以毫秒为单位，每次逻辑更新的时候使用
        */
        this.physicsElapsedMS = (1 / 60) * 1000;

        /**
        * 期望的帧速率的乘子，在Game.update中使用
        */
        this.desiredFpsMult = 1.0 / 60;

        /**
        * 期望的帧速率
        */
        this._desiredFps = 60;

        /**
        * 建议帧速率
        */
        this.suggestedFps = this.desiredFps;

        /**
        * 游戏放慢速度的比例
        * - 1.0 = 正常速度
        * - 2.0 = 一半的速度
        */
        this.slowMotion = 1.0;

        /**
        * 如果设置为true游戏时钟的高级属性被更新，包括fps rate, fps min/max, suggestedFps and msMin/msMax。
        */
        this.advancedTiming = false;

        /**
        * 高级时钟开启时计算：最新一秒已经渲染的帧数目
        */
        this.frames = 0;

        /**
        * 高级时钟开启时计算:帧速率
        */
        this.fps = 0;

        /**
        * 高级时钟开启时计算:最小帧速率
        */
        this.fpsMin = 1000;

        /**
        * 高级时钟开启时计算:最大帧速率
        */
        this.fpsMax = 0;

        /**
        * 在高级游戏时钟开启时计算：一段连续帧中最小的帧间隔,初始值设置为1000可以保证第一次计算最小的间隔就是当前时间间隔
        */
        this.msMin = 1000;

        /**
        * 在高级游戏时钟开启时计算：一段连续帧中最大的帧间隔
        */
        this.msMax = 0;

        /**
        * 记录最后一次暂停的时候
        */
        this.pauseDuration = 0;

        /**
        * setTimeout等待时间
        */
        this.timeToCall = 0;

        /**
        * 下次掉用游戏循环期望时间 
        */
        this.timeExpected = 0;

        /**
        * 游戏时钟上绑定的一个egame.Timer计时器对象
        */
        this.events = new egame.Timer(this.game, false);

        /**
        * 从最新一次suggestedFps计算，time.update被调用的次数
        */
        this._frameCount = 0;

        /**
        * 从最新一次suggestedFps计算，经过的帧时间间隔之合
        */
        this._elapsedAccumulator = 0;

        /**
         * 游戏时钟启动的时间
        */
        this._started = 0;

        /**
        * 当前最后一秒技术结束时间
        * @private
        */
        this._timeLastSecond = 0;

        /**
        * 暂停开始时间
        */
        this._pauseStarted = 0;

        /**
        * egame.Timer池
        */
        this._timers = [];

    };

    egame.Time.prototype = {

        /**
        *在游戏启动后自动启动游戏时钟，不可直接调用
        */
        boot: function () {

            this._started = Date.now();
            this.time = Date.now();
            this.events.start();
            //下帧期望时间,就是当前时间
            this.timeExpected = this.time;

        },

        /**
        * 添加一个已经存在的egame.Timer计时器到Timer池里面
        */
        add: function (timer) {

            this._timers.push(timer);

            return timer;

        },

        /**
        * 创建一个独立的egame.Timer到Timer池里面
        */
        create: function (autoDestroy) {

            if (autoDestroy === undefined) { autoDestroy = true; }

            var timer = new egame.Timer(this.game, autoDestroy);

            this._timers.push(timer);

            return timer;

        },

        /**
         * 移除所有Timer计时器对象
        */
        removeAll: function () {

            for (var i = 0; i < this._timers.length; i++)
            {
                this._timers[i].destroy();
            }

            this._timers = [];

            this.events.removeAll();

        },
        /**
        * 更新当前游戏时钟的time和两次time之间的间隔elapsedMS，根据系统时钟。这个在每个逻辑更新的时候计算
        */
        refresh: function () {

            //  老的time
            var previousDateNow = this.time;

            // 新的time
            this.time = Date.now();

            //时间间隔
            this.elapsedMS = this.time - previousDateNow;

        },

        /**
        * 更新时钟，这个由游戏对象调用
        */
        update: function (time) {

            //  上一帧更新时钟时的Date.now()
            var previousDateNow = this.time;

            // 当前时间
            this.time = Date.now();

            //基于time的两次update的时间差值，单位毫秒
            this.elapsedMS = this.time - previousDateNow;

            // 上次update的游戏循环的帧时间
            this.prevTime = this.now;

            // 当前帧时间
            this.now = time;

            //基于now计算的两次update时间间隔
            this.elapsed = this.now - this.prevTime;

            //计算setTimeout等待时间
            if (this.game.raf._isSetTimeOut)
            {
                //计算游戏循环中setTimeout调用时间
                this.timeToCall = Math.floor(Math.max(0, (1000.0 / this._desiredFps) - (this.timeExpected - time)));
                //更新游戏循环中的setTimeout等待时间
                this.game.raf.timeToCall = this.timeToCall;
                // 下次调用游戏循环更新的期望时间
                this.timeExpected = time + this.timeToCall;

            }

            //高级属性更新
            if (this.advancedTiming)
            {
                this.updateAdvancedTiming();
            }

            // 游戏没有暂停
            if (!this.game.paused)
            {
                this.events.update(this.time);

                if (this._timers.length)
                {
                    this.updateTimers();
                }
            }

        },

        /**
        * 游戏时钟更新的时候，计时器持中也调用update
        */
        updateTimers: function () {
            var i = 0;
            var len = this._timers.length;

            while (i < len)
            {
                if (this._timers[i].update(this.time))
                {
                    i++;
                }
                else
                {
                    //计时器移除
                    this._timers.splice(i, 1);
                    len--;
                }
            }

        },

        /**
        * 处理更新高级游戏时钟属性
        */
        updateAdvancedTiming: function () {

            // 帧数量
            this._frameCount++;

            this._elapsedAccumulator += this.elapsed;

            // 如果帧数量大于两倍的期望帧频率，重新计算建议帧速率
            if (this._frameCount >= this._desiredFps * 2)
            {
                //计算建议帧速率，保持为5的倍数
                this.suggestedFps = Math.floor(200 / (this._elapsedAccumulator / this._frameCount)) * 5;
                this._frameCount = 0;
                this._elapsedAccumulator = 0;
            }

            //计算最小，最大帧时间间隔
            this.msMin = Math.min(this.msMin, this.elapsed);
            this.msMax = Math.max(this.msMax, this.elapsed);

            this.frames++;

            if (this.now > this._timeLastSecond + 1000)
            {
                //帧速率
                this.fps = Math.round((this.frames * 1000) / (this.now - this._timeLastSecond));
                //最小帧速率
                this.fpsMin = Math.min(this.fpsMin, this.fps);
                //最大帧速率
                this.fpsMax = Math.max(this.fpsMax, this.fps);
                //最新的一秒开始时间
                this._timeLastSecond = this.now;
                this.frames = 0;
            }

        },

        /**
        * 游戏暂停的时候调用
        */
        gamePaused: function () {

            this._pauseStarted = Date.now();

            this.events.pause();

            var i = this._timers.length;

            while (i--)
            {
                this._timers[i]._pause();
            }

        },

        /**
        * 游戏恢复的时候调用
        */
        gameResumed: function () {

            //设置正确的time，保证time正确在恢复的时候
            this.time = Date.now();

            this.pauseDuration = this.time - this._pauseStarted;

            this.events.resume();

            var i = this._timers.length;

            while (i--)
            {
                this._timers[i]._resume();
            }

        },

        /**
        * 从游戏开始过去的时间
        */
        totalElapsedSeconds: function() {
            return (this.time - this._started) * 0.001;
        },

        /**
        * 自since时间来过去的时间
        */
        elapsedSince: function (since) {
            return this.time - since;
        },

        /**
        * 自since时间来过去的时间单位是秒
        */
        elapsedSecondsSince: function (since) {
            return (this.time - since) * 0.001;
        },

        /**
        * 重置游戏时钟，_start重新设置移除所有计时器
        */
        reset: function () {

            this._started = this.time;
            this.removeAll();

        }
    };

    /**
    * 游戏期望的帧速率
    */
    Object.defineProperty(egame.Time.prototype, "desiredFps", {

        get: function () {

            return this._desiredFps;

        },

        set: function (value) {

            this._desiredFps = value;
            //用来修复update帧率不同
            this.physicsElapsed = 1 / value;

            this.physicsElapsedMS = this.physicsElapsed * 1000;

            this.desiredFpsMult = 1.0 / value;

        }

    });
    egame.Time.prototype.constructor = egame.Time;



    egame.Timer = function (game, autoDestroy) {
        EventEmitter.call(this);
        if (autoDestroy === undefined) { autoDestroy = true; }

        /**
        * 关联的game对象
        */
        this.game = game;

        /**
        * 计时器是否运行
        */
        this.running = false;

        /**
        * 是否在所有计时器事件处理完成后自动销毁
        */
        this.autoDestroy = autoDestroy;

        /**
        * 计时器是否失效，如果所有计时器事件都被分发，切没有新的添加那么就失效了
        */
        this.expired = false;

        /**
        * 距离最近一帧的时间间隔
        */
        this.elapsed = 0;

        /**
         * 计时器事件队列
        */
        this.events = [];

        /**
        * 下次计时器事件发生时间
        */
        this.nextTick = 0;

        /**
        * 两帧时间差的最大极限
        */
        this.timeCap = 1000;

        /**
        * 计时器是否暂停
        */
        this.paused = false;

        /**
        * 代码暂停
        */
        this._codePaused = false;

        /**
        * 计时器运行时间
        */
        this._started = 0;

        /**
        * 暂停开始时间
        */
        this._pauseStarted = 0;

        /**
        * 总共暂停时间
        */
        this._pauseTotal = 0;

        /**
        * 当前帧时间
        */
        this._now = Date.now();

        /**
        * 缓存计时器事件对象长度的变量
        */
        this._len = 0;

        /**
        * 处理的计时器事件数目缓存
        */
        this._marked = 0;

        /**
        * 缓存当前指向计时器事件对象
        */
        this._i = 0;


        /**
        *  _newTick - 内部缓存变量，用于暂时保存，下一个时钟
        */
        this._newTick = 0;

    };
    egame.Timer.prototype = Object.create(EventEmitter.prototype);
    /**
    * 1分钟
    */
    egame.Timer.MINUTE = 60000;

    /**
    * 1秒
    */
    egame.Timer.SECOND = 1000;

    /**
    * 半秒
    */
    egame.Timer.HALF = 500;

    /**
    * 1/4秒
    */
    egame.Timer.QUARTER = 250;

    egame.util.extend(egame.Timer.prototype,{

        /**
        * 在计时器上创建一个计时器事件
        */
        create: function (delay, loop, repeatCount, callback, callbackContext, args) {

            delay = Math.round(delay);

            var tick = delay;

            if (this._now === 0)
            {
                tick += this.game.time.time;
            }
            else
            {
                tick += this._now;
            }

            var event = new egame.TimerEvent(this, delay, tick, repeatCount, loop, callback, callbackContext, args);

            this.events.push(event);

            this.order();
            //没有失效
            this.expired = false;

            return event;

        },

        /**
        * 添加一个新的计时器事件
        * 事件会在计时器运行后的delay触发。如果计时器未运行，延迟是计时器开始时候算，如果已经运行，从当前游戏时间开始计算
        */
        add: function (delay, callback, callbackContext) {

            return this.create(delay, false, 0, callback, callbackContext, Array.prototype.slice.call(arguments, 3));

        },

        /**
        * 添加一个有重复数目的计时器事件
        */
        repeat: function (delay, repeatCount, callback, callbackContext) {

            return this.create(delay, false, repeatCount, callback, callbackContext, Array.prototype.slice.call(arguments, 4));

        },

        /**
        * 设置一个循环计时器
        */
        loop: function (delay, callback, callbackContext) {

            return this.create(delay, true, 0, callback, callbackContext, Array.prototype.slice.call(arguments, 3));

        },

        /**
        * 让计时器开始运行
        */
        start: function (delay) {

            if (this.running)
            {
                return;
            }

            this._started = this.game.time.time + (delay || 0);

            this.running = true;

            for (var i = 0; i < this.events.length; i++)
            {
                //事件出发时间
                this.events[i].tick = this.events[i].delay + this._started;
            }

        },

        /**
        * 停止计时器运行，不会触发destroyed方法
        */
        stop: function (clearEvents) {

            this.running = false;

            if (clearEvents === undefined) { clearEvents = true; }

            if (clearEvents)
            {
                this.events.length = 0;
            }

        },

        /**
        * 移除所有TimerEvent
        */
        remove: function (event) {

            for (var i = 0; i < this.events.length; i++)
            {
                if (this.events[i] === event)
                {
                    this.events[i].pendingDelete = true;
                    return true;
                }
            }

            return false;

        },

        /**
        * 根据tick字段，给计时器事件排序。
        * 在计时器调用create的时候自动调用
        */
        order: function () {

            if (this.events.length > 0)
            {
                // 排序event，使具有最低tick的事件排在第一位
                this.events.sort(this.sortHandler);

                this.nextTick = this.events[0].tick;
            }

        },

        /**
        * 排序算法，小于0时，a在前面，b在后面
        */
        sortHandler: function (a, b) {

            if (a.tick < b.tick)
            {
                return -1;
            }
            else if (a.tick > b.tick)
            {
                return 1;
            }

            return 0;
        },

        /**
        * 清除等待删除的事件对象，重置_len和_i属性
        */
        clearPendingEvents: function () {

            this._i = this.events.length;

            while (this._i--)
            {
                if (this.events[this._i].pendingDelete)
                {
                    this.events.splice(this._i, 1);
                }
            }

            this._len = this.events.length;
            this._i = 0;

        },
        /**
        * 游戏时钟update的时候，计时器的update自动调用
        */
        update: function (time) {

            if (this.paused)
            {
                return true;
            }
            //两次update时间间隔
            this.elapsed = time - this._now;
            //当前update时间
            this._now = time;

            //阻止不喜欢的
            if (this.elapsed > this.timeCap)
            {
                //  如果当前时间和上次调用update时间时间差太大，比如过说暂停游戏，重新调整TimeEvent和nextTick.
                this.adjustEvents(time - this.elapsed);
            }

            this._marked = 0;

            //清除等待删除的事件对象
            this.clearPendingEvents();

            //计时器正在运行，切当前帧时间大于等于下一个要发生的时钟
            if (this.running && this._now >= this.nextTick && this._len > 0)
            {
                while (this._i < this._len && this.running)
                {
                    if (this._now >= this.events[this._i].tick && !this.events[this._i].pendingDelete)
                    {
                        //下一次调用计时器事件的时钟
                        this._newTick = (this._now + this.events[this._i].delay) - (this._now - this.events[this._i].tick);

                        if (this._newTick < 0)
                        {
                            this._newTick = this._now + this.events[this._i].delay;
                        }

                        //循环是一直以某个间隔运行
                        if (this.events[this._i].loop === true)
                        {
                            this.events[this._i].tick = this._newTick;
                            this.events[this._i].callback.apply(this.events[this._i].callbackContext, this.events[this._i].args);
                        }
                        //循环调用次数
                        else if (this.events[this._i].repeatCount > 0)
                        {
                            this.events[this._i].repeatCount--;
                            this.events[this._i].tick = this._newTick;
                            this.events[this._i].callback.apply(this.events[this._i].callbackContext, this.events[this._i].args);
                        }
                        //正常的那次调用
                        else
                        {
                            this._marked++;
                            this.events[this._i].pendingDelete = true;
                            this.events[this._i].callback.apply(this.events[this._i].callbackContext, this.events[this._i].args);
                        }

                        this._i++;
                    }
                    else
                    {
                        break;
                    }
                }

                //计时器事件没有执行完成，从新排序
                if (this.events.length > this._marked)
                {
                    this.order();
                }
                //设置过期，发送
                else
                {
                    this.expired = true;
                    this.emit("completed",this);
                }
            }
            //如果过期且是自动销毁那么就返回false,这样计时器对象可以在游戏时钟里面销毁
            if (this.expired && this.autoDestroy)
            {
                return false;
            }
            else
            {
                return true;
            }
        },

        /**
        * 暂停计时器和所有的计时器事件
        */
        pause: function () {

            if (!this.running)
            {
                return;
            }

            this._codePaused = true;

            if (this.paused)
            {
                return;
            }

            this._pauseStarted = this.game.time.time;

            this.paused = true;

        },

        /**
        * 非code暂停
        */
        _pause: function () {

            if (this.paused || !this.running)
            {
                return;
            }

            this._pauseStarted = this.game.time.time;

            this.paused = true;

        },

        /**
        * 通过baseTime调整TimerEvent的tick属性，和Timer的nextTick属性
        */
        adjustEvents: function (baseTime) {

            for (var i = 0; i < this.events.length; i++)
            {
                if (!this.events[i].pendingDelete)
                {
                    //算出，tick距离暂停的时间
                    var t = this.events[i].tick - baseTime;
                    if (t < 0)
                    {
                        t = 0;
                    }

                    //暂停过后新的tick，为当前时间加上tick距离暂停的时间
                    this.events[i].tick = this._now + t;
                }
            }
            //重新计算nextTick
            var d = this.nextTick - baseTime;
            if (d < 0)
            {
                this.nextTick = this._now;
            }
            else
            {
                this.nextTick = this._now + d;
            }

        },

        /**
        * 代码恢复处理
        */
        resume: function () {

            if (!this.paused)
            {
                return;
            }

            var now = this.game.time.time;
            //所有的暂停的时间
            this._pauseTotal += now - this._now;
            this._now = now;

            this.adjustEvents(this._pauseStarted);

            this.paused = false;
            this._codePaused = false;

        },

        /**
        * 非代码暂停恢复处理
        */
        _resume: function () {

            if (this._codePaused)
            {
                return;
            }
            else
            {
                this.resume();
            }

        },

        /**
        * 移除completed事件监听和所有的计时器事件
        */
        removeAll: function () {
            this.off("completed");
            this.events.length = 0;
            this._len = 0;
            this._i = 0;

        },

        /**
        * 销毁计时器对象，所有的计时器事件不会在触发，计时器完成的completed方法也不会在触发
        */
        destroy: function () {
            //移除所有事件监听
            this.off("completed");
            this.running = false;
            this.events = [];
            this._len = 0;
            this._i = 0;

        }
    });

    /**
    * 下一次要触发TimeEvent的时间
    */
    Object.defineProperty(egame.Timer.prototype, "next", {

        get: function () {
            return this.nextTick;
        }

    });

    /**
    * 距离下次触发事件的时间
    */
    Object.defineProperty(egame.Timer.prototype, "duration", {

        get: function () {

            if (this.running && this.nextTick > this._now)
            {
                return this.nextTick - this._now;
            }
            else
            {
                return 0;
            }

        }

    });

    /**
    * 事件队列长度
    */
    Object.defineProperty(egame.Timer.prototype, "length", {

        get: function () {
            return this.events.length;
        }

    });

    /**
    * Timer运行的时间
    */
    Object.defineProperty(egame.Timer.prototype, "ms", {

        get: function () {

            if (this.running)
            {
                return this._now - this._started - this._pauseTotal;
            }
            else
            {
                return 0;
            }

        }

    });

    /**
    * Timer运行时间的毫秒值
    */
    Object.defineProperty(egame.Timer.prototype, "seconds", {

        get: function () {

            if (this.running)
            {
                return this.ms * 0.001;
            }
            else
            {
                return 0;
            }

        }

    });

    egame.Timer.prototype.constructor = egame.Timer;

    /**
    * 计时器事件，由计时器处理
    * 到一定的时间后触发，callback
    */
    egame.TimerEvent = function (timer, delay, tick, repeatCount, loop, callback, callbackContext, args) {

        /**
        *所属的时钟 
        */
        this.timer = timer;

        /**
        * 计时器事件触发的延迟
        */
        this.delay = delay;

        /**
        * 下一个将出发计时器事件的游戏时钟
        */
        this.tick = tick;

        /**
        * 要被触发计时器事件的次数，-1是为了正常调用的那一次
        */
        this.repeatCount = repeatCount - 1;

        /**
        * 一直以delay间隔循环调用
        */
        this.loop = loop;

        /**
        * 计时器事件发生的回调函数
        */
        this.callback = callback;

        /**
        * 计时器事件发生的回调函数执行环境
        */
        this.callbackContext = callbackContext;

        /**
        * 回调函数需要的参数
        */
        this.args = args;

        /**
        * 一个代表这个计时器事件对象是否处于等待删除的状态
        */
        this.pendingDelete = false;

    };

    egame.TimerEvent.prototype.constructor = egame.TimerEvent;

    return egame.Time;
    });

