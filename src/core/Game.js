/**
 * 游戏对象
 */
egame.define("Game", ["RequestAnimationFrame", "EventEmitter", "StateManager", "Time", "Stage", "World"], function(RequestAnimationFrame, EventEmitter, StateManager, Time, Stage, World) {
	egame.Game = function(width, height, parent, scaleMode, state) {
			EventEmitter.call(this);
			this.width = width || 640;
			this.height = height || 1136;
			//父容器
			this.parent = parent;
			this.isBooted = false;
			this.isRunning = false;

			//缩放模式
			this.scaleMode = scaleMode || egame.ScaleMode.NO_SCALE;

			//积累的间隙时间，直到逻辑更新的时候减少
			this._deltaTime = 0;
			this._kickstart = true;
			//最后一帧的逻辑渲染次数
			this._lastCount = 0;
			//如果帧逻辑渲染次数失控，这个计数器增加
			this._spiraling = 0;
			//强制每一帧只有一个更新
			this.forceSingleUpdate = false;
			//当前帧的逻辑更新次数
			this.updatesThisFrame = 1;
			//当前帧的逻辑更新id,第一个是0依次递增
			this.currentUpdateID = 0;

			//游戏是否暂停
			this._paused = false;
			this.raf = new RequestAnimationFrame();
			this.state = new StateManager(this, state);
			this.time = new Time(this);
			this.stage = new Stage(this);
			this.world = new World(this);
		}
		//缩放模式
	egame.ScaleMode = {
		NO_SCALE: 1,
		FIXED_WIDTH: 2,
		FIXED_HEIGHT: 3,
		FULL_PAGE: 4
	};
	egame.Game.prototype = Object.create(EventEmitter.prototype);
	egame.util.extend(egame.Game.prototype, {
		update: function(time) {
			this.time.update(time);

			//第一次启动
			if (this._kickstart) {
				this.updateLogic(this.time.desiredFpsMult);
				this.updateRender(this.time.slowMotion * this.time.desiredFps);
				this._kickstart = false;
				return;
			}
			//如果帧速度不断降低，执行下面逻辑
			if (this._spiraling > 1 && !this.forceSingleUpdate) {
				//1. 发出警告，程序无法保持desiredFps
				if (this.time.time > this._nextFpsNotification) {
					//保证10秒内只发送一次
					this._nextFpsNotification = this.time.time + 10000;

					//发送警告
					this.emit("fpsProblemNotifier");
				}

				//2. 重置_deltaTime，这将导致所有没有执行的逻辑更新跳过
				this._deltaTime = 0;
				this._spiraling = 0;

				//3. 执行渲染
				this.updateRender(this.time.slowMotion * this.time.desiredFps);
				//帧速率还在可控范围内
			} else {
				// 通过减慢因子计算步长
				var slowStep = this.time.slowMotion * 1000.0 / this.time.desiredFps;

				//增加间隙时间，但间隙不能大于3倍的的步长值
				this._deltaTime += Math.max(Math.min(slowStep * 3, this.time.elapsed), 0);

				// 如果需要丢帧，调用多次逻辑更新,除非forceSingleUpdate＝true
				var count = 0;

				this.updatesThisFrame = Math.floor(this._deltaTime / slowStep);

				if (this.forceSingleUpdate) {
					this.updatesThisFrame = Math.min(1, this.updatesThisFrame);
				}

				while (this._deltaTime >= slowStep) {
					this._deltaTime -= slowStep;
					this.currentUpdateID = count;
					this.updateLogic(this.time.desiredFpsMult);
					count++;

					if (this.forceSingleUpdate && count === 1) {
						break;
					} else {
						this.time.refresh();
					}
				}

				//帧速率变慢
				if (count > this._lastCount) {
					this._spiraling++;
				}
				//帧速率变快
				else if (count < this._lastCount) {
					this._spiraling = 0;
				}

				//记录当前帧
				this._lastCount = count;

				//渲染更新
				this.updateRender(this._deltaTime / slowStep);
			}
		},
		/**
		 * 游戏逻辑更新
		 * @param  {number} timeStep 由Game.update传入的游戏世界时间步长值
		 */
		updateLogic: function(timeStep) {
			if (!this._paused) {
				if (this.world) this.world.camera.preUpdate();
				if (this.physics) this.physics.preUpdate();
				this.state.preUpdate(timeStep);
				this.stage.preUpdate();

				this.state.update();
				this.stage.update();
				if (this.tweens) this.tweens.update();
				if (this.physics) this.physics.update();
				if (this.particles) this.particles.update();

				this.stage.postUpdate();
			} else {
				this.state.pauseUpdate();
			}

		},
		/**
		 * 游戏渲染部分
		 * @param  {number} elapsedTime 自上次渲染的间隔值
		 */
		updateRender: function(elapsedTime) {
			if (this.lockRender) {
				return;
			}

			this.state.preRender(elapsedTime);

			this.stage.renderer.render(this.stage);

			this.state.render(elapsedTime);

		},
		/**
		 * 启动游戏
		 * statusName状态名
		 */
		boot: function(statusName) {
			//如果已经启动那么就返回
			if (this.isBooted) {
				return;
			}
			if (statusName) this.state.start(statusName);
			this.isBooted = true;
			this.time.boot();
			this.world.boot();
			this.state.boot();
			this.isRunning = true;
			this._kickstart = true;
			var that = this;
			this.raf.update = function(time) {
				that.update(time);
			}
			this.raf.start();
		},
		/**
		 * 游戏暂停处理逻辑
		 */
		gamePaused: function(event) {
			//游戏暂停处理
			if (!this._paused) {
				this._paused = true;
				this.time.gamePaused();
				this.emit("paused");
			}

		},
		/**
		 * 游戏恢复处理
		 */
		gameResumed: function(event) {
			//  游戏恢复处理逻辑
			if (this._paused) {
				this._paused = false;
				this.time.gameResumed();
				this.emit("resumed", event);
			}

		}
	});

	/**
	 * @name Phaser.Game#paused
	 * @property {boolean} paused -获取或者设置游戏是否暂停
	 */
	Object.defineProperty(egame.Game.prototype, "paused", {

		get: function() {
			return this._paused;
		},

		set: function(value) {

			if (value === true) {
				this.gamePaused(this);
			} else {
				this.gameResumed(this);
			}

		}

	});
	egame.Game.prototype.constructor = egame.Game;
	return egame.Game;
});