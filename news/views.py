from django.http import HttpResponse
from django.template import Context, loader
from django.shortcuts import render_to_response
import datetime

from Corpora.news.util import get_google
from Corpora.news.models import Article, Publisher, StoryGroup


def special(request):
    masterBool = False
    pubObj = {}
    filler = list()
    output = get_google() #call function from util.py   
    for idx, story in enumerate(output["Stories"]):
        filler.append(idx)
        try:
            ###################check the db for the masterlink associated with the main article 
            article_exists = Article.objects.filter(headline=story[0])
            if len(article_exists)>0:
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
                    #RUN THE CORPORA_ARTICLESENT SCRIPT ON TO GET THE RAW_TEXT AND PARSE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                    new_article = Article.objects.create(headline=story[0], url=link[1], date=datetime.datetime.now(), group=new_storygroup, raw_text="blank", analyzed_text = "blank", master = masterBool, publisher = pubObj)
        except Article.DoesNotExist:
            filler.append(" Database error ")
    
    return HttpResponse(filler)


def liststories(request):

    latest_news = Article.objects.all().order_by('-date')[:20]
    return render_to_response('news/news.html', {'latest_news': latest_news, 'jeremy': 'hi'})
    
    






# group = models.ForeignKey(StoryGroup)
# headline = models.TextField(blank=True)
# date = models.DateTimeField(null=True, blank=True)
# url = models.CharField(max_length=255)
# raw_text = models.TextField()
# analyzed_text = models.TextField()
# master = models.BooleanField(default=False)
# publisher = models.ForeignKey(Publisher)