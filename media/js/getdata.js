$(document).ready(function(){ 
    var current_url = window.location.toString();
    story = window.location.pathname.substr(7);    
    geturl = "http://"+window.location.host+"/getdata/"+story;
    $.get(geturl, function(data) {
      console.log(data);
      articleStorageArray = data;
      setTimeout(startEverything, 100, articleStorageArray);
    });
    
    
   /*
 $('#lengthbutton').click(function(){
        changeWordRects(counter, "length");           
    });
*/ 
    $('#familybutton').click(function(){
        showFam =! showFam;
        $(this).toggleClass('clicked');
    });
    
    $('#heatbutton').click(function(){
        changeWordRects(counter, "heat");           
    });  
    
    $('#namedbutton').click(function(){
        namedOnScreen = true;
        if (level == totalstories){
            namedLevels(level,(r/5)+(30-totalstories*2.4));  //70+(40-totalstories*6)-(totalstories)
            level--;
        }
    });
    
});


//////////////////////////////////////////////////////////////////////////////////////////////VARIABLES: starter globals
var filesArray; //use this to store the svg objects for each article (set by selectAll class)
var articlePubs = [], dataArray = []; //use this to store the data objects for each article
var w = window.innerWidth-120, h = window.innerHeight-0, w2 = w*0.5, h2 = h*0.5;
var articleStorageArray, totalstories, mainSVG, langmap, articlefile, simInfo;
var entitiesString = ['PERSON', 'ORGANIZATION', 'LOCATION', 'DATE', 'TIME', 'MONEY', 'PERCENT', 'FACILITY', 'GSP'];
var wordmap = { w: 0, h: 0, boxH: 6},  spacing  = 40, wordCount = 0;
var namedOnScreen = false;
var dat = [1];

//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: start her engines
var startEverything = function(data){
    setupSVG();
    data.forEach(function(d, i) {
        //console.log(d);
        parseArticleData(d, initChart, i);
    });
}

//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: create main SVG
var setupSVG = function(){
        
    totalstories = level = articleStorageArray.length;
    wordmap.w = ~~(w / totalstories) - spacing; 

    mainSVG = d3.select("#content").append("svg:svg") //SVG that holds all individual charts
        .attr("id", "mainSVG")
        .attr("width", w)
        .attr("height", 1000) //will need to be appended based on the data
        .attr("viewBox","0 0 0 0")
        .style("fill", "#F0F3DA")
      .append("g")
        .attr("transform", "translate(20,2)");
                    
    // Add a file for each article.
    articlefile = mainSVG.selectAll("g.articlefile")
            .data(articleStorageArray)
        .enter().append("g")
            .attr("id", function(d,i){ return "articlefile"+i})
            .attr("class", "articleClass")
            .attr("transform", function(d,i){ return "translate("+((i*wordmap.w)+(i*spacing))+",60)"; });
    
    filesArray = mainSVG.selectAll(".articleClass"); 
    setArtFileLocs();//get the translate for each articlefile and store it for updates  
}

//////////////////////////////////////////////////////////////////////////////////////////////VARIABLES: set articlefile object
var afLoc0 = {x:0, y:0}, afLoc1 = {x:0, y:0}, afLoc2 = {x:0, y:0}, afLoc3 = {x:0, y:0}, 
    afLoc4 = {x:0, y:0}, afLoc5 = {x:0, y:0}, afLoc6 = {x:0, y:0};
var artfileLocs = { 0:afLoc0, 1:afLoc1, 2:afLoc2, 3:afLoc3, 4:afLoc4, 5:afLoc5, 6:afLoc6};
//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: articlefile position storage for updates
var setArtFileLocs = function(){
    filesArray[0].forEach(function(d, i) {
        filetrans = mainSVG.select("#articlefile"+i);
        trans = filetrans[0][0].attributes[2]['nodeValue'];
        transVal = trans.match(/\(([^}]+)\)/);
        transVal = transVal[1].split(','); 
        artfileLocs[i].x = transVal[0];
        artfileLocs[i].y = transVal[1];
    });
}


