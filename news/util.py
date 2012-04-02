from BeautifulSoup import BeautifulSoup
from urlparse import urlparse
import re
import urllib2
import urllib
from urlparse import urlparse
import codecs
import json
import nltk
from nltk import FreqDist
from nltk.corpus import stopwords
from nltk.collocations import *
from nltk.tokenize.punkt import PunktSentenceTokenizer


def write_hello():
    return "hello"

#scrape Google News for stories and links
def get_google():
    url = "http://news.google.com/news?output=rss"
    groupedData = list()
    masterLinks = list()
    
    f = urllib2.urlopen(url).read()
    soup = BeautifulSoup(f)
    titles = soup.findAll('title');
    titles = titles[2:]
    items = soup.findAll('item')
    descripts = soup.findAll('description')
    descripts = descripts[:-1]
    
    
    for idx, itm in enumerate(items):
        paird = list();
        masterlink = re.findall(r"k />+\S*<g", str(itm))
        masterlink = re.findall(r"url=+\S*<g", str(masterlink))
        masterlink = [link[4:-2] for link in masterlink]
        masterLinks.append(masterlink[0])
        descript = itm.find('description')
        urlSrch = re.findall(r"url=+\S*&quot", str(descript))
        urlSrch = [link[4:-5] for link in urlSrch]
        for link in urlSrch:
            netloca = urlparse(link)
            if "hostednews/ap/"in link:
                pubName = "associatedpress"
            else:
                if "www" in netloca.netloc:
                    pubName = netloca.netloc[4:]
                else:
                    pubName = netloca.netloc
            paird.append((pubName, link))
        trimTitle = str(titles[idx])
        trimTitle = trimTitle[7:-8]
        #get rid of Publisher name after the dash
        cutPub = re.findall(r"\s-\s+.{5}", trimTitle)
        if len(cutPub) > 0:
            cropmark = trimTitle.find(cutPub[len(cutPub)-1]);
            trimTitle = trimTitle[:cropmark]
        groupedData.append((trimTitle, paird))
        
        
    GScrapeData = {"Masters": masterLinks, "Stories": groupedData}        
    JSON_output = json.dumps( GScrapeData )#this does not work for parsing in Views 
    return GScrapeData
    #return JSON_output
############################################################################################



#use DiffBot API to get article content
def get_article(link):
    baseurl = "http://www.diffbot.com/api/article?token=721bf45a809f0f2d913973a977bdf550&url="
    request = baseurl+link
    response = urllib.urlopen(request)
    rawtext = json.loads( response.read() )
    if rawtext["text"]:
        rawtext = rawtext["text"].encode('ascii', 'ignore')
    else: 
        rawtext = "Content Unavailable"
    return rawtext
############################################################################################


#GET SENTIMENT ANALYSIS
def get_sentiment(article):
    url = "http://text-processing.com/api/sentiment/"
    values = {'text' : article}
    data = urllib.urlencode(values)
    response = urllib.urlopen(url, data)
    sentiment = json.loads( response.read() )
    return sentiment
############################################################################################   



# FIND TRI-GRAMS
def findTriGrams(text):    
    trigram_measures = nltk.collocations.TrigramAssocMeasures()
    trifinder = TrigramCollocationFinder.from_words( text )
    # only n-grams that appear 3+ times
    trifinder.apply_freq_filter(3)
    # return the 10 n-grams with the highest PMI
    return trifinder.nbest(trigram_measures.pmi, 10)
############################################################################################   
    


