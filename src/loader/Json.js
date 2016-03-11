egame.define("Json", ["Resource"], function(Resource) {

    /**
     * 音频资源
     */
    egame.Json = function(loader) {
        //继承资源类
        Resource.call(this);
        //资源类型
        this.type = 'json';
        //加载器
        this.loader = loader;
    };

    egame.Json.prototype = Object.create(egame.Resource.prototype);
    egame.util.extend(egame.Json.prototype, {
        //加载资源的方法
        load: function() {
            var json = this;
            var loader = this.loader;
            if (json.url) {
                loader.xhrLoad(json, json.requestUrl, 'text');
            } else {
                this.resoureError(json, null, '没有给定有效的json数据链接');
            }
            return this;
        },
        loadComplete: function() {
            this.data =JSON.parse(this.requestObject.responseText);
        }
    });
    egame.Json.prototype.constructor = egame.Json;

    /***给Loader扩充的方法****/
    //加载json文件
    egame.Loader.prototype.json = function(key, url) {
        var json = new egame.Json(this);
        json.key = key;
        json.url = url;
        json.requestUrl = this.transformUrl(json.url, json);
        this.addToResourceList(json);
        return this;
    };

    return egame.Json;

});