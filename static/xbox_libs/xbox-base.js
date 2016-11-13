function xboxBaseScrollTop(obj) {
    var windowHeight = $(window).height();
    var scrollTop = $(window).scrollTop();
    var mid = scrollTop + Math.floor(windowHeight / 2);

    $('html, body').animate({
        scrollTop: obj.offset().top - mid,
    },
    500);
}



// obj:jquery对象 $("#xxx")
// 增加菊花
function xboxBaseWaitMe(obj) {
    obj.waitMe({
        effect : 'win8_linear',
        text: 'Please wait...',
        bg: 'rgba(255,255,255,0.7)',
        color:'#000',
        sizeW:'',
        sizeH:''
    });
}

function xboxBaseWaitMeHide(obj) {
    obj.waitMe('hide');
}

// 用于debug: 对象所关联的实践
function xboxBaselistHandlers(obj, events, outputFunction) {
    return obj.each(function(i){
        var elem = this,
            dEvents = $(this).data('events');
        if (!dEvents) {return;}
        $.each(dEvents, function(name, handler){
            if((new RegExp('^(' + (events === '*' ? '.+' : events.replace(',','|').replace(/^on/i,'')) + ')$' ,'i')).test(name)) {
               $.each(handler, function(i,handler){
                   outputFunction(elem, '\n' + i + ': [' + name + '] : ' + handler );
               });
           }
        });
    });
};
