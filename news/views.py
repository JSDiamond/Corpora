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

from Corpora.news.util import get_google, get_article, get_sentiment, findTriGrams, tokenize_text_and_tag_named_entities, SetWordDictionary, Find_Important_Words, MarkovGenerator
from Corpora.news.models import Article, Publisher, StoryGroup
from forms import GatherForm


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
            headline = form.cleaned_data['headline']
            article_url = form.cleaned_data['article_url']
            headline = forms.CharField(max_length=100)
            return HttpResponseRedirect( '/gathering/', {'form': form} ) # Redirect after POST
    else:
        None
        form = GatherForm() # An unbound form
    return render_to_response('news/gather.html', {'form': form}, context_instance=RequestContext(request))
    
def gathering(request, form):
    form = form
    return render_to_response('news/gathering.html', {'form': form}, context_instance=RequestContext(request))


def special(request):
    masterBool = False
    pubObj = {}
    filler = list()
    
    #///////////////////////GLOBAL VARS FOR ANALYSIS///////////////////
    #//////////////////////////////////////////////////////////////////
    dict_to_json = {}
    dict_to_json['Corpus'] = list() 
    stops = ['Why', 'all', 'Who', 'just', 'being', 'over', 'both', 'Had', 'What', 'Same', 'Yours', 'Does', 'through', 'yourselves', 'Has', 'its', 'before', 'Be', 'We', 'His', 'with', 'had', ',', 'Here', 'should', 'Don', 'to', 'only', 'under', 'Not', 'ours', 'has', 'By', 'Nor', 'do', 'them', 'his', 'They', 'very', 'Of', 'While', 'She', 'they', 'not', 'during', 'now', 'Where', 'him', 'nor', 'Once', 'Because', 'like', 'Just', 'Their', 'did', 'Over', 'Yourself', 'these', 'Both', 't', 'each', 'Further', 'He', 'where', 'Ourselves', 'Before', 'Again', 'because', 'says', 'For', 'doing', 'theirs', 'some', 'About', 'Been', 'Should', 'Whom', 'Only', 'are', 'Which', 'Between', 'our', 'ourselves', 'Were', 'out', 'Down', 'what', 'said', 'for', 'That', 'Very', 'below', 'Until', 'does', 'On', 'above', 'between', 'During', 'Than', '?', 'she', 'Me', 'be', 'we', 'after', 'And', 'This', 'Its', 'Up', 'here', 'S', 'Himself', 'Against', 'Each', 'hers', 'My', 'by', 'on', 'about', 'Ours', 'Being', 'of', 'against', 'Any', 'Doing', 's', 'Itself', 'Through', 'or', 'Then', 'own', 'Her', 'No', 'into', 'There', 'When', 'yourself', 'down', 'Few', 'Too', 'From', 'Was', 'your', '"', 'from', 'her', 'whom', 'Did', 'there', 'Says', 'been', '.', 'few', 'too', 'Such', 'themselves', ':', 'was', 'until', 'Those', 'more', 'himself', 'that', 'These', 'Having', 'but', 'Most', 'Hers', 'So', 'Off', 'off', 'herself', 'than', 'those', 'he', 'me', 'myself', 'Now', 'To', 'this', 'Herself', 'Into', 'up', 'Him', 'will', 'while', 'Other', 'can', 'were', 'Our', 'my', 'Your', 'Out', 'and', 'Above', 'then', 'Some', 'is', 'in', 'am', 'it', 'an', 'How', 'as', 'itself', 'Below', 'at', 'have', 'further', 'Under', 'Themselves', 'An', 'their', 'Or', 'if', 'again', 'Them', 'no', 'Said', 'After', 'when', 'same', 'any', 'how', 'other', 'which', 'Theirs', 'Yourselves', 'you', 'More', 'With', 'Are', 'A', 'Myself', "'t", "'s", 'Like', 'Do', 'I', 'who', 'Can', 'Will', 'most', 'such', 'The', 'But', 'why', 'a', 'All', 'Own', 'don', "'", 'i', 'Is', 'Am', 'It', 'T', 'having', 'As', 'so', 'At', 'Have', 'In', 'the', 'If', 'yours', 'You', 'once', 'also', 'Also']

    uniqueURLS = list()
    Named_in_Sent = dict()
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
                filler.append("_NewArticle , ")
                ###################if not in db, make an Article, a StoryGroup w/ date, and check for each Publisher to see if it needs to be entered
                slug = slugify(story[0])
                existing_storygroup = StoryGroup.objects.filter(slugline=slug)
                if not existing_storygroup.count():
                    new_storygroup = StoryGroup.objects.create(date=datetime.datetime.now(), slugline=slug)
                else:
                    continue
                for link in story[1]:
                    if link in uniqueURLS:
                        None
                    else:
                        uniqueURLS.append(link) 
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
                        diffobj = get_article(link[1])
                        rawtext = diffobj['rawtext']
                        imagelink = diffobj['image']
                        ####################################### Tokenize
                        TrueTextWords = nltk.word_tokenize(rawtext)
                        #whitespace = nltk.WhitespaceTokenizer()
                        #spaceTokens = whitespace.tokenize(rawtext)
                        ####################################### Frequence Distribution
                        fdist = FreqDist(TrueTextWords)
                        ####################################### Sentiment Anaylsis
                        sentiment = get_sentiment(rawtext)
                        ####################################### Decent Quotation Finder
                        quoteSrch = re.findall(r'"([^"]*)"', (rawtext)) 
                        ####################################### Find TriGrams
                        dict_to_json['TriGrams'] = findTriGrams(TrueTextWords)
                        ####################################### Token break and Find Named Entities
                        TTATNE = tokenize_text_and_tag_named_entities(rawtext)
                        Sentities = TTATNE["SB"]
                        ####################################### FILL DICT WITH DATA 
                        annotate = SetWordDictionary(Sentities, fdist, entitiesString, stops)
                        dict_to_json['Corpus'] = annotate['word_list']
                        dict_to_json['Important'] = annotate['important_list']
                        ####################################### IMPORTANT WORD INDEX FIND & PLACE
                        all_important = Find_Important_Words(dict_to_json['Corpus'], TrueTextWords, fdist, entitiesString)
                        Imporatnt_Named = list()
                        NamedEnts = list(TTATNE["UNE"])
                        Sentences = TTATNE["SL"]
                        ######################################################## FIND IMPORTANT WORDS IN SENTENCES WITH NAMED ENTS
                        for ent in NamedEnts: 
                            wordset = set()
                            for sent in Sentences:
                                if ent[1] in sent:
                                    for word in all_important:
                                        if word in sent:
                                            wordset.add(word)
                            if len(wordset) > 0:
                                Imporatnt_Named.append((ent[1], list(wordset)))
                        ######################################################## WRITE DATA TO DICTIONARY
                        dict_to_json['NamedEnts'] = list(TTATNE["UNE"])
                        dict_to_json['Sentiment'] = sentiment['probability']
                        dict_to_json['Imporatnt_Named'] = Imporatnt_Named
                        #dict_to_json['SentLengths'] = TTATNE["SL"]
                        #dict_to_json['Numbers'] = list(TTATNE["AN"])
                        dict_to_json['Quotes'] = quoteSrch
                        #dict_to_json['Raw_Text'] = rawtext
                        JSON_output = json.dumps( dict_to_json )
                        new_article = Article.objects.create(headline=story[0], url=link[1], date=datetime.datetime.now(), group=new_storygroup, raw_text=rawtext, image_link=imagelink, analyzed_text=JSON_output, master=masterBool, publisher=pubObj)
        except Article.DoesNotExist:
            filler.append(" Database error ")
    
    return HttpResponse(filler)




def poetronix(request, storygroup):
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
    
    
    
