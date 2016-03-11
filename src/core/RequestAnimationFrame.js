/**
 * 游戏循环
 */
egame.define("RequestAnimationFrame",function(){
	egame.RequestAnimationFrame = function(forceSetTimeOut) {
	    if (forceSetTimeOut === undefined) { forceSetTimeOut = false; }
	    /**
	     * 没一次调用执行的函数
	     */
	    this.update = function(){};
	    /**
	     * 游戏循环是否在运行
	    */
	    this.isRunning = false;
	    /**
	     * setTimeout的触发时间，默认给60
	     */
	    this.timeToCall = 1000/60;
	    /**
	     * 强制使用setTimeout
	     */
	    this.forceSetTimeOut = forceSetTimeOut;

	    var vendors = [
	        'ms',
	        'moz',
	        'webkit',
	        'o'
	    ];

	    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; x++)
	    {
	        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
	        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'];
	    }

	    /**
	     * 是否使用的是setTimeout
	     */
	    this._isSetTimeOut = false;

	    /**
	     * 循环用户函数
	    */
	    this._onLoop = null;

	    /**
	     * timeoutID或者是raf的id用于取消这个发生器
	    */
	    this._timeOutID = null;
	};

	egame.RequestAnimationFrame.prototype = {

	    /**
	     * 开始帧发送器
	    */
	    start: function (update) {
	        this.isRunning = true;
	        if(egame.util.isFunction(update)){
	        	this.update = update;
	        }
	        var _this = this;

	        if (!window.requestAnimationFrame || this.forceSetTimeOut)
	        {
	            this._isSetTimeOut = true;

	            this._onLoop = function () {
	                return _this.updateSetTimeout();
	            };

	            this._timeOutID = window.setTimeout(this._onLoop, 0);
	        }
	        else
	        {
	            this._isSetTimeOut = false;

	            this._onLoop = function (time) {
	                return _this.updateRAF(time);
	            };

	            this._timeOutID = window.requestAnimationFrame(this._onLoop);
	        }

	    },

	    /**
	    * requestAnimationFrame的更新方法
	    */
	    updateRAF: function (rafTime) {
	        this.update(Math.floor(rafTime));
	        this._timeOutID = window.requestAnimationFrame(this._onLoop);

	    },

	    /**
	    * setTimeout的更新方法
	    */
	    updateSetTimeout: function () {

	        this.update(Date.now());

	        this._timeOutID = window.setTimeout(this._onLoop, this.timeToCall);

	    },

	    /**
	    * 停止requestAnimationFrame的运行.
	    */
	    stop: function () {

	        if (this._isSetTimeOut)
	        {
	            clearTimeout(this._timeOutID);
	        }
	        else
	        {
	            window.cancelAnimationFrame(this._timeOutID);
	        }

	        this.isRunning = false;

	    },

	    /**
	     * 是否使用的是setTimeout
	    */
	    isSetTimeOut: function () {
	        return this._isSetTimeOut;
	    },

	    /**
	     * 是否使用的是requestAnimationFrame
	    */
	    isRAF: function () {
	        return (this._isSetTimeOut === false);
	    }
	};

	egame.RequestAnimationFrame.prototype.constructor = egame.RequestAnimationFrame;

	return egame.RequestAnimationFrame;
});