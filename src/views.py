from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.views.decorators.csrf import csrf_exempt
from django.core.context_processors import csrf
from django.http import HttpResponseRedirect
from django.core.context_processors import csrf

from linkedtv.LinkedTVAPI import *
from linkedtv.SaveEndpoint import *
from linkedtv.ImageFetcher import *
from linkedtv.VideoPlayoutHandler import *
import simplejson

def main(request):
    return render_to_response('index.html')

def publisher(request, pub = '', id = ''):
    api = LinkedTVAPI()
    videoData = {}
    if pub:
        if pub == 'nisv':
            videoData = api.getMediaResources('S&V')
        else:
            videoData = api.getMediaResources(pub)
    return render_to_response('home.html', {'id' : id, 'publisher' : pub, 'videoData' : videoData})

"""This is called to fetch the list of media resources from the LinkedTV API"""
def resources(request):
    api = LinkedTVAPI()
    publisher = request.GET.get('p', None)
    format = request.GET.get('format', 'json')
    if publisher:
        resp = {'mediaResources' : []}
        return HttpResponse(resp, mimetype='application/%s' % format)
    if format == 'json':
        return HttpResponse("{error: 'Please provide a valid publisher'}", mimetype='application/json')
    else:
        return HttpResponse('<error>Please provide a valid publisher</error>', mimetype='application/xml')


"""This is called to fetch the data of a single media resource"""
def resource(request):
    mediaResourceID = request.GET.get('id', None)
    clientIP = getClientIP(request)
    if mediaResourceID:
        
        """Get the playout URL"""
        
        vph = VideoPlayoutHandler()
        playoutURL = vph.getPlayoutURL(mediaResourceID, clientIP)
        print 'PLAYOUT URL => %s' % playoutURL
        #playoutURL = 'none'
        imgf = ImageFetcher()
        thumbURL = imgf.getThumbnailLocatorFromAPI(mediaResourceID)
        print 'THUMB URL => %s' % thumbURL        
        """Only if there is a playout URL get the annotation data"""        
        if playoutURL:
            api = LinkedTVAPI()
            mr = api.loadMediaResource(mediaResourceID)
            print 'got some stuff back'
            mr['locator'] = playoutURL
            mr['thumb_base'] = thumbURL
            resp = simplejson.dumps(mr)
            return HttpResponse(resp, mimetype='application/json')
        else:
            return HttpResponse("{error: 'no play-out URL found!'}", mimetype='application/json')

    return HttpResponse("{error: 'resource does not exist'}", mimetype='application/json')


"""This is called to save a single chapter"""
@csrf_exempt
def savechapter(request):
    savedata = request.POST.get('savedata', None)
    sep = SaveEndpoint()
    try:
        saveURIs = sep.saveChapter(simplejson.loads(savedata))
    except JSONDecodeError, e:
        return HttpResponse("{'error' : 'malformed save data'}", mimetype='application/json')
    return HttpResponse(simplejson.dumps(saveURIs), mimetype='application/json')


"""This is called to save a single annotation (containing a URL to an online resource + multiple enrichments)"""
@csrf_exempt
def saveannotation(request):
    savedata = request.POST.get('savedata', None)
    sep = SaveEndpoint()
    try:
        saveURIs = sep.saveAnnotation(simplejson.loads(savedata))
    except JSONDecodeError, e:
        return HttpResponse("{'error' : 'malformed save data'}", mimetype='application/json')
    return HttpResponse(simplejson.dumps(saveURIs), mimetype='application/json')


"""This is called to fetch an keyframe/thumbnail image from the Noterik server"""
def image(request):
    millis = request.GET.get('ms', None)
    id = request.GET.get('id', None)
    if millis:
        fetcher = ImageFetcher()
        resp = fetcher.getNoterikThumbnailByMillis(id, millis)
        if resp:
            return HttpResponse(resp, mimetype='image/jpeg')
        else:
            return HttpResponseRedirect('/site_media/images/snowscreen.gif')
    elif id:
        fetcher = ImageFetcher()
        resp = fetcher.getEnrichmentThumb(id)
        if resp:
            return HttpResponse(resp)
        else:
            return HttpResponseRedirect('/site_media/images/snowscreen.gif')
        
    return HttpResponse("{'error' : 'Please provide the moment in time by milliseconds'}", mimetype='application/json')


"""This is called when using a DBPedia autocomplete field in the UI"""
def autocomplete(request):
    prefix = request.GET.get('term', None)
    api = LinkedTVAPI()
    options = api.autocomplete(prefix)
    resp = simplejson.dumps(options)
    return HttpResponse(resp, mimetype='application/json')
    
    
"""This is called to fetch the IP of the connecting client"""
def getClientIP(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
