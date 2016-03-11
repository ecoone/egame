egame.define("Audio", ["Resource"], function(Resource) {

    /**
     * 音频资源
     */
    egame.Audio = function(loader) {
        //继承资源类
        Resource.call(this);
        //资源类型
        this.type = 'audio';
        //音频类型
        this.audioType = null;
        //webaudio使用的上下文环境
        this.audioContext = null;
        //是否对arraaybuffer解码到了audioBuffer
        this.autoDecode = true;
        //解码后的数据
        this.decodeData = null;

        //加载器
        this.loader = loader;

        this.forceAudio = false;

    };
    egame.Audio.AudioType = {
        AUDIO_TAG: 1,
        WEB_AUDIO: 2
    };
    //检测egame可以播放视频的类型
    egame.Audio.canPlayAudio = function(type) {
        if (type === 'mp3' && egame.Audio.mp3) {
            return true;
        } else if (type === 'ogg' && (egame.Audio.ogg || egame.Audio.opus)) {
            return true;
        } else if (type === 'm4a' && egame.Audio.m4a) {
            return true;
        } else if (type === 'opus' && egame.Audio.opus) {
            return true;
        } else if (type === 'wav' && egame.Audio.wav) {
            return true;
        } else if (type === 'webm' && egame.Audio.webm) {
            return true;
        }
        return false;
    };

    //检查audio支持情况
    egame.Audio._checkAudio = function() {
        var audioElement = document.createElement('audio');
        var result = false;
        try {
            if (result = !!audioElement.canPlayType) {
                if (audioElement.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '')) {
                    egame.Audio.ogg = true;
                }

                if (audioElement.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, '') || audioElement.canPlayType('audio/opus;').replace(/^no$/, '')) {
                    egame.Audio.opus = true;
                }

                if (audioElement.canPlayType('audio/mpeg;').replace(/^no$/, '')) {
                    egame.Audio.mp3 = true;
                }

                // Mimetypes accepted:
                //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   bit.ly/iphoneoscodecs
                if (audioElement.canPlayType('audio/wav; codecs="1"').replace(/^no$/, '')) {
                    egame.Audio.wav = true;
                }

                if (audioElement.canPlayType('audio/x-m4a;') || audioElement.canPlayType('audio/aac;').replace(/^no$/, '')) {
                    egame.Audio.m4a = true;
                }

                if (audioElement.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, '')) {
                    egame.Audio.webm = true;
                }
            }
        } catch (e) {}
    }
    egame.Audio._checkAudio();

    //获取可播放视频链接
    egame.Audio.getAudioURL = function(urls) {
        for (var i = 0; i < urls.length; i++) {
            var url = urls[i];
            var audioType;

            if (url.uri) // {uri: .., type: ..} 对象类型的url
            {
                url = url.uri;
                audioType = url.type;
            } else {
                //假设这种链接可以直接播放
                if (url.indexOf("blob:") === 0 || url.indexOf("data:") === 0) {
                    return url;
                }
                //清除查询参数
                if (url.indexOf("?") >= 0) {
                    url = url.substr(0, url.indexOf("?"));
                }

                var extension = url.substr((Math.max(0, url.lastIndexOf(".")) || Infinity) + 1);

                audioType = extension.toLowerCase();
            }

            if (egame.Audio.canPlayAudio(audioType)) {
                return urls[i];
            }
        }
        return null;
    }
    egame.Audio.prototype = Object.create(egame.Resource.prototype);
     egame.util.extend(egame.Audio.prototype, {
        //加载资源的方法
        load: function() {
            var audio = this;
            var loader = this.loader;
            if (audio.url) {
                if ((!!window['AudioContext'] || !!window['webkitAudioContext'])&&!audio.forceAudio) {
                    window.AudioContext = window.AudioContext || window.webkitAudioContext;
                    audio.audioType = egame.Audio.AudioType.WEB_AUDIO;
                    audio.audioContext = new AudioContext();
                    loader.xhrLoad(audio, audio.requestUrl, 'arraybuffer');
                } else {
                    audio.audioType = egame.Audio.AudioType.AUDIO_TAG;
                    this._loadAudioTag();
                }
            } else {
                this.resoureError(audio, null, '没有给定有效的视频链接或者设备不支持所给类型的视频播放');
            }
            return this;
        },
        //通过audio标签加载
        _loadAudioTag: function() {
            var audio = this;
            var loader = this.loader;

            audio.data = new Audio();
            audio.data.name = audio.key;

            var playThroughEvent = function() {
                audio.data.removeEventListener('canplaythrough', playThroughEvent, false);
                audio.data.onerror = null;
                loader.resourceComplete(audio);
            };
            audio.data.onerror = function() {
                audio.data.removeEventListener('canplaythrough', playThroughEvent, false);
                audio.data.onerror = null;
                loader.resourceError(audio);
            };

            audio.data.preload = 'auto';
            audio.data.src = audio.requestUrl;
            audio.data.addEventListener('canplaythrough', playThroughEvent, false);
            audio.data.load();
        },
        loadComplete: function() {
            if ((!!window['AudioContext'] || !!window['webkitAudioContext'])&&!this.forceAudio) {
                this.data = this.requestObject.response;
                if (this.autoDecode) {
                    this.audioContext.decodeAudioData(this.data, function(buffer) {
                        this.decodeData = buffer;
                    }, function() {
                        console.warn("音频文件：" + this.key + ",解码错误");
                    });
                }
            }
        }
    });
    egame.Audio.prototype.constructor = egame.Audio;

    /***给Loader扩充的方法****/
    //加载视频
    egame.Loader.prototype.audio = function(key, urls,forceAudio,autoDecode) {
        if (autoDecode === undefined) {
            autoDecode = true;
        }
        if (forceAudio === undefined) {
            forceAudio = false;
        }
        if (typeof urls === 'string') {
            urls = [urls];
        }
        var audio = new egame.Audio(this);
        audio.key = key;
        audio.url = egame.Audio.getAudioURL(urls);
        audio.requestUrl = this.transformUrl(audio.url, audio);
        audio.autoDecode = autoDecode;
        audio.forceAudio = forceAudio;
        this.addToResourceList(audio);
        return this;
    };

    return egame.Audio;

});