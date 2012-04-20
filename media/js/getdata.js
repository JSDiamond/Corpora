$(document).ready(function(){ 
    var current_url = window.location.toString();
    story = window.location.pathname.substr(7);    
    geturl = "http://"+window.location.host+"/getdata/"+story;
    
    $('#SVGcontainer').html('<p style="text-align: center; padding-bottom: 16px;" id="loading">L O A D I N G . . .</p>');
    
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

    $('#sentimentbutton').click(function(){
        if(!sentimentshowing){
            $('.uc').css({ 'border-bottom': '1px #333 solid'})
            $('.uc').stop().animate({ 'height': wordmap.w*0.8 }, 400, 'easeOutQuart', function() { });
            $('#bottompad').stop().animate({ 'margin-top': (wordmap.w*0.94)+'px' }, 550, 'easeOutQuart', function() { });
            sentimentshowing =! sentimentshowing;
        } else if (sentimentshowing) {
            $('.uc').stop().animate({ 'height': 0 }, 400, 'easeOutQuart', function() { $(this).css({ 'border-bottom': 'none'}) });
            $('#bottompad').stop().animate({ 'margin-top': (0)+'px' }, 550, 'easeOutQuart', function() { });
            sentimentshowing =! sentimentshowing;
        }
    });

    $('#familybutton').click(function(){
        showFam =! showFam;
        $(this).toggleClass('clicked');
    });
    
    $('#importantnet').click(function(){
        if(!importantshowing){
            if(!buildone){
                buildImportantNetwork(links);
                buildone = true;
            }
            $('#levelsSVG').stop().animate({ 'height': levelHeight+70}, 440, 'easeOutQuart', function() { $('.impclass').show(); });
            importantshowing =! importantshowing;
        } else if(importantshowing) {
            $('.impclass').hide();
            $('#levelsSVG').stop().animate({ 'height': levelHeight-70}, 440, 'easeOutQuart', function() { });
            importantshowing =! importantshowing;
        }
    });
    
    $('#heatbutton').click(function(){
        changeWordRects(counter, "heat");           
    });  
    
    $('#namedbutton').click(function(){
        if(!namedOnScreen){
            $('#levelsSVG').stop().animate({ 'height': lH}, 800, 'easeOutCubic', function() { 
                setTimeout( showButtons, 200);
            });
            if (level == totalstories){
                namedLevels(level,(r/5)+(30-totalstories*2.4));  //70+(40-totalstories*6)-(totalstories)
                level--;
            }
            namedOnScreen =! namedOnScreen;
        } else if(namedOnScreen){
            lH = $('#levelsSVG').height();
            $('#levelsSVG').stop().animate({ 'height': 0}, 800, 'easeOutCubic', function() { });
            $('#familybutton').hide();
            $('#importantnet').hide();
            namedOnScreen =! namedOnScreen;
        }
    });
    
});
var sentimentshowing = false, importantshowing = false, buildone = false, namedOnScreen = false, lH = 0;

var showButtons = function(){
        $('#familybutton').show();
        $('#importantnet').show();
}

