from Corpora.news.models import Story
from django.contrib import admin


class StoryAdmin(admin.ModelAdmin):
    model = Story

admin.site.register(Story, StoryAdmin)