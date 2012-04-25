from BeautifulSoup import BeautifulSoup
import re
import urllib2
import urllib
from urlparse import urlparse
import codecs
import json
import nltk
from nltk import FreqDist
from nltk.collocations import *
from Corpora.news.models import Article, Publisher, StoryGroup
from django.template.defaultfilters import slugify
import datetime
#from nltk.tokenize.punkt import PunktSentenceTokenizer


def get_current_path(request):
    return {
       'current_path': request.get_full_path()
     }

def scrape_pub_from_url(link):
    netloca = urlparse(link)
    if "hostednews/ap/"in link:
        pubName = "associatedpress"
    elif "hostednews/afp/"in link:
        pubName = "afp"
    else:
        if "www" in netloca.netloc:
            pubName = netloca.netloc[4:]
        else:
            pubName = netloca.netloc
    return pubName


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
            elif "hostednews/afp/"in link:
                pubName = "afp"
            else:
                if "www" in netloca.netloc:
                    pubName = netloca.netloc[4:]
                else:
                    pubName = netloca.netloc
            paird.append((pubName, link))
        trimTitle = str(titles[idx])
        trimTitle = trimTitle[7:-8]
        #get rid of Publisher name after the dash
        cutPub = re.findall(r"\s-\s+.{3}", trimTitle)
        if len(cutPub) > 0:
            cropmark = trimTitle.find(cutPub[len(cutPub)-1]);
            trimTitle = trimTitle[:cropmark]
        groupedData.append((trimTitle, paird))
        
        
    GScrapeData = {"Masters": masterLinks, "Stories": groupedData}        
    #JSON_output = json.dumps( GScrapeData )#this does not work for parsing in Views 
    return GScrapeData
############################################################################################



#form function formating the headline and links to be passed into makeObjects_fromText()
# def get_fromForm():
#     groupedData = list()
#     masterLinks = list()  
#     
#     for idx, itm in enumerate(items):
#         paird = list();
#         masterlink = #the first link from the form
#         masterLinks.append(masterlink[0])
#         urlSrch = #the link
#         for link in urlSrch:
#             netloca = urlparse(link)
#             if "hostednews/ap/"in link:
#                 pubName = "associatedpress"
#             elif "hostednews/afp/"in link:
#                 pubName = "afp"
#             else:
#                 if "www" in netloca.netloc:
#                     pubName = netloca.netloc[4:]
#                 else:
#                     pubName = netloca.netloc
#             paird.append((pubName, link))
#         trimTitle = str(titles[idx])
#         trimTitle = trimTitle[7:-8]
#         #get rid of Publisher name after the dash
#         cutPub = re.findall(r"\s-\s+.{3}", trimTitle)
#         if len(cutPub) > 0:
#             cropmark = trimTitle.find(cutPub[len(cutPub)-1]);
#             trimTitle = trimTitle[:cropmark]
#         groupedData.append((trimTitle, paird))
#         
#         
#     formData = {"Masters": masterLinks, "Stories": groupedData}        
#     #JSON_output = json.dumps( GScrapeData )#this does not work for parsing in Views 
#     return formData
############################################################################################



#use DiffBot API to get article content
def get_article(link):
    baseurl = "http://www.diffbot.com/api/article?token=721bf45a809f0f2d913973a977bdf550&url="
    request = baseurl+link
    response = urllib.urlopen(request)
    results = json.loads( response.read() )
    try: 
        results["text"]
        rawtext = results["text"].encode('ascii', 'ignore')
    except: 
        rawtext = "Content Unavailable"
    try: 
        media = results["media"]
        for item in media:
            if item['primary'] == "true" and item['type'] == "image":                
                image = item['link']
        print image
    except: 
        image = "None"
    return { 'rawtext': rawtext, 'image': image }
############################################################################################



