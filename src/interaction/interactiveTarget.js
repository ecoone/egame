egame.define("interactiveTarget", function() {
/**
 * 交互对象默认的属性值，用于扩充需要交互的显示对象
 * 在{@link egame.interaction.InteractionManager}中使用.
 *
 * @mixin
 * @memberof egame.interaction
 * @example
 *      function MyObject() {}
 *
 *      Object.assign(
 *          MyObject.prototype,
 *          egame.interaction.interactiveTarget
 *      );
 */
var interactiveTarget = {
    /**
     * 是否可交互
     */
    interactive: false,
    /**
     * @todo Needs docs.
     */
    buttonMode: false,
    /**
     * @todo Needs docs.
     */
    interactiveChildren: true,
    /**
     * 默认光标
     */
    defaultCursor: 'pointer',

    /**
     * 是否移入显示对象
     * @private
     */
    _over: false,
    /**
     * 触摸阶段
     * @private
     */
    _touchDown: false
};

    egame.interactiveTarget = interactiveTarget;
    return interactiveTarget;
});
