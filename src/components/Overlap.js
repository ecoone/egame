egame.define("Overlap", ["Component","Rectangle"], function(Component,Rectangle) {
    /**
    * 检测与传入的显示对象是否相交
    * @class
    */
    egame.Component.Overlap = function () {};

    egame.Component.Overlap.prototype = {

        overlap: function (displayObject) {
            return egame.Rectangle.intersects(this.getBounds(), displayObject.getBounds());

        }

    };
    return egame.Component.Overlap;
});


