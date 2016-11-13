/*!
 * Author: Chen Zijun <chenzijun@xiaomi.com>
 * Date: 2014-07-23
 * Description:
 *      用于显示xbox的服务树，只需引入此插件即可使用。
 * TODO:
 *      写成js插件的格式
 *
 * 依赖插件：
 *      bootstrap-affix.js
 *      jquery.cookie.js
 !**/

// on off
(function($) {
  var o = $({});
  $.on = function() {
    o.on.apply(o, arguments);
  };

  $.off = function() {
    o.off.apply(o, arguments);
  };

  $.trigger = function() {
    o.trigger.apply(o, arguments);
  };

}(jQuery));

// the component
function XboxTree(el, name) {
    this.el = null;
    this.name = null;
    this.dbclickCallback = null;
    this.showCallback = null;
    this.hideCallback = null;
}

function change_norns_to_xbox_tree(b, index){
    if(b){
        for(var i=0; i < b.length; i++ ){
            b[i].attr = {
            id: 'node_'+ index,
            level: b[i].type,
            path: b[i].path
            }
            delete b[i].open;
            delete b[i].type;
            delete b[i].path;
            index += 1
            change_norns_to_xbox_tree(b[i].children, index)
        }
    }
    return
}

/*
 * xbox_tree的渲染
 *
 * 参数:
 *      username: 用户名
 *      treeSchema: 树结构,可以为空
 *
 */
XboxTree.prototype.init = function(el, options) {
    var self = this;
    this.el = $(el);
    this.name = name;

    var settings = $.extend({
        username: "",
        treeSchema: "",
        xboxDomain: "http://norns.pt.xiaomi.com",
    }, options);

    var iconHtml = "<button class='btn btn-default btn-sm btn-flat tree-refresh'>刷新服务树</button>";
    iconHtml += "<button class='btn btn-default btn-sm btn-flat pull-right tree-hide'>隐藏服务树</button>";

    var xboxTreeIcon = $("<div class='pad' ></div>").html(iconHtml);
    xboxTreeIcon.attr('id', 'xbox-tree-icon');
    xboxTreeIcon.addClass('xbox-tree-icon');

    var xboxTree = $("<div ></div>").addClass("xbox-tree");
    var expendButton = $("<button class='btn btn-default btn-sm btn-flat pull-right tree-expend'>显示服务树</button>");
    expendButton.css({
        position: "fixed",
        top: "40%",
        left : "-27px",
        "z-index": "999999",
        "vertical-align": "middle",
        "-moz-transform" : "rotate(90deg)",
        "-webkit-transform" : "rotate(90deg)",
        "-o-transform" : "rotate(90deg)",
        "-ms-transform" : "rotate(90deg)",
        "transform" : "rotate(90deg)",
        "display": 'none',
    });

    // 追加至body
    self.el.append(xboxTreeIcon);
    self.el.append(xboxTree);
    $("body").append(expendButton);

    // 追加事件
    $(".tree-refresh").click(function(){
        self.render(settings, refresh=1); // 渲染xbox树
        xboxTree.show();
    });
    self.el.find(".tree-hide").click(function(){
        expendButton.show();
        self.el.hide();
        if (self.hideCallback != null) {
            self.hideCallback();
        }
    });
    expendButton.click(function(){
        expendButton.hide();
        self.el.show();
        if (self.showCallback != null) {
            self.showCallback();
        }
    });

    self.render(settings); // 渲染xbox树
}

XboxTree.prototype.on = function(ev, handler) {
    $.on(ev, handler);
}

XboxTree.prototype.off = function(ev) {
    $.off(ev);
}

XboxTree.prototype.trigger = function(ev, data) {
    $.trigger(ev, data);
}

XboxTree.prototype.fill = function(tree_data, settings) {
    var self = this;
    var tree_json = tree_data;
    self.el.find(".xbox-tree").jstree({
            "plugins" : ["themes","json_data","ui","crrm", "contextmenu", "types", "search"],
            "themes":{
                "theme" : "proton"
            },

            "core" : {
                "animation" : 100,
                "initially_open" : [ "phtml_1" ]
            },
            "types" : {
                "types" : {
                    "default" : {
                        "icon" : {"image": "/static/xbox_libs/xbox-tree/jstree/themes/proton/d.png"}
                    }
                }
            },
            "json_data" : {"data": tree_json},
            "search":{ search_method: "jstree_contains_plusPath" },
        })
        .bind("select_node.jstree", function (event, data) {
            var node_id = data.rslt.obj.attr("id");
            self.el.find(".xbox-tree").jstree("toggle_node","#"+node_id);
        })
        .bind("loaded.jstree", function (event, data) {
            var ipath = self.getNodePath();
            if (ipath == null) {
                ipath = 'cop.xiaomi';
            }
            var tagstrings = [ipath];
            self.el.find(".xbox-tree").jstree("search", tagstrings);
        });

    // reload html
    self.el.find('.xbox-tree').delegate("a","click", function(e) {
        self.dbclickCallback(self.getNodePath());
    });

    var tagstring = self.getNodePath()
    self.el.jstree("search", tagstring);
}

XboxTree.prototype.getNodePath = function() {
    var self = this;
    var ipath = self.el.find(".xbox-tree").jstree("get_selected").attr("path");
    var cookie_name = "xboxTree"
    if (ipath != null) {
        var date = new Date();
        var minutes = 60 * 24 * 7; // 保存一周
        date.setTime(date.getTime() + (minutes * 60 * 1000));
        $.cookie(cookie_name, ipath, {path: '/', expires:date});
    }
    else{
        var js_tree_get_node = $.cookie(cookie_name);
        if (js_tree_get_node != "") {
            ipath = js_tree_get_node;
        }
    }
    return ipath;
}

XboxTree.prototype.render = function(settings, refresh) {
    var self = this;
    if (settings['username']==null || settings['username']=="") {
        return;
    }

    var itemName = "treeData_" + settings['username'];

    var data = {};
    data['user_tree_schema'] = settings['treeSchema'];
    var url = settings['xboxDomain']+"/api/v1/user/"+settings['username']+"/schema/cop_owt_pdl/tree";
    if (refresh != null) {
        url = settings['xboxDomain']+"/api/v1/user/"+settings['username']+"/schema/cop_owt_pdl/tree";
        localStorage.setItem(itemName, "");
    }
    self.el.find(".xbox-tree").html("刷新中...");
    var treeData = localStorage.getItem(itemName);
    if (treeData) {
        self.fill(JSON.parse(treeData), settings);
    }
    else {
        $.ajax({
            type: "get",
            url : url,
            data: data,
            success: function(treeData, textStatus){
                var index = 1;
                change_norns_to_xbox_tree(treeData.tree, index);
                localStorage.setItem(itemName, JSON.stringify(treeData.tree));
                self.fill(treeData.tree, settings);
            },
        });
    }
}

XboxTree.prototype.dbclick = function(callback) {
    this.dbclickCallback = callback
}

XboxTree.prototype.show = function(callback) {
    this.showCallback = callback
}

XboxTree.prototype.hide = function(callback) {
    this.hideCallback = callback
}
