import datetime

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from Corpora.news.util import get_google


class Command(BaseCommand):
    args = ""
    help = "Scrapes google."

    def handle(self, *args, **kwargs):
        get_google()
        #MAKE SURE THIS IS COMPLETING THE WHOLE 'FUN/SPECIAL' FUNCTION
        return ''