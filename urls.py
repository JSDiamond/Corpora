import os

from django.conf import settings
from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^$', "Corpora.news.views.splash", name="splash"),
    url(r'^news/$', "Corpora.news.views.liststories", {'page': 0}, name="liststories"),
    url(r'^news/(?P<page>\d+)/$', "Corpora.news.views.liststories", name="liststories"),
    url(r"^fun/$", "Corpora.news.views.special", name="special"),
    url(r'^gathers/(?P<page>\d+)/$', "Corpora.news.views.gathers", name="gathers"),
    url(r"^gather/$", "Corpora.news.views.gather", name="gather"),
    url(r"^info/$", "Corpora.news.views.info", name="info"),
    url(r"^story/(?P<storygroup>\d+)/$", "Corpora.news.views.collate", name="collate"),
    url(r"^getdata/(?P<storygroup>\d+)/$", "Corpora.news.views.getdata", name="getdata"),
    url(r"^poetronix/(?P<storygroup>\d+)/$", "Corpora.news.views.poetronix", name="poetronix"),
    url(r"^headline/$", "Corpora.news.views.headline", name="headline"),
    url(r"^getSlugs/$", "Corpora.news.views.getSlugs", name="getSlugs"),
    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    url(r'^admin/', include(admin.site.urls)),
)

if settings.DEV_MODE:
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve',
         {'document_root': os.path.join(settings.CORPORA_DIRECTORY, 'media')}),
    )
