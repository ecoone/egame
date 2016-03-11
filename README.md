#egame游戏引擎

egame是一个使用ecojs开发的轻量级、模块化、易于扩展的2d canvas渲染的h5游戏引擎。
![logo](https://github.com/ecoone/egame/blob/master/demo/images/egame-logo.png)
##egame包含的特性
1.  资源加载（Loader）
2.  canvas渲染
3.  状态管理(Status)
4.  音频管理(Sound)
5.  世界、舞台、相机管理(World,Stage,Camera)
6.  显示对象和显示容器(Container,DisplayObject)
7.  精灵、精灵表、文字、图形、平铺精灵(Sprite,SpriteSheet,Text,Graphics,TilingSprite)
8.  精灵动画(SpriteSheetAnimation)
9.  组(Group)
10. 补间动画(Tween)
11. 粒子效果(Particle)
12. 物理引擎(Physics)
13. 输入(InteractionManager)

##基础使用例子
```
egame.use(['Game', 'Loader', 'Texture', 'Sprite', 'Text', 'Image'], function(Game,Loader, Texture, Sprite, Text) {
	//创建一个游戏对象
	var game = new Game(640, 1008, document.body, egame.ScaleMode.FIXED_WIDTH);
	var load = new Loader(game);
	//初始画面
	var loaddingStatus = {
		preload: function() {
			//设置要加载的资源
			load.image("mniya1", "images/1.jpg");
			//加载资源界面
			game.stage.renderer.backgroundColor = 0x1099bb;
			var basicText = new Text('当前进度：0%');
			basicText.x = 150;
			basicText.y = 100;
			game.stage.addChild(basicText);
			//资源加载状态捕获
			//加载资源完成时候调用
			game.load.onResourceComplete.add(function() {
				basicText.text = '当前进度：' + game.load.progress + '%';
			});
			game.load.onResourceError.add(function(resourceKey) {
				alert("资源" + resourceKey + "加载失败");
			});
			// 所有加载资源完成时候调用
			game.load.onLoadComplete.add(function() {
				basicText.text = '当前进度：' + game.load.progress + '%';
				game.stage.removeChildren();
			});
		},
		create: function() {
			//设置背景色
			game.stage.backgroundColor = 0x1099bb;
			//使用图片资源
			//方式1
			// var texture = Texture.fromResource('mniya1');
			// var minya1 = new Sprite(texture);
			// 方式2
			var minya1 = new Sprite('mniya1');
			minya1.anchor.x = 0.5;
			minya1.anchor.y = 0.5;
			minya1.scale.x = 0.3;
			minya1.scale.y = 0.3;
			minya1.position.x = 200;
			minya1.position.y = 150;
			this.minya1 = minya1;
			this.stage.addChild(minya1);
		},
		update: function() {
			this.minya1.rotation += 0.1;
		}
	};
	//添加状态并在游戏启动后自动启动
	game.state.add("loadding", loaddingStatus, true);
	game.boot();
});
```

##LICENSE
发布于(http://opensource.org/licenses/MIT) MIT License.



