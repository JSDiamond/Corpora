from django.http import HttpResponse
from django.template import Context, loader
from django.shortcuts import render_to_response

import nltk
import re
import json
from nltk.corpus import stopwords
from nltk import FreqDist
import datetime

from Corpora.news.util import get_google, get_article, get_sentiment, findTriGrams, tokenize_text_and_tag_named_entities, SetWordDictionary, Find_Important_Words, MarkovGenerator
from Corpora.news.models import Article, Publisher, StoryGroup


def liststories(request):
    grouped_news = list()
    latest_news = list()
    latest_storygroups = StoryGroup.objects.all().order_by('-date')[:10]
    for idx, story in enumerate(latest_storygroups):
        grouped_news.append(Article.objects.filter(group = story)[:6])
        latest_news.append(grouped_news)
    #latest_news = Article.objects.all().order_by('-date')[:20]
    return render_to_response('news/news.html', {'latest_news': latest_news})



def collate(request, storygroup):
    try:
        all_articles = Article.objects.filter(group = storygroup)[:6]
    except Article.DoesNotExist:
        raise Http404
    return render_to_response('news/collate.html', {'all_articles': all_articles})
    

def getdata(request, storygroup):
    try:
        all_articles = Article.objects.filter(group = storygroup)[:6]
        data_array = list()
        for idx, art in enumerate(all_articles):
            data_array.append(art.analyzed_text)
    except Article.DoesNotExist:
        raise Http404
    return HttpResponse(json.dumps(data_array), mimetype="application/json")



def special(request):
    masterBool = False
    pubObj = {}
    filler = list()
    
    #///////////////////////GLOBAL VARS FOR ANALYSIS///////////////////
    #//////////////////////////////////////////////////////////////////
    dict_to_json = {}
    dict_to_json['Corpus'] = list() 
    stops = set(stopwords.words('english'))
    stops.add('.')
    stops.add("'s")
    stops.add("'t")
    stops.add(",")
    stops.add(":")
    stops.add("?")
    stops.add("\"")
    stops.add("\'")
    entitiesString = 'PERSON ORGANIZATION LOCATION DATE TIME MONEY PERCENT FACILITY GSP'
    #//////////////////////////////////////////////////////////////////
    #//////////////////////////////////////////////////////////////////
    
    output = get_google() #call function from util.py   
    for idx, story in enumerate(output["Stories"]):
        filler.append(idx)
        try:
            ###################check the db for the masterlink associated with the main article 
            article_exists = Article.objects.filter(headline=story[0])
            if len(article_exists)<1:
                filler.append(" New Article ")
                ###################if not in db, make an Article, a StoryGroup w/ date, and check for each Publisher to see if it needs to be entered 
                new_storygroup = StoryGroup.objects.create(date=datetime.datetime.now())
                for link in story[1]:
                    if link == output['Masters'][idx]: ####################test for main article
                        masterBool = True
                    else:
                        masterBool = False
                    try: ##################################################test for prexisting publisher
                        pub_exists = Publisher.objects.get(name=link[0])
                        pubObj = pub_exists
                    except Publisher.DoesNotExist:
                        new_publisher = Publisher.objects.create(name=link[0])
                        pubObj = new_publisher
                        
                    ####################################### DiffBot API call for content
                    rawtext = get_article(link[1])
                    ####################################### Tokenize
                    TrueTextWords = nltk.word_tokenize(rawtext)
                    whitespace = nltk.WhitespaceTokenizer()
                    spaceTokens = whitespace.tokenize(rawtext)
                    ####################################### Frequence Distribution
                    fdist = FreqDist(TrueTextWords)
                    ####################################### Sentiment Anaylsis
                    sentiment = get_sentiment(rawtext)
                    ####################################### Decent Quotation Finder
                    quoteSrch = re.findall(r'"([^"]*)"', (rawtext)) 
                    ####################################### Find TriGrams
                    dict_to_json['TriGrams'] = findTriGrams(spaceTokens)
                    ####################################### Token break and Find Named Entities
                    TTATNE = tokenize_text_and_tag_named_entities(rawtext)
                    Sentities = TTATNE["SB"]
                    ####################################### FILL DICT WITH DATA 
                    dict_to_json['Corpus'] = SetWordDictionary(Sentities, fdist, entitiesString, stops)
                    ####################################### IMPORTANT WORD INDEX FIND & PLACE
                    Find_Important_Words(dict_to_json['Corpus'], TrueTextWords, fdist, entitiesString)
                    dict_to_json['NamedEnts'] = list(TTATNE["UNE"])
                    dict_to_json['Sentiment'] = sentiment['probability']
                    dict_to_json['Sentiment'] = sentiment['probability']
                    dict_to_json['SentLengths'] = TTATNE["SL"]
                    dict_to_json['Numbers'] = list(TTATNE["AN"])
                    dict_to_json['Quotes'] = quoteSrch
                    dict_to_json['Raw_Text'] = rawtext
                    JSON_output = json.dumps( dict_to_json )
                    #PARSE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                    new_article = Article.objects.create(headline=story[0], url=link[1], date=datetime.datetime.now(), group=new_storygroup, raw_text=rawtext, analyzed_text=JSON_output, master=masterBool, publisher=pubObj)
        except Article.DoesNotExist:
            filler.append(" Database error ")
    
    return HttpResponse(filler)




def poetry(request, storygroup):
    allText = ""
    poem = list()
    generator = MarkovGenerator(n=1, max=7)
    try:
        all_articles = Article.objects.filter(group = storygroup)[:6]
        for art in all_articles:
            allText += str(art.raw_text)
        allText = nltk.sent_tokenize(allText)
        for line in allText:
            line = line.strip()
            generator.feed(line)
            #poem+=allText
        for i in range(5):
            poem.append(generator.generate())
    except Article.DoesNotExist:
        raise Http404
    return render_to_response('news/poetry.html', {'all_articles': all_articles, 'poem': poem})
    
    
# Trayvon Martin coverage: Republicans, many whites say 'enough'    
# The two sides also continued.
# "I do think we need to the foreseeable future as first
# " Karas questioned 1,000 adults.
# The Los Angeles Times reports this instance.
# The results were committed by black male.

# Obama: Republicans Want 'Radical Vision' for America
# He also includes tax code fairer by requiring
# "Who are allowed to policies but has
# That's part or mortgage lenders.
# It's patriotism.
# My mother and the right thing to consider
    
    