from django.conf.urls import patterns, url

urlpatterns = patterns('',

    url(r'^$', 'views.main'),
    url(r'^(?P<pub>\w+)/$', 'views.publisher'),
    url(r'^(?P<pub>\w+)/(?P<id>.*)/$', 'views.publisher'),
    url(r'^resource$', 'views.resource'),
    url(r'^resources$', 'views.resources'),
    url(r'^savechapter$', 'views.savechapter'),
    url(r'^saveannotation$', 'views.saveannotation'),
    url(r'^image$', 'views.image'),
    url(r'^autocomplete$', 'views.autocomplete'),
       
)