def makeObjects_fromText(givenObject):

    #///////////////////////GLOBAL VARS FOR ANALYSIS///////////////////
    #//////////////////////////////////////////////////////////////////
    dict_to_json = {}
    dict_to_json['Corpus'] = list() 
    stops = ['Why', 'all', 'Who', 'just', 'being', 'over', 'both', 'Had', 'What', 'Same', 'Yours', 'Does', 'through', 'yourselves', 'Has', 'its', 'before', 'Be', 'We', 'His', 'with', 'had', ',', 'Here', 'should', 'Don', 'to', 'only', 'under', 'Not', 'ours', 'has', 'By', 'Nor', 'do', 'them', 'his', 'They', 'very', 'Of', 'While', 'She', 'they', 'not', 'during', 'now', 'Where', 'him', 'nor', 'Once', 'Because', 'like', 'Just', 'Their', 'did', 'Over', 'Yourself', 'these', 'Both', 't', 'each', 'Further', 'He', 'where', 'Ourselves', 'Before', 'Again', 'because', 'says', 'For', 'doing', 'theirs', 'some', 'About', 'Been', 'Should', 'Whom', 'Only', 'are', 'Which', 'Between', 'our', 'ourselves', 'Were', 'out', 'Down', 'what', 'said', 'for', 'That', 'Very', 'below', 'Until', 'does', 'On', 'above', 'between', 'During', 'Than', '?', 'she', 'Me', 'be', 'we', 'after', 'And', 'This', 'Its', 'Up', 'here', 'S', 'Himself', 'Against', 'Each', 'hers', 'My', 'by', 'on', 'about', 'Ours', 'Being', 'of', 'against', 'Any', 'Doing', 's', 'Itself', 'Through', 'or', 'Then', 'own', 'Her', 'No', 'into', 'There', 'When', 'yourself', 'down', 'Few', 'Too', 'From', 'Was', 'your', '"', 'from', 'her', 'whom', 'Did', 'there', 'Says', 'been', '.', 'few', 'too', 'Such', 'themselves', ':', 'was', 'until', 'Those', 'more', 'himself', 'that', 'These', 'Having', 'but', 'Most', 'Hers', 'So', 'Off', 'off', 'herself', 'than', 'those', 'he', 'me', 'myself', 'Now', 'To', 'this', 'Herself', 'Into', 'up', 'Him', 'will', 'while', 'Other', 'can', 'were', 'Our', 'my', 'Your', 'Out', 'and', 'Above', 'then', 'Some', 'is', 'in', 'am', 'it', 'an', 'How', 'as', 'itself', 'Below', 'at', 'have', 'further', 'Under', 'Themselves', 'An', 'their', 'Or', 'if', 'again', 'Them', 'no', 'Said', 'After', 'when', 'same', 'any', 'how', 'other', 'which', 'Theirs', 'Yourselves', 'you', 'More', 'With', 'Are', 'A', 'Myself', "'t", "'s", 'Like', 'Do', 'I', 'who', 'Can', 'Will', 'most', 'such', 'The', 'But', 'why', 'a', 'All', 'Own', 'don', "'", 'i', 'Is', 'Am', 'It', 'T', 'having', 'As', 'so', 'At', 'Have', 'In', 'the', 'If', 'yours', 'You', 'once', 'also', 'Also']

    uniqueURLS = list()
    masterBool = False
    pubObj = {}
    filler = list()
    Named_in_Sent = dict()
    entitiesString = 'PERSON ORGANIZATION LOCATION DATE TIME MONEY PERCENT FACILITY GSP'
    #//////////////////////////////////////////////////////////////////
    #//////////////////////////////////////////////////////////////////

    
    for idx, story in enumerate(givenObject["Stories"]):
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
                        if link == givenObject["Masters"][idx]: ####################test for main article
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
    return filler
############################################################################################




#GET SENTIMENT ANALYSIS
def get_sentiment(article):
    url = "http://text-processing.com/api/sentiment/"
    values = {'text' : article}
    data = urllib.urlencode(values)
    try: 
        response = urllib.urlopen(url, data)
        sentiment = json.loads( response.read() )
    except:
        sentiment = { 'probability': 'Sentiment Unavailable' }
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
        #senttokens = nltk.word_tokenize(sentence)
        sentLengths.append(sentence)
        for chunk in nltk.ne_chunk(nltk.pos_tag(nltk.word_tokenize(sentence))):
            
            if hasattr(chunk,  'node'):
                if len(chunk.leaves()) == 1 and chunk.leaves()[0][0] == 'Mr.':
                            tmp_group = ((chunk.leaves()[0][1], chunk.leaves()[0][0])) 
                elif chunk.node != 'GPE':
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
    important_list = list()
    filler_list = list()
    for idx, sent in enumerate(text): 
        for idx, tggd_tup in enumerate(sent):                                       
            if tggd_tup[0] in entString:
                allparts = list()
                for word in tggd_tup[1]:
                    wdsubl = annotateToken(word_list, uniqueKey, word, tggd_tup[0], dist, stops, filler_list)
                    allparts.append(wdsubl)
                word_list.append((tggd_tup[0], allparts))              
            else:
                wdsubl = annotateToken(word_list, uniqueKey, tggd_tup[1], tggd_tup[0], dist, stops, important_list)
                word_list.append((tggd_tup[0], wdsubl))
        endofsent = annotateToken(word_list, uniqueKey, "XendsentX", "END", dist, stops, filler_list)
        word_list.append(("END", endofsent))
    return {'word_list': word_list, 'important_list': important_list}

