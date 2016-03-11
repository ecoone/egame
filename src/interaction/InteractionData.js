egame.define("InteractionData", ["Point"], function(Point) {

    /**
     * 保持所有交互信息对象
     *
     * @class
     * @memberof egame.interaction
     */
    function InteractionData() {
        /**
         *  触摸或者鼠标事件发生的坐标
         * @member {egame.Point}
         */
        this.global = new Point();

        /**
         * 发生交互的目标精灵对象
         * @member {egame.Sprite}
         */
        this.target = null;

        /**
         * 这个是捕获的原始DOM事件对象
         * @member {Event}
         */
        this.originalEvent = null;
    }

    InteractionData.prototype.constructor = InteractionData;

    /**
     * 这个交互对象在特定显示对象终的局部坐标
     * @param displayObject {egame.DisplayObject} 获取局部坐标的显示对象
     * @param [point] {egame.Point} 用于存储局部坐标的点，可选，如果不传入将会创建一个新的点
     * @param [globalPos] {egame.Point}  这个点是全局坐标，可选(如果不传那么就用当前的全局坐标点）
     * @return {egame.Point} 这个点保持着，交互信息对象相对于显示对象的坐标
     */
    InteractionData.prototype.getLocalPosition = function(displayObject, point, globalPos) {
        return displayObject.worldTransform.applyInverse(globalPos || this.global, point);
    };

    egame.InteractionData = InteractionData;
    return InteractionData;
});