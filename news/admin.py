from Corpora.news.models import Article
from django.contrib import admin


class ArticleAdmin(admin.ModelAdmin):
    model = Article

admin.site.register(Article, ArticleAdmin)