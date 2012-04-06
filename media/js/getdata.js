$(document).ready(function(){ 
    var current_url = window.location.toString();
    //window.location.pathname
    story = window.location.pathname.substr(7);    
    geturl = "http://"+window.location.host+"/getdata/"+story;
    $.get(geturl, function(data) {
      console.log(data);
    });
});