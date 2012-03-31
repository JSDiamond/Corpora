from django.db import models
import datetime


class StoryGroup(models.Model):
    date = models.DateTimeField()
    
    def __unicode__(self):
        return self.date


class Publisher(models.Model):
    name = models.CharField(max_length=255)
    
    def __unicode__(self):
        return self.name


class Article(models.Model):
    group = models.ForeignKey(StoryGroup)
    headline = models.TextField(blank=True)
    date = models.DateTimeField(null=True, blank=True)
    url = models.CharField(max_length=255)
    raw_text = models.TextField()
    analyzed_text = models.TextField()
    master = models.BooleanField(default=False)
    publisher = models.ForeignKey(Publisher)
    
    def __unicode__(self):
        return self.headline
