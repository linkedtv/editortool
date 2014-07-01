import base64
from lxml import etree
import lxml
from subprocess import *
import urllib2
from PIL import Image
import StringIO
from linkedtv.linkedtv_settings import LTV_REDIS_SETTINGS
import redis
import urllib
import re, urlparse
import requests

"""
TODO soms werkt het niet goed met het teruggeven van de plaatjes... (kan de server het niet aan?)

OVER REQUESTS!!
    http://docs.python-requests.org/en/latest/user/advanced/#ssl-cert-verification

"""

class ImageFetcher():
       
    def __init__(self):
        self.redisCache = redis.StrictRedis(host=LTV_REDIS_SETTINGS['host'], port=LTV_REDIS_SETTINGS['port'], db=LTV_REDIS_SETTINGS['db'])
    
    def getThumbnailLocatorFromAPI(self, mediaResourceID):
        pw = base64.b64encode(b'admin:linkedtv')
        url = 'http://api.linkedtv.eu/mediaresource/%s/mediaresourcerelation' % mediaResourceID
        cmd_arr = []
        cmd_arr.append('curl')
        cmd_arr.append(url)
        cmd_arr.append('-H')
        cmd_arr.append('Authorization: Basic %s' % pw)
        cmd_arr.append('-H')        
        cmd_arr.append('Accept: application/xml')        
        p1 = Popen(cmd_arr, stdout=PIPE)
        resp = p1.communicate()[0]        
        if resp:
            xml = etree.fromstring(resp)
            rels = xml.xpath('//mediaresourcerelation')
            for rel in rels:
                if rel.xpath('./relationType')[0].text == 'thumbnail-locator':
                    return rel.xpath('./relationTarget')[0].text
        return None
    
    """This function returns image data from the Noterik image server
    @param id: the id of the mediaResource/video
    @param second: the desired timepoint from the mediaResource/video in seconds
    """
    def getNoterikThumbnailByMillis(self, mediaResourceID, millis):
        baseURL = self.redisCache.get('thumb.%s' % mediaResourceID)
        if not baseURL:
            baseURL = self.getThumbnailLocatorFromAPI(mediaResourceID)     
        if baseURL:
            tt = self.millisToTimeTuple(millis)
            url = '%sh/%d/m/%d/sec%d.jpg' % (baseURL, tt[0], tt[1], tt[2])            
            """Call the Noterik API and fetch the image"""
            try:
                u = urllib2.urlopen(url)
                #l = u.info()['Content-Length']
            except urllib2.HTTPError, e:
                print 'Error getting %s' % url
                print e
                return None
            except urllib2.URLError, u:
                print 'Error getting %s' % url
                print u
                return None
            
            """Read the image and resize it, so it is more suitable for the Editor tool UI"""
            x = u.read()
            img = Image.open(StringIO.StringIO(x))
            output = StringIO.StringIO()
            img = img.resize([105, 79])
            img.save(output, 'JPEG', quality=90)
            
            """Save the thumbnail-locator in the cache"""
            self.redisCache.set('thumb.%s' % mediaResourceID, baseURL)
            
            return output.getvalue()
        return None
    
    """ TODO dit moet gefixed worden!!! irritant gedoe!"""
    def getEnrichmentThumb(self, url):
        o = urlparse.urlparse(url)
        print o                
        print '\n\n'
        url = '%s://%s%s%s' % (o.scheme, o.netloc, urllib.urlencode({'q' : o.path.encode('utf-8')})[2:].replace('%2F', '/'), urllib.urlencode({'q' : o.params})[2:])
        print url
        r = requests.get(url, verify=False)
        return r.content
    
    """This function converts an amount of seconds into a tuple (hours, minutes, seconds)"""
    def millisToTimeTuple(self, millis):
        if millis:            
            millis = int(millis)
            h = m = s = 0
            while millis >= 3600000:
                h += 1
                millis -= 3600000
            while millis >= 60000:
                m += 1
                millis -= 60000
            while millis >= 1000:
                s+= 1        
                millis -= 1000
            return (h, m, s)
        return None
