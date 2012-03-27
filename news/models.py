from django.db import models
import datetime


class Story(models.Model):
    headline = models.TextField()
    links = models.TextField()
    date = models.DateTimeField()
    
    def __unicode__(self):
        return self.headline
