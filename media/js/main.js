$(document).ready(function(){ 
    console.log(window.location.toString());
    var hthree = $('.story_preview').find('h3');
    var loc = window.location.host;    
    //geturl = "http://"+window.location.host+"/getdata/"+story;
    console.log(loc);
    hthree.each(function(index){
        groupNum = $(this).attr('group');
        $(this).find('a').attr('href', 'http://'+loc+'/story/'+groupNum);
    });
    
    var current_opac = 1;
    $(document).scroll(function(){ 
        scrollTop = $(document).scrollTop();
        if(scrollTop > 40){
            $('#toolbar').stop().animate({ 'opacity': '0.2', 'padding-top': '0px', 'padding-bottom': '0px'}, 80, 'linear', function() { current_opac = $('#toolbar').css('opacity'); });
            $('.button').stop().animate({ 'height': '32px' }, 80, 'linear', function() { });
            $('#whitelogo').stop().animate({ 'height': '10px', 'padding-bottom': '14px' }, 80, 'linear', function() { });
            //$('#wordsearch').stop().animate({ 'margin-top': '-7px', 'padding-top': '4px', 'height': '27px' }, 80, 'linear', function() { });
            //$('.button').stop().animate({ 'background': 'rgba(100,100,100,0.0) url() no-repeat 0 0' }, 100, 'linear', function() { });
        } else {
            $('#toolbar').stop().animate({ 'opacity': '1', 'padding-top': '16px', 'padding-bottom': '16px'}, 180, 'easeOutCubic', function() { current_opac = $('#toolbar').css('opacity'); });
            $('.button').stop().animate({ 'height': '48px' }, 136, 'linear', function() { });
            $('#whitelogo').stop().animate({ 'height': '20px', 'padding-bottom': '21px' }, 136, 'linear', function() { });
            //$('#wordsearch').stop().animate({ 'margin-top': '-16px', 'padding-top': '14px', 'height': '42px' }, 180, 'linear', function() { });
            //$('.button').stop().animate({ 'background': '#444 url() no-repeat 0 0' }, 100, 'linear', function() { });            
        }
        
    });
    $('#toolbar').hover( function () {
                    $(this).css({ 'opacity': '1'});
                    //$(this).stop().animate({ 'opacity': '1'}), 10, 'linear', function() {}
                  }, 
                  function () {
                    $(this).css({ 'opacity': current_opac});
                    //$(this).stop().animate({ 'opacity': current_opac}), 10, 'linear', function() {}
                  }
    );
    $('#toolbar').bind( 'mouseover',  function () {
            $(this).css({ 'opacity': '1'});
    });
    
    var loc = window.location.host;
    $('#gatherbutton').click(function(){
        window.location.href = 'http://'+loc+'/gather/';
    });
    $('#feedbutton').click(function(){
        window.location.href = 'http://'+loc+'/news/0';
    });
    $('#infobutton').click(function(){
        window.location.href = 'http://'+loc+'/info';
    });
    
});






