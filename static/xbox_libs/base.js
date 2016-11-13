//页面的全局变量
var g_checked_host_list = new Array();
var g_all_host_list = new Array();
var g_init_selected_node_id = "";
var g_tree_path = "";
var g_user_tree_schema = '';
var g_default_operate_tree_schema = '';
var g_special_path = ""

params = $.url(true).param();
if (params['user_tree_schema'] != null && params["user_tree_schema"] != "") {
    g_user_tree_schema =  params['user_tree_schema'];

}

function fn_get_node_path(){
    var ipath = $("#ser_tree").jstree("get_selected").attr("path");
    var cookie_name = "js_tree_get_node_"+ g_user_tree_schema;
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

function fn_fill_tree(tree_json){
    $("#ser_tree")
        .jstree({
            "plugins" : ["themes","json_data","ui","crrm", "contextmenu", "types", "search"],

            "themes":{
                "theme": "default",
                "dots": true,
                "icons": true
            },

            "types" : {
                "types" : {
                    "default" : {
                        "icon" : {"image": "/static/images/icon-folder-close-bs.png"}
                    }
                }
            },
            "search":{
                search_method: "jstree_contains_plusPath"
            },
            "json_data" : {"data": tree_json},
            "contextmenu" : { items :{
                    //items名称是为了覆盖jstree自身定义的，意义请参照label
                    "create" : {
                        "separator_before"	: true,
                        "separator_after"	: false,
                        "label"				: "新增节点",
                        "action"			: function (obj) { add_new_node(obj); }
                    },
                    "deleteNode" : {
                        "separator_before"	: false,
                        "separator_after"	: false,
                        "label"				: "删除节点",
                        "action"			: function (obj) { del_node(obj); }
                    },
                    "nodeInfo" : {
                        "separator_before"	: false,
                        "separator_after"	: true,
                        "label"				: "节点信息",
                        "action"			: function (obj) { node_info(obj); }
                    },
                    "hostsManager" : {
                        "separator_before"	: true,
                        "separator_after"	: true,
                        "label"				: "新增/删除机器",
                        "action"			: function (obj) { host_manager(obj); }
                    },
                    "remove" : {
                        "separator_before"	: false,
                        "separator_after"	: false,
                        "label"				: "老门神授权管理",
                        "action"			: function (obj) { godlike_auth(obj); }
                    },
                    "addgodlikenode" : {
                        "separator_before"	: false,
                        "separator_after"	: true,
                        "label"				: "新增老门神节点",
                        "action"			: function (obj) { add_godlike_node(obj); }
                    },
                }
            }
        })
        .bind("select_node.jstree", function (event, data) {
            var ipath = data.rslt.obj.attr("path");
            var node_id = data.rslt.obj.attr("id");
            $("#ser_tree").jstree("toggle_node","#"+node_id);
        })
        .bind("search.jstree", function (e, data) {
            //alert("Found " + data.rslt.nodes.length + " nodes matching '" + data.rslt.str + "'.")
        })
        .bind("loaded.jstree", function (event, data) {
            ipath = $("#ser_tree").jstree("get_selected").attr("path");
            if (ipath == null) {
                $("#ser_tree").jstree("close_all", -1);
                var cookie_name = "js_tree_get_node_"+ g_user_tree_schema;
                var js_tree_get_node = $.cookie(cookie_name);
                tagstrings = [js_tree_get_node]
                $("#ser_tree").jstree("search", tagstrings);
            }
        });
}

function fn_get_tree_json(fn_callback) {
    var tree_json = [];
    var tree_list;
    $.ajax({
        type: "get",
        url : "/tree/get_schema_tree",
        data: "_r=" + Math.random()+"&user_tree_schema="+g_user_tree_schema,
        dataType: "json",
        success: function(data, textStatus){
            tree_list = data;
            if(tree_list["succ"] != 0){
                alert("获取服务树信息失败。错误信息：" + tree_list['err_note']);
                return [];
            }
            tree_json = tree_list["jtree"]
            fn_callback(tree_json);
            return tree_json;
        },
        error: function(XMLHttpRequest, textStatus, errorThrown){
            return [];
        }
    });
}

var is_ser_tree_wraped = 0;
function ser_tree_wrap(close)
{
    if(close === true){
        $("#div_ser_tree").removeClass("span3").hide();
        $("#div_ser_list").addClass("span12").removeClass("span9");
        $("#img_tree_page_ctrl").removeClass("icon-arrow-left").addClass("icon-arrow-right");
        is_ser_tree_wraped = 1;
        $("#img_tree_page_ctrl").tooltip("toggle");
    }else{
        if ( 0 == is_ser_tree_wraped ){
            $("#div_ser_tree").removeClass("span3").hide();
            $("#div_ser_list").addClass("span12").removeClass("span9");
            $("#img_tree_page_ctrl").removeClass("icon-arrow-left").addClass("icon-arrow-right");
            is_ser_tree_wraped = 1;
            $("#img_tree_page_ctrl").tooltip("toggle");
        } else {
            $("#div_ser_tree").show().addClass("span3");
            $("#div_ser_list").addClass("span9").removeClass("span12");
            $("#img_tree_page_ctrl").removeClass("icon-arrow-right").addClass("icon-arrow-left");
            is_ser_tree_wraped = 0;
            $("#img_tree_page_ctrl").tooltip("toggle");
        }
    }
}

function common_check(){
// 公共检查，检查通过返回true，否则返回false
    return true;
}

$(function(){

    $('#img_tree_page_ctrl').tooltip();

    $("#input_search_host").bind('keypress', function(e) {
        if(e.keyCode==13){
            $("#btn_search_host").trigger( "click" );
        }
    });

    // 按机器名搜索
    $("#btn_search_host").click(function(){
        var input_search_host = $("#input_search_host").val();
        if (!input_search_host){
            return;
        }
        if(input_search_host.indexOf(".")>0){
            $.ajax({
                type: "get",
                async: true,
                url : "/tree/search_by_host?tree_schema="+g_user_tree_schema,
                data: "host=" + input_search_host + "&_r=" + Math.random(),
                dataType: "json",
                success: function(data, textStatus){
                    tagstrings = data['tagstrings']
                    if (input_search_host.match(new RegExp("^[0-9]{1,3}\..*[0-9]$"))) {
                        msg = "机器名： "+data['hostname'] + "\n\n"
                        msg += tagstrings.join("\n")
                        alert(msg)
                    }
                    $("#ser_tree").jstree("search", tagstrings);
                },
                error: function(XMLHttpRequest, textStatus, errorThrown){
                    alert("搜索机器失败：请求失败。");
                }
            });
        }else{
            $("#ser_tree").jstree("search", input_search_host);
        }
    });

    get_schema_list();
    fn_get_tree_json(fn_fill_tree);
    $("#tree_node_path").editable();
});

function get_schema_list(){
    var schema_list;
    $.ajax({
        type: "get",
        async: true,
        url : "/tree/get_schema_list",
        data: "_r=" + Math.random(),
        dataType: "json",
        success: function(data, textStatus){
            schema_list = data;
            g_default_operate_tree_schema = schema_list["default_operate_tree_schema"];
            return schema_list["schema_list"];
        },
        error: function(XMLHttpRequest, textStatus, errorThrown){
            alert("获取schema配置失败。");
            return "fail";
        }
    });
}

function del_node(obj) {
    if (!common_check()) {
        return false
    }
    path = obj.attr("path");
    p_depth = path.split('_').length;
    //var deny_flag = false;
    //$.each(g_all_tree_path, function(idx, p){
    //    if ( 0 == p.indexOf(path) ){
    //        if ( p_depth < p.split('_').length )
    //            deny_flag = true;
    //            return false;
    //        }
    //});
    //if ( deny_flag ) {
    //    alert("该节点还有下层节点，请先删除下层节点");
    //    return;
    //}
    $.ajax({
        type: "get",
        async: true,
        url : "/tree/del_node",
        data: "tag=" + path + "&_r=" + Math.random(),
        dataType: "json",
        success: function(data, textStatus){
            ret_data = data;
            if ( 0 != ret_data['succ'] ){
                alert("删除节点失败，错误提示：" + ret_data['err_note']);
            }else{
                self.location = "/tree/main/host";
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown){
            alert("删除节点失败，错误提示：请求失败。");
        }
    });

}

function host_manager(obj){
    if (!common_check()) {
        return false
    }
    path = obj.attr("path");
    url = "/tree/hosts/union_tag/index?path="+path
    window.open(url, '_blank');
}

function node_info(obj){
    if (!common_check()) {
        return false
    }
    path = obj.attr("path");
    url = "/tree/tagstring/index"
    window.open(url, '_blank');
}

function add_new_node(obj){
    if (!common_check()) {
        return false
    }
    path = obj.attr("path");
    url = "/tree/union_tags/add/simple/index?path="+path
    window.open(url, '_blank');
}

function del_node(obj){
    if (!common_check()) {
        return false
    }
    path = obj.attr("path");
    url = "/tree/union_tags/delete/index?path="+path
    window.open(url, '_blank');
}
