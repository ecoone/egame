egame.define("Loader",["Signal"],function(Signal) {
    /**
     * Loader是用来处理外部资源加载，比如图片，音乐，视频，纹理地图和数据文件等。
     * 加载器使用html标签（例如：image标签、XHR并提供加载进度和完成回调
     */
    egame.Loader = function(game) {

        /**
         * 引用的游戏对象
         */
        this.game = game;

        //将加载器挂入游戏对象，以便在游戏状态中使用
        if(game) game.load = this;

        /**
         * 如果是true那么加载器在处理加载队列
         */
        this.isLoading = false;

        /**
         * 如果是true那么所有资产都已经加载完毕
         */
        this.hasLoaded = false;

        /**
         * 资源地址的基础链接以'/'结尾
         * @property {string} baseURL
         */
        this.baseURL = '';

        /**
         * 资源地址的基础路径
         * 例子:
         * `load.path = "images/sprites/";
         * load.image("ball", "ball.png");
         * load.image("tree", "level1/oaktree.png");
         * load.image("boom", "http://server.com/explode.png");`
         *
         * `ball` 从 `images/sprites/ball.png` 加载 。tree从
         * `images/sprites/level1/oaktree.png`加载。但是`boom`还是
         * 从url给定的链接加载，因为这是绝对路径
         * 注意：Path是在resourcename前面，在baseURl后面，如果设置了baseURl
         *  path必须以'/结尾'
         */
        this.path = '';

        /**
         * 在资源开始加载前触发
         */
        this.onLoadStart = new egame.Signal();

        /**
         * 资源加载完成触发
         */
        this.onLoadComplete = new egame.Signal();

        /**
         * 资源加载前触发
         */
        this.onResourceStart = new egame.Signal();

        /**
         * 资源加载完成触发，不管是错误还是成功完成
         */
        this.onResourceComplete = new egame.Signal();

        /**
         * 资源加载错误出发
         */
        this.onResourceError = new egame.Signal();

        /**
         * 是否允许并行下载
         * 在所有资源加载之前设置
         */
        this.enableParallel = true;

        /**
         * 同时允许并行加载的资源最大数量
         * 当前很多浏览器一个域名最多可以加载6个，我们设置4个有些保守
         */
        this.maxParallelDownloads = 4;

        /**
         * 保存要被加载资源对象
         */
        this._resourceList = [];

        /**
         * 正在加载的资源对象，在加载开始前和完成后都为空
         */
        this._flightQueue = [];

        /**
         * _resourceList数组中第一个没有下载完成的资源下标
         */
        this._processingHead = 0;

        /**
         * 是否第一个资源开始加载了
         */
        this._resourceLoadStarted = false;


        /**
         * 总的加载资源数目
         */
        this._totalResourceCount = 0;



        /**
         * 已经加载的资源数目
         */
        this._loadedResourceCount = 0;

    };
    //用来缓存加载的资源
    egame.Caches = {};
    //钳位数字
    egame.Loader.clamp = function (x, a, b) {
        return ( x < a ) ? a : ( ( x > b ) ? b : x );
    };
    egame.Loader.prototype = {
        /**
         * 检查某个key和type的资源是否在等待加载的队列中
         */
        checkKeyExists: function(type, key) {
            return this.getResourceIndex(type, key) > -1;
        },
        /**
         * 获取资源的队列索引
         * 只有文件/资产在下载队列里才能被发现
         * @param {string} type - 资源类型
         * @param {string} key - 你想检测的资源的key
         */
        getResourceIndex: function(type, key) {
            var bestFound = -1;
            for (var i = 0; i < this._resourceList.length; i++) {
                var resource = this._resourceList[i];

                if (resource.type === type && resource.key === key) {
                    bestFound = i;
                    if (resource.status == egame.Resource.CREATED) {
                        break;
                    }
                }
            }
            return bestFound;
        },

        /**
         * 获取资产和下标
         * 只有资产在文件队列中才会发现
         */
        getResourceAndIndex: function(type, key) {

            var resourceIndex = this.getResourceIndex(type, key);

            if (resourceIndex > -1) {
                return {
                    index: resourceIndex,
                    resource: this._resourceList[resourceIndex]
                };
            }
            return false;
        },
        /**
         * 通过key获取资源
         */
        getResource:function(key){
           return egame.Caches[key];
        },
        /**
         * 重置加载器并清除资产队列
         */
        reset: function() {
            this.isLoading = false;
            this._processingHead = 0;
            this._resourceList.length = 0;
            this._flightQueue.length = 0;

            this._resourceLoadStarted = false;
            this._totalResourceCount = 0;
            this._loadedResourceCount = 0;
            this.onLoadStart.removeAll();
            this.onLoadComplete.removeAll();
            this.onResourceStart.removeAll();
            this.onResourceComplete.removeAll();
            this.onResourceError.removeAll();
        },
        /**
         * 从下载队列中删除资源
         */
        removeResource: function(type, key) {
            var resourceAndIndex = this.getResourceAndIndex(type, key);
            if (resourceAndIndex) {
                if (resourceAndIndex.resource.status == egame.Resource.STATUS.CREATED) {
                    this._resourceList.splice(resourceAndIndex.index, 1);
                }
            }
        },
        /**
         * 添加资源类到资源列表
         */
        addToResourceList: function(resource) {
            egame.Caches[resource.key] = resource;
            var resIndex = this.getResourceIndex(resource.type, resource.key);
            if (resIndex > -1) {
                var currentRes = this._resourceList[resIndex];

                if (currentRes.status == egame.Resource.STATUS.CREATED) {
                    this._resourceList[resIndex] = resource;
                } else {
                    this._resourceList.push(resource);
                    this._totalResourceCount++;
                }
            } else if (resIndex === -1) {
                this._resourceList.push(resource);
                this._totalResourceCount++;
            }
            return this;
        },
        /**
         * 开始加载资源。正常情况下，你不需要调用，StateManager里面会做这件事情
         */
        start: function() {

            if (this.isLoading) {
                return;
            }

            this.hasLoaded = false;
            this.isLoading = true;
            this.updateProgress();
            this.processLoadQueue();
        },

        /**
         * 处理文件加载队列
         */
        processLoadQueue: function() {
            //加载器不处于加载状态
            if (!this.isLoading) {
                this.finishedLoading(true);
                return;
            }

            //处理正在加载中的资源队列
            for (var i = 0; i < this._flightQueue.length; i++) {
                var resource = this._flightQueue[i];

                if (resource.status == egame.Resource.STATUS.LOADED || resource.status == egame.Resource.STATUS.ERRORED) {
                    this._flightQueue.splice(i, 1);
                    i--;

                    //资源加载错误，触发文件加载错误事件
                    if (resource.status == egame.Resource.STATUS.ERRORED) {
                        this.onResourceError.dispatch(resource.key, resource);
                    }
                    //增加加载了的资源数量
                    this._loadedResourceCount++;
                    //出发文件加载完成事件
                    this.onResourceComplete.dispatch(this.progress, resource.key, resource.status, this._loadedResourceCount, this._totalResourceCount);

                }
            }

            //最大可同时加载的数据
            var inflightLimit = this.enableParallel ? egame.Loader.clamp(this.maxParallelDownloads, 1, 12) : 1;

            //处理资源数组
            for (var i = this._processingHead; i < this._resourceList.length; i++) {
                var resource = this._resourceList[i];
                //前移为加载完成的下标
                if (resource.status == egame.Resource.STATUS.LOADED || resource.status == egame.Resource.STATUS.ERRORED) {
                    if (i === this._processingHead) {
                        this._processingHead = i + 1;
                    }
                }
                //还未开始加载，且可以加载
                else if (resource.status == egame.Resource.STATUS.CREATED && this._flightQueue.length < inflightLimit) {

                    //第一次加载出发
                    if (!this._resourceLoadStarted) {
                        this._resourceLoadStarted = true;
                        this.onLoadStart.dispatch();
                    }

                    //放入加载队列
                    this._flightQueue.push(resource);
                    resource.status = egame.Resource.STATUS.LOADING;
                    this.onResourceStart.dispatch(this.progress, resource.key, resource.url);
                    resource.load();
                }

                if (this._flightQueue.length >= inflightLimit) {
                    break;
                }
            }

            //调用加载更新接口
            this.updateProgress();

            // 如果所有文件队列里面的文件都处理完成
            if (this._processingHead >= this._resourceList.length) {
                this.finishedLoading();
            }
            //如果资源加载出现错误
            else if (!this._flightQueue.length) {
                this.finishedLoading(true);
            }
        },

        /**
         * 加载全部完成
         * 非正常的
         */
        finishedLoading: function(abnormal) {
            //如果未加载完成返回
            if (this.hasLoaded) return;

            this.hasLoaded = true;
            this.isLoading = false;

            // 空队列情况调用加载开始
            if (!abnormal && !this._resourceLoadStarted) {
                this._resourceLoadStarted = true;
                this.onLoadStart.dispatch();
            }
            //加载完成事件
            this.onLoadComplete.dispatch();
            //重置加载器
            this.reset();
            //告诉游戏状态加载完成
            this.game.state.loadComplete();
        },
        /**
         * 文件加载过程中出现错误
         */
        resourceError: function(resource, reason) {
            resource.loadError();
            var url = resource.requestUrl || this.transformUrl(resource.url, resource);
            var message = '加载资源失败，URL：' + url;
            if (!reason && resource.requestObject) {
                reason = resource.requestObject.status;
            }
            if (reason) {
                message = message + ' (' + reason + ')';
            }

            this.asyncComplete(resource, message);
        },
        //文件加载成功的处理逻辑
        resourceComplete: function(resource) {
            resource.loadComplete();
            this.asyncComplete(resource);
        },
        /**
         * 通知加载器给定文件已经被加载和处理或者请求失败
         * @param {object} resource
         * @param {string} [error=''] -错误信息，如果有的话，没有错误信息意味着没有错误
         */
        asyncComplete: function(resource, errorMessage) {
            if (errorMessage === undefined) {
                errorMessage = '';
            }
            resource.status = egame.Resource.STATUS.LOADED;
            if (!!errorMessage) {
                resource.status = egame.Resource.STATUS.ERRORED;
            }
            if (errorMessage) {
                resource.errorMsg = errorMessage;
                console.warn('egame.Loader - ' + resource.type + '[' + resource.key + ']' + ': ' + errorMessage);
            }
            this.processLoadQueue();
        },
        /**
         * 转化资源链接
         */
        transformUrl: function(url, resource) {
            if (!url) {
                return false;
            }

            if (url.match(/^(?:blob:|data:|http:\/\/|https:\/\/|\/\/)/)) {
                return url;
            } else {
                return this.baseURL + this.path + url;
            }
        },
        /**
         * 这个是用来处理通过xhr的资源加载
         * @param {object} resource - 要被加载的资源对象
         * @param {string} url - 资源的链接
         * @param {string} type - xhr的responseType.
         */
        xhrLoad: function(resource, url, type) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = type;
            var loader = this;
            xhr.onload = function() {
                loader.resourceComplete(resource);
            };

            xhr.onerror = function() {
                loader.resourceError(resource);
            };

            resource.requestObject = xhr;
            resource.requestUrl = url;
            xhr.send();
        },
        /**
         * 更新加载进度,接口
         */
        updateProgress: function() {},

        /**
         * 返回已经加载完成的文件，哪怕出错了
         */
        totalLoadedFiles: function() {
            return this._loadedResourceCount;
        },
        /**
         * 返回还未被加载的资源数目
         */
        totalQueuedFiles: function() {
            return this._totalResourceCount - this._loadedResourceCount;
        }
    };

    /**
     * 加载进度非4舍5入的
     * 这个可能会降低，因为可能有动态添加在的文件，在启动加载后
     */
    Object.defineProperty(egame.Loader.prototype, "progressFloat", {

        get: function() {
            var progress = (this._loadedResourceCount / this._totalResourceCount) * 100;
            return egame.Loader.clamp(progress || 0, 0, 100);
        }

    });

    /**
     * 加载进度这里使用的四舍五入(从1到100) TODO是否应该使用四舍五入？
     */
    Object.defineProperty(egame.Loader.prototype, "progress", {

        get: function() {
            return Math.round(this.progressFloat);
        }

    });

    egame.Loader.prototype.constructor = egame.Loader;
    return egame.Loader;
});