egame.define("BaseTexture", ["CONST", "Utils", "EventEmitter"], function(CONST, Utils, EventEmitter) {
    /**
     * 纹理是用来存储图片信息的，所有的纹理的基础累
     * @class
     * @memberof egame
     * @param source {Image|Canvas} 
     * @param [scaleMode=egame.SCALE_MODES.DEFAULT]
     * @param resolution {number} 
     */
    function BaseTexture(source, scaleMode, resolution) {
        EventEmitter.call(this);

        this.uid = Utils.uid();

        /**
         * 分辨率
         */
        this.resolution = resolution || 1;

        /**
         * 纹理的宽度，受分辨率的影响
         */
        this.width = 100;

        /**
         * 纹理的高度，受分辨率的影响
         */
        this.height = 100;

        /**
         * 纹理资源原始尺寸
         */
        this.realWidth = 100;
        /**
         * 纹理资源的实际高度
         */
        this.realHeight = 100;

        /**
         * 缩放模式，用于缩放纹理
         * @default egame.SCALE_MODES.LINEAR
         * @see egame.SCALE_MODES
         */
        this.scaleMode = scaleMode || CONST.SCALE_MODES.DEFAULT;

        /**
         *  一旦纹理成功加载就会被设置为true
         * 如果没有纹理数据或者资源加载失败，这个属性不会变成true
         */
        this.hasLoaded = false;

        /**
         * 如果资源正在加载设置为true
         * 加载过的资源会绕过加载这一步
         */
        this.isLoading = false;

        /**
         * 图片资源或者canvas资源用于创建纹理
         * @member {Image|Canvas}
         * @readonly
         */
        this.source = null;


        /**
         * 图片链接，非必要
         */
        this.imageUrl = null;


        // 如果没有资源传入就不要尝试加载资源了
        if (source) {
            this.loadSource(source);
        }

    }

    BaseTexture.prototype = Object.create(EventEmitter.prototype);
    BaseTexture.prototype.constructor = BaseTexture;

    /**
     * 资源加载完成后，重新更新数据
     */
    BaseTexture.prototype.update = function() {
        this.realWidth = this.source.naturalWidth || this.source.width; //
        this.realHeight = this.source.naturalHeight || this.source.height;

        this.width = this.realWidth / this.resolution;
        this.height = this.realHeight / this.resolution;
        this.emit('update', this);
    };

    /**
     * 加载资源
     * @param source {Image|Canvas} 纹理的资源的对象.
     */
    BaseTexture.prototype.loadSource = function(source) {
        var wasLoading = this.isLoading;
        this.hasLoaded = false;
        this.isLoading = false;

        if (wasLoading && this.source) {
            this.source.onload = null;
            this.source.onerror = null;
        }

        this.source = source;
        // 加载完成
        if ((this.source.complete || this.source.getContext) && this.source.width && this.source.height) {
            this._sourceLoaded();
        } else if (!source.getContext) {

            this.isLoading = true;

            var scope = this;

            source.onload = function() {
                source.onload = null;
                source.onerror = null;
                if (!scope.isLoading) {
                    return;
                }

                scope.isLoading = false;
                scope._sourceLoaded();

                scope.emit('loaded', scope);
            };

            source.onerror = function() {
                source.onload = null;
                source.onerror = null;

                if (!scope.isLoading) {
                    return;
                }

                scope.isLoading = false;
                scope.emit('error', scope);
            };

            // 检测图片是否加载完成
            if (source.complete && source.src) {
                this.isLoading = false;

                // 加载完成不需要回掉
                source.onload = null;
                source.onerror = null;

                if (source.width && source.height) {
                    this._sourceLoaded();
                    if (wasLoading) {
                        this.emit('loaded', this);
                    }
                } else {
                    if (wasLoading) {
                        this.emit('error', this);
                    }
                }
            }
        }
    };

    /**
     * 资源加载完成后的处理
     */
    BaseTexture.prototype._sourceLoaded = function() {
        this.hasLoaded = true;
        this.update();
    };

    /**
     * 销毁基础纹理
     *
     */
    BaseTexture.prototype.destroy = function() {
        if (this.imageUrl) {
            delete Utils.BaseTextureCache[this.imageUrl];
            delete Utils.TextureCache[this.imageUrl];

            this.imageUrl = null;

            if (!navigator.isCocoonJS) {
                this.source.src = '';
            }
        } else if (this.source && this.source._egameId) {
            delete Utils.BaseTextureCache[this.source._egameId];
        }

        this.source = null;

        this.dispose();
    };


    /**
     * 改变纹理的资源图片
     * @param newSrc {string} 新的图片链接
     */
    BaseTexture.prototype.updateSourceImage = function(newSrc) {
        this.source.src = newSrc;

        this.loadSource(this.source);
    };

    /**
     * 从给定的图片url创建一个基础纹理，如果有缓存就不在去重新生成纹理了
     * @static
     * @param imageUrl {string} 纹理的图片地址
     * @param [crossorigin=(auto)] {boolean} 是否使用匿名跨域
     * @param [scaleMode=egame.SCALE_MODES.DEFAULT] 缩放模式
     */
    BaseTexture.fromImage = function(imageUrl, crossorigin, scaleMode) {
        var baseTexture = Utils.BaseTextureCache[imageUrl];

        // if (crossorigin === undefined && imageUrl.indexOf('data:') !== 0) {
        //     crossorigin = true;
        // }

        if (!baseTexture) {

            var image = new Image();
            // if (crossorigin) {
            //     image.crossOrigin = '';
            // }

            baseTexture = new BaseTexture(image, scaleMode);
            baseTexture.imageUrl = imageUrl;

            image.src = imageUrl;

            Utils.BaseTextureCache[imageUrl] = baseTexture;

            // 图片分辨率
            baseTexture.resolution = Utils.getResolutionOfUrl(imageUrl);
        }

        return baseTexture;
    };

    /**
     * 从给定的canvas元素创建基础纹理
     * @param canvas {Canvas} 纹理的canvas元素源
     * @param scaleMode {number} 缩放模式
     */
    BaseTexture.fromCanvas = function(canvas, scaleMode) {
        if (!canvas._egameId) {
            canvas._egameId = 'canvas_' + Utils.uid();
        }

        var baseTexture = Utils.BaseTextureCache[canvas._egameId];

        if (!baseTexture) {
            baseTexture = new BaseTexture(canvas, scaleMode);
            Utils.BaseTextureCache[canvas._egameId] = baseTexture;
        }

        return baseTexture;
    };

    egame.BaseTexture = BaseTexture;
    return BaseTexture;
});