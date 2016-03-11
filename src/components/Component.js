egame.define("Component", function() {
	egame.Component = function() {};

	/**
	 * 通过混杂模式安装注册组件
	 *
	 * @method
	 * @protected
	 */
	egame.Component.install = function(components) {


		this.components = {};

		for (var i = 0; i < components.length; i++) {
			var id = components[i];
			var replace = false;

			if (id === 'Destroy') {
				replace = true;
			}
			egame.util.extend(this, egame.Component[id].prototype, replace);

			this.components[id] = true;

		}

	};

	/**
	 * 组件初始化
	 */
	egame.Component.init = function() {
		for(var id in this.components){
			if(egame.Component[id].init) egame.Component[id].init.call(this);
		}

	};	
	return egame.Component;
});