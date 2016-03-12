egame.define("SpriteSheetParser", ["Frame", "FrameData"], function(Frame, FrameData) {

    /**
     * 解析精灵表配置文件或者配置参数，将其转换为frameData
     * @class egame.SpriteSheetParser
     * @static
     */
    egame.SpriteSheetParser = {

        /**
         * Parse a Sprite Sheet and extract the animation frame data from it.
         *
         * @method egame.SpriteSheetParser.spriteSheet
         * @param {string} resourceKey - 资源key
         * @param {number} frameWidth - The fixed width of each frame of the animation.
         * @param {number} frameHeight - The fixed height of each frame of the animation.
         * @param {number} [frameMax=-1] - The total number of animation frames to extract from the Sprite Sheet. The default value of -1 means "extract all frames".
         * @param {number} [margin=0] - If the frames have been drawn with a margin, specify the amount here.
         * @param {number} [spacing=0] - If the frames have been drawn with spacing between them, specify the amount here.
         * @return {egame.FrameData} A FrameData object containing the parsed frames.
         */
        spriteSheet: function(resourceKey,frameWidth, frameHeight, frameMax, margin, spacing) {
            if (frameMax === undefined) { frameMax = -1; }
            if (margin === undefined) { margin = 0; }
            if (spacing === undefined) { spacing = 0; }
            var img = egame.Caches[resourceKey].data;
            var width = img.width;
            var height = img.height;
            if (frameWidth <= 0) {
                frameWidth = Math.floor(-width / Math.min(-1, frameWidth));
            }

            if (frameHeight <= 0) {
                frameHeight = Math.floor(-height / Math.min(-1, frameHeight));
            }

            var row = Math.floor((width - margin) / (frameWidth + spacing));
            var column = Math.floor((height - margin) / (frameHeight + spacing));
            var total = row * column;
            if (frameMax !== -1) {
                total = frameMax;
            }

            //  Zero or smaller than frame sizes?
            if (width === 0 || height === 0 || width < frameWidth || height < frameHeight || total === 0) {
                console.warn("egame.SpriteSheetParser.spriteSheet: '" + key + "'s width/height zero or width/height < given frameWidth/frameHeight");
                return null;
            }

            //  Let's create some frames then
            var data = new egame.FrameData();
            var x = margin;
            var y = margin;

            for (var i = 0; i < total; i++) {
                //i frame的index 没有name
                data.addFrame(new egame.Frame(i, x, y, frameWidth, frameHeight, ''));

                x += frameWidth + spacing;

                if (x + frameWidth > width) {
                    x = margin;
                    y += frameHeight + spacing;
                }
            }
            return data;

        },

        /**
         * 解析JSON数组数据为frameData
         * @method egame.SpriteSheetParser.JSONData
         * @param {object} json - JSON data 必须是数组格式
         * @return {egame.FrameData} A FrameData object containing the parsed frames.
         */
        JSONData: function(json) {

            //  Malformed?
            if (!json['frames']) {
                console.warn("egame.SpriteSheetParser.JSONData: Invalid Texture Atlas JSON given, missing 'frames' array");
                console.log(json);
                return;
            }

            //  Let's create some frames then
            var data = new egame.FrameData();

            //  By this stage frames is a fully parsed array
            var frames = json['frames'];
            var newFrame;

            for (var i = 0; i < frames.length; i++) {
                //index为数组坐标，name为文件名字
                newFrame = data.addFrame(new egame.Frame(
                    i,
                    frames[i].frame.x,
                    frames[i].frame.y,
                    frames[i].frame.w,
                    frames[i].frame.h,
                    frames[i].filename
                ));

                if (frames[i].trimmed) {
                    newFrame.setTrim(
                        frames[i].trimmed,
                        frames[i].sourceSize.w,
                        frames[i].sourceSize.h,
                        frames[i].spriteSourceSize.x,
                        frames[i].spriteSourceSize.y,
                        frames[i].spriteSourceSize.w,
                        frames[i].spriteSourceSize.h
                    );
                }
            }

            return data;
        },



        /**
         * 解析JSON哈希数据为frameData
         * @method egame.SpriteSheetParser.JSONDataHash
         * @param {object} json - JSON data 必须是hash格式
         * @return {egame.FrameData} A FrameData object containing the parsed frames.
         */
        JSONDataHash: function(json) {

            //  Malformed?
            if (!json['frames']) {
                console.warn("egame.SpriteSheetParser.JSONDataHash: Invalid Texture Atlas JSON given, missing 'frames' object");
                console.log(json);
                return;
            }

            //  Let's create some frames then
            var data = new egame.FrameData();

            //  By this stage frames is a fully parsed array
            var frames = json['frames'];
            var newFrame;
            var i = 0;

            for (var key in frames) {
                //i为key遍历的序号，name为hash值
                newFrame = data.addFrame(new egame.Frame(
                    i,
                    frames[key].frame.x,
                    frames[key].frame.y,
                    frames[key].frame.w,
                    frames[key].frame.h,
                    key
                ));

                if (frames[key].trimmed) {
                    newFrame.setTrim(
                        frames[key].trimmed,
                        frames[key].sourceSize.w,
                        frames[key].sourceSize.h,
                        frames[key].spriteSourceSize.x,
                        frames[key].spriteSourceSize.y,
                        frames[key].spriteSourceSize.w,
                        frames[key].spriteSourceSize.h
                    );
                }

                i++;
            }

            return data;

        }

    };
    return egame.SpriteSheetParser;
});