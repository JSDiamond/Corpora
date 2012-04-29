import datetime

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from Corpora.news.util import get_google

##  30,0 * * * * /usr/bin/python /home/jsdiamond/corporaproject.com/Corpora/manage.py scrape_google  ##

class Command(BaseCommand):
    args = ""
    help = "Scrapes google."

    def handle(self, *args, **kwargs):
        output = get_google() #call function from util.py 
        return ''