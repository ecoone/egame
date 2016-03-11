egame.define("Image", ["Resource"], function(Resource) {

    /**
     * 图片资源
     */
    egame.Image = function(loader) {
        //继承资源类
        Resource.call(this);
        //资源类型
        this.type = 'image';

        //加载器
        this.loader = loader;

        //是否允许图片跨域，默认允许
        this.crossOrigin = null;

    };
    egame.Image.prototype = Object.create(egame.Resource.prototype);
    egame.Image.prototype.constructor = egame.Image;
     egame.util.extend(egame.Image.prototype ,{
        //加载资源的方法
        load: function() {
            var loader = this.loader;
            var resource = this;
            resource.data = new Image();
            resource.data.name = resource.key;
            //crossorigin="anonymous",crossorigin="use-credentials"
            if (this.crossOrigin) {
                resource.data.crossOrigin = this.crossOrigin;
            }
            resource.data.onload = function() {
                //文件加载成功
                if (resource.data.onload) {
                    resource.data.onload = null;
                    resource.data.onerror = null;
                    loader.resourceComplete(resource);
                }
            };

            resource.data.onerror = function() {
                //文件加载错误
                if (resource.data.onerror) {
                    resource.data.onload = null;
                    resource.data.onerror = null;
                    loader.resourceError(resource);
                }
            };

            resource.data.src = resource.requestUrl;
            //如果图片是立即可用的/缓存
            if (resource.data.complete && resource.data.width && resource.data.height) {
                resource.data.onload = null;
                resource.data.onerror = null;
                loader.resourceComplete(resource);
            }
        },
        loadComplete: function() {}
    });



    /***给Loader扩充的方法****/
    //加载图片
    egame.Loader.prototype.image = function(key, url,crossOrigin) {
        var loader = this;
        var image = new egame.Image(loader);
        image.key = key;
        image.url = url;
        image.requestUrl = this.transformUrl(image.url, image);
        if(crossOrigin!==undefined) image.crossOrigin = crossOrigin;
        loader.addToResourceList(image);
        return this;
    };
    //加载一组图片
    egame.Loader.prototype.images = function(keys, urls,crossOrigin) {
        for (var i = 0; i < keys.length; i++) {
            this.image(keys[i], urls[i],crossOrigin);
        }
    };


    return egame.Image;

});