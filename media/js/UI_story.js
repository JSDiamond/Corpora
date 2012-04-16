$(document).ready(function(){ 
    $(document).scroll(function(){ 
        scrollTop = $(document).scrollTop();
        if(scrollTop > 40){
            //$('#toolbar').css({backgroundColor: 'rgba(0,0,0,0.7)'});
            $('#toolbar').stop().animate({ 'opacity': '0.88', 'padding-top': '0px', 'padding-bottom': '0px'}, 100, 'linear', function() { });
            //'background': '#222 url(/media/images/wgray_fab.png) repeat 0 0',
        } else {
            //$('#toolbar').css({backgroundColor: '#222'});
            $('#toolbar').stop().animate({ 'opacity': '1', 'padding-top': '16px', 'padding-bottom': '16px'}, 220, 'easeOutCubic', function() { });
            
        }
    });
});