# SubFunction of SetWordDictionary 
def annotateToken(word_list, uniqueKey, token, pos, dist, stops, important_list):
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
        elif len(token) > 3 and dist[token] > 3:
            word_sublist.append(('important', 'yes'))
            important_list.append((token, dist[token]))
        else:
            word_sublist.append(('important', 'no'))
    return word_sublist
############################################################################################



# IMPORTANT WORD INDEX FIND & PLACE
def Find_Important_Words(subdict, text, dist, entString):
    all_important = set()
    for idx, d in enumerate(subdict):
        if d[0] in entString:
            for tup in d[1]:
                inList = list()
                if tup[3][1] == 'no':
                     tup.append(('other_indexes', 0))
                else:
                    #for idx2, w in enumerate(text):
                        #if tup[0][1] == w:
                            #inList.append(idx2)
                    tup.append(('other_indexes', 0))
        else:
            inList = list()
            if d[1][3][1] == 'no': 
                d[1].append(('other_indexes', 0))
            else:
                all_important.add(d[1][0][1])
                #for idx2, w in enumerate(text):
                    #if d[1][0][1] == w:
                        #inList.append(idx2)
                d[1].append(('other_indexes', 0))
    return all_important
############################################################################################



class MarkovGenerator(object):

  def __init__(self, n, max):
    self.n = n # order (length) of ngrams
    self.max = max # maximum number of elements to generate
    self.ngrams = dict() # ngrams as keys; next elements as values
    self.beginnings = list() # beginning ngram of every line

  def tokenize(self, text):
    return str(text).split(" ")

  def feed(self, text):

    tokens = self.tokenize(text)

    # discard this line if it's too short
    if len(tokens) < self.n:
      return

    # store the first ngram of this line
    beginning = tuple(tokens[:self.n])
    self.beginnings.append(beginning) #tuple(['The', 'was'])

    for i in range(len(tokens) - self.n):

      gram = tuple(tokens[i:i+self.n])
      next = tokens[i+self.n] # get the element after the gram

      # if we've already seen this ngram, append; otherwise, set the
      # value for this key as a new list
      if gram in self.ngrams:
        self.ngrams[gram].append(next)
      else:
        self.ngrams[gram] = [next]

  # called from generate() to join together generated elements
  def concatenate(self, source):
    return " ".join(source)

  # generate a text from the information in self.ngrams
  def generate(self, startWord):

    from random import choice

    # get a random line beginning; convert to a list. 
    current = choice(self.beginnings)
    output = list(current)

    for i in range(self.max):
      if current in self.ngrams:
        possible_next = self.ngrams[current]
        next = choice(possible_next)
        next = re.sub(r"[.,!\"\'?:;]", "", str(next))
        output.append(next)
        # get the last N entries of the output; we'll use this to look up
        # an ngram in the next iteration of the loop
        current = tuple(output[-self.n:])
      else:
        break

    output_str = self.concatenate(output)
    return output_str



############################################################################################



