egame.define("Debug", function() {
    /**
     * egame调试对象,用于在开发阶段开放一些调试信息，便于项目开发
     * 
     * @class egame.Debug
     * @constructor
     * @param {egame.Game} game -游戏对象引用
     */
    egame.Debug = function(game) {

        /**
         * @property {egame.Game} game -游戏对象引用
         */
        this.game = game;

        /**
         * @property {CanvasRenderingContext2D} context -调试信息的2d渲染环境
         */
        this.context = game.stage.context;

        /**
         * @property {string} font - 调试信息的字体
         * @default '14px Courier'
         */
        this.font = '14px Courier';

        /**
         * @property {number} columnWidth - The spacing between columns.
         */
        this.columnWidth = 100;

        /**
         * @property {number} lineHeight - The line height between the debug text.
         */
        this.lineHeight = 16;

        /**
         * @property {boolean} renderShadow - Should the text be rendered with a slight shadow? Makes it easier to read on different types of background.
         */
        this.renderShadow = true;

        /**
         * @property {number} currentX - The current X position the debug information will be rendered at.
         * @default
         */
        this.currentX = 0;

        /**
         * @property {number} currentY - The current Y position the debug information will be rendered at.
         * @default
         */
        this.currentY = 0;

        /**
         * @property {number} currentAlpha - The alpha of the Debug context, set before all debug information is rendered to it.
         * @default
         */
        this.currentAlpha = 1;


    };

    egame.Debug.prototype = {

        /**
         * Internal method that resets and starts the debug output values.
         *
         * @method egame.Debug#start
         * @protected
         * @param {number} [x=0] - The X value the debug info will start from.
         * @param {number} [y=0] - The Y value the debug info will start from.
         * @param {string} [color='rgb(255,255,255)'] - The color the debug text will drawn in.
         * @param {number} [columnWidth=0] - The spacing between columns.
         */
        start: function(x, y, color, columnWidth) {

            if (typeof x !== 'number') {
                x = 0;
            }
            if (typeof y !== 'number') {
                y = 0;
            }
            color = color || 'rgb(255,255,255)';
            if (columnWidth === undefined) {
                columnWidth = 0;
            }

            this.currentX = x;
            this.currentY = y;
            this.currentColor = color;
            this.columnWidth = columnWidth;

            this.context.save();
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.strokeStyle = color;
            this.context.fillStyle = color;
            this.context.font = this.font;
            this.context.globalAlpha = this.currentAlpha;

        },

        /**
         * Internal method that stops the debug output.
         *
         * @method egame.Debug#stop
         * @protected
         */
        stop: function() {

            this.context.restore();
        },

        /**
         * Internal method that outputs a single line of text split over as many columns as needed, one per parameter.
         *
         * @method egame.Debug#line
         * @protected
         */
        line: function() {

            var x = this.currentX;

            for (var i = 0; i < arguments.length; i++) {
                if (this.renderShadow) {
                    this.context.fillStyle = 'rgb(0,0,0)';
                    this.context.fillText(arguments[i], x + 1, this.currentY + 1);
                    this.context.fillStyle = this.currentColor;
                }

                this.context.fillText(arguments[i], x, this.currentY);

                x += this.columnWidth;
            }

            this.currentY += this.lineHeight;

        },
        /**
         * Render camera information including dimensions and location.
         *
         * @method egame.Debug#cameraInfo
         * @param {egame.Camera} camera - The egame.Camera to show the debug information for.
         * @param {number} x - X position of the debug info to be rendered.
         * @param {number} y - Y position of the debug info to be rendered.
         * @param {string} [color='rgb(255,255,255)'] - color of the debug info to be rendered. (format is css color string).
         */
        cameraInfo: function(camera, x, y, color) {

            this.start(x, y, color);
            this.line('Camera (' + camera.width + ' x ' + camera.height + ')');
            this.line('X: ' + camera.x + ' Y: ' + camera.y);

            if (camera.bounds) {
                this.line('Bounds x: ' + camera.bounds.x + ' Y: ' + camera.bounds.y + ' w: ' + camera.bounds.width + ' h: ' + camera.bounds.height);
            }

            this.line('View x: ' + camera.view.x + ' Y: ' + camera.view.y + ' w: ' + camera.view.width + ' h: ' + camera.view.height);
            // this.line('Screen View x: ' + camera.screenView.x + ' Y: ' + camera.screenView.y + ' w: ' + camera.screenView.width + ' h: ' + camera.screenView.height);
            this.line('Total in view: ' + camera.totalInView);
            this.stop();

        },

        /**
         * Render Timer information.
         *
         * @method egame.Debug#timer
         * @param {egame.Timer} timer - The egame.Timer to show the debug information for.
         * @param {number} x - X position of the debug info to be rendered.
         * @param {number} y - Y position of the debug info to be rendered.
         * @param {string} [color='rgb(255,255,255)'] - color of the debug info to be rendered. (format is css color string).
         */
        timer: function(timer, x, y, color) {

            this.start(x, y, color);
            this.line('Timer (running: ' + timer.running + ' expired: ' + timer.expired + ')');
            this.line('Next Tick: ' + timer.next + ' Duration: ' + timer.duration);
            this.line('Paused: ' + timer.paused + ' Length: ' + timer.length);
            this.stop();

        },
        /**
         * Renders the Sprites bounds. Note: This is really expensive as it has to calculate the bounds every time you call it!
         *
         * @method egame.Debug#spriteBounds
         * @param {egame.Sprite|egame.Image} sprite - The sprite to display the bounds of.
         * @param {string} [color] - Color of the debug info to be rendered (format is css color string).
         * @param {boolean} [filled=true] - Render the rectangle as a fillRect (default, true) or a strokeRect (false)
         */
        spriteBounds: function(sprite, color, filled) {

            var bounds = sprite.getBounds();

            bounds.x += this.game.camera.x;
            bounds.y += this.game.camera.y;

            this.rectangle(bounds, color, filled);

        },
        /**
         * Render debug infos (including name, bounds info, position and some other properties) about the Sprite.
         *
         * @method egame.Debug#spriteInfo
         * @param {egame.Sprite} sprite - The Sprite to display the information of.
         * @param {number} x - X position of the debug info to be rendered.
         * @param {number} y - Y position of the debug info to be rendered.
         * @param {string} [color='rgb(255,255,255)'] - color of the debug info to be rendered. (format is css color string).
         */
        spriteInfo: function(sprite, x, y, color) {

            this.start(x, y, color);

            this.line('Sprite: ' + ' (' + sprite.width + ' x ' + sprite.height + ') anchor: ' + sprite.anchor.x + ' x ' + sprite.anchor.y);
            this.line('x: ' + sprite.x.toFixed(1) + ' y: ' + sprite.y.toFixed(1));
            this.line('angle: ' + sprite.angle.toFixed(1) + ' rotation: ' + sprite.rotation.toFixed(1));
            this.line('visible: ' + sprite.visible + ' in camera: ' + sprite.inCamera);
            this.line('bounds x: ' + sprite._bounds.x.toFixed(1) + ' y: ' + sprite._bounds.y.toFixed(1) + ' w: ' + sprite._bounds.width.toFixed(1) + ' h: ' + sprite._bounds.height.toFixed(1));

            this.stop();

        },

        /**
         * Renders the sprite coordinates in local, positional and world space.
         *
         * @method egame.Debug#spriteCoords
         * @param {egame.Sprite|egame.Image} sprite - The sprite to display the coordinates for.
         * @param {number} x - X position of the debug info to be rendered.
         * @param {number} y - Y position of the debug info to be rendered.
         * @param {string} [color='rgb(255,255,255)'] - color of the debug info to be rendered. (format is css color string).
         */
        spriteCoords: function(sprite, x, y, color) {

            this.start(x, y, color, 100);

            if (sprite.name) {
                this.line(sprite.name);
            }

            this.line('x:', sprite.x.toFixed(2), 'y:', sprite.y.toFixed(2));
            this.line('pos x:', sprite.position.x.toFixed(2), 'pos y:', sprite.position.y.toFixed(2));
            this.line('world x:', sprite.world.x.toFixed(2), 'world y:', sprite.world.y.toFixed(2));

            this.stop();

        },

        /**
         * Renders Line information in the given color.
         *
         * @method egame.Debug#lineInfo
         * @param {egame.Line} line - The Line to display the data for.
         * @param {number} x - X position of the debug info to be rendered.
         * @param {number} y - Y position of the debug info to be rendered.
         * @param {string} [color='rgb(255,255,255)'] - color of the debug info to be rendered. (format is css color string).
         */
        lineInfo: function(line, x, y, color) {

            this.start(x, y, color, 80);
            this.line('start.x:', line.start.x.toFixed(2), 'start.y:', line.start.y.toFixed(2));
            this.line('end.x:', line.end.x.toFixed(2), 'end.y:', line.end.y.toFixed(2));
            this.line('length:', line.length.toFixed(2), 'angle:', line.angle);
            this.stop();
        },

        /**
         * Renders a single pixel at the given size.
         *
         * @method egame.Debug#pixel
         * @param {number} x - X position of the pixel to be rendered.
         * @param {number} y - Y position of the pixel to be rendered.
         * @param {string} [color] - Color of the pixel (format is css color string).
         * @param {number} [size=2] - The 'size' to render the pixel at.
         */
        pixel: function(x, y, color, size) {
            size = size || 2;
            this.start();
            this.context.fillStyle = color;
            this.context.fillRect(x, y, size, size);
            this.stop();

        },

        /**
         * Renders a egame geometry object including Rectangle, Circle, Point or Line.
         *
         * @method egame.Debug#geom
         * @param {egame.Rectangle|egame.Circle|egame.Point|egame.Line} object - The geometry object to render.
         * @param {string} [color] - Color of the debug info to be rendered (format is css color string).
         * @param {boolean} [filled=true] - Render the objected as a filled (default, true) or a stroked (false)
         * @param {number} [forceType=0] - Force rendering of a specific type. If 0 no type will be forced, otherwise 1 = Rectangle, 2 = Circle, 3 = Point and 4 = Line.
         */
        geom: function(object, color, filled, forceType) {

            if (filled === undefined) {
                filled = true;
            }
            if (forceType === undefined) {
                forceType = 0;
            }

            color = color || 'rgba(0,255,0,0.4)';

            this.start();

            this.context.fillStyle = color;
            this.context.strokeStyle = color;

            if (object instanceof egame.Rectangle || forceType === 1) {
                if (filled) {
                    this.context.fillRect(object.x - this.game.camera.x, object.y - this.game.camera.y, object.width, object.height);
                } else {
                    this.context.strokeRect(object.x - this.game.camera.x, object.y - this.game.camera.y, object.width, object.height);
                }
            } else if (object instanceof egame.Circle || forceType === 2) {
                this.context.beginPath();
                this.context.arc(object.x - this.game.camera.x, object.y - this.game.camera.y, object.radius, 0, Math.PI * 2, false);
                this.context.closePath();

                if (filled) {
                    this.context.fill();
                } else {
                    this.context.stroke();
                }
            } else if (object instanceof egame.Point || forceType === 3) {
                this.context.fillRect(object.x - this.game.camera.x, object.y - this.game.camera.y, 4, 4);
            } else if (object instanceof egame.Line || forceType === 4) {
                this.context.lineWidth = 1;
                this.context.beginPath();
                this.context.moveTo((object.start.x + 0.5) - this.game.camera.x, (object.start.y + 0.5) - this.game.camera.y);
                this.context.lineTo((object.end.x + 0.5) - this.game.camera.x, (object.end.y + 0.5) - this.game.camera.y);
                this.context.closePath();
                this.context.stroke();
            }

            this.stop();

        },

        /**
         * Renders a Rectangle.
         *
         * @method egame.Debug#geom
         * @param {egame.Rectangle|object} object - The geometry object to render.
         * @param {string} [color] - Color of the debug info to be rendered (format is css color string).
         * @param {boolean} [filled=true] - Render the objected as a filled (default, true) or a stroked (false)
         */
        rectangle: function(object, color, filled) {

            if (filled === undefined) {
                filled = true;
            }

            color = color || 'rgba(0, 255, 0, 0.4)';

            this.start();

            if (filled) {
                this.context.fillStyle = color;
                this.context.fillRect(object.x - this.game.camera.x, object.y - this.game.camera.y, object.width, object.height);
            } else {
                this.context.strokeStyle = color;
                this.context.strokeRect(object.x - this.game.camera.x, object.y - this.game.camera.y, object.width, object.height);
            }

            this.stop();

        },

        /**
         * Render a string of text.
         *
         * @method egame.Debug#text
         * @param {string} text - The line of text to draw.
         * @param {number} x - X position of the debug info to be rendered.
         * @param {number} y - Y position of the debug info to be rendered.
         * @param {string} [color] - Color of the debug info to be rendered (format is css color string).
         * @param {string} [font] - The font of text to draw.
         */
        text: function(text, x, y, color, font) {

            color = color || 'rgb(255,255,255)';
            font = font || '16px Courier';

            this.start();
            this.context.font = font;

            if (this.renderShadow) {
                this.context.fillStyle = 'rgb(0,0,0)';
                this.context.fillText(text, x + 1, y + 1);
            }

            this.context.fillStyle = color;
            this.context.fillText(text, x, y);

            this.stop();

        },

        /**
         * Visually renders a QuadTree to the display.
         *
         * @method egame.Debug#quadTree
         * @param {egame.QuadTree} quadtree - The quadtree to render.
         * @param {string} color - The color of the lines in the quadtree.
         */
        quadTree: function(quadtree, color) {

            color = color || 'rgba(255,0,0,0.3)';

            this.start();

            var bounds = quadtree.bounds;

            if (quadtree.nodes.length === 0) {
                this.context.strokeStyle = color;
                this.context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
                this.text('size: ' + quadtree.objects.length, bounds.x + 4, bounds.y + 16, 'rgb(0,200,0)', '12px Courier');

                this.context.strokeStyle = 'rgb(0,255,0)';

                for (var i = 0; i < quadtree.objects.length; i++) {
                    this.context.strokeRect(quadtree.objects[i].x, quadtree.objects[i].y, quadtree.objects[i].width, quadtree.objects[i].height);
                }
            } else {
                for (var i = 0; i < quadtree.nodes.length; i++) {
                    this.quadTree(quadtree.nodes[i]);
                }
            }

            this.stop();
        },

        /**
         * Render a Sprites Physics body if it has one set. The body is rendered as a filled or stroked rectangle.
         * This only works for Arcade Physics, Ninja Physics (AABB and Circle only) and Box2D Physics bodies.
         * To display a P2 Physics body you should enable debug mode on the body when creating it.
         *
         * @method egame.Debug#body
         * @param {egame.Sprite} sprite - The Sprite who's body will be rendered.
         * @param {string} [color='rgba(0,255,0,0.4)'] - Color of the debug rectangle to be rendered. The format is a CSS color string such as '#ff0000' or 'rgba(255,0,0,0.5)'.
         * @param {boolean} [filled=true] - Render the body as a filled rectangle (true) or a stroked rectangle (false)
         */
        body: function(sprite, color, filled) {

            if (sprite.body) {
                this.start();
                if (sprite.body.type === egame.Physics.ARCADE) {
                    egame.Physics.Arcade.Body.render(this.context, sprite.body, color, filled);
                } 
                this.stop();
            }
        },
        /**
         * Render a Sprites Physic Body information.
         *
         * @method egame.Debug#bodyInfo
         * @param {egame.Sprite} sprite - The sprite to be rendered.
         * @param {number} x - X position of the debug info to be rendered.
         * @param {number} y - Y position of the debug info to be rendered.
         * @param {string} [color='rgb(255,255,255)'] - color of the debug info to be rendered. (format is css color string).
         */
        bodyInfo: function(sprite, x, y, color) {

            if (sprite.body) {
                this.start(x, y, color, 210);

                if (sprite.body.type === egame.Physics.ARCADE) {
                    egame.Physics.Arcade.Body.renderBodyInfo(this, sprite.body);
                } else if (sprite.body.type === egame.Physics.BOX2D) {
                    this.game.physics.box2d.renderBodyInfo(this, sprite.body);
                }

                this.stop();
            }
        }
    };

    egame.Debug.prototype.constructor = egame.Debug;
    return egame.Debug;
});