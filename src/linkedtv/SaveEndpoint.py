# -*- coding: utf-8 -*-
import uuid
from utils.TimeUtils import *
from linkedtv_settings import LTV_SPARQL_ENDPOINT, LTV_REDIS_SETTINGS, LTV_SAVE_GRAPH
import urllib
import base64
from subprocess import *
import os
import simplejson
from simplejson import JSONDecodeError

class SaveEndpoint():
    
    def __init__(self):
        print '--initializing save endpoint--'        
        self.ET_GRAPH = LTV_SAVE_GRAPH
        self.NERD_ONTO_PF = 'http://nerd.eurecom.fr/ontology#'
        self.LTV_ONTO_PF = 'http://data.linkedtv.eu/ontologies/core#'
        self.LTV_ENTITY_PF = 'http://data.linkedtv.eu/entity'
        self.LTV_CHAPTER_PF = 'http://data.linkedtv.eu/chapter'
        self.DBPEDIA_ONTOLOGY_PF = 'http://dbpedia.org/ontology'
        
        self.ET_SOURCE = 'editor_tool'
        self.ET_CONFIDENCE = '1'
        self.ET_RELEVANCE = '1'
        
        self.A_PF = 'http://data.linkedtv.eu/annotation'
        self.MF_PF = 'http://data.linkedtv.eu/media'
        
        self.PROV_ET = 'http://data.linkedtv.eu/organization/SV/EditorTool'
    
    """This function saves a single chapter"""
    def saveChapter(self, data):
        print 'Saving chapter...'
        print data
        
        c = data['chapter']
        mediaResourceID = data['mediaResourceID']
        action = data['action']
        s = TimeUtils.toStringSeconds(c['start'])
        e = TimeUtils.toStringSeconds(c['end'])
        d = TimeUtils.toStringSeconds(int(c['end']) - int(c['start']))
        
        """Head part of the query"""
        query = []
        query.append('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ')
        query.append('PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ')
        query.append('PREFIX linkedtv: <http://data.linkedtv.eu/ontologies/core#> ')
        query.append('PREFIX prov: <http://www.w3.org/ns/prov#> ')
        query.append('PREFIX ma: <http://www.w3.org/ns/ma-ont#> ')
        query.append('PREFIX oa: <http://www.w3.org/ns/oa#> ')
        query.append('PREFIX nsa: <http://multimedialab.elis.ugent.be/organon/ontologies/ninsuna#> ')
        query.append('PREFIX dc: <http://purl.org/dc/elements/1.1/> ')
        
        query.append('WITH <%s> ' % self.ET_GRAPH)
                                               
        query.append('DELETE { ')
        if c.has_key('ETmfURI'):
            mfURI = c['ETmfURI']
            query.append('<%s> ?p1 ?o1 . ' % mfURI)
        else:
            mfURI = '%s/%s#t=%s,%s' % (self.MF_PF, uuid.uuid1(), s, e)
        if c.has_key('ETbodyURI'):
            bodyURI = c['ETbodyURI']
            query.append('<%s> ?p2 ?o2 . ' % bodyURI)
        else:
            bodyURI = '%s/%s' % (self.LTV_CHAPTER_PF, uuid.uuid1())  
        if c.has_key('ETannotationURI'):            
            aURI = c['ETannotationURI']
            query.append('<%s> ?p3 ?o3' % aURI)
        else:
            aURI = '%s/%s' % (self.A_PF, uuid.uuid1())
        query.append('} ')
        
        """Do not insert data when the action is to delete the chapter"""
        if(action != 'delete'):
            query.append('INSERT { ')
            
            """media fragment"""
            query.append('<%s> rdf:type <http://www.w3.org/ns/ma-ont#MediaFragment> . ' % mfURI)
            query.append('<%s> rdf:type <http://multimedialab.elis.ugent.be/organon/ontologies/ninsuna#TemporalFragment> . ' % mfURI)
            query.append('<%s> ma:isFragmentOf <%s/%s> . ' % (mfURI, self.MF_PF, mediaResourceID))
            query.append('<%s> ma:duration %s . ' % (mfURI, d))
            query.append('<%s> nsa:temporalStart %s . ' % (mfURI, s))
            query.append('<%s> nsa:temporalEnd %s . ' % (mfURI, e))
            query.append('<%s> nsa:temporalUnit "npt" . ' % mfURI)
            
            """body -> type=chapter + label"""
            query.append('<%s> rdf:type <%sChapter> . ' % (bodyURI, self.LTV_ONTO_PF))
            query.append('<%s> linkedtv:hasSegmentType "%s" . ' % (bodyURI, c['type']))
            query.append('<%s> rdfs:label "%s" . ' % (bodyURI, c['title']))
            
            """annotation targets the media fragment & links to the body"""        
            query.append('<%s> rdf:type <http://www.w3.org/ns/oa#Annotation> . ' % aURI)
            query.append('<%s> rdf:type <http://www.w3.org/ns/prov#Entity> . ' % aURI)
            query.append('<%s> oa:hasTarget <%s> . ' % (aURI, mfURI))
            query.append('<%s> oa:hasBody <%s> . ' % (aURI, bodyURI))        
            #query.append('<%s> prov:startedAtTime "%s" . ' % (aURI, 'currenttime'))
            query.append('<%s> prov:wasAttributedTo <%s> . ' % (aURI, self.PROV_ET))
            
            """Link to the original annotation (if any)"""
            if c.has_key('annotationURI'):
                query.append('<%s> linkedtv:wasDerivedFrom <%s> . ' % (aURI, c['annotationURI']))        
            query.append('} ')
        
        query.append('WHERE {')
        """Only for update and delete"""
        if c.has_key('ETmfURI'):
            query.append('<%s> ?p1 ?o1 . ' % mfURI)
            query.append('<%s> ?p2 ?o2 . ' % bodyURI)
            query.append('<%s> ?p3 ?o3' % aURI)
        query.append('}')
        
        print '\n\nSAVING CHAPTER-------------------------------------'
        print ''.join(query)
        print '\nEND SAVING CHAPTER-------------------------------------'
        
        resp = self.sendSearchRequest(''.join(query))
        jsonData = None
        try:
            jsonData = simplejson.loads(resp)
            print jsonData            
        except JSONDecodeError, e:
            print e
            return None
        return {'ETmfURI' : mfURI, 'ETbodyURI' : bodyURI, 'ETannotationURI' : aURI}
    
    def saveAnnotation(self, data):
        print 'Saving annotation...'
        print data
        
        a = data['annotation']
        mediaResourceID = data['mediaResourceID']
        action = data['action']
        s = TimeUtils.toStringSeconds(a['start'])
        e = TimeUtils.toStringSeconds(a['end'])
        d = TimeUtils.toStringSeconds(int(a['end']) - int(a['start']))
                   
        """Query head"""        
        query = []
        query.append('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ')
        query.append('PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ')
        query.append('PREFIX linkedtv: <http://data.linkedtv.eu/ontologies/core#> ')
        query.append('PREFIX owl: <http://www.w3.org/2002/07/owl#> ')
        query.append('PREFIX oa: <http://www.w3.org/ns/oa#> ')
        query.append('PREFIX prov: <http://www.w3.org/ns/prov#> ')
        query.append('PREFIX ma: <http://www.w3.org/ns/ma-ont#> ')
        query.append('PREFIX nsa: <http://multimedialab.elis.ugent.be/organon/ontologies/ninsuna#> ')
        query.append('PREFIX dc: <http://purl.org/dc/elements/1.1/> ')
        
        """The graph storing the ET data"""
        query.append('WITH <%s> ' % self.ET_GRAPH)
                
        query.append('DELETE {')
        if a.has_key('ETmfURI'):
            mfURI = a['ETmfURI']
            query.append('<%s> ?p1 ?o1 . ' % mfURI)
        else:
            mfURI = '%s/%s#t=%s,%s' % (self.MF_PF, uuid.uuid1(), s, e)
        if a.has_key('ETbodyURI'):
            bodyURI = a['ETbodyURI']
            query.append('<%s> ?p2 ?o2 . ' % bodyURI)
        else:
            bodyURI = '%s/%s' % (self.LTV_ENTITY_PF, uuid.uuid1())
        if a.has_key('ETannotationURI'):
            aURI = a['ETannotationURI']
            query.append('<%s> ?p3 ?o3 . ' % aURI)
        else:
            aURI = '%s/%s' % (self.A_PF, uuid.uuid1())
        if a.has_key('ETenrichmentURI'):
            eaURI = a['ETenrichmentURI']
            query.append('<%s> ?p4 ?o4 . ' % eaURI)
            query.append('?eBody ?p5 ?o5 . ')
        else:
            eaURI = '%s/%s' % (self.A_PF, uuid.uuid1())
        query.append('} ')        
        
        if(action != 'delete'):            
            query.append('INSERT { ')
            
            """First create the media fragment => self.MF_PF/UUID/#t=1931.24,1934.639"""
            query.append('<%s> rdf:type <http://www.w3.org/ns/ma-ont#MediaFragment> . ' % mfURI)
            query.append('<%s> rdf:type <http://multimedialab.elis.ugent.be/organon/ontologies/ninsuna#TemporalFragment> . ' % mfURI)
            query.append('<%s> ma:isFragmentOf <%s/%s> . ' % (mfURI, self.MF_PF, mediaResourceID))
            query.append('<%s> ma:duration %s . ' % (mfURI, d))
            query.append('<%s> nsa:temporalStart %s . ' % (mfURI, s))
            query.append('<%s> nsa:temporalEnd %s . ' % (mfURI, e))
            query.append('<%s> nsa:temporalUnit "npt" . ' % mfURI)
                                    
            """Then create the annotation body, which is an entity (the enrichments also refer to this entity!)"""        
            query.append('<%s> rdf:type <%sEntity> . ' % (bodyURI, self.LTV_ONTO_PF))
            
            """Custom entities always use the DBPedia type; moderated entities always a NERD type"""
            if a.has_key('annotationURI'):
                query.append('<%s> rdf:type <%s%s> . ' % (bodyURI, self.NERD_ONTO_PF, a['type']))
            elif a.has_key('type'):
                query.append('<%s> rdf:type <%s/%s> . ' % (bodyURI, self.DBPEDIA_ONTOLOGY_PF, a['type']))
            else:
                """For unknown vocabularies use the default type 'Thing'"""
                query.append('<%s> rdf:type <%s/%s> . ' % (bodyURI, self.DBPEDIA_ONTOLOGY_PF, 'Thing'))
                
            """Custom entities populate the url field; moderated entities possibly have a disambiguation URL"""                
            if a.has_key('url'):
                query.append('<%s> ma:locator "%s" . ' % (bodyURI, a['url']))
            elif a.has_key('disambiguationURL'):
                query.append('<%s> owl:sameAs "%s" . ' % (bodyURI, a['disambiguationURL']))
            if a.has_key('type'):
                query.append('<%s> dc:type "%s" . ' % (bodyURI, a['type']))
            else:
                """For unknown vocabularies use the default type 'Thing'"""
                query.append('<%s> dc:type "%s" . ' % (bodyURI, 'Thing'))
                
            query.append('<%s> dc:source "%s" . ' % (bodyURI, self.ET_SOURCE))
            query.append('<%s> rdfs:label "%s" . ' % (bodyURI, a['label']))
            """These fields are not filled with the ET, but maybe later they could..."""
            #query.append('<%s> dc:identifier "%s" . ' % (bodyURI, '?'))
            #query.append('<%s> linkedtv:hasConfidence "%s" . ' % (bodyURI, self.ET_CONFIDENCE))
            #query.append('<%s> linkedtv:hasRelevance "%s" . ' % (bodyURI, self.ET_RELEVANCE))
                    
            """Following, create the annotation and tie everything together"""        
            query.append('<%s> rdf:type <http://www.w3.org/ns/oa#Annotation> . ' % aURI)
            query.append('<%s> rdf:type <http://www.w3.org/ns/prov#Entity> . ' % aURI)
            query.append('<%s> oa:hasTarget <%s> . ' % (aURI, mfURI))
            query.append('<%s> oa:hasBody <%s> . ' % (aURI, bodyURI))
            query.append('<%s> prov:wasAttributedTo <%s> . ' % (aURI, self.PROV_ET))
            """Link to the original annotation (if any)"""
            if a.has_key('annotationURI'):
                query.append('<%s> linkedtv:wasDerivedFrom <%s> . ' % (aURI, a['annotationURI']))
            
            """Ultimately create annotations & annotation bodies for each enrichment"""
            if a.has_key('enrichments'):
                
                """First create the annotation to attach the enrichments to"""            
                query.append('<%s> rdf:type <http://www.w3.org/ns/oa#Annotation> . ' % eaURI)
                query.append('<%s> rdf:type <http://www.w3.org/ns/prov#Entity> . ' % eaURI)
                query.append('<%s> oa:motivatedBy <http://www.w3.org/ns/oa#linking> . ' % eaURI)
                query.append('<%s> oa:hasTarget <%s> . ' % (eaURI, mfURI))
                #query.append('<%s> prov:startedAtTime <%s> . ' % (eaURI, ?))
                query.append('<%s> prov:wasAttributedTo <%s> . ' % (eaURI, self.PROV_ET))
                query.append('<%s> prov:wasDerivedFrom <%s> . ' % (eaURI, bodyURI))
                for e in a['enrichments'].values():
                    if e:
                        """If the source is ET, it means this is a custom enrichment"""
                        if(e.has_key('source') and e['source'] == self.ET_SOURCE):                    
                            eURI = '%s/%s' % (self.MF_PF, uuid.uuid1())
                            query.append('<%s> rdf:type <http://www.w3.org/ns/ma-ont#MediaResource> . ' % eURI)
                            query.append('<%s> rdf:type <http://data.linkedtv.eu/ontologies/core#RelatedContent> . ' % eURI)
                            query.append('<%s> dc:source <%s> . ' % (eURI, self.ET_SOURCE))
                            query.append('<%s> prov:wasAttributedTo <%s> . ' % (eURI, self.PROV_ET))
                            query.append('<%s> ma:locator <%s> . ' % (eURI, e['url']))
                            #query.append('<%s> dc:date %s . ' % (eURI, e['date']))
                            #query.append('<%s> dc:type <%s> . ' % (eURI, e['type']))
                            #query.append('<%s> dc:creator <%s> . ' % (eURI, e['creator']))                    
                            #query.append('<%s> linkedtv:hasPoster <%s> . ' % (eURI, e['poster']))
                            """Add this body to the enrichment annotation"""
                            query.append('<%s> oa:hasBody <%s> . ' % (eaURI, eURI))
                        else:
                            """Simply link to the original enrichment (because no properties could be changed anyway)"""
                            query.append('<%s> oa:hasBody <%s> . ' % (eaURI, e['bodyURI']))
                                    
            query.append(' } ')
        
        """The WHERE part, used for the selection of sources (only for DELETE in this case)"""
        query.append('WHERE {')
        if a.has_key('ETmfURI'):
            query.append('<%s> ?p1 ?o1 . ' % mfURI)
            query.append('<%s> ?p2 ?o2 . ' % bodyURI)
            query.append('<%s> ?p3 ?o3 . ' % aURI)
            query.append('<%s> ?p4 ?o4 . ' % eaURI)
            query.append('OPTIONAL {<%s> oa:hasBody ?eBody . ' % eaURI)
            query.append("?eBody dc:source '%s' . " % self.ET_SOURCE)
            query.append('?eBody ?p5 ?o5 }')
            
        query.append('}')
        
        print '\n\nSAVING ANNOTATIONS & ENRICHMENTS-------------------------------------'
        print ''.join(query)
        print '\nEND SAVING ANNOTATIONS & ENRICHMENTS-------------------------------------'
        
        resp = self.sendSearchRequest(''.join(query))
        jsonData = None
        try:
            jsonData = simplejson.loads(resp)            
        except JSONDecodeError, e:
            print e
            return None
        
        return {'ETmfURI' : mfURI, 'ETbodyURI' : bodyURI, 'ETannotationURI' : aURI, 'ETenrichmentURI' : eaURI}
    
    """
    this function deletes any resource
    """
    def deleteResource(self, resourceURI):
        print 'Deleting resource with URI: %s' % resourceURI
        query = []
        query.append('WITH <%s> ' % self.ET_GRAPH)
        query.append('DELETE {<%s> ?p ?o } ' % resourceURI)
        query.append('WHERE {<%s> ?p ?o } ' % resourceURI)
               
        resp = self.sendSearchRequest(''.join(query))
        jsonData = None
        try:
            jsonData = simplejson.loads(resp)
        except JSONDecodeError, e:
            print resp
            print e
            return False
        return True
    
    def deleteAllAnnotationsOfMediaResource(self, mediaResourceID):
        print 'Deleting all resources of media resource: %s' % mediaResourceID
        query = []
        query.append('PREFIX oa: <http://www.w3.org/ns/oa#> ')
        query.append('PREFIX ma: <http://www.w3.org/ns/ma-ont#> ')
        query.append('WITH <%s> ' % self.ET_GRAPH)
        query.append('DELETE ')
        query.append('{ ')
        query.append('?mf ?p1 ?o1 . ')
        query.append('?a ?p2 ?o2 . ')
        query.append('?b ?p3 ?o3 ')
        query.append('} ')
        query.append('WHERE ')
        query.append('{ ')
        query.append('?mf ma:isFragmentOf <%s/%s> . ' % (self.MF_PF, mediaResourceID))
        query.append('?mf ?p1 ?o1 . ')
        query.append('?a oa:hasTarget ?mf . ')
        query.append('?a ?p2 ?o2 . ')
        query.append('?a oa:hasBody ?b . ')
        query.append('?b ?p3 ?o3 ')        
        query.append('} ')
        
        print ''.join(query)
        
        resp = self.sendSearchRequest(''.join(query))
        jsonData = None
        try:
            jsonData = simplejson.loads(resp)
        except JSONDecodeError, e:
            print resp
            print e
            return False
        return True
            
    def sendSearchRequest(self, query):
        #os.environ['HTTP_PROXY'] = 'http://proxy.ka.beeldengeluid.nl:3128'
        cmd_arr = []
        cmd_arr.append('curl')
        cmd_arr.append('-X')
        cmd_arr.append('POST')
        cmd_arr.append(LTV_SPARQL_ENDPOINT)
        cmd_arr.append('-H')
        cmd_arr.append('Accept: application/sparql-results+json')
        cmd_arr.append('-d')
        cmd_arr.append('query=%s' % urllib.quote(query.encode("utf-8"), ''))
        p1 = Popen(cmd_arr, stdout=PIPE)
        output = p1.communicate()[0]
        return output
    