class MarkovDictionary(object):

  def __init__(self, n, max):
    self.n = n # order (length) of ngrams
    self.max = max # maximum number of elements to generate
    self.ngrams = dict() # ngrams as keys; next elements as values

  def tokenize(self, text):
    import nltk
    import re
    tokens = list()
    tok = nltk.word_tokenize(text)
    tok_clean = list()
    for w in tok:
        if len(w) > 3:
            clean = re.sub(r"[.,!\"?():;]", "", str(w))
        elif "'" in w and len(w) < 4:
            clean = ""
        else:
            clean = w
        tok_clean.append(clean)
        
    
    for chunk in nltk.ne_chunk(nltk.pos_tag(tok_clean)):
            if hasattr(chunk,  'node'):
                if chunk.node != 'GPE':
                    tmp_group = ( (' '.join(c[0] for c in chunk.leaves())), chunk.node )
                    #uniqueNmdEnt.add((chunk.node, [(' '.join(c[0] for c in chunk.leaves()))]));
                else:
                    tmp_group = ( (' '.join(c[0] for c in chunk.leaves())), 'LOCATION' ) #[(' '.join(c[0] for c in chunk.leaves()))]
                    #uniqueNmdEnt.add(('LOCATION', (' '.join(c[0] for c in chunk.leaves()))));
                tokens.append(tmp_group)
            else:
                tokens.append((chunk[0], chunk[1]))
    return tokens

  def feed(self, text):
    import nltk
    tokens = self.tokenize(str(text))

    # discard this line if it's too short
    if len(tokens) < self.n:
      return

    for i in range(len(tokens) - self.n):

      gram = tuple(tokens[i:i+self.n])
      next = tokens[i+self.n] # get the element after the gram

      # if we've already seen this ngram, append; otherwise, set the
      # value for this key as a new list
      if gram[0][0] in self.ngrams:
        tagged = next
        self.ngrams[gram[0][0]].append(tagged)
      else:
        tagged = next
        self.ngrams[gram[0][0]] = [tagged]
    return self.ngrams
    
############################################################################################


class ContextFree(object):
    
  def __init__(self):
    self.rules = dict()
    self.expansion = list()
    self.prev_word = ""
    self.prev_start = ""
    self.ART_DICT = {}

  # rules are stored in self.rules, a dictionary; the rules themselves are
  # lists of expansions (which themselves are lists)
  def add_rule(self, rule, expansion): 
    if rule in self.rules:
      self.rules[rule].append(expansion)
    else:
      self.rules[rule] = [expansion]

  def expand(self, start):

    import random

    # if the starting rule was in our set of rules, then we can expand it 
    if start in self.rules:
      possible_expansions = self.rules[start]
      # grab one possible expansion
      random_expansion = random.choice(possible_expansions)
      # call this method again with the current element of the expansion
      for elem in random_expansion:
        self.expand(elem)
    else:
      # if the rule wasn't found, then it's a terminal: simply append the
      # string to the expansion
      #print start + " : " + self.prev_word
      fword = self.find_a_word(start, self.prev_word)
      self.expansion.append(fword)
                                                                                #if len(self.expansion)>3:
      #self.expansion.append(prev_word)

  # utility method to run the expand method and return the results
  def get_expansion(self, axiom, ARTDICT, lastword):
    del self.expansion[:]
    clean = re.sub(r"[.,!\"?():;]", "", str(lastword))
    self.prev_word = clean
    self.ART_DICT = ARTDICT
    self.expand(axiom)
    return self.expansion
    
  def find_a_word(self, pos, prev):
    import random
    word = ""
    wordcollection = list()
    choices = list()
    #print " "
    #print " "
    #print "The previous word was = \""+prev+"\". The next word should be p.o.s "+start
    
    if pos == "IS":
        word = "is"
    elif pos == "CC":
        word = random.choice(['and', 'but', 'although', 'though', 'and'])
    else:
        try:
            for tup in self.ART_DICT[prev]:
                if tup[1] == pos:
                    choices.append(tup[0])
            #print "MarkovDictionary choices are:"
            #print choices
        except:
            None
            
        if len(choices) > 0:
            word = random.choice(choices)
        else:
            for key in self.ART_DICT:
                for tup in self.ART_DICT[key]:
                    if tup[1] == pos:
                        wordcollection.append(tup[0])
            #if len(wordcollection)>0:
            word = random.choice(wordcollection)
        #if word == "":
            #self.find_a_word(start, self.prev_word)
    self.prev_word = word
    self.prev_start = pos
    return word
############################################################################################


def add_rules_from_file(cfree, file_obj):
  # rules are stored in the given file in the following format:
  # Rule -> a | a b c | b c d
  # ... which will be translated to:
  # self.add_rule('Rule', ['a'])
  # self.add_rule('Rule', ['a', 'b', 'c'])
  # self.add_rule('Rule', ['b', 'c', 'd'])
  for line in file_obj:
    line = re.sub(r"#.*$", "", line) # get rid of comments
    line = line.strip() # strip any remaining white space
    match_obj = re.search(r"(\w+) *-> *(.*)", line)
    if match_obj:
      rule = match_obj.group(1)
      expansions = re.split(r"\s*\|\s*", match_obj.group(2))
      for expansion in expansions:
        expansion_list = expansion.split(" ")
        cfree.add_rule(rule, expansion_list)




