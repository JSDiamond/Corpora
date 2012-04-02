from Corpora.news.models import StoryGroup, Publisher, Article
from django.contrib import admin

class StoryGroupAdmin(admin.ModelAdmin):
    model = StoryGroup

admin.site.register(StoryGroup, StoryGroupAdmin)

class PublisherAdmin(admin.ModelAdmin):
    model = Publisher

admin.site.register(Publisher, PublisherAdmin)


class ArticleAdmin(admin.ModelAdmin):
    model = Article

admin.site.register(Article, ArticleAdmin)