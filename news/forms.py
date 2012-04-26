from django import forms
from django.template.defaultfilters import slugify

from Corpora.news.models import StoryGroup


class GatherForm(forms.Form):
    article_url_1 = forms.URLField(max_length=255, required=True)
    article_url_2 = forms.URLField(max_length=255, required=True)
    article_url_3 = forms.URLField(max_length=255, required=False)
    article_url_4 = forms.URLField(max_length=255, required=False)
    article_url_5 = forms.URLField(max_length=255, required=False)
    article_url_6 = forms.URLField(max_length=255, required=False)
    headline = forms.CharField(max_length=100, required=True)
    
    def clean_headline(self):
        headline = self.cleaned_data['headline']
        slugified = slugify(headline)
        try:
            existing = StoryGroup.objects.get(slugline=slugified)
            raise forms.ValidationError("This headline is already in the database. Please enter a unique headline.")
        except StoryGroup.DoesNotExist:
            pass
    
        return headline
