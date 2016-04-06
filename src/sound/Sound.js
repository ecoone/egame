egame.define("Sound", function() {
    egame.Sound = function(audioKey) {
        var audio = egame.Caches[audioKey];
        this.audio = audio;
        this.key = audio.key;
        this.audioContext = audio.audioContext;
        this.decodeCompleteQuenes = [];
        if (this.audioContext) {
            var self = this;
            //对加载的音频解码
            if (audio.autoDecode && !audio.decodeData && audio.data) {
                this.audioContext.decodeAudioData(audio.data, function(buffer) {
                    audio.decodeData = buffer;
                    for (var i = 0; i < self.decodeCompleteQuenes.length; i++) {
                        var o = self.decodeCompleteQuenes[i];
                        o.func.apply(o.context, o.arguments);
                    }
                }, function() {
                    console.warn("音频文件：" + audio.key + ",解码错误");
                });
            }

        }

        //是否暂停
        this.paused = true;

        //当前是否静音
        this.muted = false;

        //audio对象池的最大数量
        this.maxAudioPools = 7;
        this.audioPools = [];

        //buffer source
        this.webAudioPools = [];
        //声音大小
        this.volume = 1;
        //循环
        this.loop = false;
        //从哪里开始播放
        this.position = 0;
        //播放的时间长度
        this.duration = undefined;
        //是否播放过
        this._played = false;
    };
    //是否需要手势解锁，因为有些手机如iphone必须需要于屏幕交互才可播放
    egame.Sound.touchLocked = false; 
    var ua = navigator.userAgent;
    if(/iP[ao]d|iPhone/i.test(ua)){
         egame.Sound.touchLocked = true;
        (navigator.appVersion).match(/OS (\d+)/);
        var iOSVersion = parseInt(RegExp.$1, 10);
        document.addEventListener('touchstart',function(){
            egame.Sound.touchLocked = false;
        }, true);
        document.addEventListener('touchend', function(){
            egame.Sound.touchLocked = false;
        }, true);
    }
    egame.Sound.prototype = {
        /**
         * 播放音频文件
         * @param  {[type]} loop   是否循环播放
         * @param  {[type]} volume 音量
         * @param  {[type]} position  开始位置
         * @param  {[type]} duration 播放长度 
         */
        play: function(loop, volume, position, duration) {
            //当没有触摸的时候不可播放
            if(egame.Sound.touchLocked) return;
            if (!this.audio.decodeData&&this.audio.audioType != egame.Audio.AudioType.AUDIO_TAG) {
                this.decodeCompleteQuenes.push({
                    arguments: arguments,
                    context: this,
                    func: this.play
                })
                return;
            }
            if (volume !== undefined) {
                this.volume = volume;
            }
            if (loop !== undefined) {
                this.loop = loop;
            }
            if (position !== undefined) {
                this.position = position;
            }
            if (duration !== undefined) {
                this.duration = duration;
            }
            if (this.audio.audioType == egame.Audio.AudioType.AUDIO_TAG) {
                var audioTag = this.getOpenAudioTag();
                if(!audioTag)  return;
                audioTag.src = this.audio.data.src;
                audioTag.volume = this.volume;
                audioTag.loop = this.loop;
                audioTag.play();
            } else {
                var webAudio = this.getOpenWebAudio();
                var source = webAudio.source;
                var gainNode = webAudio.gainNode;
                gainNode.gain.value = this.volume;
                source.buffer = this.audio.decodeData;
                if (!this.duration) this.duration = source.buffer.duration;
                source.loop = this.loop;
                this.volume = this.volume;
                source.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                //webAudio播放音频的真实时间
                webAudio.startTime = this.audioContext.currentTime;
                source.start(0, this.position, this.duration);
            }
            this.paused = false;
            this._played = true;
        },
        //获取一个可用的audioTag标签
        getOpenAudioTag: function() {
            for (var i = 0; i < this.audioPools.length; i++) {
                var audioTag = this.audioPools[i];
                if (audioTag.ended||audioTag.codeEnded) {
                    return audioTag;
                }
            }
            if (i < this.maxAudioPools) {
                var audioTag = new Audio();
                this.audioPools.push(audioTag);
                return audioTag;
            }
            return null;
        },
        //获取一个播放完成的webaudio对象
        getOpenWebAudio: function() {
            for (var i = 0; i < this.webAudioPools.length; i++) {
                var webAudio = this.webAudioPools[i];
                if (!this.loop && webAudio.ended) {
                    webAudio.source = this.audioContext.createBufferSource();
                    return webAudio;
                }
            }
            var webAudio = {};
            var source = this.audioContext.createBufferSource();
            source.onended = function() {
                webAudio.ended = true;
            }
            if (this.audioContext.createGain === undefined) {
                gainNode = this.audioContext.createGainNode();
            } else {
                gainNode = this.audioContext.createGain();
            }
            webAudio.source = source;
            webAudio.gainNode = gainNode;
            webAudio.startOffset = 0;
            this.webAudioPools.push(webAudio);
            return webAudio;
        },
        /**
         * 暂停播放声音
         */
        pause: function() {
            if (this.paused) return;
            if (this.audio.audioType == egame.Audio.AudioType.AUDIO_TAG) {
                var audioTag;
                for (var i in this.audioPools) {
                    audioTag = this.audioPools[i];
                    audioTag.pause();
                }
                this.paused = true;
            } else {
                this.stop(true);
            }
        },
        /**
         * 恢复被暂停的声音
         */
        resume: function() {
            if (this.paused&&this._played) {
                if (this.audio.audioType == egame.Audio.AudioType.AUDIO_TAG) {
                    var audioTag;
                    for (var i in this.audioPools) {
                        audioTag = this.audioPools[i];
                        audioTag.play();
                    }
                    this.paused = false;
                } else {
                    var webAudio, source, gainNode;
                    for (var i in this.webAudioPools) {
                        webAudio = this.webAudioPools[i];
                        var sourceOld = webAudio.source;
                        var source = this.audioContext.createBufferSource();
                        source.buffer = sourceOld.buffer;
                        source.loop = sourceOld.loop;
                        gainNode = webAudio.gainNode;
                        gainNode.gain.value = this.volume;
                        source.connect(gainNode);
                        gainNode.connect(this.audioContext.destination);
                        webAudio.startTime = this.audioContext.currentTime;
                        webAudio.source = source;
                        source.start(0, webAudio.startOffset % source.buffer.duration, this.duration);
                    }
                    this.paused = false;
                }
            }
        },
        /**
         * 停止声音播放,声音回到初始位置
         */
        stop: function(paused) {
            if (!this._played) return;
            if (this.audio.audioType == egame.Audio.AudioType.AUDIO_TAG) {
                var audioTag;
                for (var i in this.audioPools) {
                    audioTag = this.audioPools[i];
                    audioTag.pause();
                    audioTag.currentTime = 0.0;
                    audioTag.codeEnded = true;
                }
                this.paused = true;
            } else {
                var webAudio, source, gainNode;
                for (var i in this.webAudioPools) {
                    webAudio = this.webAudioPools[i];
                    source = webAudio.source;
                    gainNode = webAudio.gainNode;
                    source.disconnect(gainNode);
                    if (source.stop === undefined) {
                        source.noteOff(0);
                    } else {
                        source.stop(0);
                    }
                    if(paused){
                        webAudio.startOffset += this.audioContext.currentTime - webAudio.startTime;
                    }else{
                       webAudio.startOffset = this.position;
                    }   
                }
                this.paused = true;
            }
        },
        /**
         * 静音
         */
        mute: function() {
            if (this.muted||!this._played) return;
            if (this.audio.audioType == egame.Audio.AudioType.AUDIO_TAG) {
                var audioTag;
                for (var i in this.audioPools) {
                    audioTag = this.audioPools[i];
                    audioTag.muted = true;
                }
                this.muted = true;
            } else {
                for (var i in this.webAudioPools) {
                    webAudio = this.webAudioPools[i];
                    source = webAudio.source;
                    gainNode = webAudio.gainNode;
                    gainNode.gain.value = 0;
                    webAudio.muted = true;
                }
                this.muted = true;
            }
        },
        /**
         * 解除静音
         */
        unmute: function() {
            if (this.muted) {
                if (this.audio.audioType == egame.Audio.AudioType.AUDIO_TAG) {
                    var audioTag;
                    for (var i in this.audioPools) {
                        audioTag = this.audioPools[i];
                        audioTag.muted = false;
                    }
                    this.muted = false;
                } else {
                    for (var i in this.webAudioPools) {
                        webAudio = this.webAudioPools[i];
                        source = webAudio.source;
                        gainNode = webAudio.gainNode;
                        gainNode.gain.value = this.volume;
                        webAudio.muted = false;
                    }
                    this.muted = false;
                }
            }
        }
    }
    
    return egame.Sound;
});