#Based on code by http://gavinmhackeling.com/blog ########## FIND ENTITIES
def tokenize_text_and_tag_named_entities(text):
    sentenceBlock = []
    sentLengths = list() 
    uniqueNmdEnt = set() 
    allNums = set() 
    # split the source string into a list of sentences
    # for each sentence, split it into words and tag the word with its PoS
    # send the words to the named entity chunker
    # for each chunk containing a Named Entity, add to list
    # and append it to the list of tokens for the sentence
    # for each chunk that does not contain a NE, add the word & pos to the list of tokens for the sentence
    for sentence in nltk.sent_tokenize(text):
        tokens = []
        senttokens = nltk.word_tokenize(sentence)
        sentLengths.append(len(senttokens))
        for chunk in nltk.ne_chunk(nltk.pos_tag(nltk.word_tokenize(sentence))):
            if hasattr(chunk,  'node'):
                if chunk.node != 'GPE':
                    tmp_group = (chunk.node,  [c[0] for c in chunk.leaves()])
                    uniqueNmdEnt.add((chunk.node, (' '.join(c[0] for c in chunk.leaves()))));
                else:
                    tmp_group = ('LOCATION',  [c[0] for c in chunk.leaves()]) #[(' '.join(c[0] for c in chunk.leaves()))]
                    uniqueNmdEnt.add(('LOCATION', (' '.join(c[0] for c in chunk.leaves()))));
                tokens.append(tmp_group)
            else:
                tokens.append((chunk[1], chunk[0]))
                if chunk[1] == 'CD':
                    allNums.add(chunk[0]);
        sentenceBlock.append(tokens)
    return { "SB": sentenceBlock, "SL": sentLengths, "UNE": uniqueNmdEnt, "AN": allNums }
############################################################################################



# SET ALL PLACES IN DICT
def SetWordDictionary(text, dist, entString, stops):
    word_list = list()
    uniqueKey = dict()
    for idx, sent in enumerate(text): 
        for idx, tggd_tup in enumerate(sent):                                       
            if tggd_tup[0] in entString:
                allparts = list()
                for word in tggd_tup[1]:
                    wdsubl = annotateToken(word_list, uniqueKey, word, tggd_tup[0], dist, stops)
                    allparts.append(wdsubl)
                word_list.append((tggd_tup[0], allparts))              
            else:
                wdsubl = annotateToken(word_list, uniqueKey, tggd_tup[1], tggd_tup[0], dist, stops)
                word_list.append((tggd_tup[0], wdsubl))
        endofsent = annotateToken(word_list, uniqueKey, "XendsentX", "END", dist, stops)
        word_list.append(("END", endofsent))
    return word_list

# SubFunction of SetWordDictionary 
def annotateToken(word_list, uniqueKey, token, pos, dist, stops):
    word_sublist = list()
    word_sublist.append(('token', token))                            #add the token
    #word_sublist.append(('pos', pos))                               #add the part of speech
    if dist[token]:
        if token in stops: 
            word_sublist.append(('freq', 0))
        else:
            word_sublist.append(('freq', dist[token]))                #add the frequency distribution
    else:
        word_sublist.append(('freq', 0))
    
    word_sublist.append(('length', len(token)))                       #add char length
    
    if token in uniqueKey:
        uniqueKey[token] += 1
        word_sublist.append(('important', 'no'))
    else:
        uniqueKey[token] = 1
        if token in stops:
            word_sublist.append(('important', 'no'))
        elif len(token) > 2 and dist[token] > 2:
            word_sublist.append(('important', 'yes'))
        else:
            word_sublist.append(('important', 'no'))
    return word_sublist
############################################################################################



# IMPORTANT WORD INDEX FIND & PLACE
def Find_Important_Words(subdict, text, dist, entString):
     for idx, d in enumerate(subdict):
        if d[0] in entString:
            for tup in d[1]:
                inList = list()
                if tup[3][1] == 'no':
                     tup.append(('other_indexes', 0))
                else:
                    for idx2, w in enumerate(text):
                        if tup[0][1] == w:
                            inList.append(idx2)
                    tup.append(('other_indexes', inList))
        else:
            inList = list()
            if d[1][3][1] == 'no': 
                d[1].append(('other_indexes', 0))
            else:
                for idx2, w in enumerate(text):
                    if d[1][0][1] == w:
                        inList.append(idx2)
                d[1].append(('other_indexes', inList))
############################################################################################