//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: clean text for class or id selectors
var CleanNJoinText = function(word){
    word = String(word).replace(/[.'& \/]/g, "");
    word = String(word).replace(/[-]/g, "");
    return word;
}

//////////////////////////////////////////////////////////////////////////////////////////////VARIABLES: starter globals
var filesArray; //use this to store the svg objects for each article (set by selectAll class)
var articlePubs = [], dataArray = []; //use this to store the data objects for each article
var w = window.innerWidth-120, h = window.innerHeight-0, w2 = w*0.5, h2 = h*0.5;
var articleStorageArray, totalstories, mainArtSVG, levelsSVG, netowrkSVG, langmap, articlefile, simInfo;
var wordmap = { w: 0, h: 0, boxH: 6},  spacing  = 34, wordCount = 0;
var dat = [1];
var entitiesString = ['PERSON', 'ORGANIZATION', 'LOCATION', 'DATE', 'TIME', 'MONEY', 'PERCENT', 'FACILITY', 'GSP'];
/* var namedColors = {'PERSON': 'AC6A51', 'ORGANIZATION': '537EA3', 'LOCATION': '569677', 'DATE': 'D5D964', 'TIME': '773D99', 'MONEY': 'C8CB6D', 'PERCENT': 'A6984B', 'FACILITY': 'BF9D54', 'GSP': 'AABA56'}; */
/* var namedColors = {'PERSON': '987162', 'ORGANIZATION': '666884', 'LOCATION': '59826E', 'DATE': 'D5D964', 'TIME': '773D99', 'MONEY': 'B0B177', 'PERCENT': 'A6984B', 'FACILITY': 'A08A64', 'GSP': 'AABA56'}; */
var namedColors = {'PERSON': 'B9886F', 'ORGANIZATION': 'C7D284', 'LOCATION': '86B2AC', 'DATE': 'D5D964', 'TIME': '773D99', 'MONEY': '516482', 'PERCENT': 'A6984B', 'FACILITY': '516482', 'GSP': 'AABA56'};


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
    
    levelsSVG = d3.select("#SVGcontainer").append("svg:svg") //SVG that holds all individual charts
        .attr("id", "levelsSVG")
        .attr("width", w+40)
        .attr("height", 0)
        .attr("viewBox","0 0 0 0")
      .append("g")
        .attr("transform", "translate(40,2)");
    
    netowrkSVG = d3.select("#SVGcontainer").append("svg:svg") //SVG that holds all individual charts
        .attr("id", "netowrkSVG")
        .attr("width", w+40)
        .attr("height", 0)
        .attr("viewBox","0 0 0 0")
      .append("g")
        .attr("transform", "translate(40,2)");

    mainArtSVG = d3.select("#SVGcontainer").append("svg:svg") //SVG that holds all individual charts
        .attr("id", "mainArtSVG")
        .attr("width", w+40)
        .attr("height", 0) //will need to be appended based on the data
        .attr("viewBox","0 0 0 0")
        .style("fill", 'rgba(255,255,255,0)')
        .style("margin-top", '-20px')
      .append("g")
        .attr("width", w)
        .attr("transform", "translate(22,2)");
        
        
                    
    // Add a file for each article.
    articlefile = mainArtSVG.selectAll("g.articlefile")
            .data(articleStorageArray)
        .enter().append("g")
            .attr("id", function(d,i){ return "articlefile"+i})
            .attr("class", "articleClass")
            //.style("background", "#fff")
            //.attr("width", wordmap.w)
            .attr("transform", function(d,i){ return "translate("+((i*wordmap.w)+(i*spacing)+20)+",34)"; });
    
    filesArray = mainArtSVG.selectAll(".articleClass"); 
    setArtFileLocs();//get the translate for each articlefile and store it for updates 
         
}

//////////////////////////////////////////////////////////////////////////////////////////////VARIABLES: set articlefile object
var afLoc0 = {x:0, y:0}, afLoc1 = {x:0, y:0}, afLoc2 = {x:0, y:0}, afLoc3 = {x:0, y:0}, 
    afLoc4 = {x:0, y:0}, afLoc5 = {x:0, y:0}, afLoc6 = {x:0, y:0};
var artfileLocs = { 0:afLoc0, 1:afLoc1, 2:afLoc2, 3:afLoc3, 4:afLoc4, 5:afLoc5, 6:afLoc6};
//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: articlefile position storage for updates
var setArtFileLocs = function(){
    filesArray[0].forEach(function(d, i) {
        filetrans = mainArtSVG.select("#articlefile"+i);
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
             important = [],
             imporatnt_named = []
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
            
            //article_corp.SentLengths.forEach(function(d) {
            //    sentlenghts.push(d); //push all sentence lenghts to data
            //});
            
            //article_corp.Numbers.forEach(function(d) {
            //    numbers.push(d); //push all numbers lenghts to data
            //});
            
            article_corp.Imporatnt_Named.forEach(function(d) {
                imporatnt_named.push(d); //push all Named with sentence-related impotrant to data
            });
            
            article_corp.Quotes.forEach(function(d) {
                quotes.push(d); //push all quotes lenghts to data
            });
            
            article_corp.Important.forEach(function(d) {
                important.push(d); //push all important words to data
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
        "Important": important,
        "Imporatnt_Named": imporatnt_named,
    }
    //console.log(articleData);
    dataArray.push(articleData);
    setTimeout(callback, 1000, articleData, column);///////////CALLBACK (initChart): wait 1s for load
     
    $('#important ul').append('<li>'+column+'</li>');
    articleData['Important'].forEach(function(d,i){
        var quote = d;
        $('#important ul').append('<li><p>'+d+'</p></li>');
    });
    
    
    $('#trigrams ul').append('<li>'+column+'</li>');
    articleData['TriGrams'].forEach(function(d,i){
        var quote = d;
        $('#trigrams ul').append('<li><p>'+d+'</p></li>');
    });
     
     
     $('#quotes ul').append('<li>'+column+'</li>');
    articleData['Quotes'].forEach(function(d,i){
        var quote = d;
        $('#quotes ul').append('<li><p>"'+d+'"</p></li>');
    });
    
}


//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: make article column map of rects
var initChart = function(article_data, column){
    
    var file = mainArtSVG.select("#articlefile"+column);
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
                                            var word = CleanNJoinText(article_data["Words"][i]);
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
    xsent = mainArtSVG.selectAll('.XendsentX');
    xsent[0].forEach(function(d){
        mainArtSVG.select("#XendsentX").remove();
    });
    
    compareCorpora(article_data, column); ///////////////////CALL: send the data for this article to concordance function
    if(column == totalstories-1){
        $('#loading').remove();
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
    
    if(column == totalstories-1){
        setTimeout(writeFactsToScreen, 20);
    }
    
}



//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: go through each article and make concordances 
var allEntities = {}, entitiesList = []; //this is used for Named Entities Concordance
var allImportant = {}, wordtrack = {}, targetcount = 0, links = []; //this is used for Important Words Concordance
var compareCorpora = function(article_data, column){
    
    article_data["NamedEnts"].forEach(function(d) {
        
        var word = CleanNJoinText(d[1]);
                
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
            if(d[0]=="GSP"){ allEntities[word]['POS'] = "LOCATION"; }
            else { allEntities[word]['POS'] = d[0]; }                                
            
            try{
                instances = mainArtSVG.selectAll("."+word);
                allEntities[word]['freq'] = instances[0].length;
            } catch(err){
                allEntities[word]['freq'] = 1;
            }
        }
    });
    
    article_data["Imporatnt_Named"].forEach(function(d, idx) {
        
        var word = CleanNJoinText(d[0]);
        var importantLog = {};
        if (allImportant[word]) { //if entry already exists
            d[1].forEach(function(dd,i){
                if(!importantLog[dd]){
                    allImportant[word].push(dd);
                    importantLog[dd] = "in";
                }
            })
        } else {                //if entry is new
            allImportant[word] = [];
            d[1].forEach(function(dd,i){
                allImportant[word].push(dd);
                importantLog[dd] = "in";
            })
        }
        
        jQuery.unique( allImportant[word] );
    });
    
    
    article_data["Imporatnt_Named"].forEach(function(d,i){
        var word = CleanNJoinText(d[0]);
        allImportant[word].forEach(function(dd, i){
            links.push({source: word, target: dd, type: "direct", x: 0, y: 0})
            if(wordtrack[dd]){ //conditional to help count the traget nodes for use in layout
                //wordtrack[dd] = wordtrack.length;
            } else {
                targetcount++;
                wordtrack[dd] = targetcount;
            }
        }); 
    });
}
 
var nodes = {}, pathlink, force, arclocs = [{}], prevRadius = 0;
    
var buildImportantNetwork = function(linkz) {
    console.log(allImportant);
    //$('#netowrkSVG').stop().animate({ 'height': levelHeight}, 400, 'easeOutQuart', function() { });
    // Compute the distinct nodes from the links.
    linkz.forEach(function(link, i) {
        source = CleanNJoinText(link.source);
        arcoff = $('#tx_'+source).offset();//'#tx_'+source
        txt = d3.select('#tx_'+source);
        arccenter = txt[0][0].attributes[5].nodeValue.split(",");
       // console.log(arccenter)
        arccolor = $('#rp_'+source).attr('fill');
                
      /*
  arc = levelsSVG.selectAll('#'+link.source); //////////////get the translates for the arc and it's text
        //ntext = levelsSVG.selectAll('#'+link.source);
            //console.log(link.source);
        trans = arc[0][0].attributes[4]['nodeValue'];
        //ntext = arc[0][0].childNodes[1].attributes[0]['nodeValue'];
            //console.log(ntext);
        transVal = trans.match(/translate\(([^}]+)\)rotate/);
        transVal = transVal[1].split(','); 
        //ntextVal = ntext.match(/translate\(([^}]+)\) rotate/);
            //console.log(ntextVal);
        //ntextVal = ntextVal[1].split(','); 
        arclocs[i] = {x1: transVal[0], y1: transVal[1], x2: arccenter[0], y2: arccenter[1]};
            //console.log(arclocs[i]);
        //console.log( arclocs );
*/
        
        mainoff = $('#mainArtSVG').offset();
        keyspace = 22-targetcount/10;
        keyleft = (  (((w-30)*0.5)-((targetcount*keyspace)*0.5))-20 );
        
        //console.log(linkz[i].target);
        term = CleanNJoinText(linkz[i].target)
        radius = $('.'+term);
        //console.log(radius.length);
        
        link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, class: "slink", x: (arcoff.left-52), y: (arcoff.top-168), charge: 0, fixed: true, color: arccolor, stroke: '#fff', radius: 8}); //x: (arcoff.left-50), y: ((arcoff.top)-162)
        //link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, class: "link", x: (arclocs[i].x1-arclocs[i].x2), y: (arclocs[i].y1+arclocs[i].y2), charge: 0, fixed: true});

        link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, class: "tlink", x: (wordtrack[link.target]*keyspace-(-(keyleft))), y: (mainoff.top)-126, charge: -2000, color: '#777', stroke: 'none', radius: radius.length, fixed: true}); //x: (w/2), y: levelHeight/2 
        
        prevRadius = radius.length;
    });
      
      
        levelsWidth = d3.select('#levelsSVG')[0][0].attributes[1].nodeValue;
        levelsSVG.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("class", "label impclass")
                .attr("fill", "#AAA")
                .attr("text-anchor", "center")
                .attr("transform", function(){ return "translate(" + (-22) + "," + ((mainoff.top)-114) + ") rotate(270)" })
                .text("KEY TERMS");
        levelsSVG.append("rect")
                .attr("x", -17)
                .attr("class", "impclass")
                .attr("y", (mainoff.top)-178)
                .attr("width", levelsWidth-42)
                .attr("height", 98)
                .style("stroke", "#AAA")
                .style("stroke-width", "1px")
                .style("fill", "rgba(255,255,255,0.5)");
      
    /*
levelsSVG.append("text")
        .attr("x", keyleft-2)
        .attr("y", (mainoff.top)-170)
        .attr("dy", "14px")
        .attr("text-anchor", "end")
        .text("Key Terms:")
        .style("font-size", "20px");
*/
            
    force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([w, h])
        .linkDistance(10)
        .charge(function(d) { return d.charge; })
        //.on("tick", tick)
        .friction(0.9)
        .gravity(10)
        .start();
    
    levelsSVG.append("defs").selectAll("marker")
        .data(["loose", "direct", "inherited"])
      .enter().append("marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 16)
        .attr("refY", -1.5)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5");//SVG triangle
    
    pathlink = levelsSVG.append("g").selectAll("path")
        .data(force.links())
      .enter().append("path")
        .attr("class", function(d) { return "link impclass" + d.type +" link_"+d.target.name +" link_"+d.source.name; })
        .attr('opacity', 0.6)
        .style('display', 'none');
        //.attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

    

    var circle = levelsSVG.append("g").selectAll("rect")
        .data(force.nodes())
      .enter().append("rect")
        .attr("id", function(d) { term = CleanNJoinText(d.name); return term; })
        .attr("class", function(d) { return d.class+" impclass"; })
        .attr("width", function(d) { return 8; })
        .attr("height", function(d) { return d.radius; })
        .attr('opacity', 0.75)
        .style("cursor", "default")
        .style("fill", function(d) { return d.color; })
        .style("stroke", function(d) { return d.stroke; })
        //.call(force.drag)
        .on('mouseover',function(){
                                    //if($(this).hasClass('slink')){
                                        $('.link_'+this.id).show();
                                    //}
                				})
        .on('mouseout',function(){
                                    //if(this.class == "slink"){
                                        $('.link_'+this.id).hide();
                                    //}
                				});
                				    
    var text = levelsSVG.append("g").selectAll("g")
        .data(force.nodes())
      .enter().append("g")
        .attr("class", "impclass")
        .style("font-size", "10px")
        .style("font-family", "Oswald")
        .style("font-weight", "600");
    
    // A copy of the text with a thick white stroke for legibility.
    /*
text.append("text")
        .attr("x", 8)
        .attr("y", "4px")
        .attr("class", "shadow")
        .text(function(d) { if(d.class == "tlink") { return d.name }; })
        .attr('transform', 'rotate(45)');
*/
    
    text.append("text")
        .attr("id", function(d) { term = CleanNJoinText(d.name); return "terms_"+term; })
        .attr("x", 8)
        .attr("y", "2px")
        .style("cursor", "default")
        .style("fill", "#222")
        .text(function(d) { if(d.class == "tlink") { return d.name }; })
        .attr('transform', 'rotate(45)')
        .on('mouseover',function(){
                                    console.log();
                                    $('.link_'+this.id.substr(6)).show();
                				})
        .on('mouseout',function(){
                                    $('.link_'+this.id.substr(6)).hide();
                				});
    
    var curve = d3.svg.line().interpolate("bundle").tension(.85);
    var cords = [], dr = 0;
    function tick() {
        pathlink.attr("d", function(d, i) { 
            targ = $('#'+CleanNJoinText(d.target.name));
            console.log(CleanNJoinText(d.target.name));
            cords[0] = [(d.source.x + 4), d.source.y]; 
            cords[1] = [d.source.x+0, d.source.y+60];
            cords[2] = [d.target.x-0, d.target.y-60];
            cords[3] = [(d.target.x + 4), (d.target.y - targ[0].attributes[3].nodeValue)];
            return curve(cords); 
        });  
      /*
pathlink.attr("d", function(d, i) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy); //Math.sqrt(dx * dx + dy * dy)
        return "M" + d.source.x + "," + d.source.y + "A" + (-dr*2) + "," + dr*2 + " 0 0,1 " + d.target.x + "," + d.target.y;
      });
*/
    
      circle.attr("transform", function(d, i) {
        return "translate(" + (d.x) + "," + (d.y - d.radius) + ") ";//rotate(-45)
      });
    
      text.attr("transform", function(d, i) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    }

    tick();
    
        /*
levelsSVG.append("line")
                .attr("x1", -17)
                .attr("y1", (mainoff.top)-210)
                .attr("x2", -17)
                .attr("y2", (mainoff.top)-120)
                .style("stroke", "#AAA")
                .style("stroke-width", "1px");
        levelsSVG.append("line")
                .attr("x1", levelsWidth-40)
                .attr("y1", (mainoff.top)-210)
                .attr("x2", levelsWidth-40)
                .attr("y2", (mainoff.top)-120)
                .style("stroke", "#AAA")
                .style("stroke-width", "1px");
        levelsSVG.append("line")
                .attr("x1", -17)
                .attr("y1", (mainoff.top)-210)
                .attr("x2", levelsWidth-40)
                .attr("y2", (mainoff.top)-210)
                .style("stroke", "#AAA")
                .style("stroke-width", "1px");
        levelsSVG.append("line")
                .attr("x1", -17)
                .attr("y1", (mainoff.top)-120)
                .attr("x2", levelsWidth-40)
                .attr("y2", (mainoff.top)-120)
                .style("stroke", "#AAA")
                .style("stroke-width", "1px");
*/
    
}


//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: Put ink on paper
var artcolor = d3.interpolate('#596128', '#612848' );
var publishers = [], bottoms = [], bottoms_sort = [], artid, lowest;
var writeFactsToScreen = function(){
    ///////////////////////////////////////MAKE A GRADIENT///////////
    var gradient = mainArtSVG.append("svg:svg")
      .append("svg:linearGradient")
        .attr("id", "gradient")
        /*
.attr("x1", "0%")
        .attr("y1", "20%")
        .attr("x2", "30%")
        .attr("y2", "30%")
*/
        .attr("x1", "34%")
        .attr("y1", "0%")
        .attr("x2", "8%")
        .attr("y2", "0%")
        .attr("spreadMethod", "pad");
    
    gradient.append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "#fff")//5694F4
        .attr("stop-opacity", 1);
    
    gradient.append("svg:stop")
        .attr("offset", "40%")
        .attr("stop-color", "#fff")
        .attr("stop-opacity", 0);
    ///////////////////////////////////////MADE A GRADIENT///////////

    
    $('.publinks').each(function(index){ publishers.push($(this).html())});
    //console.log(publishers);
    filesArray[0].forEach(function(d, i) {
        filetrans = mainArtSVG.select("#articlefile"+i);
        artid = mainArtSVG.select("#articlefile"+i);
        bottom = filetrans[0][0].childNodes[filetrans[0][0].childElementCount-2].y.baseVal.value;
        bottoms.push(Math.ceil(bottom));
        bottoms_sort.push(Math.ceil(bottom));
        
        
        artid.append('svg:image')
            .attr("x", -60)
            .attr("y", -33)
            .attr("width", wordmap.w)
            .attr("height", 26)
            .attr('xlink:href', '/media/images/pape_fade.png');
        
        /*
artid.append("rect")
            .attr('class', 'pub_blocker')
            .attr("x", -76)
            .attr("y", -33)
            .attr("width", wordmap.w)
            .attr("height", 26);
*/
            //.style("fill", "url(#gradient)");rgb(250,240,242) url(/media/images/pape_light.png) repeat 0 0
            //.style("fill", "rgb(250,240,242) url(/media/images/pape_fade.png) repeat 0 0");
        artid.append("rect")
            .attr("id", "article"+i+"_publight")
            .attr('class', 'pub_highlight')
            .attr("x", -16)
            .attr("y", -33)
            .attr("width", 10)
            .attr("height", 26)
            .attr("opacity", 0.0)
            .style("fill", function(){return artcolor(i)});//"url(#gradient)" #B8B5FF
        artid.append("text")
            .attr("x", 0)
            .attr("y", -2)
            .attr("dy", "-12px")
            .attr("width", wordmap.w)
            .style("fill", "#222")
            .style("font-size", "19px")
            .style('text-transform', 'uppercase')
            .style("font-family", "Oswald")
            .style("font-weight", "200")
            .text(publishers[i]); 
/*
            .on('mouseover',function(){
                                    d3.select(this).transition()
                    					.attr('opacity', 0.75)
                    					.duration(100)
                    					.ease("linear",1,1)
                    					.call();
                					})
*/
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
    
     artid.append('svg:image')
            .attr("x", wordmap.w-20)
            .attr("y", -33)
            .attr("width", wordmap.w)
            .attr("height", 26)
            .attr('xlink:href', '/media/images/pape_fade.png');
    
    
    bottoms_sort = bottoms_sort.sort(sortfunc);
    lowest = bottoms_sort[0];
    $('#mainArtSVG').stop().animate({ 'height': lowest+60}, 300, 'easeOutQuart', function() { buildSupplemental(bottoms, bottoms_sort) });
    
      
    /*
$('.wordrect').bind('mousedown', function() {
        mousedraging = true;
    });
    $('.wordrect').bind('mouseup', function() {
        mousedraging = true;
    });
*/  
}
var sortfunc = function(a,b) { return b - a; }
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
    mainOff = $('#mainArtSVG').offset();
    mainOff_top = mainOff.top;
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
        var textsvg = mainArtSVG.append("text")
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
            .append("<div id='removeme"+thisId+"' class='readWindow'> <ul class='sentlist'></ul></div>"); //transy-(-objectY-70)
        sentenceArray.forEach(function(d,i){
            thisword = d.split(" ");
            thisword = thisword.join("");
            $('.sentlist').append("<li id='"+idArray[i]+"_"+thisword+"' class='innerText'>"+d+"</li>");
        });
        $('#removeme'+thisId).css({ "top": (mainOff_top-(-objectY+68))+"px", "left": (transx-(-38))+"px", "text-align":"left", "width": (wordmap.w-(-20))+"px", "max-height": "20px" });
        $('#innerText'+thisId).css({ "top": "0px", "left": woffset+"px" });
        //sentwidth = $('.innerText').forEach(function(d,i){d.});
        $('.innerText').each(function(index) {
             sw = $(this).outerWidth();
             textsvg_width += sw;
        });
        //sentenceArray.forEach(function(d,i){ if(d=="."||d=="!"||d=="?" ){ textsvg_width+=30;} });
         
        //actual length of the line of wordrects
        totalLinewidth = (allWordObjs[allWordObjs.length-1].x.baseVal.value) + (allWordObjs[allWordObjs.length-1].width.baseVal.value);
        //scale the textline width to the width of the column for scrollability
        textflow = d3.scale.linear()
            .domain([0, (totalLinewidth+8)])
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
            thiscount = parseInt(obj.id.substr(1));
            prevword = $('#w'+(thiscount-1)).attr('word');//get the previous word to see if added space needed due to sentence ending
            thisword = thisword.split(" ");
            thisword = thisword.join("");
            objectX = obj.x.baseVal.value;
            $("#"+obj.id+"_"+thisword).css({"color": "#000"});
            var lineX = function(oX) { return textflow(oX); };
            var woffset = -(lineX(objectX));
            if(prevword=="."|| prevword=="!" || prevword=="?" ){ woffset+=50;}//check previous word and add space if new sentence
            $(".sentlist").stop()
                .animate({ left: woffset}, 400, 'easeOutSine', function() {});
        }
}






//////////////////////////////////////////////////////////////////////////////////////////////VARIABLES: Named Entity display
var shift = 0, level = 0, firsttime = true, currentWord = "", currentColor = "";
var r = Math.min(w, h) *0.5,
    inner = 0, outer = 0, levelHeight = 0;
    color = d3.scale.category10(),
    donut = d3.layout.pie().startAngle( 6 ).endAngle( 3 ).sort(null);
//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: Named Entity display
var namedLevels = function(level, change){
        
    r = (w*0.6)*((10-totalstories)*0.12);//Math.min(w, h)*((10-totalstories)*0.12);
    inner += 0.21//0.7-(level*0.08);
    outer = inner+0.1;
    var arc = d3.svg.arc().innerRadius(r*inner+20).outerRadius(r*outer+8);
    var arcs, paths;
    levelHeight = (r*outer)+100;    
    
    
    if (firsttime) {
        change += 30;
        firsttime = false;
        levelsSVG.append("text")
                .attr("x", 0)
                .attr("y", -2)
                .attr("dy", "-12px")
                .attr("class", "label")
                .attr("fill", "#999")
                .attr("text-anchor", "start")
                .attr("dy", ".35em")
                .attr("transform", "translate(" + (w2+(r*inner)-120) + "," + 4 + ")")
                .text("Named Entities that appeared in:");
    }
        
    if (level > 0){
        //moveArticles(change);
        $('#levelsSVG').stop().animate({ 'height': levelHeight}, 400, 'easeOutQuart', function() { });
        var nodeArray = [];
        var nodeWords = [];
        var nodePOS = [];
        entitiesList.forEach(function(d,i){
            if(allEntities[d][0] == level){
                nodeWords.push(d);
                nodeArray.push(allEntities[d]['freq']);
                nodePOS.push(allEntities[d]['POS']);
            } 
        });
        
        
        
        nameBlock = levelsSVG.selectAll("g.nameBlock"+level)
                .data(dat)
            .enter().append("g")
                .data([nodeArray])
                .attr("id", "nameBlock"+level)
                .attr("class", "infoblock")
                .attr("width", w-20)
                .attr("height", 100) //will need to be appended based on the data
                .attr("transform", "translate("+0+","+(0)+")");
        nblk = levelsSVG.select("#nameBlock"+level);

        
        if(nodeWords.length == 0) { //if there are no entities at this level, make a "NULL" arc
        
                nodeWords.push("NULL");
                nodeArray.push(1);
                arcs = nblk.selectAll("g.arc")
                    .data(donut)
                  .enter().append("g")
                    //.attr('id', function(d, i) { return nodeWords[i]; })
                    .attr("class", "arc")
                    .style("stroke", "#fff")
                    .style('cursor', 'pointer')
                    .style("stroke-width", "2px")
                    .attr("transform", "translate(" + (w2-10) + "," + (-inner*30) + ") rotate(282)")
                    .attr('opacity', 0.8)
                paths = arcs.append("path")
                    .attr("fill","#ddd")
                    .attr("d", arc)
                    .attr('opacity', 0.6);
                
        } else { //else make a partitioned arc for each entity
                
                
                arcs = nblk.selectAll("g.arc")
                    .data(donut)
                  .enter().append("g")
                    .attr("parents", function(d, i) { return allEntities[nodeWords[i]][1].toString(); })
                    .attr('id', function(d, i) { return nodeWords[i]; })
                    .attr("class", function(d, i) { fam = allEntities[nodeWords[i]][1].toString().replace(/[,]/g, " "); return "arc "+fam+" "+nodePOS[i]; })
                    .style("stroke", "#fff")
                    .style('cursor', 'pointer')
                    .style("stroke-width", "2px")
                    .attr("transform", "translate(" + (w2-10) + "," + ((-inner*30)-((r*inner)*0.2)) + ") rotate(282)")
                    .attr('opacity', 0.8);
                    /*
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
*/
            paths = arcs.append("path")
                .attr("id", function(d, i) { if(nodeWords[i]=="NULL") { return "NULL" }else{ return 'rp_'+CleanNJoinText($('.'+nodeWords[i]).attr('word')); } })
                .attr('class', 'ringpath')
                //.attr("fill", function(d,i) { return d3.rgb("hsl("+nodeArray[i]*nodeArray[i]*10+",45,40)"); })
                .attr('fill', function(d,i) { return namedColors[nodePOS[i]] })
                .attr("d", d3.svg.arc().innerRadius(r*inner+20).outerRadius(function(d,i){ return r*outer+2+(nodeArray[i]*1.4); }))//r*outer+8
                .attr('opacity', 0.4);
                            
            
            lables = nblk.append("text")
                .attr("x", 0)
                .attr("y", -2)
                .attr("dy", "-12px")
                .style("fill", "#777")
                .style("font-size", "11px")
                .style("font-family", "Miso")//Titillium
                .style("font-weight", "400")
                .attr("fill", "#999")
                .attr("text-anchor", "start")
                .attr("dy", ".35em")
                .attr("transform", "translate(" + (w2+(r*inner)+6) + "," + 4 + ")")
                .text("[ "+level+" of "+totalstories+" ]");
            
  		    arc.outerRadius(function(d,i){ return ((r*outer+8)-(r*inner+20))+(r*outer+4) });
    }
    
    arcs.transition()
                .ease("cubic-out")
                .duration(400)
                .attr("transform", "translate(" + (w2-10) + "," + ((-inner*22)-(-(40-level*5))) + ") rotate(282)");
    
    textbits = arcs.append("text")
        .attr("transform", function(d,i) { 
                                        var a = (d.startAngle/2-d.endAngle/2)+d.endAngle;
                                        var angle = (((a*180) / 10 * Math.PI)+94);
                                        if(angle<350){ angle+=180; }
                                        if(nodeWords[i]=="NULL") { angle -= 90 };
                                        return "translate(" + arc.centroid(d) + ") rotate("+ angle +")"; 
                                    })
        .attr("dy", ".35em")
        .attr("id", function(d, i) { if(nodeWords[i]=="NULL") { return "NULL" }else{ return 'tx_'+CleanNJoinText($('.'+nodeWords[i]).attr('word')); } })
        .attr("class", "namedent")
        .attr("fill", "#3c3c3c")
        .attr("center", function(d){ return arc.centroid(d); })
        .style('cursor', 'pointer')
        .style('stroke', 'none')
        .style("font-size", "9px")
        .style("font-weight", "600")
        .attr("text-anchor", function(d,i) { 
                                        var a = (d.startAngle/2-d.endAngle/2)+d.endAngle;
                                        var angle = (((a*180) / 10 * Math.PI)+94);
                                        var anchor = "end";
                                        if(angle<350){ anchor = "start"; }
                                        if(nodeWords[i]=="NULL") { anchor = "middle"; };
                                        return anchor; 
                                    })
        .attr("display", function(d) { return d.value > .15 ? null : "none"; }) //if null than "none"
        .text(function(d, i) { if(nodeWords[i]=="NULL") { return "NULL" }else{ return $('.'+nodeWords[i]).attr('word'); } });

    
	level--;
	setTimeout(namedLevels, 600, level, (r/5)+(30-totalstories*2.4));
	setTimeout(bindArcEvents, 600, arcs);
      
    } else if (level == 0){
                levelsSVG.append("text")
                .attr("x", 0)
                .attr("y", -2)
                .attr("dy", "-12px")
                .attr("class", "label")
                .attr("fill", "#999")
                .attr("text-anchor", "start")
                .attr("dy", ".35em")
                .attr("transform", "translate(" + (w-100) + "," + 4 + ")")
                .text(":of the articles");
                
        $('#familybutton').show();
        $('#importantnet').show();
        
    }
    
    if (level == 1){
        levelsSVG.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("class", "label")
                .attr("fill", "#AAA")
                .attr("text-anchor", "center")
                .attr("transform", function(){ return "translate(" + (-22) + "," + (levelHeight*0.5) + ") rotate(270)" })
                .text("NAMED ENTITES");
        levelsSVG.append("line")
                .attr("x1", -17)
                .attr("y1", 0)
                .attr("x2", -17)
                .attr("y2", levelHeight)
                .style("stroke", "#AAA")
                .style("stroke-width", "1px");
        levelsSVG.append("line")
                .attr("x1", -17)
                .attr("y1", 0)
                .attr("x2", -12)
                .attr("y2", 0)
                .style("stroke", "#AAA")
                .style("stroke-width", "1px");
        levelsSVG.append("line")
                .attr("x1", -17)
                .attr("y1", levelHeight)
                .attr("x2", -12)
                .attr("y2", levelHeight)
                .style("stroke", "#AAA")
                .style("stroke-width", "1px");
    }
    
}

var bindArcEvents = function(arcs){
    arcs.on("mouseout",function(){ arcMouseOut(this);})
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
}
var arcMouseOut = function(obj){
    d3.select(obj).transition()
		.attr('opacity', 0.75)
		.duration(200)
		.ease("linear",1,1)
		.call(function(){ showArticleFamily(this, 0.4, 0.8, 0, 360) })
		//.call(function(){ d3.select(this[0][0]['node']['childNodes'][0]).transition().attr('opacity', '0.3').duration(90) })
		.call(function(){ d3.select(this[0][0]['node']['childNodes'][1]).transition().attr('fill', '#3c3c3c').style('font-size', '9px').duration(170) })
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
		.call(function(){ showArticleFamily(this, 0.8, 1, 1, 160) })
		.call(function(){ 
		                  currentWord = this[0][0]['node']['id']; 
		                 // d3.select(this[0][0]['node']['childNodes'][0]).transition().attr('opacity', '0.9').duration(80) 
		              })
		.call(function(){ d3.select(this[0][0]['node']['childNodes'][1]).transition().style('fill', '#000').style('font-size', '12px').duration(150) })
	d3.selectAll('.'+currentWord).transition()
		.style("stroke", "#000")
	    //.style('fill', function(){ currentColor = $('.'+currentWord).css('fill'); return '#330000' })
		.duration(150)
		.ease("linear",1,1);
} 

var showFam = false;
var showArticleFamily = function(obj, opac1, opac2, opac3, speed) {
    //console.log(obj[0][0]['node'].id);
    element = obj[0][0]['node'];
    parents = $('#'+element.id).attr('parents');
    parentArray = parents.split(',');
    if(showFam){
        parentArray.forEach(function(d, i){ 
                                            $('.'+d).stop().animate({ opacity: opac2}, speed, 'linear', function() { }); 
                                            $('.'+d+' .ringpath').stop().animate({ opacity: opac1}, speed-100, 'linear', function() { });
                                            //d3.selectAll('.'+d).transition().attr('opacity', function(){ return (opac-0.25) }).duration(150);
        });
    } else {
        $('#'+element.id+' .ringpath').css({'opacity': (opac1)});
    }
    parentArray.forEach(function(d, i){ 
                                        $('#'+d+'_publight').stop().animate({ opacity: opac3}, speed-160, 'linear', function() { });
                                    });
}

//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: shift articles down/up
var moveArticles = function(change){
    filesArray[0].forEach(function(d, i) {
        filetrans = mainArtSVG.select("#articlefile"+i);
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
          /*
  links = mainArtSVG.selectAll('.namelink')
                .transition()
                    .attr("y2", (artfileLocs[i].y-32))
                    .attr("opacity", 0.35)
                    .duration(500)
                    .ease("exp-out",1,1);
*/
        }
    });
}



