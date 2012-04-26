from django.db import IntegrityError
from django.http import HttpResponse
from django.template import Context, loader
from django.template.defaultfilters import slugify
from django.shortcuts import render_to_response
from django.core.context_processors import csrf
from django.template import RequestContext
import nltk
import re
import json
#from nltk.corpus import stopwords
from nltk import FreqDist
import datetime

from Corpora.news.util import get_google, makeObjects_fromText, get_article, get_sentiment, findTriGrams, tokenize_text_and_tag_named_entities, SetWordDictionary, Find_Important_Words, scrape_pub_from_url, MarkovDictionary, MarkovGenerator, ContextFree, add_rules_from_file
from Corpora.news.models import Article, Publisher, StoryGroup
from forms import GatherForm



def splash(request):
    return render_to_response('news/splash.html', {})
    


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
            data_array.append(json.loads(art.analyzed_text))
    except Article.DoesNotExist:
        raise Http404
    return HttpResponse(json.dumps(data_array), mimetype="application/json")



def gather(request):
    if request.method == 'POST': # If the form has been submitted...
        form = GatherForm(request.POST) # A form bound to the POST data
        
        if form.is_valid(): # All validation rules pass
            headliner = form.cleaned_data['headline']
                        
            #print form
            
            #article_url_1 = form.cleaned_data['article_url_1']
                        
            #Call the GET_FROMFORM() function and send the new url back to the page

            return HttpResponse(json.dumps("backatchya"), mimetype="application/json")
    else:
        form = GatherForm() # An unbound form
    return render_to_response('news/gather.html', {'form': form}, context_instance=RequestContext(request))
    
    
    
def gathering(request, form):
    formpass = form
    return render_to_response('news/gathering.html', {'form': formpass}, context_instance=RequestContext(request))


def special(request):
    
    #SLTRIB.COM always comes up with wired chars and crap
    
    output = get_google() #call function from util.py   
    
    filler = makeObjects_fromText(output)
    
    return HttpResponse(filler)




def poetronix(request, storygroup):
    import datetime
    import random
    aesops_starters = [ 'It happened that', 'One day,', 'One hot summer\'s day,', 'At one time,', 'Long ago,' ]
    aesop_quotes = [ 'found great difficulty in', 'on his way home', 'was so tickled at the idea of', 'and singing to his heart\'s content', 'and continued its toil', 'by an unlucky chance' ] 
    aesop_ends = [ 'and was never seen again.', 'finally giving up the chase.', 'and shall never forget it.', 'recommending you to do the same.', 'and took this advice.' ]
    aesop_morals = [ 'It is best to prepare for the days of necessity.', 'So, appearances are deceptive.', 'So, little friends may prove great friends.', 'Never trust the advice of a man in difficulties.', 'Beware lest you lose the substance by grasping at the shadow.', 'People often grudge others what they cannot enjoy themselves.', 'It is easy to despise what you cannot get.', 'One bad turn deserves another.', 'Self-conceit may lead to self-destruction.', 'Incentive spurs effort' ] 
    allText = ""
    poem = list()
    raw_text = ""
    opening = ""
    storylines = list()
    ARTDICT = {}
    link = ""
    lineSetting = 5
    materials = list()
    MarkDiction = MarkovDictionary(n=1, max=7)
    MarkGen = MarkovGenerator(n=1, max=4)
    try:
        story = StoryGroup.objects.get(id = storygroup)
        ranje = int(storygroup)   
             
        for idx in range(1):
            all_articles1 = Article.objects.filter(group = ranje)[:6] #datetime.date(2012, 04, 19)
            link = all_articles1[0].url
            print all_articles1
            print all_articles1[0]
            print all_articles1[0].url
            ranje = ranje-1
            #{'date_time_field__range': (datetime.datetime.combine(date, datetime.time.min),datetime.datetime.combine(date, datetime.time.max))} 
            materials.append(storygroup)
            for art in all_articles1:
                raw_text += art.raw_text
                #breaks = nltk.sent_tokenize(art.raw_text)
                #for line in breaks:
                    #MarkGen.feed(line)
                allText += str(art.raw_text)
                 
        allText = re.sub(r"[!\"?()\[\]\\\/:;]", "", str(allText))  
        allText = nltk.sent_tokenize(str(allText))
        ARTDICT = MarkDiction.feed(allText)
                
        cfree = ContextFree()
        add_rules_from_file(cfree, open("news/grammar.txt"))
        
         ####### Make title #######
        title = cfree.get_expansion('Title', ARTDICT, '')
        title[0] = str(title[0][0].upper()) + str(title[0][1:])
        title[2] = str(title[2][0].upper()) + str(title[2][1:])
        title = ' '.join(title)
        
        for idx in range(lineSetting*3):                
            
            #beginning = MarkGen.generate( "NN" )
            #lastword = beginning.split(" ")
            breakdown = idx % lineSetting
            expansion = cfree.get_expansion( str(breakdown), ARTDICT, '') #'the' lastword[:-1]
            #sentence = beginning +" "+ ' '.join(expansion)
            sentence =  ' '.join(expansion)
            if opening != "":
                sentence = opening+" "+sentence+"."
                opening = ""
            else: 
                sentence = re.sub(r"[!\"?()\[\]:;]", "", str(sentence))
                sentence = sentence.lower()
                up = str(sentence[0].upper())
                sentence = up + str(sentence[1:])
            #if r"[Tt]hey" in sentence:
            sentence = re.sub(r"\b[Ww]as", "were", str(sentence))
            #sentence = re.sub(r"\b[Hh]as", "have", str(sentence))
            up = str(sentence[0].upper())
            sentence = up + str(sentence[1:]) + "."
            storylines.append(sentence)
            if idx % lineSetting == lineSetting-1:
                storylines.append("-----")
        #storylines[-1] = str(storylines[-1][:-1])+", "+random.choice(aesop_ends)
        #storylines.append(random.choice(aesop_morals))
        
                

    except Article.DoesNotExist:
        raise Http404
    return render_to_response('news/poetronix.html', { 'all_articles': materials, 'poem': storylines, 'raw_text': storylines[-1], 'lastword': title, 'link': link })
    
    
    
