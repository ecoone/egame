egame.define("Resource", function() {

    /**
     * 资源基础类
     */
    egame.Resource = function(loader) {
        //资源引用的加载器对象
        this.loader = loader;
        //资源类型
        this.type = '';
        //资源的名字
        this.key = "";
        //资源状态
        this.status = STATUS.CREATED;
        //资源数据
        this.data = null;
        //资源链接
        this.url = "";
        //加载错误的信息
        this.errorMsg ="";
        //资源请求链接
        this.requestUrl = "";
    };

    /**
     * 资源类型
     */
    var STATUS = egame.Resource.STATUS = {
        CREATED: 1,
        LOADING: 2,
        LOADED: 3,
        ERRORED: 4
    };
    
    //这里只是展示接口
    egame.Resource.prototype = {
        //加载资源接口
        load: function() {},
        //加载成功要做的事情
        loadComplete: function() {},
        //加载失败要做的事情
        loadError: function() {}
    };
    egame.Resource.prototype.constructor = egame.Resource;

    return egame.Resource;

});