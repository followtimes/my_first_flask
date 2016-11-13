;(function ($){
    $.fn.xboxAlert = function (options){
        var settings = $.extend( {
            showCloseButton: true,
        }, options);

        Messenger().post(settings);
    };
})(jQuery);

// 后续作为xbox的插件

Messenger.options = {
    theme: 'future',
    //theme: 'air',
    extraClasses: 'messenger-fixed messenger-on-bottom messenger-on-right',
}

function xboxAlert(msg, type) {
    if (type == null || type == '') {
        type = "success";
    }
    msgOptions = {
        message: msg,
        type: type,
        showCloseButton: true,
    };
    Messenger().post(msgOptions);
}
