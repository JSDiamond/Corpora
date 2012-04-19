from django import forms

class GatherForm(forms.Form):
    article_url_1 = forms.URLField(max_length=255, required=True)
    article_url_2 = forms.URLField(max_length=255, required=True)
    article_url_3 = forms.URLField(max_length=255, required=False)
    article_url_4 = forms.URLField(max_length=255, required=False)
    article_url_5 = forms.URLField(max_length=255, required=False)
    article_url_6 = forms.URLField(max_length=255, required=False)
    headline = forms.CharField(max_length=100, required=True)