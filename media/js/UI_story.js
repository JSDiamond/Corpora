$(document).ready(function(){ 
    
    $('#searchtxt').bind( 'click',  function () {
            event.stopPropagation();
            $(this).stop().animate({ 'width': '120px' }, 260, 'swing', function() { });
    });
    $('#searchtxt').bind( 'focus',  function () {
            event.stopPropagation();
            if( $('#searchtxt').attr('value') == "Search"){
                 $('#searchtxt').attr('value', '');
            }
            $(this).stop().animate({ 'width': '120px' }, 260, 'swing', function() { });
    });
    $('#searchtxt').bind( 'blur',  function () {
            $(this).stop().animate({ 'width': '36px' }, 260, 'swing', function() { });
            if( $('#searchtxt').attr('value') == ""){
                 $('#searchtxt').attr('value', 'Search');
            }

    });
    
    /*
$('#searchbutton').bind( 'click',  function () {
            event.stopPropagation();
            searchFucntion();
    });
*/
    
    $('#searchbutton').bind( 'keypress',  function (e) {
        if ((e.keyCode || e.which) == 13) { //keycode 'Enter'
            searchFucntion();
            $('#searchtxt').stop().animate({ 'width': '36px' }, 260, 'swing', function() { });
        }
    });
    
    var searchterm = "xxyyzz123";
    var searchFucntion = function() {
            d3.selectAll('.'+searchterm).transition().style('stroke', 'none').duration(70);
            d3.selectAll('#rp_'+searchterm).transition().style('stroke', 'none').duration(70);
            searchterm = CleanNJoinText( $('#searchtxt').attr('value') );
            d3.selectAll('.'+searchterm).transition().style('stroke', '#222').duration(70);
            d3.selectAll('#rp_'+searchterm).transition().style('stroke', '#222').duration(70);
    }
    
    var CleanNJoinText = function(word){
        word = String(word).replace(/[.'?"!—~!@#$%^&*()_+& \/]/g, "");
        word = String(word).replace(/[-]/g, "");
        return word;
    }
    
    $('.legendBlock').each(function(){
            color = $(this).attr('color');
            $(this).css({'background-color': color});
    });
    
});




