$(document).ready(function(){ 
    console.log(window.location.toString());
    var current_url = window.location.toString();
    //window.location.pathname
    story = window.location.pathname.substr(7);    
    geturl = "http://"+window.location.host+"/getdata/"+story;
    console.log(geturl);
    $.get(geturl, function(data) {
      console.log(data[12]);
    });
});