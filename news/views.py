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

from Corpora.news.util import get_google, get_article, get_sentiment, findTriGrams, tokenize_text_and_tag_named_entities, SetWordDictionary, Find_Important_Words, scrape_pub_from_url, MarkovDictionary, MarkovGenerator, ContextFree, add_rules_from_file
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
            headliner = form.cleaned_data['headline']
            article_url_1 = form.cleaned_data['article_url_1']
            article_url_2 = form.cleaned_data['article_url_2']
            article_url_3 = form.cleaned_data['article_url_3']
            article_url_4 = form.cleaned_data['article_url_4']
            article_url_5 = form.cleaned_data['article_url_5']
            article_url_6 = form.cleaned_data['article_url_6']
            
            try:
                ###################check the db for the masterlink associated with the main article 
                article_exists = Article.objects.filter(headline=headliner)
                if not article_exists.count():
                    ###################if not in db, make an Article, a StoryGroup w/ date, and check for each Publisher to see if it needs to be entered
                    slug = slugify(story[0])
                    existing_storygroup = StoryGroup.objects.filter(slugline=slug)
                    if not existing_storygroup.count():
                        new_storygroup = StoryGroup.objects.create(date=datetime.datetime.now(), slugline=slug)
                    else:
                        None
            except Article.DoesNotExist:
                None
            return HttpResponseRedirect( '/gathering/', {'form': form} ) # Redirect after POST
    else:
        None
        form = GatherForm() # An unbound form
    return render_to_response('news/gather.html', {'form': form}, context_instance=RequestContext(request))
    
def gathering(request, form):
    formpass = form
    return render_to_response('news/gathering.html', {'form': formpass}, context_instance=RequestContext(request))


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
    #SLTRIB.COM always comes up with wired chars and crap
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
    MarkDiction = MarkovDictionary(n=1, max=7)
    MarkGen = MarkovGenerator(n=1, max=6)
    try:
        story = StoryGroup.objects.get(id = storygroup)
        ranje = int(storygroup)   
             
        for idx in range(4):
            ranje = ranje-1
            all_articles1 = Article.objects.filter(group = ranje)[:1] #datetime.date(2012, 04, 19)
            #{'date_time_field__range': (datetime.datetime.combine(date, datetime.time.min),datetime.datetime.combine(date, datetime.time.max))} 
            for art in all_articles1:
                raw_text += art.raw_text
                breaks = nltk.sent_tokenize(art.raw_text)
                for line in breaks:
                    MarkGen.feed(line)
                allText += str(art.raw_text) 
            
        allText = nltk.sent_tokenize(str(allText))
        ARTDICT = MarkDiction.feed(allText)
        
        ####### Make title #######
        entities = { 1: random.choice(['PERSON','ORGANIZATION']), 2: random.choice(['PERSON','ORGANIZATION']) }
        for ent in entities:
            collection = list()
            for key in ARTDICT:
                    for tup in ARTDICT[key]:
                        if tup[1] == entities[ent]:
                            collection.append(tup[0])
            entities[ent] =  (random.choice(collection), entities[ent])
            
        title = "The "+entities[1][0]+" and the "+entities[2][0]

        
        cfree = ContextFree()
        add_rules_from_file(cfree, open("news/test.grammar"))
        opening = random.choice(aesops_starters) + " " + random.choice([ entities[1][0], entities[2][0] ])
        
        for idx in range(6):                
            beginning = MarkGen.generate( "NN" )
            lastword = beginning.split(" ")
            expansion = cfree.get_expansion('VP', ARTDICT, lastword[:-1], entities) #'the'
            sentence = beginning +" "+ ' '.join(expansion)
            #sentence =  ' '.join(expansion)
            if opening != "":
                sentence = opening+" "+sentence+"."
                #opening = random.choice([ entities[1][0], entities[2][0], 'They' ])+" "
                opening = ""
            else: 
                up = sentence[0].upper()
                sentence = up+sentence[1:]+"."
            if r"[Tt]hey" in sentence:
                re.sub(r"\b[Ww]as", "were", str(sentence))
                re.sub(r"\b[Hh]as", "have", str(sentence))
            storylines.append(sentence)
        storylines[-1] = str(storylines[-1][:-1])+", "+random.choice(aesop_ends)
        if r"[Tt]hey" in storylines[-1]:
                re.sub(r"\b[Ww]as", "were", str(sentence))
                re.sub(r"\b[Hh]as", "have", str(sentence))
        storylines.append(random.choice(aesop_morals))
        
                

    except Article.DoesNotExist:
        raise Http404
    return render_to_response('news/poetronix.html', { 'all_articles': all_articles1, 'poem': storylines, 'raw_text': storylines[-1], 'lastword': title })
    
    
    
