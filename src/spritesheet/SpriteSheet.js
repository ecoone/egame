egame.define("SpriteSheet", ["SpriteSheetParser", "Sprite"], function(SpriteSheetParser, Sprite) {
    function SpriteSheet(imgResourceKey, frameWidthOrSpriteSheetKey, frameHeight, frameMax, margin, spacing) {
        this.currentFrame = null;
        //用于存储所有帧数据
        this._frameData = null;
        Sprite.call(this, imgResourceKey);
        if(frameWidthOrSpriteSheetKey){
            this.spriteSheetConfig(frameWidthOrSpriteSheetKey, frameHeight, frameMax, margin, spacing);
        }
    }
    SpriteSheet.prototype = Object.create(Sprite.prototype);
    SpriteSheet.prototype.constructor = SpriteSheet;
    //给精灵表设置帧
    egame.util.extend(SpriteSheet.prototype, {
        /**
         * 精灵表配置,可以是json配置也可以是按照大小参数配置
         */
        spriteSheetConfig: function(frameWidthOrSpriteSheetKey, frameHeight, frameMax, margin, spacing) {
            var frameData = null;
            if (egame.util.isString(frameWidthOrSpriteSheetKey)) {
                var json = egame.Caches[frameWidthOrSpriteSheetKey].data;
                if (!json) {
                    throw Error("精灵表配置文件：" + frameWidthOrSpriteSheetKey + "，不存在");
                }
                if (egame.util.isArray(json['frames'])) {
                    frameData = SpriteSheetParser.JSONData(json);
                } else {
                    frameData = SpriteSheetParser.JSONDataHash(json);
                }
            } else {
                frameData = SpriteSheetParser.spriteSheet(this.resourceKey,frameWidthOrSpriteSheetKey, frameHeight, frameMax, margin, spacing);
            }
            this.loadFrameData(frameData);
        },
        /**
         * 设置frameData和当前帧，如果第二个frame不传那么就设置为0
         * @method SpriteSheet#loadFrameData
         * @private
         * @param {egame.FrameData} frameData - 要设置的frameData
         * @param {string|number} frame - 当前帧
         * @return {boolean} 设置成功返回true，否则返回false.
         */
        loadFrameData: function(frameData, frame) {

            if (frameData === undefined) {
                return false;
            }


            this._frameData = frameData;

            if (frame === undefined || frame === null) {
                this.frame = 0;
            } else {
                if (typeof frame === 'string') {
                    this.frameName = frame;
                } else {
                    this.frame = frame;
                }
            }
            return true;
        },

        /**
         * Loads FrameData into the internal temporary vars and resets the frame index to zero.
         * This is called automatically when a new Sprite is created.
         *
         * @method SpriteSheet#copyFrameData
         * @private
         * @param {egame.FrameData} frameData - The FrameData set to load.
         * @param {string|number} frame - The frame to default to.
         * @return {boolean} Returns `true` if the frame data was loaded successfully, otherwise `false`
         */
        copyFrameData: function(frameData, frame) {

            this._frameData = frameData.clone();

            if (frame === undefined || frame === null) {
                this.frame = 0;
            } else {
                if (typeof frame === 'string') {
                    this.frameName = frame;
                } else {
                    this.frame = frame;
                }
            }
            return true;
        },
        /**
         * Check whether the frames in the given array are valid and exist.
         *
         * @method SpriteSheet#validateFrames
         * @param {Array} frames - An array of frames to be validated.
         * @param {boolean} [useNumericIndex=true] - Validate the frames based on their numeric index (true) or string index (false)
         * @return {boolean} True if all given Frames are valid, otherwise false.
         */
        validateFrames: function(frames, useNumericIndex) {

            if (useNumericIndex === undefined) {
                useNumericIndex = true;
            }

            for (var i = 0; i < frames.length; i++) {
                if (useNumericIndex === true) {
                    if (frames[i] > this._frameData.total) {
                        return false;
                    }
                } else {
                    if (this._frameData.checkFrameName(frames[i]) === false) {
                        return false;
                    }
                }
            }

            return true;

        },
        /**
         * 将frame对象应用到Sprite上面
         * @param {[type]} frame [description]
         */
        setSourceFrame: function(frame) {
            this._frame = frame;
            this.texture.frame.x = frame.x;
            this.texture.frame.y = frame.y;
            this.texture.frame.width = frame.width;
            this.texture.frame.height = frame.height;

            this.texture.crop.x = frame.x;
            this.texture.crop.y = frame.y;
            this.texture.crop.width = frame.width;
            this.texture.crop.height = frame.height;
            if (frame.trimmed) {
                if (this.texture.trim) {
                    this.texture.trim.x = frame.spriteSourceSizeX;
                    this.texture.trim.y = frame.spriteSourceSizeY;
                    this.texture.trim.width = frame.sourceSizeW;
                    this.texture.trim.height = frame.sourceSizeH;
                } else {
                    this.texture.trim = {
                        x: frame.spriteSourceSizeX,
                        y: frame.spriteSourceSizeY,
                        width: frame.sourceSizeW,
                        height: frame.sourceSizeH
                    };
                }
                this.texture.width = frame.sourceSizeW;
                this.texture.height = frame.sourceSizeH;
                this.texture.frame.width = frame.sourceSizeW;
                this.texture.frame.height = frame.sourceSizeH;
            } else if (!frame.trimmed && this.texture.trim) {
                this.texture.trim = null;
            }
        },
    });

    /**
     * @name SpriteSheet#frameData
     * @property {egame.FrameData} frameData - 精灵表的FrameData.
     * @readonly
     */
    Object.defineProperty(SpriteSheet.prototype, 'frameData', {

        get: function() {
            return this._frameData;
        }

    });

    /**
     * @name SpriteSheet#frameTotal
     * @property {number} frameTotal - The total number of frames in the currently loaded FrameData, or -1 if no FrameData is loaded.
     * @readonly
     */
    Object.defineProperty(SpriteSheet.prototype, 'frameTotal', {
        get: function() {
            return this._frameData.total;
        }
    });

    /**
     * @name SpriteSheet#frame
     * @property {number} frame - Gets or sets the current frame index and updates the Texture Cache for display.
     */
    Object.defineProperty(SpriteSheet.prototype, 'frame', {

        get: function() {

            if (this.currentFrame) {
                return this.currentFrame.index;
            }

        },

        set: function(value) {
            if (typeof value === 'number' && this._frameData && this._frameData.getFrame(value) !== null) {
                this.currentFrame = this._frameData.getFrame(value);
                if (this.currentFrame) {
                    this.setSourceFrame(this.currentFrame);
                }
            }

        }

    });

    /**
     * @name SpriteSheet#frameName
     * @property {string} frameName - Gets or sets the current frame name and updates the Texture Cache for display.
     */
    Object.defineProperty(SpriteSheet.prototype, 'frameName', {

        get: function() {

            if (this.currentFrame) {
                return this.currentFrame.name;
            }

        },

        set: function(value) {

            if (typeof value === 'string' && this._frameData && this._frameData.getFrameByName(value) !== null) {
                this.currentFrame = this._frameData.getFrameByName(value);
                if (this.currentFrame) {
                    this._frameIndex = this.currentFrame.index;

                    this.setSourceFrame(this.currentFrame);
                }
            } else {
                console.warn('Cannot set frameName: ' + value);
            }
        }

    });

    egame.SpriteSheet = SpriteSheet;
    return egame.SpriteSheet;
});