//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: take apart the JSON and organize for visualization
var parseArticleData = function (articleJSON, callback, column){

        var data_wordLength = [], //d[1][2][1]
             data_freqdist = [], //d[1][1][1]
             data_words = [], //d[1][0][1]
             data_pos = [], //d[0]
             data_others = [],
             namedents = [],
             trigrams = [],
             sentiment = [],
             numbers = [],
             quotes = [],
             sentlenghts = [];
        
        var parseJSON = function(article_corp) { //Parse JSON into categories
            // Compute a unique index for each package name.            
            article_corp.NamedEnts.forEach(function(d) {
                namedents.push(d); //push all named entities to data
            });
            
            article_corp.TriGrams.forEach(function(d) {
                trigrams.push(d); //push all trigrams to data
            });
            
            sentiment.push(article_corp.Sentiment)//push sentiment analysis to data
            
            article_corp.SentLengths.forEach(function(d) {
                sentlenghts.push(d); //push all sentence lenghts to data
            });
            
            article_corp.Numbers.forEach(function(d) {
                numbers.push(d); //push all numbers lenghts to data
            });
            
            article_corp.Quotes.forEach(function(d) {
                quotes.push(d); //push all quotes lenghts to data
            });
            
            article_corp.Corpus.forEach(function(d) {
                try{
                    test = d[1][0][0][0]; //IF THIS IS A NAMED ENTITY
                    totallen = 0;
                    concat = "";
                    freq = 0;
                    d[1].forEach(function(d) {
                        concat += d[0][1];
                        concat += " ";
                        totallen += d[2][1];
                        freq = d[1][1];
                    });
                    concat = concat.substr(0, concat.lastIndexOf(" "));
                    data_wordLength.push(totallen);//push all wordlengths to data
                    data_words.push(concat);//push all words to data
                    data_freqdist.push(freq);//push all freqs to data
                    data_pos.push(d[0]);//push part of speach to data
                    data_others.push(d[1][0][4][1]);//push other_indexes to data
                } catch(err) {
                    data_wordLength.push(d[1][2][1]);//push all wordlengths to data
                    data_words.push(d[1][0][1]);//push all words to data
                    data_freqdist.push(d[1][1][1]);//push all freqs to data
                    data_pos.push(d[0]);//push part of speach to data
                    data_others.push(d[1][4][1]);//push other_indexes to data
                }
            });
        }
    parseJSON(articleJSON)
    
    articleData = { //Return the main data object for this article
        "WordLength": data_wordLength,
        "Words": data_words,
        "FreqDist": data_freqdist,
        "POS": data_pos,
        "Others": data_others,
        "NamedEnts": namedents,
        "TriGrams": trigrams,
        "Sentiment": sentiment,
        "SentLengths": sentlenghts,
        "Numbers": numbers,
        "Quotes": quotes,
    }
    //console.log(articleData);
    dataArray.push(articleData);
    setTimeout(callback, 1000, articleData, column);///////////CALLBACK (initChart): wait 1s for load
}


