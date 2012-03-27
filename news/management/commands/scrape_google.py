import datetime

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from Corpora.news.util import write_hello


class Command(BaseCommand):
    args = ""
    help = "Scrapes google."

    def handle(self, *args, **kwargs):
        hello = write_hello()
        return hello