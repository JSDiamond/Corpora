from django.http import HttpResponse
from django.template import Context, loader
from django.shortcuts import render_to_response
import datetime

from Corpora.news.util import get_google
from Corpora.news.models import Story


def special(request):

    output = get_google()
    for story in output:
        try:
            story_exists = Story.objects.get(headline=story[0])
        except Story.DoesNotExist:
            new_story = Story()
            new_story.headline = story[0]
            new_story.save()
            new_story = Story.objects.create(headline=story[0], links=story[1], date=datetime.datetime.now())
    
    return HttpResponse(output)


def liststories(request):

    latest_news = Story.objects.all().order_by('-date')[:10]
    return render_to_response('news/news.html', {'latest_news': latest_news})
    