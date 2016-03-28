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
14. 贴片地图(Tilemap)
15. 游戏对象创建器(GameObjectCreator)
16. 调试信息(Debug)

##基础使用例子
```
egame.use(['Game', 'Loader', 'Texture', 'Sprite','Text','GameObjectCreator','Image'], function(Game,Loader, Texture, Sprite, Text,GameObjectCreator) {
	//创建一个游戏对象
	var game = new Game(640, 1008, document.body, egame.ScaleMode.FIXED_WIDTH);
	var load = new Loader(game);
	var add =  new GameObjectCreator(game);
	//初始画面
	var loaddingStatus = {
		preload: function() {
			//设置要加载的资源
			load.image("mniya", "images/1.jpg");
			//加载资源界面
			game.stage.backgroundColor = 0x1099bb;
			var basicText = game.add.text("当前进度：0%",150,100);
            //加载资源完成时候调用
            game.load.on("resourceCompleted",function(){
                basicText.text ='当前进度：'+game.load.progress+'%' ;
            });
            game.load.on("resourceErrored",function(resourceKey){
                alert("资源"+resourceKey+"加载失败");
            });
            // 所有加载资源完成时候调用
            game.load.on("loadCompleted",function(){
                basicText.text ='当前进度：'+game.load.progress+'%' ;
                game.stage.removeChildren();
            });
		},
		create: function() {
			//设置背景色
			game.stage.backgroundColor = 0x1099bb;
			//使用图片资源
			//方式1
			// var texture = Texture.fromResource('mniya');
			// var mniya = new Sprite(texture);
			// 方式2
			var mniya = new Sprite('mniya');
			mniya.anchor.x = 0.5;
			mniya.anchor.y = 0.5;
			mniya.scale.x = 0.3;
			mniya.scale.y = 0.3;
			mniya.position.x = 200;
			mniya.position.y = 150;
			this.mniya = mniya;
			this.stage.addChild(mniya);
		},
		update: function() {
			this.mniya.rotation += 0.1;
		}
	};
	//添加状态并在游戏启动后自动启动
	game.state.add("loadding", loaddingStatus, true);
	game.boot();
});
```

##LICENSE
发布于(http://opensource.org/licenses/MIT) MIT License.



