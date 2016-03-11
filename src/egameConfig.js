//egame模块资源配置
eco.namespace("egame");
egame.SPRITE = 1;
egame.GROUP = 2;
egame.EMITTER = 11;
egame.SPRITESHEET_ANIMATION = 3;
egame.config({
	base: "../src/",
	modules:{
		"Game":'core/Game.js',  //核心部分
		"RequestAnimationFrame":'core/RequestAnimationFrame.js',
		"Signal":'core/Signal.js',
		"Time":'core/Time.js',
		"StateManager":'core/StateManager.js',
		"Stage":'core/Stage.js',
		"Camera":'core/Camera.js',
		"World":'core/World.js',
		"Group":'core/Group.js',
		"Loader":'loader/Loader.js', //加载器
		"Resource":'loader/Resource.js',
		"Image":'loader/Image.js',
		"Json":'loader/Json.js',
		"Audio":'loader/Audio.js',
		"Video":'loader/Video.js',
		"Sound":'sound/Sound.js', //音频控制
		"CONST":'utils/CONST.js', //工具
		"Utils":'utils/Utils.js',
		"EventEmitter":'utils/EventEmitter.js',
		"Point":'math/Point.js', //数学部分
		"Matrix":'math/Matrix.js',
		"Circle":'math/shapes/Circle.js',
		"Ellipse":'math/shapes/Ellipse.js',
		"Polygon":'math/shapes/Polygon.js',
		"RoundedRectangle":'math/shapes/RoundedRectangle.js',
		"Rectangle":'math/shapes/Rectangle.js',
		"QuadTree":'math/QuadTree.js',
		"RandomDataGenerator":'math/RandomDataGenerator.js',
		"DisplayObject":'display/DisplayObject.js',//显示容器和显示对象
		"Container":'display/Container.js',
		"SystemRenderer":'renderers/SystemRenderer.js',//渲染器
		"CanvasRenderer":'renderers/canvas/CanvasRenderer.js',
		"CanvasBuffer":'renderers/canvas/utils/CanvasBuffer.js',
		"CanvasTinter":'renderers/canvas/utils/CanvasTinter.js',
		"CanvasGraphics":'renderers/canvas/utils/CanvasGraphics.js',
		"BaseTexture":'textures/BaseTexture.js', //显示对象
		"Texture":'textures/Texture.js',
		"RenderTexture":'textures/RenderTexture.js',
		"Sprite":'sprites/Sprite.js',
		"Text":'text/Text.js',
		"GraphicsData":'graphics/GraphicsData.js',
		"Graphics":'graphics/Graphics.js',
		"TilingSprite":'tilingsprite/TilingSprite.js',
		"Component":'components/Component.js',//显示对象
		"FixedToCamera":'components/FixedToCamera.js',
		"InCamera":'components/InCamera.js',
		"Overlap":'components/Overlap.js',
		"LifeSpan":'components/LifeSpan.js',
		"Smoothed":'components/Smoothed.js',
		"Reset":'components/Reset.js',
		"InteractionData":'interaction/InteractionData.js',//输入部分
		"interactiveTarget":'interaction/interactiveTarget.js',
		"InteractionManager":'interaction/InteractionManager.js',
		"SpriteSheet":'spritesheet/SpriteSheet.js', //精灵表及精灵动画部分
		"SpriteSheetParser":'spritesheet/SpriteSheetParser.js',
		"Frame":'spritesheet/Frame.js',
		"FrameData":'spritesheet/FrameData.js',
		"Animation":'spritesheet/Animation.js', 
		"SpriteSheetAnimation":'spritesheet/SpriteSheetAnimation.js', 
		"Easing":'tween/Easing.js',    //补间动画部分
		"Tween":'tween/Tween.js',
		"TweenData":'tween/TweenData.js',
		"TweenManager":'tween/TweenManager.js',
		"Physics":'physics/Physics.js',//物理引擎部分
		"Arcade":'physics/arcade/Arcade.js',
		"Arcade_Body":'physics/arcade/Arcade_Body.js',
		"Particle":'particles/Particle.js',//粒子引擎
		"Particles":'particles/Particles.js',
		"Emitter":'particles/Emitter.js',
	}
});