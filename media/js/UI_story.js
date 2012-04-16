$(document).ready(function(){ 
    var current_opac = 1;
    $(document).scroll(function(){ 
        scrollTop = $(document).scrollTop();
        if(scrollTop > 40){
            $('#toolbar').stop().animate({ 'opacity': '0.2', 'padding-top': '0px', 'padding-bottom': '0px'}, 80, 'linear', function() { current_opac = $('#toolbar').css('opacity'); });
            //$('.button').stop().animate({ 'background': 'rgba(100,100,100,0.0) url() no-repeat 0 0' }, 100, 'linear', function() { });
        } else {
            $('#toolbar').stop().animate({ 'opacity': '1', 'padding-top': '16px', 'padding-bottom': '16px'}, 180, 'easeOutCubic', function() { current_opac = $('#toolbar').css('opacity'); });
            //$('.button').stop().animate({ 'background': '#444 url() no-repeat 0 0' }, 100, 'linear', function() { });            
        }
        
    });
    $('#toolbar').hover( function () {
                    $(this).stop().animate({ 'opacity': '1'}), 10, 'linear', function() {}
                  }, 
                  function () {
                    $(this).stop().animate({ 'opacity': current_opac}), 10, 'linear', function() {}
                  }
    );
    if(current_opac < 1){
        $('.button').hover( function () {
                        $(this).stop().animate({ 'font-size': '20px'}), 10, 'linear', function() {}
                      }, 
                      function () {
                        //$('#toolbar').stop().animate({ 'opacity': current_opac}), 10, 'linear', function() {}
                      }
        );
    }
});