//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: add elements below each article
var sentimentBlock, underHeight;
var buildSupplemental = function(bottoms, bottoms_sort) {    
    
    ul = $('#underlist');
    offHeight = $('#mainArtSVG').outerHeight();
    bottoms.forEach(function(d,i){
        ul.append('<li class="uc underColumn'+i+'" style="position: absolute; top: '+(-offHeight+d+50)+'px; left: '+((i*wordmap.w)+(i*spacing)+42)+'px;  width: '+wordmap.w+'px;"><p class="supp">Sentiment</p></li>');
        if(d == bottoms_sort[0]){ $('.underColumn'+i).addClass('longestColumn') }
        //console.log(dataArray[i].Sentiment[0].neg);
        data = [dataArray[i].Sentiment[0].pos, dataArray[i].Sentiment[0].neg]
        sentimentBlock = d3.select('.underColumn'+i).append("svg:svg") //SVG that holds all individual charts
                            .data([data])
                            .attr("id", "sentimentBlock"+i)
                            .attr("id", "sentBlock")
                            .attr("width", wordmap.w)
                            .attr("height", wordmap.w*0.7) //will need to be appended based on the data
                            .attr("viewBox","0 0 0 0")
                            .style("margin-top", '0px')
                          .append("g")
                            .attr("width", w)
                            .attr("transform", "translate(0,0)");
        /*
sentimentBlock.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", wordmap.w)
                .attr("height", wordmap.w*0.75)
                .style("stroke", "#AAA")
                .style("stroke-width", "1px")
                .style("fill", "rgba(255,255,255,0.4)");
*/
                
        buildSentiment(dataArray[i].Sentiment[0]);
        underHeight = $('.underColumn0').height();
        $('.uc').height(0);
    });
    var heights = $('.longestColumn').outerHeight()
    $('#bottompad').css({ 'margin-top': heights+20+'px' });
    
    //||||||||||||||||||||||||||||||||||||||||||||||Article Maps: lable 
    pub_to_bottom = bottoms_sort[0]+50;
    mainArtSVG.append("text")
            .attr("x", 0)
            .attr("y", -2)
            //.attr("dy", "-12px")
            .attr("class", "label")
            .attr("fill", "#AAA")
            .attr("text-anchor", "center")
            .attr("transform", function(){ return "translate(" + 0 + "," + ((bottoms_sort[0]*0.5)+40) + ") rotate(270)" })
            .text("ARTICLE MAPS");
    mainArtSVG.append("line")
                .attr("x1", 1)
                .attr("y1", 0)
                .attr("x2", 1)
                .attr("y2", pub_to_bottom)
                .style("stroke", "#AAA")
                .style("stroke-width", "1px");
    mainArtSVG.append("line")
                .attr("x1", 1)
                .attr("y1", 0)
                .attr("x2", 5)
                .attr("y2", 0)
                .style("stroke", "#AAA")
                .style("stroke-width", "1px");
    mainArtSVG.append("line")
                .attr("x1", 1)
                .attr("y1", pub_to_bottom)
                .attr("x2", 5)
                .attr("y2", pub_to_bottom)
                .style("stroke", "#AAA")
                .style("stroke-width", "1px"); 
    //||||||||||||||||||||||||||||||||||||||||||||||Article Maps: lable  
}


