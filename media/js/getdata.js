$(document).ready(function(){ 
    var current_url = window.location.toString();
    story = window.location.pathname.substr(7);    
    geturl = "http://"+window.location.host+"/getdata/"+story;
    $.get(geturl, function(data) {
      console.log(data);
      articleStorageArray = data;
      setTimeout(startEverything, 100, articleStorageArray);
    });
});


//////////////////////////////////////////////////////////////////////////////////////////////VARIABLES: starter globals
var filesArray; //use this to store the svg objects for each article (set by selectAll class)
var dataArray = []; //use this to store the data objects for each article
var w = window.innerWidth-120, h = window.innerHeight-0, w2 = w*0.5, h2 = h*0.5;
var articleStorageArray, totalstories, mainSVG, langmap, articlefile, simInfo;
var entitiesString = ['PERSON', 'ORGANIZATION', 'LOCATION', 'DATE', 'TIME', 'MONEY', 'PERCENT', 'FACILITY', 'GSP'];
var wordmap = { w: 0, h: 0, boxH: 6},  spacing  = 40, wordCount = 0;
var namedOnScreen = false;

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
            .attr("transform", function(d,i){ return "translate("+((i*wordmap.w)+(i*spacing))+",100)"; });
    
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


//////////////////////////////////////////////////////////////////////////////FUNCTION: take apart the JSON and organize for visualization
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
                        if(column == 3){console.log(concat)};
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
    console.log(articleData);
    dataArray.push(articleData);
    setTimeout(callback, 1000, articleData, column);///////////CALLBACK (initChart): wait 1s for load
}


//////////////////////////////////////////////////////////////////////////////FUNCTION: make article column map of rects
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
					.call(function(){$(".innerText").css({"color": "#bbb"});})
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
    
    //compareCorpora(article_data, column); ///////////////////CALL: send the data for this article to concordance function
}