//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: make article column map of rects
var initChart = function(article_data, column){
    
    var file = mainSVG.select("#articlefile"+column);
    var prevd1 = 0, prevd2 = 0, prevd3 = 0, prevd4 = 0, ycount = 0, yp = 0, 
        linecount = 0, lplace = 0, lp = 0, linecount2 = 0, lplace2 = 0, lp2 = 0;
    var langmap = file.selectAll("rect")
            .data(article_data["WordLength"]) //article_data["WordLength"]
        .enter().append("rect")
            .attr("class", function(d,i){   lplace = lp;
                                            if(prevd3 > wordmap.w-10){
                                                prevd3 = 0;
                                                linecount += 1;
                                                lp = linecount;
                                            } else if(article_data["Words"][i] == "XendsentX"){
                                                prevd3 += 9;
                                            } else {
                                                prevd3 += d+1;
                                                lp = linecount;
                                            }
                                            var word = article_data["Words"][i];
                                            word = String(word).replace(/[.]/g, "");
                                            word = String(word).replace(/[']/g, "");
                                            word = String(word).replace(/ /g, "");
                                            return word+" "+ article_data["POS"][i] +" "+"wordrect"+" "+"art_"+column+"_line_"+lplace; 
                                        })
            .attr("id", function(d,i){ 
                                if(article_data["Words"][i] == "XendsentX"){
                                    return"XendsentX"
                                } else {
                                    wordCount++; 
                                    return "w"+wordCount; 
                                }
                        })
            .attr("freq", function(d,i){ return article_data["FreqDist"][i] })
            .attr("word", function(d,i){ return article_data["Words"][i] })
            .attr("x", function(d, i){ 
                                    xplace = prevd1;
                                    if(prevd1 > wordmap.w-10){
                                        prevd1 = 0;
                                    } else if(article_data["Words"][i] == "XendsentX"){
                                        prevd1 += 9;
                                        xplace = 10000000;
                                    } else {
                                        prevd1 += d+1;
                                    }
                                    return xplace; 
                                })
            .attr("y", function(d, i){ 
                                    yplace = yp;
                                    if(prevd2 > wordmap.w-10){
                                        prevd2 = 0;
                                        ycount += 1.25;
                                        d3.select(this).attr("sentence", yp);
                                        yp = ycount*wordmap.boxH;
                                    } else if(article_data["Words"][i] == "XendsentX"){
                                        prevd2 += 9;
                                        xplace = 10000000;
                                    } else {
                                        prevd2 += d+1;
                                        yp = ycount*wordmap.boxH;
                                    }
                                    return yplace;
                                })
            .attr("line", function(d, i){ 
                                    lplace2 = lp2;
                                    if(prevd4 > wordmap.w-10){
                                        prevd4 = 0;
                                        linecount2 += 1;
                                        lp2 = linecount2;
                                    } else if(article_data["Words"][i] == "XendsentX"){
                                        prevd4 += 9;
                                    } else {
                                        prevd4 += d+1;
                                        lp2 = linecount2;
                                    }
                                    return lplace2;
                                })                                
            .attr("width", function(d,i){ return d; })
            .attr("height", wordmap.boxH)
            /*
.style("fill", function(d,i) { 
                                            fq = article_data["FreqDist"][i]
                                            return d3.rgb("hsl("+0+","+(20+fq*4)+","+(90-(fq*0.8))+")"); 
                                        }); 
*/         
            //.style("fill", function(d,i) { return d3.rgb("hsl("+d*d*d*20.01+","+30+","+70+")"); });
            .style("fill", function(d,i) { return d3.rgb("hsl("+180+","+10+","+(82-d*0.7)+")"); })
            .on("mouseout",function(){
				d3.select(this).transition()
					//.style("fill", function(d,i) { return d3.rgb("hsl("+180+","+10+","+(82-d*0.7)+")"); })
					.style("stroke", "none")
					.duration(300)
					.ease("linear",1,1)
					.call(function(){$(".innerText").css({"color": "#666"});})
				})
            .on("mouseover",function(){
					d3.select(this).transition()
    					//.style("fill", function(d,i) { return d3.rgb("hsl("+d*d*d*20.01+","+100+","+70+")"); })
    					.style("stroke", "#333")
    					//.attr("width",function(d){ return d*4; })
    					//.attr("height", wordmap.boxH*4)
    					//.attr("y",function(){return -Math.random()*500;})
    					.duration(300)
    					.ease("linear",1,1)
				});
     
    //Get rid of all the XendsentX objs
    xsent = mainSVG.selectAll('.XendsentX');
    xsent[0].forEach(function(d){
        mainSVG.select("#XendsentX").remove();
    });
    
    compareCorpora(article_data, column); ///////////////////CALL: send the data for this article to concordance function
}



//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: go through each article and make concordances 
var allEntities = {}, entitiesList = []; //this is used for Named Entities Concordance
var compareCorpora = function(article_data, column){
    
    article_data["NamedEnts"].forEach(function(d) {
        
        var word = d[1];
        word = String(word).replace(/[.]/g, "");
        word = String(word).replace(/[']/g, "");
        word = String(word).replace(/ /g, "");
        
        //if (word == "XL") { console.log("'XL' : article"+column)};
        
        if (allEntities[word]) { //if entry already exists, add 1 to the frequency and add article it's parent article
            var already = false;
            allEntities[word][1].forEach(function(d){ //some entities are defined more than once, this tests to make sure they only get in once
                if(d == "article"+column){
                    already = true;
                } 
            });
            if (!already) {
                allEntities[word][0] += 1; 
                allEntities[word][1].push("article"+column);
            }
        } else {                //if entry is new, set frequency 1 and add article it is from
            allEntities[word] = [1, []];
            allEntities[word][1].push("article"+column);
            entitiesList.push(word);
            try{
                instances = mainSVG.selectAll("."+word);
                allEntities[word]['freq'] = instances[0].length;
            } catch(err){
                allEntities[word]['freq'] = 1;
            }
        }
    });
    
    if(column == totalstories-1){
        setTimeout(writeFactsToScreen, 400);
        //console.log(allEntities)
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: Put ink on paper
var writeFactsToScreen = function(){
    var publishers = [];
    $('.publinks').each(function(index){ publishers.push($(this).html())});
    //console.log(publishers);
    filesArray[0].forEach(function(d, i) {
        filetrans = mainSVG.select("#articlefile"+i);
        artid = mainSVG.select("#articlefile"+i);
        bottom = filetrans[0][0].childNodes[filetrans[0][0].childElementCount-2].y.baseVal.value;
                
        artid.append("text")
            .attr("x", 0)
            .attr("y", -2)
            .attr("dy", "-12px")
            .style("fill", "#222")
            .style("font-size", "16px")
            .text(publishers[i]); 
        artid.append("line")
            .attr("x1", 0)
            .attr("y1", -8)
            .attr("x2", wordmap.w)
            .attr("y2", -8)
            .style("stroke", "#222");   
        artid.append("line")
            .attr("x1", 0)
            .attr("y1", bottom+16)
            .attr("x2", wordmap.w)
            .attr("y2", bottom+16)
            .style("stroke", "#222");        
    });
      
    /*
$('.wordrect').bind('mousedown', function() {
        mousedraging = true;
    });
    $('.wordrect').bind('mouseup', function() {
        mousedraging = true;
    });
*/  
    //////////////////////////////////////////////BIND FUNCTIONS: readingWindow make/remove and text scrolling with timers
    $('.wordrect').bind('mouseover', function() {
        event.stopPropagation();
        clearTimeout(timer2);
        timer1 = setTimeout(makeWordBox, 300, this);
        //timer2 = setTimeout(moveTextflow, 50, this);
        //makeWordBox(this);
        moveTextflow(this);
        //if(mousedraging){moveTextflow(this);}
    });
    $('.wordrect').bind('mouseout', function() {
        event.stopPropagation();
        timer2 = setTimeout(killReader, 1000);
        clearTimeout(timer1);
        //clearTimeout(timer2);
        //wordrectMouseTrack();
    });
}
var timer1 = "", timer2 = "";
var killReader = function(){
    $(".readWindow").stop()
                .animate({ opacity: 0}, 160, 'linear', function() { $('.readWindow').remove(); });
    readingObj = "null";
}
var mousedraging = false;


//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: make individual reading windows for text
var textflow = function(){};
var wordspan_length = 3, readingObj = "null", objectX = 0, objectY = 0, prevObjX = 0, prevObjY = 0, 
    parent = "null", prevparent = {"id": 100};
var makeWordBox = function(obj){
    var sentenceArray = [], idArray = [];
    objectX = obj.x.baseVal.value;//get obj x location
    objectY = obj.y.baseVal.value;//get obj y location
    headTop = $('#story_headline').outerHeight();
    parent = obj.parentNode;
   if(objectY != prevObjY || parent.id != prevparent.id){ //if no longer on the same line or the same article, remove window
        $('.readWindow').remove();
        readingObj = "null";
    }
   if(readingObj == "null"){//if no other window on screen, make a new one
        textsvg_width = 0;
        prevparent = parent;
        prevObjX = objectX;
        prevObjY = objectY;

        var articleid = prevparentFlow = obj.parentNode.id.substr(11);//get parent element id & substr to just the end number
        var transx = artfileLocs[articleid].x;//get parent element translate.x
        var transy = artfileLocs[articleid].y;//get parent element translate.y
        thisId = obj.id;
        objLine = prevlineFlow = $(obj).attr("line");//get the line number for the obj
        allWordObjs = $('.art_'+articleid+'_line_'+objLine);//find all of the wordrects that have the same line number in this article
        for(var i=0; i<allWordObjs.length; i++){
            specId = allWordObjs[i].id
            idArray.push(specId);
            specWord = $("#"+specId).attr("word");
            sentenceArray.push(specWord);
        }
        
        //make text purely for computing textline width
        var textsvg = mainSVG.append("text")
                .attr("id", "textfiller")
                .text(sentenceArray.join(" "))
                .attr("x", 0)
                .attr("y", "75px")
                .attr("dy", "14px")
                .style("fill", "#0000FF")
                .attr("opacity", 0.0)
                .style("font-size", "12px")
        //textsvg_width = textsvg[0][0]['clientWidth'];
        //sentenceArray.forEach(function(d,i){ if(d=="."||d=="!"||d=="?" ){console.log(textsvg_width);textsvg_width+=12;console.log(textsvg_width)} });
        
 
        $('#SVGoverlay')
            .append("<div id='removeme"+thisId+"' class='readWindow'> <ul class='sentlist'></ul></div>");
        sentenceArray.forEach(function(d,i){
            thisword = d.split(" ");
            thisword = thisword.join("");
            $('.sentlist').append("<li id='"+idArray[i]+"_"+thisword+"' class='innerText'>"+d+"</li>");
        });
        $('#removeme'+thisId).css({ "top": (transy-(-objectY-70))+"px", "left": (transx-(-65))+"px", "text-align":"left", "width": (wordmap.w-(-20))+"px", "max-height": "20px" });
        $('#innerText'+thisId).css({ "top": "0px", "left": woffset+"px" });
        //sentwidth = $('.innerText').forEach(function(d,i){d.});
        $('.innerText').each(function(index) {
             sw = $(this).outerWidth();
             textsvg_width += sw;
        });
        sentenceArray.forEach(function(d,i){ if(d=="."||d=="!"||d=="?" ){ textsvg_width+=42;} });
         
        //actual length of the line of wordrects
        totalLinewidth = (allWordObjs[allWordObjs.length-1].x.baseVal.value) + (allWordObjs[allWordObjs.length-1].width.baseVal.value);
        //scale the textline width to the width of the column for scrollability
        textflow = d3.scale.linear()
            .domain([0, (totalLinewidth+20)])
            .range([0, textsvg_width+100]);
        //after calculating the textflow, remove textsvg
        textsvg.remove();
        var lineX = function(oX) { return textflow(oX); };
        var woffset = -(lineX(objectX));
        moveTextflow(obj);
        readingObj = $('#innerText'+thisId);
        //setTimeout(removeAllWordBox, 1000,"removeme"+thisId);
   }
}


//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: scorll the text in the readingWindow
var prevlineFlow = "", prevparentFlow = "";
var moveTextflow = function(obj){
        thisline = $('#'+obj.id).attr('line');
        thisparent = obj.parentNode.id.substr(11);

        if(thisline == prevlineFlow && thisparent == prevparentFlow){//if we are on the same line & article, scroll text
            thisword = $('#'+obj.id).attr('word');
            thisword = thisword.split(" ");
            thisword = thisword.join("");
            objectX = obj.x.baseVal.value;
            objectX = obj.x.baseVal.value;
            $("#"+obj.id+"_"+thisword).css({"color": "#000"});
            var lineX = function(oX) { return textflow(oX); };
            var woffset = -(lineX(objectX));
            $(".sentlist").stop()
                .animate({ left: woffset}, 400, 'easeOutSine', function() {});
        }
}









//////////////////////////////////////////////////////////////////////////////////////////////VARIABLES: Named Entity display
var shift = 0, level = 0, firsttime = true;
var r = Math.min(w, h) *0.5,
    inner = 0, outer = 0,
    color = d3.scale.category10(),
    donut = d3.layout.pie().startAngle( 6 ).endAngle( 3 ).sort(null);
//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: Named Entity display
var namedLevels = function(level, change){
    if (firsttime) {
        change += 30;
        firsttime = false;
    }
    r = Math.min(w, h)*((10-totalstories)*0.12);
    inner += 0.2;
    outer = inner+0.1;
    var arc = d3.svg.arc().innerRadius(r*inner+20).outerRadius(r*outer+8);
    var arcs, paths;
    if (level > 0){
        moveArticles(change);
        var nodeArray = [];
        var nodeWords = [];
        entitiesList.forEach(function(d,i){
            if(allEntities[d][0] == level){
                nodeWords.push(d);
                nodeArray.push(allEntities[d]['freq'])
                //console.log(allEntities[d][1]);
            } 
        });
        
        nameBlock = mainSVG.selectAll("g.nameBlock"+level)
                .data(dat)
            .enter().append("g")
                .data([nodeArray])
                .attr("id", "nameBlock"+level)
                .attr("class", "infoblock")
                .attr("width", w-20)
                .attr("height", 100) //will need to be appended based on the data
                .attr("transform", "translate("+0+","+(0)+")");
        nblk = mainSVG.select("#nameBlock"+level);
                
        var currentWord = "";
        var currentColor = ""; 

        
        if(nodeWords.length == 0) { //if there are no entities at this level, make a "NULL" arc
        
                nodeWords.push("NULL");
                nodeArray.push(1);
                arcs = nblk.selectAll("g.arc")
                    .data(donut)
                  .enter().append("g")
                    .attr('id', function(d, i) { return nodeWords[i]; })
                    .attr("class", "arc")
                    .style("stroke", "#fff")
                    .style('cursor', 'pointer')
                    .style("stroke-width", "2px")
                    .attr("transform", "translate(" + (w2-10) + "," + (-inner*30) + ") rotate(282)")
                    .attr('opacity', 0.8)
                paths = arcs.append("path")
                    .attr("fill","#ddd")
                    .attr("d",arc)
                    .attr('opacity', 0.6);
                
        } else { //else make a partitioned arc for each entity
        
                arcs = nblk.selectAll("g.arc")
                    .data(donut)
                  .enter().append("g")
                    .attr("parents", function(d, i) { return allEntities[nodeWords[i]][1].toString(); })
                    .attr('id', function(d, i) { return nodeWords[i]; })
                    .attr("class", function(d, i) { fam = allEntities[nodeWords[i]][1].toString().replace(/[,]/g, " "); return "arc "+fam; })
                    .style("stroke", "#fff")
                    .style('cursor', 'pointer')
                    .style("stroke-width", "2px")
                    .attr("transform", "translate(" + (w2-10) + "," + ((-inner*30)-((r*inner)*0.2)) + ") rotate(282)")
                    .attr('opacity', 0.75)
                    .on("mouseout",function(){ arcMouseOut(this);})
                    .on("mouseover",function(){ arcMouseOver(this);})
                    .on("click",function(){
                            if($('.'+currentWord).css('fill') == '#338888'){ 
                                d3.select(this).on('mouseout', function(){ arcMouseOut(this);})
                                d3.select(this).transition()
                					.attr('opacity', 0.75)
                					.duration(100)
                					.ease("linear",1,1)
                					.call(function(){ d3.select(this[0][0]['node']['childNodes'][0]).transition().attr('opacity', '0.3').style('stroke', '#fff').duration(80) });
            					d3.selectAll('.'+currentWord).transition()
                				    .style('fill', function(){ return currentColor })
                				    .style("stroke", "none")
                					.duration(150)
                					.ease("linear",1,1);
                            } else {
                                d3.select(this).on('mouseout', null);
                                d3.select(this).transition()
                					.attr('opacity', 1)
                					.duration(100)
                					.ease("linear",1,1)
                					.call(function(){ d3.select(this[0][0]['node']['childNodes'][0]).transition().style('stroke', '#222').duration(70) });
            					d3.selectAll('.'+currentWord).transition()
                				    .style('fill', function(){ currentColor = $('.'+currentWord).css('fill'); return '#338888' })
                					.duration(150)
                					.ease("linear",1,1);
                            }
        				});
        				
        		
            paths = arcs.append("path")
                .attr('class', 'ringpath')
                .attr("fill", function(d,i) { return d3.rgb("hsl("+nodeArray[i]*nodeArray[i]*10+",45,40)"); })
                .attr("d",arc)
                .attr('opacity', 0.3);

            arcs.transition()
                .ease("cubic-out")
                .duration(400)
                .attr("transform", "translate(" + (w2-10) + "," + (-inner*30) + ") rotate(282)");
  		
    }
    
    
    textbits = arcs.append("text")
        .attr("transform", function(d,i) { 
                                        var a = (d.startAngle/2-d.endAngle/2)+d.endAngle;
                                        var angle = (((a*180) / 10 * Math.PI)+90);
                                        if(angle<350){ angle+=180; }
                                        if(nodeWords[i]=="NULL") { angle -= 90 };
                                        return "translate(" + arc.centroid(d) + ") rotate("+ angle +")"; 
                                    })
        .attr("dy", ".35em")
        .attr("class", "namedent")
        .attr("fill", "#3c3c3c")
        .style('cursor', 'pointer')
        .style('stroke', 'none')
        .style("font-size", "9px")
        .style("font-weight", "600")
        .attr("text-anchor", function(d,i) { 
                                        var a = (d.startAngle/2-d.endAngle/2)+d.endAngle;
                                        var angle = (((a*180) / 10 * Math.PI)+90);
                                        var anchor = "end";
                                        if(angle<350){ anchor = "start"; }
                                        if(nodeWords[i]=="NULL") { anchor = "middle"; };
                                        return anchor; 
                                    })
        .attr("display", function(d) { return d.value > .15 ? null : "none"; }) //if null than "none"
        .text(function(d, i) { if(nodeWords[i]=="NULL") { return "NULL" }else{ return $('.'+nodeWords[i]).attr('word'); } });

    
	level--;
	setTimeout(namedLevels, 600, level, (r/5)+(30-totalstories*2.4));
      
    } else if (level == 0){
        //killLinks();
    }
}

var arcMouseOut = function(obj){
    d3.select(obj).transition()
		.attr('opacity', 0.75)
		.duration(200)
		.ease("linear",1,1)
		.call(function(){ d3.select(this[0][0]['node']['childNodes'][0]).transition().attr('opacity', '0.3').duration(90) })
		.call(function(){ d3.select(this[0][0]['node']['childNodes'][1]).transition().attr('fill', '#3c3c3c').style('font-size', '9px').duration(150) })
		.call(function(){ showArticleFamily(this, 0.75) })
	d3.selectAll('.'+currentWord).transition()
		.style("stroke", "none")
		//.style('fill', currentColor)
		.duration(150)
		.ease("linear",1,1);
}

var arcMouseOver = function(obj){
    d3.select(obj).transition()
		.attr('opacity', 1)
		.duration(100)
		.ease("linear",1,1)
		.call(function(){ currentWord = this[0][0]['node']['id']; d3.select(this[0][0]['node']['childNodes'][0]).transition().attr('opacity', '0.65').duration(80) })
		.call(function(){ d3.select(this[0][0]['node']['childNodes'][1]).transition().style('fill', '#000').style('font-size', '12px').duration(150) })
		.call(function(){ showArticleFamily(this, 1) })
	d3.selectAll('.'+currentWord).transition()
		.style("stroke", "#000")
	    //.style('fill', function(){ currentColor = $('.'+currentWord).css('fill'); return '#330000' })
		.duration(150)
		.ease("linear",1,1);
} 

var showFam = false;
var showArticleFamily = function(obj, opac) {
    //console.log(obj[0][0]['node'].id);
    if(showFam){
        element = obj[0][0]['node'];
        parents = $('#'+element.id).attr('parents');
        parentArray = parents.split(',');
        parentArray.forEach(function(d, i){ 
                                            $('.'+d).stop().animate({ opacity: opac}, 160, 'linear', function() { }); 
                                            $('.'+d).find('.ringpath').css({'opacity': (opac-0.2)});
        //parentArray.forEach(function(d, i){ $('.'+d).css({'opacity': opac}); $('.'+d).find('.ringpath').css({'opacity': (opac-0.2)}); 
        });
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: shift articles down/up
var moveArticles = function(change){
    filesArray[0].forEach(function(d, i) {
        filetrans = mainSVG.select("#articlefile"+i);
        trans = filetrans[0][0].attributes[2]['nodeValue'];
        transVal = trans.match(/\(([^}]+)\)/);
        transVal = transVal[1].split(','); 
        artfileLocs[i].x = transVal[0];
        artfileLocs[i].y = transVal[1]-(-change);
        
        filetrans.transition()
                .attr("transform", "translate("+(artfileLocs[i].x)+","+(artfileLocs[i].y)+")")
                .duration(500)
                .ease("exp-out",1,1);
        if(namedOnScreen){
            links = mainSVG.selectAll('.namelink')
                .transition()
                    .attr("y2", (artfileLocs[i].y-32))
                    .attr("opacity", 0.35)
                    .duration(500)
                    .ease("exp-out",1,1);
        }
    });
}

