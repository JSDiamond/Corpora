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
});