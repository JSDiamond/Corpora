from django.db import models
import datetime


class StoryGroup(models.Model):
    date = models.DateTimeField()
    slugline = models.SlugField(blank=True, unique=True)
    entities = models.TextField(blank=True)
    
    def __unicode__(self):
        return str(self.id)


class Publisher(models.Model):
    name = models.CharField(max_length=255)
    
    def __unicode__(self):
        return self.name


class Article(models.Model):
    group = models.ForeignKey(StoryGroup)
    headline = models.TextField()
    date = models.DateTimeField()#null=True
    url = models.CharField(max_length=255)
    raw_text = models.TextField(blank=True)
    image_link = models.TextField(blank=True)
    analyzed_text = models.TextField(blank=True)
    master = models.BooleanField(default=False)
    publisher = models.ForeignKey(Publisher)
    
    def __unicode__(self):
        return self.headline