//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: build sentiment visualization
var buildSentiment = function(SentAnalysis){
    r = wordmap.w,
    color = d3.scale.category20(),
    donut = d3.layout.pie().startAngle( 2.93 ).endAngle( 6.07 ).sort(null),
    arc = d3.svg.arc().innerRadius(0).outerRadius(r*0.425),
    senttcolor = d3.interpolate('#B9C5D0', '#D0C5B9' ); //('#8090A0', '#A09080' );
    
    var sent_arcs = sentimentBlock.selectAll("g.arc")
        .data(donut)
      .enter().append("g")
        .attr("class", "arc")
        .style("stroke", "#666")
        .style("stroke-width", "1px")
        .attr("transform", "translate(" + wordmap.w*0.5 + "," + (wordmap.w*0.5) + ") rotate(102.2)");
        
    sent_arcs.append("path")
        .attr("fill", function(d, i) { return senttcolor(i); })
        .attr("opacity", 0.9)
        .attr("d", d3.svg.arc().innerRadius(0).outerRadius(r*0.425));
        
    sent_arcs.append("text")
        .attr("transform", function(d) { 
                                        var angle = (((d.endAngle*180) / 10 * Math.PI)+270);
                                        //console.log(angle); 
                                        if(angle<90){ angle+=180; }
                                        return "translate(" + arc.centroid(d) + ") rotate("+ 260 +")"; 
                                    })
        .attr("dy", ".35em")
        .attr("fill", "#666")
        .style("stroke", "none")
        .style("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("display", function(d) { return d.value > .05 ? null : "none"; }) //if null than "none"
        .text(function(d, i) { return d.value.toFixed(2); });
    
    var x = d3.scale.linear() //this is like map() in Processing
        .domain([0, 1]) //map the max amount to the width of the sketch
        .range([0, (wordmap.w*0.85)-1]);    
        
    sentimentBlock.append("rect")
            .attr("x", wordmap.w*0.075)
            .attr("y", wordmap.w*0.5)
            .attr("width", wordmap.w*0.85)
            .attr("height", 20)
            .style("stroke", "#666")
            .style("stroke-width", "1px")
            .style("fill", "#CBCCCC")
    sentimentBlock.append("rect")
            .attr("x", wordmap.w*0.075)
            .attr("y", (wordmap.w*0.5)+1)
            .attr("width", function(d){ return x(SentAnalysis.neutral)-1; })
            .attr("height", 18)
            .style("stroke", "none")
            //.style("stroke-width", "1px")
            .style("fill", "#FDFFFF"); 
            
    var neutralRound = String(SentAnalysis.neutral).substr(0, 4);    
    sentimentBlock.append("text")
            .attr("x", (wordmap.w*0.075)+4)
            .attr("y", (wordmap.w*0.5)+15)
            .attr("dy", "0")
            .attr("fill", "#777")
            .style("stroke", "none")
            .style("font-size", "11px")
            .attr("text-anchor", "start")  
            .text('NEUTRAL: '+neutralRound)    
    sentimentBlock.append("text")
            .attr("x", 6)
            .attr("y", 26)
            .attr("dy", "0")
            .attr("fill", "#999")
            .style("stroke", "none")
            .style("font-size", "11px")
            .attr("text-anchor", "start")  
            .text('POS:')      
    sentimentBlock.append("text")
            .attr("x", wordmap.w-6)
            .attr("y", 26)
            .attr("dy", "0")
            .attr("fill", "#999")
            .style("stroke", "none")
            .style("font-size", "11px")
            .attr("text-anchor", "end")  
            .text(':NEG') 
}

//////////////////////////////////////////////////////////////////////////////////////////////FUNCTION: transition for all wordrects
var dat = [1];
var counter = 0, color;
var changeWordRects = function(count, conditional){
        dat.forEach(function(d, i) {
            artfile = mainArtSVG.select("#articlefile"+count);
            allwords = artfile.selectAll(".wordrect");
            dataArray[count]["Important"].forEach(function(d, ii){
                try{
                    artfile.selectAll("."+d[0]).transition()
                        //.style("fill", "#000")
                        .style("fill", function() { 
                                        fq = d[1]
                                        //console.log(d[0]+" : "+fq);
                                        color = d3.rgb("hsl("+0+","+(20+fq*10)+","+(90-(fq*2))+")");
                                        return color; 
                                    })
                        .duration(600)
    					.ease("linear",1,1);
                }
                catch(err){}
            });
            dataArray[count]["NamedEnts"].forEach(function(d, ii){
                try{
                    var word = CleanNJoinText(d[1]);
                    //console.log(word);
                    artfile.selectAll("."+word).transition()
                         //.style("fill", "#000")
                        .style("fill", function() { 
                                        fq = $("#"+this.id).attr('freq');
                                        color = d3.rgb("hsl("+0+","+(20+fq*10)+","+(90-(fq*2))+")");
                                        return color; 
                                    })
                        .duration(600)
    					.ease("linear",1,1); 
                }
                catch(err){}
            });
        });
        if(counter < totalstories-1){
            counter++;
            setTimeout(changeWordRects, 600, counter, conditional);
        } else {
            counter = 0;
        }
}
