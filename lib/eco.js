/*
 * eco.js生态框架 (https://github.com/TUNIU-OPE/ecojs)
 * Copyright 2015 mni_Ya
 * Licensed under the MIT license
 */
(function(global, undefined) {
  if (global.eco) {
    return;
  }
  /********公有方法部分**************************/
  var util = {};

  //类型判断
  util.isType = function(type) {
    return function(obj) {
      return {}.toString.call(obj) == "[object " + type + "]"
    }
  }
  util.isObject = util.isType("Object");
  util.isString = util.isType("String");
  util.isArray = Array.isArray || util.isType("Array");
  util.isFunction = util.isType("Function");
  util.isUndefined = util.isType("Undefined");
  util.isBoolean = util.isType("Boolean");
  util.isInArray = function(array, item) {
    for (i = 0; i < array.length; i++) {
      if (array[i] == item)
        return true;
    }
    return false;
  }
  util._uid = 0;
  util.uid = function() {
    return util._uid++
  };

  //css,js加载
  (function(util) {
    var isWebWorker = typeof window === 'undefined' && typeof importScripts !== 'undefined' && isFunction(importScripts);
    var doc = document
    var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement
    var baseElement = head.getElementsByTagName("base")[0]
    var IS_CSS_RE = /\.css(?:\?|$)/i
    var isOldWebKit = +navigator.userAgent
      .replace(/.*(?:AppleWebKit|AndroidWebKit)\/?(\d+).*/i, "$1") < 536
    var currentlyAddingScript

    function request(url, callback, charset, crossorigin) {
      charset = "utf-8";
      crossorigin = undefined;
      var isCSS = IS_CSS_RE.test(url);
      if (!isCSS && isWebWorker) {
        var error
        try {
          importScripts(url)
        } catch (e) {
          error = e
        }
        callback(error)
        return;
      }
      var node = doc.createElement(isCSS ? "link" : "script");
      if (charset) {
        node.charset = charset
      }

      if (!util.isUndefined(crossorigin)) {
        node.setAttribute("crossorigin", crossorigin)
      }

      addOnload(node, callback, isCSS, url)


      if (isCSS) {
        node.rel = "stylesheet"
        node.href = url
      } else {
        node.async = true
        node.src = url
      }

      currentlyAddingScript = node

      baseElement ?
        head.insertBefore(node, baseElement) :
        head.appendChild(node)

      currentlyAddingScript = null
    }

    function addOnload(node, callback, isCSS, url) {
      var supportOnload = "onload" in node

      if (isCSS && (isOldWebKit || !supportOnload)) {
        setTimeout(function() {
            pollCss(node, callback)
          }, 1) 
        return
      }

      if (supportOnload) {
        node.onload = onload
        node.onerror = function() {
          util.emit("error", {
            uri: url,
            node: node
          })
          onload(true)
        }
      } else {
        node.onreadystatechange = function() {
          if (/loaded|complete/.test(node.readyState)) {
            onload()
          }
        }
      }

      function onload(error) {
        node.onload = node.onerror = node.onreadystatechange = null

        if (!node.rel) {
          head.removeChild(node)
        }

        node = null

        callback(error)
      }
    }

    function pollCss(node, callback) {
      var sheet = node.sheet
      var isLoaded

      if (isOldWebKit) {
        if (sheet) {
          isLoaded = true
        }
      }
      else if (sheet) {
        try {
          if (sheet.cssRules) {
            isLoaded = true
          }
        } catch (ex) {
          if (ex.name === "NS_ERROR_DOM_SECURITY_ERR") {
            isLoaded = true
          }
        }
      }

      setTimeout(function() {
        if (isLoaded) {
          callback()
        } else {
          pollCss(node, callback)
        }
      }, 20)
    }
    util.request = request
  })(util);

  //对象扩充
  util.extend = function(target, obj, deep,included) {
    var key;
    if (!obj) return target;
    if(util.isArray(deep)){
      included = deep;
      deep = false;
    }
    if(util.isArray(included)&&included.length==0) included = false;
    for (key in obj) {
      if(util.isArray(included)&&!util.isInArray(included,key)) continue;
      if (target === obj[key]) continue;
      if (util.isObject(obj[key]) && deep) {
        if (!target[key]) target[key] = {};
        util.extend(target[key], obj[key], deep);
      }
      target[key] = obj[key];
    }
    return target;
  };

  //事件通讯
  util.events = {};
  util.on = function(name, callback) {
    var list = this.events[name] || (this.events[name] = [])
    list.push(callback)
    return this
  }

  util.one = function(name, callback) {
    var self = this;
    var oneHandler = function(data) {
      self.off(name, oneHandler);
      callback.call(self, data);
    };
    self.on(name, oneHandler);
    return this
  }

  util.off = function(name, callback) {
    if (!(name || callback)) {
      this.events = {}
      return this
    }

    var list = this.events[name]
    if (list) {
      if (callback) {
        for (var i = list.length - 1; i >= 0; i--) {
          if (list[i] === callback) {
            list.splice(i, 1)
          }
        }
      } else {
        delete this.events[name]
      }
    }

    return this
  }

  util.emit = function(name, data) {
    var list = util.events[name]

    if (list) {
      list = list.slice()

      for (var i = 0, len = list.length; i < len; i++) {
        list[i](data)
      }
    }

    return util
  }

  /*****************模块部分************************/

  //模块状态
  var STATUS = Module.STATUS = {
    VIRTUAL: -1, //这个模块不是真实的，只是一个虚拟模块
    CREATED: 0, //模块所在文件加载完成
    READY: 1, //模块的依赖文件加载完成
    EXECUTING: 2, //执行模块中
    EXECUTED: 3, //执行成功
  }

  //模块类
  function Module(id, dependencyIds, factory) {
    if (arguments.length == 2) {
      dependencyIds = [];
      factory = dependencyIds;
    }
    //模块标识
    this.id = id;
    //依赖模块标识
    this.dependencyIds = dependencyIds;
    //依赖模块对象
    this.dependencies = {};
    //模块构造方法
    this.factory = factory;
    //模块的状态
    this.status = STATUS.CREATED;
    //模块导出
    this.exports = {};
    //模块是否可用
    this._enable = true;
    //模块关联的命名空间
    this.nameSpace = null;
  }

  //执行模块
  Module.prototype.exec = function() {
    //如果模块处于不可用状态报错
    if (!this._enable) {
      throw new Error('模块' + this.id + '处于不可用的状态');
    }

    //模块的状态若大于开始执行那么
    if (this.status >= STATUS.EXECUTING) {
      return this.exports;
    }

    this.status = STATUS.EXECUTING;

    var exportsList = [];
    for (var i = 0; i < this.dependencyIds.length; i++) {
      exportsList.push(this.dependencies[this.dependencyIds[i]].exec());
    }

    this.exports = util.isFunction(this.factory) ? this.factory.apply(this, exportsList) : this.factory;

    this.status = STATUS.EXECUTED;
    return this.exports;
  }

  //设置模块的依赖
  Module.prototype.setDependencies = function() {
    if (this.dependencyIds) {
      for (var i = 0; i < this.dependencyIds.length; i++) {
        var id = this.dependencyIds[i];
        var dependModule = this.nameSpace.searchModuleById(id);
        dependModule.setDependencies();
        this.dependencies[id] = dependModule;
      }
    }
  }

  //模块不可用
  Module.prototype.disable = function() {
    this._enable = false;
  }

  //模块可用
  Module.prototype.enable = function() {
    this._enable = true;
  }

  //模块是否可用
  Module.prototype.isEnable = function() {
    return this._enable;
  }

  /*********命名空间部分***********************/
  function NameSpace(name) {
    //命名空间的名字
    this.name = name;

    this._data = {
      _env: "" //环境变量               
    };

    this._meta = {
      name: "", //名称
      version: "", //版本号
      description: "", //描述
      author: "", //作者
      participator: "" //参与者
    };

    //子命名空间标识集合
    this.childNames = [];
    //子命名空间引用
    this.children = {};

    //父命名空间
    this.parent = null;

    //命名空间下的模块标识集合
    this.moduleIds = [];
    //命名空间下的模块对象
    this.modules = {};

    //任务相关
    this.taskIds = [];
    this.tasks = {};

    //服务相关
    this.serviceIds = [];
    this.services = {};

    //工作流相关
    this.workflowIds = [];
    this.workflows = {};

    //配置路径
    this.configData = {
      base: "/",
      nameSpaces: {},
      fullNameSpaces: {},
      modules: {},
      fullModules: {}
    }

    //是否处于完备状态,0不是，1是 
    this.status = 0;
  }

  //util扩充给NameSpace
  NameSpace.prototype.util = util;

  //命名空间生成新的命名空间,双向链
  NameSpace.prototype.namespace = function(name, callback) {
    if (!global[name]) {
      global[name] = new NameSpace(name);
      global[name].parent = this;
      this.childNames.push(name);
      this.children[name] = global[name];
    }
    if (callback) callback(global[name]);
  };

  //设置公有资源配置
  NameSpace.prototype.data = function(keyAndEnv, data) {
    var argLen = arguments.length;
    var returnData = null;
    var key = keyAndEnv,
      env = "";
    if (keyAndEnv.indexOf(".") != -1) {
      key = keyAndEnv.split(".")[0];
      env = keyAndEnv.split(".")[1];
    }
    //获取数据
    if (argLen == 1) {
      if (this._data._env && !env) {
        env = this._data._env;
      }
      if (env) {
        if (util.isObject(this._data[key][env])) {
          returnData = {};
          util.extend(returnData, this._data[key]._global);
          util.extend(returnData, this._data[key][env]);
        }
        returnData = this._data[key][env];
      } else {
        returnData = this._data[key]._global;
      }

    }
    //3.设置特定环境变量下的公有配置
    if (argLen == 2) {
      if (!this._data[key]) {
        this._data[key] = {
          _global: {}
        };
        if (!env) {
          this._data[key]._global = data;
        }
      }
      if (util.isObject(data)) {

        if (!util.isObject(this._data[key]._global)) this._data[key]._global = {};
        if (!util.isObject(this._data[key][env])) this._data[key][env] = {};
        if (env) {
          util.extend(this._data[key][env], data);
        } else {
          util.extend(this._data[key]._global, data);
        }
      } else {
        if (env) {
          this._data[key][env] = data;
        } else {
          this._data[key]._global = data;
        }
      }
      returnData = this;
    }

    return returnData;
  }

  //设置环境变量
  NameSpace.prototype.env = function(envAndKey) {
    var env = envAndKey,
      key = "";
    if (envAndKey.indexOf(".") != -1) {
      key = envAndKey.split(".")[0];
      env = envAndKey.split(".")[1];
    }
    this._data._env = env;
    if (key) {
      this._data[key]._env = env
    }
    return this;
  }

  //设置获取命名空间的元数据
  NameSpace.prototype.meta = function(obj) {
    if (!obj) return this._meta;
    util.extend(this._meta, obj);
  }

  //根据模块id查询模块
  NameSpace.prototype.searchModuleById = function(moduleId) {
    var module = this.modules[moduleId];
    if (moduleId.indexOf(".") != -1) {
      var nameSpaceName = moduleId.split(".")[0];
      var moduleId = moduleId.split(".")[1];
      var nameSpace = global[nameSpaceName];
      if (!nameSpace) {
        throw Error("模块：" + moduleId + ",所在的命名空间：" + nameSpaceName + "不存在");
      } else {
        module = nameSpace.searchModuleById(moduleId);
      }
    } else {
      if (!module) {
        var url = this.configData.modules[moduleId] ? (this.configData.base + this.configData.modules[moduleId]) : this.configData.fullModules[moduleId];
        if (url) {
          module = { //虚拟模块
            url: url,
            id: moduleId,
            nameSpace: this,
            status: STATUS.VIRTUAL
          };
        } else {
          if (!this.parent) {
            throw Error("模块：" + moduleId + ",在命名空间树中未查询到");
          } else {
            module = this.parent.searchModuleById(moduleId);
          }
        }
      }
    }
    return module;
  }

  //根据命名空间名称获取url
  NameSpace.prototype.getUrlByNameSpaceName = function(nameSpaceName) {
    var url = this.configData.nameSpaces[nameSpaceName] ? (this.configData.base + this.configData.nameSpaces[nameSpaceName]) : this.configData.fullNameSpaces[nameSpaceName];
    if (!url) {
      if (this.parent) {
        url = this.parent.getUrlByNameSpaceName(nameSpaceName);
      }
    }
    return url;
  }

  //链接资源的状态
  var URL_STATUS = {
    ERROR: -1,
    INIT: 0,
    FETCHING: 1,
    FETCHED: 2
  };
  var urlStatusMap = {};

  NameSpace.prototype.loadNameSpaces = function(nameSpaceNames, callback) {
    var nameSpace = this;
    for (var i = 0; i < nameSpaceNames.length; i++) {
      var nameSpaceName = nameSpaceNames[i];
      var url = this.getUrlByNameSpaceName(nameSpaceName);
      if (url && (!urlStatusMap[url] || urlStatusMap[url] < URL_STATUS.FETCHING)) {
        (function(nameSpaceName) {
          urlStatusMap[url] = URL_STATUS.FETCHING;
          util.request(url, function(error) {
            if (error === true) {
              urlStatusMap[url] = URL_STATUS.ERROR;
              throw Error("命名空间" + module.nameSpace.name + "中加载命名空间:" + nameSpaceName + ",发生错误：" + error);
            }
            urlStatusMap[url] = URL_STATUS.FETCHED;
            global[nameSpaceName].status = 1;
            util.emit("nameSpaceReady");
          });
        })(nameSpaceName);
      } else {
        if (!global[nameSpaceName]) {
          throw Error("命名空间" + module.nameSpace.name + "中未找到要加载的命名空间:" + nameSpaceName + "的配置且这个命名空间不存在");
        } else {
          global[nameSpaceName].status = 1;
        }
      }
    }

    function nameSpaceReadyCallback() {
      var ready = true;
      for (var i = 0; i < nameSpaceNames.length; i++) {
        var nameSpaceName = nameSpaceNames[i];
        if (!global[nameSpaceName] || (global[nameSpaceName].status == 0)) {
          ready = false;
          break;
        }
      }
      if (ready) {
        util.off("nameSpaceReady", nameSpaceReadyCallback);
        callback.call(nameSpace);
      }
    }
    util.on("nameSpaceReady", nameSpaceReadyCallback);
    nameSpaceReadyCallback();
  }

  NameSpace.prototype.loadModules = function(moduleIds, callback) {
    var nameSpace = this;
    for (var i = 0; i < moduleIds.length; i++) {
      var moduleId = moduleIds[i];
      var module = this.searchModuleById(moduleId);
      //去加载模块文件
      var url = module.url;
      if (url && (!urlStatusMap[url] || urlStatusMap[url] < URL_STATUS.FETCHING)) {
        (function(module) {
          var url = module.url;
          urlStatusMap[url] = URL_STATUS.FETCHING;
          util.request(url, function(error) {
            if (error === true) {
              urlStatusMap[url] = URL_STATUS.ERROR;
              throw Error("命名空间" + module.nameSpace.name + "中加载模块:" + module.id + ",发生错误：" + error);
            }
            urlStatusMap[url] = URL_STATUS.FETCHED;
            if (url.indexOf(".css") != -1) {
              module.nameSpace.define(moduleId, [], function() {});
            } else {
              util.emit("loadDependencies");
            }
          });
        })(module);
      }
    }

    function moduleReadyCallback() {
      if (moduleReadyCallback.locked) {
        return;
      }
      var ready = true;
      for (var i = 0; i < moduleIds.length; i++) {
        var moduleId = moduleIds[i];
        var module = nameSpace.searchModuleById(moduleId);
        if (module.status <= STATUS.CREATED) {
          ready = false;
          break;
        }
      }
      if (ready) {
        moduleReadyCallback.locked = true;
        util.off("moduleReady", moduleReadyCallback);
        callback.call(nameSpace); //模块加载完成里面可能导致模块m加载完成出发循环依赖，所以这样要对函数加锁

      }
    }
    moduleReadyCallback.locked = false;
    util.on("moduleReady", moduleReadyCallback);
    moduleReadyCallback();
  }

  //配置模块地址
  NameSpace.prototype.config = function(configData) {
    util.extend(this.configData, configData);
  }

  //创建一个模块
  NameSpace.prototype.define = function(id, dependencyIds, factory) {
    if (arguments.length == 2) {
      factory = dependencyIds;
      dependencyIds = [];
    }
    var nameSpace = this;
    var module = new Module(id, dependencyIds, factory);
    module.nameSpace = this;
    this.moduleIds.push(id);
    this.modules[id] = module;
    if (dependencyIds.length == 0) { //没有依赖的情况下module的状态直接到Ready
      module.status = STATUS.READY;
      util.emit("moduleReady");
    } else {
      util.one("loadDependencies", function() { //存在依赖的需要等待有人发出加载依赖是时候在去加载
        nameSpace.loadModules(dependencyIds, function() {
          module.status = STATUS.READY;
          util.emit("moduleReady");
        })
      });
    }
    return this;
  }

  //使用模块
  NameSpace.prototype.use = function(nameSpaceNames, dependencyIds, factory) {
    if (util.isString(nameSpaceNames)) {
      nameSpaceNames = [nameSpaceNames]
    };
    if (arguments.length == 3) {
      if (util.isString(dependencyIds)) {
        dependencyIds = [dependencyIds]
      };
    }
    if (arguments.length == 2) {
      factory = dependencyIds;
      dependencyIds = nameSpaceNames;
      nameSpaceNames = [];
    }


    //同步模块引入
    if (arguments.length == 1) {
      //触发加载依赖，让现在存在的模块去加载依赖
      util.emit("loadDependencies");

      dependencyIds = nameSpaceNames;
      nameSpaceNames = [];
      factory = function() {};
      for (var i = 0; i < dependencyIds.length; i++) {
        var moduleId = dependencyIds[i];
        if (moduleId.indexOf(".") != -1) {
          throw Error("同步模式不得夸命名空间调用")
        };
        var module = this.searchModuleById(moduleId);
        module.setDependencies();
        this[moduleId] = module.exec();
      }
      return;
    }

    //本命名空间必须加载
    //从dependencyIds中获取nameSpaceNames
    for (var i = 0; i < dependencyIds.length; i++) {
      var dependencyId = dependencyIds[i];
      if (dependencyId.indexOf(".") != -1) {
        var nameSpaceName = dependencyId.split(".")[0];
        if (!util.isInArray(nameSpaceNames, nameSpaceName)) nameSpaceNames.push(nameSpaceName);
      }
    }
    if(!util.isInArray(nameSpaceNames, this.name)) nameSpaceNames.push(this.name);

    if (nameSpaceNames && nameSpaceNames.length > 0) {
      //加载命名空间
      this.loadNameSpaces(nameSpaceNames, function() {
        util.emit("loadDependencies");
        this.loadModules(dependencyIds, loadModulesCallBack);
      });
    } else {
      //加载模块
      util.emit("loadDependencies");
      this.loadModules(dependencyIds, loadModulesCallBack);
    }

    function loadModulesCallBack() {
      //3.给module添加依赖对象,并执行模块
      var nameSpace = this;
      var exportsList = [];
      for (var i = 0; i < dependencyIds.length; i++) {
        var module = nameSpace.searchModuleById(dependencyIds[i]);
        module.setDependencies();
        var exports = module.exec();
        exportsList.push(exports);
      }
      //4.调用
      factory.apply(nameSpace, exportsList);
    }
  };


  /*************获取命名空间，模块相关信息部分******************/
  //命名空间依赖关系树  
  NameSpace.prototype.showNameSpaceTree = function() {
    var ns = this;
    var childNames = ns.childNames.join(",");
    var childrenInfo = "";
    if (childNames) childrenInfo = "(" + childNames + ")";
    console.log(ns.name + childrenInfo);
    console.log("----");
    for (var i = 0; i < ns.childNames.length; i++) {
      ns.children[childNames].showNameSpaceTree();
    }
  }

  //获取命名空间下的模块id 
  NameSpace.prototype.showModules = function() {
    console.log("该命名空间模块总数是:" + this.moduleIds.length);
    console.log("该命名空间下的模块有:" + this.moduleIds.join(","));
  }

  //获取命名空间下的模块关系 
  NameSpace.prototype.showModulesTree = function() {
    for (var i = 0; i < this.moduleIds.length; i++) {
      this.showModuleTree(this.moduleIds[i]);
      console.log("---------------");
    }
  }

  //获取某个模块的依赖关系 
  NameSpace.prototype.showModuleTree = function(id) {
    var module = this.modules[id];
    var dependencyIds = module.dependencyIds.join(",");
    var dependenciesInfo = "";
    if (dependencyIds) dependenciesInfo = "(" + dependencyIds + ")";
    console.log(module.id + dependenciesInfo);
    console.log("----");
    for (var i = 0; i < module.dependencyIds.length; i++) {
      this.showModuleTree(module.dependencyIds[i]);
    }
  }

  /***********工作流模块******************/
  //任务管理
  NameSpace.prototype.task = function(id, taskImpl) {
    if (util.isObject(id)) {
      for (var p in id) {
        this.taskIds.push(p);
        this.tasks[p] = id[p];
      }
    } else {
      this.taskIds.push(id);
      this.tasks[id] = taskImpl;
    }
    return this;
  }

  //服务管理
  NameSpace.prototype.service = function(id, serviceImpl) {
    if (util.isObject(id)) {
      for (var p in id) {
        this.serviceIds.push(p);
        this.services[p] = id[p];
      }
    } else {
      this.serviceIds.push(id);
      this.services[id] = serviceImpl;
    }
    return this;
  }

  //工作流
  function Workflow(context, id, sequenceTask) {
    //命名空间上下文
    this.context = context;
    //工作流id
    this.id = id;
    //工作流执行任务序列
    this.sequenceTask = sequenceTask;
  }

  //工作流运行
  Workflow.prototype.run = function() {
    var sequenceTask = this.sequenceTask;
    var nameSpace = this.context;
    for (var i = 0; i < sequenceTask.length; i++) {
      var taskId = sequenceTask[i];
      nameSpace.tasks[taskId].call(nameSpace, nameSpace.services, nameSpace.tasks);
    }
  }

  //通过Namespace运行工作流
  NameSpace.prototype.run = function(workflowId) {
    this.workflows[workflowId].run();
  }

  //工作流创建
  NameSpace.prototype.workflow = function(id, sequenceTask) {
    if (arguments.length == 1 && util.isArray(id)) {
      sequenceTask = id;
      id = "_anonymous_workflow_" + util.uid();
    }
    if (arguments.length == 2 && util.isString(sequenceTask)) {
      sequenceTask = [sequenceTask];
    }
    this.workflowIds.push(id);
    this.workflows[id] = new Workflow(this, id, sequenceTask);
    return this.workflows[id];
  }


 /****************切面部分*****************/
  //切面类
  function Aspect(id, advice) {
    if(arguments.length==1 && util.isObject(id)){
      advice = id;
      id = "_anonymous_aspect_"+util.uid();
    }
    if(arguments.length==0){
      id = "_anonymous_aspect_"+util.uid();
    }
    var aspect = {};
    aspect.id = id;
    aspect.advice = advice ? advice : {};
    aspect.pointCut = Aspect.pointCut;
    aspect._wrapperFunc = Aspect._wrapperFunc;
    return aspect;
  }

  //获取函数名
  Aspect.getMethodName = function(func) {
    return func.name || func.toString().match(/function\s*([^(]*)\(/)[1];
  }

  //获取对象类型名
  Aspect.getClassName = function(obj) {
    return Aspect.getMethodName(obj.constructor);
  }

  //添加切面
  Aspect.pointCut = function(context, targetNames) {
    if (arguments.length == 1) {
      if (!util.isObject(context)) {
        targetNames = context;
        context = global;
      } else {
        targetNames = [];
        for (p in context) {
          if (util.isFunction(context[p])) {
            targetNames.push(p);
          }
        }
      }
    }
    if (util.isString(targetNames)) {
      targetNames = [targetNames];
    }
    for (var i = 0; i < targetNames.length; i++) {
      var targetName = targetNames[i];
      context[targetName] = this._wrapperFunc(context, targetName);
    }
  };

  Aspect._exclused = ["before", "after", "around", "throwing"];
  Aspect._wrapperFunc = function(context, targetName) {
    var originTarget = context[targetName];
    //扩充
    var advice = util.extend({}, this.advice);
    if (!context._eventAdvices) context._eventAdvices = {};
    if (!context._eventAdvices[targetName]) {
      context._eventAdvices[targetName] = util.extend({}, util, true,["events","on","off","one","emit"]);
    }
    var eventAdvice = context._eventAdvices[targetName];
    return function() {
      //添加事件通知
      for (p in advice) {
        if (util.isFunction(advice[p]) && !util.isInArray(Aspect._exclused, p)) {
          eventAdvice.on(p, function(eventData){
            advice.joinPoint.eventDatas[p] = eventData;
            advice[p].call(advice,advice.joinPoint);
          });
        }
      }

      try {
        var joinPoint = {
          context: context,
          contextName: Aspect.getClassName(context),
          target: originTarget,
          targetName: targetName,
          arguments: arguments,
          result: "",
          error: "",
          stop: false,
          eventDatas:{}
        };
        advice.joinPoint = joinPoint;
        if (!eventAdvice.joinPoint) eventAdvice.joinPoint = joinPoint;
        if (advice.before) {
          advice.before(joinPoint);
          if (joinPoint.stop) return;
        }
        if (advice.around) {
          advice.around(joinPoint);
          if (joinPoint.stop) return;
        } else {
          joinPoint.result = originTarget.apply(context, arguments);
        }
        if (advice.after) {
          advice.after(joinPoint);
          if (joinPoint.stop) return;
        }
      } catch (error) {
        if (advice.throwing) {
          advice.throwing(joinPoint);
        }
      }
      return joinPoint.result;
    }
  }

  NameSpace.prototype.Aspect = Aspect;

  global.eco = new NameSpace('eco');

})(this);