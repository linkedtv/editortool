import datetime
import base64
from urllib2 import Request, urlopen, URLError, HTTPError
import urllib2
from subprocess import *
from lxml import etree
import lxml
import httplib2
#from profilehooks import timecall
import logging

"""
This class works with the specs obtained from http://www.linkedtv.eu/wiki/index.php/Abstract_Locator
"""

logger = logging.getLogger(__name__)

class VideoPlayoutHandler():
    
    def __init__(self):
        logger.debug('-- initializing VideoPlayoutHandler --')
        self.TICKET_USER = 'user'
        self.TICKET_EXPIRY = 10000 # 10 minutes
        self.TICKET_IP = '80.79.39.113'
    
    """    
    Returns the play-out URL for the specified mediaResourceID
    TODO make sure that it does not wait forever for the NTK server to reply
    """
    #@timecall(immediate=True)
    def getPlayoutURL(self, mediaResourceID, clientIP):
        logger.debug('getting playoutURL for: %s (%s)' % (mediaResourceID, clientIP))        
        playoutURL = None
        locator = self.getLocatorFromAPI(mediaResourceID)        
        ticket = self.generateUniqueTicket(clientIP)        
        ms = int(datetime.datetime.now().strftime("%s"))
                
        """build the POST request"""
        headers = {'Content-Type' : 'text/xml', 'Accept' : 'text/xml'}
        body = []
        body.append('<?xml version="1.0" encoding="UTF-8"?>')
        body.append('<fsxml>')
        body.append('<properties>')
        body.append('<ticket>%s</ticket>' % ticket)
        body.append('<uri>%s</uri>' % locator)
        body.append('<ip>%s</ip>' % self.TICKET_IP)
        body.append('<role>%s</role>' % self.TICKET_USER)
        body.append('<expiry>%d</expiry>' % (self.TICKET_EXPIRY + ms))
        body.append('</properties>')
        body.append('</fsxml>')
        url = 'http://ticket.noterik.com:8001/acl/ticket'
        
        """Send the request"""        
        try:            
            req = urllib2.Request(url)            
            response = urllib2.urlopen(req, ''.join(body))
            result = response.read()
            try:
                xml= etree.fromstring(result)
                status = xml.xpath('//status')
                if status and len(status) > 0:
                    st = status[0].text                    
                    if st == 'Successfully added':
                        playoutURL = self.unshorten_url('%s?ticket=%s' % (locator, ticket))
            except lxml.etree.XMLSyntaxError, e:
                print 'Could not parse the response XML'
                print e
        except urllib2.URLError, e:
            print e
        return playoutURL
    
        
    def unshorten_url(self, url):
        #print 'getting redirect URL'
        cmd_arr = []
        cmd_arr.append('curl')
        cmd_arr.append('-I')
        cmd_arr.append(url)                 
        p1 = Popen(cmd_arr, stdout=PIPE, stderr=PIPE)
        stdout, stderr = p1.communicate()
        try:
            p1.stdout.close()
        except IOError, e:
            print "stdout after failure: %s" % p1.stdout
            
        if stdout:
            r_arr = stdout.split('\n')
            for x in r_arr:
                if x.find('Location') != -1:
                    return x[len('Location: '):x.find('?')]
            return url
        else:
            logger.error(stderr)
            return None
    
    
    def getLocatorFromAPI(self, mediaResourceID):
        pw = base64.b64encode(b'admin:linkedtv')
        url = 'http://api.linkedtv.eu/mediaresource/%s' % mediaResourceID
        print url
        cmd_arr = []
        cmd_arr.append('curl')
        cmd_arr.append(url)
        cmd_arr.append('-H')
        cmd_arr.append('Authorization: Basic %s' % pw)
        cmd_arr.append('-H')
        cmd_arr.append('Accept: application/xml')
        p1 = Popen(cmd_arr, stdout=PIPE, stderr=PIPE)
        stdout, stderr = p1.communicate()
        print stdout
        try:
            p1.stdout.close()
        except IOError, e:
            print "stdout after failure: %s" % p1.stdout
            
        if stdout:
            xml = None
            try:
                xml = etree.fromstring(stdout)
            except lxml.etree.XMLSyntaxError, e:
                logger.error('Could not parse XML, probably the LinkedTV API is down')
            if xml is not None:
                locs = xml.xpath('//locator')
                if locs and len(locs) > 0:
                    return locs[0].text
        else:
            logger.error(stderr)
        return None
    
    
    def generateUniqueTicket(self, clientIP):
        t = datetime.datetime.now().time()        
        return ('%s-%s' % (t, clientIP)).replace('.', '_').replace(':', '_')
    