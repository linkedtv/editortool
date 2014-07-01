from subprocess import *
import os
import simplejson
from simplejson import JSONDecodeError
import redis
from linkedtv_settings import LTV_SPARQL_ENDPOINT, LTV_STOP_FILE, LTV_SAVE_GRAPH
import urllib
import base64
from lxml import etree
import lxml
from TextAnalyzer import *
import logging

logger = logging.getLogger(__name__)

class LinkedTVAPI():

    def __init__(self):
        logger.debug(' -- initializing LinkedTVAPI --')
        self.BASE_DEBATE_URI = 'http://purl.org/linkedpolitics/nl/nl.proc.sgd.d.'      
        self.DBPEDIA_ENDPOINT = 'http://lookup.dbpedia.org/api/search.asmx/PrefixSearch'
        self.DBPEDIA_MAPPING = {"what": ["Animal", "Mammal", "BiologicalDatabase", "Disease", "EurovisionSongContestEntry", "Gnetophytes", "GolfLeague", "GrandPrix", "LaunchPad", "Locomotive", "MixedMartialArtsEvent", "MotorcycleRacingLeague", "PersonFunction", "PoloLeague", "SnookerWorldRanking", "SoccerLeague", "SoftballLeague", "Spacecraft", "VideogamesLeague", "Species", "AcademicJournal", "Activity", "Album", "AmericanFootballLeague", "Amphibian", "Arachnid", "Archaea", "Artwork", "Asteroid", "AustralianFootballLeague", "AutoRacingLeague", "Automobile", "AutomobileEngine", "Award", "BaseballLeague", "BasketballLeague", "Beverage", "Biomolecule", "Bird", "BodyOfWater", "Bone", "Book", "BowlingLeague", "BoxingLeague", "Brain", "Bridge", "CanadianFootballLeague", "CelestialBody", "ChemicalCompound", "ChemicalElement", "ChemicalSubstance", "ClubMoss", "ComicBook", "Conifer", "Constellation", "CricketLeague", "Crustacean", "CurlingLeague", "Currency", "Cycad", "CyclingLeague", "Database", "Decoration", "Drug", "Eukaryote", "Event", "Fern", "FieldHockeyLeague", "Film", "FilmFestival", "Fish", "Flag", "FloweringPlant", "Food", "FootballMatch", "FormulaOneRacing", "Fungus", "Galaxy", "Game", "Gene", "GeneLocation", "Ginkgo", "GivenName", "GovernmentType", "Grape", "GreenAlga", "HandballLeague", "HumanGene", "HumanGeneLocation", "IceHockeyLeague", "Ideology", "Infrastructure", "InlineHockeyLeague", "Instrument", "LacrosseLeague", "Language", "LegalCase", "Legislature", "Letter", "Lymph", "MeanOfTransportation", "Mineral", "MixedMartialArtsLeague", "Monument", "Moss", "MouseGene", "MouseGeneLocation", "Muscle", "MusicFestival", "MusicGenre", "Name", "Nerve", "OlympicResult", "Olympics", "PaintballLeague", "Plant", "Play", "PowerStation", "ProgrammingLanguage", "Project", "Protein", "PublicTransitSystem", "Race", "RadioControlledRacingLeague", "Reptile", "ResearchProject", "RugbyLeague", "Sales", "SambaSchool", "Ship", "SoccerClubSeason", "SoccerLeagueSeason", "SoccerTournament", "Software", "Song", "SpaceMission", "SpaceShuttle", "SpeedwayLeague", "SpeedwayTeam", "Sport", "SportsEvent", "SportsLeague", "SportsTeamSeason", "Surname", "Tax", "TelevisionEpisode", "TelevisionSeason", "TennisLeague", "TennisTournament", "TopicalConcept", "Unknown", "Vein", "VideoGame", ""], "who": ["Ambassador", "Journalist", "Artist", "Writer", "Actor", "Agent", "AmericanFootballPlayer", "AmericanFootballTeam", "Architect", "Astronaut", "AustralianRulesFootballPlayer", "BadmintonPlayer", "Band", "BaseballPlayer", "BaseballTeam", "BasketballPlayer", "BasketballTeam", "Boxer", "BritishRoyalty", "BroadcastNetwork", "Broadcaster", "BullFighter", "CanadianFootballPlayer", "CanadianFootballTeam", "Cardinal", "Celebrity", "Chancellor", "ChessPlayer", "ChristianPatriarch", "College", "CollegeCoach", "ComicsCharacter", "ComicsCreator", "Company", "Congressman", "Cricketer", "Cyclist", "Deputy", "FictionalCharacter", "FigureSkater", "FormulaOneRacer", "GaelicGamesPlayer", "GeopoliticalOrganisation", "GovernmentAgency", "HockeyTeam", "IceHockeyPlayer", "Judge", "LawFirm", "Library", "Lieutenant", "Magazine", "MartialArtist", "Mayor", "MemberOfParliament", "MilitaryPerson", "MilitaryUnit", "Model", "MusicalArtist", "NationalCollegiateAthleticAssociationAthlete", "NascarDriver", "NationalSoccerClub", "Newspaper", "Non-ProfitOrganisation", "OfficeHolder", "Organisation", "OrganisationMember", "Person", "Philosopher", "PlayboyPlaymate", "PokerPlayer", "PolishKing", "PoliticalParty", "Politician", "Pope", "President", "Priest", "RadioStation", "RecordLabel", "Referee", "RugbyClub", "RugbyPlayer", "Saint", "Scientist", "Senator", "SnookerChamp", "SnookerPlayer", "SoccerClub", "SoccerManager", "SoccerPlayer", "SportsTeam", "SportsTeamMember", "Swimmer", "TeamMember", "TelevisionStation", "TennisPlayer", "TradeUnion", "University", "VicePresident", "VicePrimeMinister"], "where": ["AdministrativeRegion", "Restaurant", "Skyscraper", "RoadTunnel", "WineRegion", "ArchitecturalStructure", "Arena", "Atoll", "Canal", "Cave", "City", "Continent", "Convention", "HistoricBuilding", "HistoricPlace", "Hospital", "Hotel", "Lake", "Lighthouse", "LunarCrater", "Mountain", "MountainPass", "MountainRange", "NaturalPlace", "Park", "Place", "PopulatedPlace", "ProtectedArea", "RailwayLine", "RailwayTunnel", "ReligiousBuilding", "River", "Road", "RoadJunction", "RouteOfTransportation", "School", "Settlement", "ShoppingMall", "SiteOfSpecialScientificInterest", "SkiArea", "SpaceStation", "Stadium", "Station", "SupremeCourtOfTheUnitedStatesCase", "Theatre", "Town", "Tunnel", "Valley", ""]}
        self.LINKEDTV_MEDIA_RESOURCE_PF = 'http://data.linkedtv.eu/media/'
        
        """Prefixes/ontologies used for the annotation body type, i.e. rdf:type"""
        self.LINKEDTV_ONTOLOGY_PF = 'http://data.linkedtv.eu/ontologies/core#' #'http://data.linkedtv.eu/ontology/'
        self.LINKEDTV_DATA_PF = 'http://data.linkedtv.eu/'
        self.NERD_ONTOLOGY_PF = 'http://nerd.eurecom.fr/ontology#'
        
        self.PROV_ET = 'http://data.linkedtv.eu/organization/SV/EditorTool'
        self.ET_GRAPH = LTV_SAVE_GRAPH
        
        self.GRAPH = 'http://data.linkedtv.eu/graph/linkedtv'
        
        """Used for the owl:sameAs"""
        self.DBPEDIA_ONTOLOGY_PF = 'http://dbpedia.org/ontology/'
        self.NL_WIKIPEDIA_PF = 'http://nl.wikipedia.org/wiki/'
        self.DE_WIKIPEDIA_PF = 'http://de.wikipedia.org/wiki/'
        self.EN_WIKIPEDIA_PF = 'http://en.wikipedia.org/wiki/'                
    
    def autocomplete(self, prefix, queryClass = '', maxHits = 10):
        #extra info: https://github.com/dbpedia/lookup
        url = '%s?QueryClass=%s&MaxHits=%d&QueryString=%s' % (self.DBPEDIA_ENDPOINT, queryClass, maxHits, prefix.replace(' ', '+'))
        logger.debug(url)        
        cmd_arr = []
        cmd_arr.append('curl')
        cmd_arr.append('-X')
        cmd_arr.append('GET')
        cmd_arr.append(url)
        cmd_arr.append('-H')
        cmd_arr.append('Accept: application/json')        
        p1 = Popen(cmd_arr, stdout=PIPE)
        output = p1.communicate()[0]
        data = simplejson.loads(output)
        options = []     
        classes = None                
        for res in data['results']:
            type = 'unknown'
            classes = res['classes']
            for c in classes:
                type = self.getDBPediaMapping(c)
                if type != 'unknown':
                    options.append({'label' : '%s|%s|%s' % (res['label'], c['uri'][len(self.DBPEDIA_ONTOLOGY_PF):], type),
                                    'value' : res['uri']})
                    break
            if len(classes) == 0:
                options.append({'label' : '%s|%s|%s' % (res['label'], 'Thing', 'unknown'),
                                'value' : res['uri']})
        return options
            
    def getDBPediaMapping(self, DBPediaClass):
        className = DBPediaClass['uri']
        if className.find(self.DBPEDIA_ONTOLOGY_PF) == -1:
            return 'unknown'
        else:
            className = className[len(self.DBPEDIA_ONTOLOGY_PF):]
            for k in self.DBPEDIA_MAPPING.keys():
                if className in self.DBPEDIA_MAPPING[k]:
                    return k    
        return 'unknown'
        
    def sendSearchRequest(self, query):
        cmd_arr = []
        cmd_arr.append('curl')
        cmd_arr.append('-X')
        cmd_arr.append('POST')
        cmd_arr.append(LTV_SPARQL_ENDPOINT)
        cmd_arr.append('-H')
        cmd_arr.append('Accept: application/sparql-results+json')
        cmd_arr.append('-d')
        cmd_arr.append('query=%s' % urllib.quote(query, ''))
        p1 = Popen(cmd_arr, stdout=PIPE, stderr=PIPE)
        stdout, stderr = p1.communicate()
        if stdout:
            return stdout
        else:
            logger.error(stderr)
            return None
    
    def getMediaResources(self, publisher, format='json'):
        query = []
        query.append('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ')
        query.append('PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ')
        query.append('PREFIX owl: <http://www.w3.org/2002/07/owl#> ')
        query.append('PREFIX oa: <http://www.w3.org/ns/oa#> ')
        query.append('PREFIX prov: <http://www.w3.org/ns/prov#> ')
        query.append('PREFIX linkedtv: <http://data.linkedtv.eu/ontologies/core#> ')
        query.append('PREFIX ma: <http://www.w3.org/ns/ma-ont#> ')
        query.append('PREFIX nsa: <http://multimedialab.elis.ugent.be/organon/ontologies/ninsuna#> ')
        query.append('SELECT DISTINCT ?locator ?medialocator ')
        query.append('FROM <%s> ' % self.GRAPH)
        query.append('WHERE { ')
        query.append('?medialocator ma:locator ?locator . ')
        query.append('?mf ma:isFragmentOf ?medialocator . ')
        query.append('?mf rdf:type ma:MediaFragment . ')
        query.append('?annotation oa:hasTarget ?mf . ')
        query.append('}')
        logger.debug(''.join(query))
        resp = self.sendSearchRequest(''.join(query))
        jsonData = None
        try:
            jsonData = simplejson.loads(resp)
        except JSONDecodeError, e:
            print e
        locs = []
        if jsonData:
            for k in jsonData['results']['bindings']:
                start = end = bodyURI = label = bodyType = NEType = conceptLink = r = c = ''
                if k.has_key('medialocator') and k.has_key('locator'):
                    if k['locator']['value'].find(publisher) != -1:
                        locs.append(k['medialocator']['value'])
        return {'mediaResources' : locs}
    
    def loadMediaResource(self, mediaResourceID, locator = None):     
        print 'getting computaded data...'   
        mediaResource = self.loadComputatedMediaResourceData(mediaResourceID)
        print 'getting curated data...'
        mediaResource['curated'] = self.loadCuratedMediaResourceData(mediaResourceID)
        return mediaResource
    
    def loadComputatedMediaResourceData (self, mediaResourceID):        
        """Check if the media resource is in the cache"""
        mediaResource = None
        
        """Otherwise get query it from the SPARQL end-point"""     
        query = []
        query.append('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ')
        query.append('PREFIX linkedtv: <http://data.linkedtv.eu/ontologies/core#> ')
        query.append('PREFIX oa: <http://www.w3.org/ns/oa#> ')
        query.append('PREFIX ma: <http://www.w3.org/ns/ma-ont#> ')
        query.append('PREFIX nsa: <http://multimedialab.elis.ugent.be/organon/ontologies/ninsuna#> ')
        query.append('PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ')
        query.append('PREFIX owl: <http://www.w3.org/2002/07/owl#> ')
        query.append('PREFIX dc: <http://purl.org/dc/elements/1.1/> ')
        
        query.append('SELECT DISTINCT ?mf ?annotation ?body ?start ?end ?label ?RDFType ?DCType ?OWLSameAs ?c ?r ')
        query.append('FROM <%s> ' % self.GRAPH)
        query.append('WHERE { ')
        query.append('?mf ma:isFragmentOf <%s%s> . ' % (self.LINKEDTV_MEDIA_RESOURCE_PF, mediaResourceID))
        query.append('?mf nsa:temporalStart ?start . ')
        query.append('?mf nsa:temporalEnd ?end . ')
        query.append('?annotation oa:hasTarget ?mf . ')
        query.append('?annotation rdf:type <http://www.w3.org/ns/oa#Annotation> . ')
        query.append('?annotation oa:hasBody ?body . ')
        
        """To make sure that no enrichments are selected"""
        query.append('OPTIONAL { ?annotationy oa:motivatedBy ?motivation . FILTER (?annotation = ?annotationy) . } ') 
        query.append('FILTER ( !BOUND(?annotationy) ) ') 
        
        query.append('OPTIONAL {?body dc:type ?DCType } ') #dit wordt gebruikt voor NE extractor types
        query.append('OPTIONAL {?body rdf:type ?RDFType} ') #dit wordt gebruikt voor de NERD & CERTH ontologies
        query.append('OPTIONAL {?body owl:sameAs ?OWLSameAs} ') #dit wordt gebruikt voor CERTH en ook NE wiki/dbpedia links
        query.append('OPTIONAL {?body linkedtv:hasConfidence ?c } ')
        query.append('OPTIONAL {?body linkedtv:hasRelevance ?r } ')
        query.append('OPTIONAL {?body rdfs:label ?label}')        
        query.append('}')
        logger.debug(''.join(query))
        resp = self.sendSearchRequest(''.join(query))
        jsonData = None
        try:
            jsonData = simplejson.loads(resp)
        except JSONDecodeError, e:
            logger.error(e)
        if jsonData:            
            concepts = []
            nes = []
            shots = []
            related = []
            chapters = []                    
            for k in jsonData['results']['bindings']:
                mfURI = annotationURI = start = end = bodyURI = label = RDFType = DCType = OWLSameAs = r = c = ''
                if k.has_key('mf'): mfURI = k['mf']['value']
                if k.has_key('annotation'): annotationURI = k['annotation']['value']
                if k.has_key('body'): bodyURI = k['body']['value']                
                if k.has_key('start'): start = k['start']['value']
                if k.has_key('end'): end = k['end']['value']
                if k.has_key('label'): label = k['label']['value']
                if k.has_key('c'): c = k['c']['value']
                if k.has_key('r'): r = k['r']['value']
                if k.has_key('RDFType'): RDFType = k['RDFType']['value']
                if k.has_key('DCType'): DCType = k['DCType']['value']
                if k.has_key('OWLSameAs'): OWLSameAs = k['OWLSameAs']['value']                
                if RDFType == '%sConcept' % self.LINKEDTV_ONTOLOGY_PF:
                    """
                    concepts.append({'mfURI' : mfURI, 'annotationURI' : annotationURI, 'bodyURI' : bodyURI, 'start' : start, 'end' : end,
                                     'label' : label, 'link' : OWLSameAs, 'relevance' : r, 'confidence' : c})
                    """
                elif RDFType == '%sShot' % self.LINKEDTV_ONTOLOGY_PF:
                    shots.append({'mfURI' : mfURI, 'annotationURI' : annotationURI, 'bodyURI' : bodyURI, 'start' : start, 'end' : end, 'label' : label,
                                  'relevance' : r, 'confidence' : c})
                elif RDFType == '%sChapter' % self.LINKEDTV_ONTOLOGY_PF:
                    chapters.append({'mfURI' : mfURI, 'annotationURI' : annotationURI, 'bodyURI' : bodyURI, 'start' : start, 'end' : end,
                                     'label' : label, 'relevance' : r, 'confidence' : c})      
                elif RDFType.find(self.NERD_ONTOLOGY_PF) != -1:
                    nes.append({'mfURI' : mfURI, 'annotationURI' : annotationURI, 'bodyURI' : bodyURI, 'start' : start, 'end' : end, 'label' : label,
                                'type' : self.getNEType(DCType, RDFType, OWLSameAs), 'subTypes' : self.getDCTypes(DCType),
                                'disambiguationURL' : OWLSameAs, 'relevance' : r, 'confidence' : c})
                    
            related = [] #self.loadRelatedContent(mediaResourceID)
            enrichments = self.loadComputatedEnrichmentsOfMediaResource(mediaResourceID)            
            mediaResource = {'concepts' : concepts, 'nes' : self.filterStopWordNEs(nes),
                             'shots' : shots, 'chapters' : chapters, 'related' : related, 'enrichments' : enrichments}
            
            return mediaResource
        return None
    
    """
    This function (should) return a dictionary with key=NElabel value=list of hyperlinks
    TODO: the RDF data is not yet available and therefore this function has to be tested still!!
    """
    def loadComputatedEnrichmentsOfMediaResource(self, mediaResourceID):
        query = []
        query.append('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ')
        query.append('PREFIX linkedtv: <http://data.linkedtv.eu/ontologies/core#> ')
        query.append('PREFIX oa: <http://www.w3.org/ns/oa#> ')
        query.append('PREFIX ma: <http://www.w3.org/ns/ma-ont#> ')
        query.append('PREFIX nsa: <http://multimedialab.elis.ugent.be/organon/ontologies/ninsuna#> ')
        query.append('PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ')
        query.append('PREFIX owl: <http://www.w3.org/2002/07/owl#> ')
        query.append('PREFIX prov: <http://www.w3.org/ns/prov#> ')
        query.append('PREFIX dc: <http://purl.org/dc/elements/1.1/> ')
        
        query.append('SELECT DISTINCT ?body ?entity ?entityLabel ?source ?date ?creator ?deeplink ?partOf ?poster ?socialInteraction ')
        query.append('?DCType ?start ?end ')
        query.append('FROM <%s> ' % self.GRAPH)
        query.append('WHERE { ')
        query.append('?mf ma:isFragmentOf <%s%s> . ' % (self.LINKEDTV_MEDIA_RESOURCE_PF, mediaResourceID))
        query.append('?mf nsa:temporalStart ?start . ')
        query.append('?mf nsa:temporalEnd ?end . ')
        query.append('?annotation oa:hasTarget ?mf . ')
        query.append('?annotation rdf:type <http://www.w3.org/ns/oa#Annotation> . ')
        query.append('?annotation oa:motivatedBy oa:linking . ')
        query.append('?annotation oa:hasBody ?body . ')
        
        #later on there could be more than one related entity!!! Need to update this!
        query.append('?annotation prov:wasDerivedFrom ?entity . ')
        query.append('?entity rdfs:label ?entityLabel ')
        
        query.append('OPTIONAL {?body dc:type ?DCType } ')
        query.append('OPTIONAL {?body linkedtv:hasPoster ?poster } ')
        query.append('OPTIONAL {?body linkedtv:hasSocialInteraction ?socialInteraction } ')        
        #query.append('OPTIONAL {?body rdf:type ?RDFType} ')
        query.append('OPTIONAL {?body dc:source ?source} ')
        query.append('OPTIONAL {?body dc:date ?date } ')
        query.append('OPTIONAL {?body ma:locator ?deeplink} ')
        query.append('OPTIONAL {?body dc:isPartOf ?partOf} ')
        query.append('OPTIONAL {?body dc:creator ?creator} ')
        #query.append('OPTIONAL {?body dc:description ?desc . ?desc <http://nlp2rdf.lod2.eu/schema/string/label> ?label}')
        query.append('}')        
        logger.debug(''.join(query))
        resp = self.sendSearchRequest(''.join(query))
        jsonData = None
        try:
            jsonData = simplejson.loads(resp)
        except JSONDecodeError, e:
            print e
        enrichments = []
        if jsonData:
            for k in jsonData['results']['bindings']:
                uri = entityURI = entityLabel = source = date = creator = deeplink = partOf = DCType = ''
                socialInteraction = poster = start = end = ''                
                if k.has_key('body'): uri = k['body']['value']            
                if k.has_key('entity'): entityURI = k['entity']['value']
                if k.has_key('entityLabel'): entityLabel = k['entityLabel']['value']
                if k.has_key('source'): source = k['source']['value']
                if k.has_key('date'): date = k['date']['value']
                if k.has_key('creator'): creator = k['creator']['value']
                if k.has_key('deeplink'): deeplink = k['deeplink']['value']
                if k.has_key('partOf'): partOf = k['partOf']['value']
                if k.has_key('DCType'): DCType = k['DCType']['value']
                if k.has_key('poster'): poster = k['poster']['value']
                if k.has_key('socialInteraction'): socialInteraction = k['socialInteraction']['value']
                if k.has_key('start'): start = k['start']['value']
                if k.has_key('end'): end = k['end']['value']
                #TODO update when there are more!
                entities = [{'uri' : entityURI, 'label' : entityLabel}]
                enrichments.append({'uri' : uri, 'source' : source, 'date' : date, 'creator' : creator, 'url' : deeplink, 'partOf' : partOf, 
                                        'DCType' : DCType, 'start' : start, 'end' : end, 'poster' : poster, 'socialInteraction' : socialInteraction,
                                        'derivedFrom' : entities})
        return enrichments
    
    def loadRelatedContent(self, mediaResourceID):
        query = []
        query.append('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ')
        query.append('PREFIX oa: <http://www.w3.org/ns/oa#> ')
        query.append('PREFIX ma: <http://www.w3.org/ns/ma-ont#> ')
        query.append('PREFIX nsa: <http://multimedialab.elis.ugent.be/organon/ontologies/ninsuna#> ')        
        query.append('SELECT DISTINCT ?start ?end ?body ')
        query.append('FROM <%s> ' % self.GRAPH)
        query.append('WHERE { ')
        query.append('?mf ma:isFragmentOf <%s%s> . ' % (self.LINKEDTV_MEDIA_RESOURCE_PF, mediaResourceID))        
        query.append('?mf nsa:temporalStart ?start . ')
        query.append('?mf nsa:temporalEnd ?end . ')
        query.append('?annotation oa:hasTarget ?mf . ')
        query.append('?annotation rdf:type <http://www.w3.org/ns/oa#Annotation> . ')
        query.append('?annotation oa:hasBody ?body . ')
        query.append('?body rdf:type <http://data.linkedtv.eu/ontology/RelatedContent> ')
        query.append('}')
        logger.debug(''.join(query))
        resp = self.sendSearchRequest(''.join(query))
        jsonData = None
        try:
            jsonData = simplejson.loads(resp)
        except JSONDecodeError, e:
            logger.error(e)
        if jsonData:
            related = []
            for k in jsonData['results']['bindings']:
                start = end = bodyURI = ''                        
                if k.has_key('start'): start = k['start']['value']
                if k.has_key('end'): end = k['end']['value']
                if k.has_key('body'): bodyURI = k['body']['value']
                related.append({'start' : start, 'end' : end, 'bodyURI' : bodyURI})
            return related
        return None
    
    def loadCuratedMediaResourceData (self, mediaResourceID):
        """Check if the media resource is in the cache"""
        mediaResource = None
        
        """Otherwise get query it from the SPARQL end-point"""     
        query = []
        query.append('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ')
        query.append('PREFIX linkedtv: <http://data.linkedtv.eu/ontologies/core#> ')
        query.append('PREFIX oa: <http://www.w3.org/ns/oa#> ')
        query.append('PREFIX ma: <http://www.w3.org/ns/ma-ont#> ')
        query.append('PREFIX nsa: <http://multimedialab.elis.ugent.be/organon/ontologies/ninsuna#> ')
        query.append('PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ')
        query.append('PREFIX owl: <http://www.w3.org/2002/07/owl#> ')
        query.append('PREFIX prov: <http://www.w3.org/ns/prov#> ')
        query.append('PREFIX dc: <http://purl.org/dc/elements/1.1/> ')
        
        query.append('SELECT DISTINCT ?orgMF ?mf ?orgAnnotation ?annotation ?enrichment ?orgBody ?body ')
        query.append('?start ?end ?label ?RDFType ?DCType ?OWLSameAs ?vocabURL ?c ?r ?segmentType ')
        
        query.append('FROM <%s> ' % self.ET_GRAPH)
        
        query.append('WHERE { ')
        query.append('?mf ma:isFragmentOf <%s%s> . ' % (self.LINKEDTV_MEDIA_RESOURCE_PF, mediaResourceID))        
        query.append('?mf nsa:temporalStart ?start . ')
        query.append('?mf nsa:temporalEnd ?end . ')
        query.append('OPTIONAL {?mf linkedtv:wasDerivedFrom ?orgMF } ')
        
        query.append('?annotation oa:hasTarget ?mf . ')
        query.append('OPTIONAL {?enrichment oa:hasTarget ?mf . ')
        query.append('?enrichment oa:motivatedBy <http://www.w3.org/ns/oa#linking> } ')
        query.append('?annotation prov:wasAttributedTo <%s> . ' % self.PROV_ET)
        query.append('?annotation rdf:type <http://www.w3.org/ns/oa#Annotation> . ')
        query.append('?annotation oa:hasBody ?body . ')
        query.append('OPTIONAL {?annotation linkedtv:wasDerivedFrom ?orgAnnotation } ')
        
        """To make sure that no enrichments are selected"""
        #query.append('OPTIONAL { ?annotationy oa:motivatedBy ?motivation . FILTER (?annotation = ?annotationy) . } ') 
        #query.append('FILTER ( !BOUND(?annotationy) ) ')
        
        query.append('OPTIONAL {?body linkedtv:wasDerivedFrom ?orgBody } ')
        query.append('OPTIONAL {?body linkedtv:hasSegmentType ?segmentType } ')
        query.append('OPTIONAL {?body dc:type ?DCType } ') #dit wordt gebruikt voor NE extractor types
        query.append('OPTIONAL {?body rdf:type ?RDFType} ') #dit wordt gebruikt voor de NERD & CERTH ontologies
        query.append('OPTIONAL {?body owl:sameAs ?OWLSameAs} ') #dit wordt gebruikt voor CERTH en ook NE wiki/dbpedia/yago links
        query.append('OPTIONAL {?body ma:locator ?vocabURL} ') #dit wordt gebruikt voor custom external vocab links
        query.append('OPTIONAL {?body linkedtv:hasConfidence ?c } ')
        query.append('OPTIONAL {?body linkedtv:hasRelevance ?r } ')
        query.append('OPTIONAL {?body rdfs:label ?label}')
        query.append('}')
        logger.debug(''.join(query))
        resp = self.sendSearchRequest(''.join(query))
        jsonData = None
        try:
            jsonData = simplejson.loads(resp)
        except JSONDecodeError, e:
            logger.error(resp)
            logger.error(e)
        if jsonData:            
            concepts = []
            nes = []
            shots = []
            related = []
            chapters = []
            for k in jsonData['results']['bindings']:
                ETenrichmentURI = mfURI = ETmfURI = annotationURI = ETannotationURI = bodyURI = ETbodyURI = start = end = bodyURI = label = ''
                RDFType = DCType = OWLSameAs = vocabURL = r = c = segmentType =''
                if k.has_key('enrichment'): ETenrichmentURI = k['enrichment']['value']
                if k.has_key('mf'): ETmfURI = k['mf']['value']
                if k.has_key('orgMf'): mfURI = k['orgMf']['value']
                if k.has_key('annotation'): ETannotationURI = k['annotation']['value']
                if k.has_key('orgAnnotation'): annotationURI = k['orgAnnotation']['value']
                if k.has_key('body'): ETbodyURI = k['body']['value']
                if k.has_key('orgBody'): bodyURI = k['orgBody']['value']                
                if k.has_key('start'): start = k['start']['value']
                if k.has_key('end'): end = k['end']['value']
                if k.has_key('label'): label = k['label']['value']
                if k.has_key('c'): c = k['c']['value']
                if k.has_key('r'): r = k['r']['value']
                if k.has_key('segmentType'): segmentType = k['segmentType']['value']
                if k.has_key('RDFType'): RDFType = k['RDFType']['value']
                if k.has_key('DCType'): DCType = k['DCType']['value']
                if k.has_key('OWLSameAs'): OWLSameAs = k['OWLSameAs']['value']
                if k.has_key('vocabURL'): vocabURL = k['vocabURL']['value']
                if RDFType == '%sConcept' % self.LINKEDTV_ONTOLOGY_PF:
                    continue
                    """
                    concepts.append({'ETmfURI' : ETmfURI, 'ETannotationURI' : ETannotationURI, 'ETbodyURI' : ETbodyURI,
                                     'mfURI' : mfURI, 'annotationURI' : annotationURI, 'bodyURI' : bodyURI,
                                     'start' : start, 'end' : end,
                                     'label' : label, 'link' : OWLSameAs, 'relevance' : r, 'confidence' : c})
                    """
                elif RDFType == '%sShot' % self.LINKEDTV_ONTOLOGY_PF:
                    shots.append({'ETmfURI' : ETmfURI, 'ETannotationURI' : ETannotationURI, 'ETbodyURI' : ETbodyURI,
                                  'mfURI' : mfURI, 'annotationURI' : annotationURI, 'bodyURI' : bodyURI, 'start' : start,
                                  'end' : end, 'label' : label, 'relevance' : r, 'confidence' : c})
                elif RDFType == '%sChapter' % self.LINKEDTV_ONTOLOGY_PF:
                    chapters.append({'ETmfURI' : ETmfURI, 'ETannotationURI' : ETannotationURI, 'ETbodyURI' : ETbodyURI,
                                     'mfURI' : mfURI, 'annotationURI' : annotationURI, 'bodyURI' : bodyURI, 'start' : start, 'end' : end,
                                     'label' : label, 'relevance' : r, 'confidence' : c, 'segmentType' : segmentType})      
                elif RDFType.find(self.NERD_ONTOLOGY_PF) != -1 or RDFType.find(self.DBPEDIA_ONTOLOGY_PF) != -1:
                    nes.append({'ETenrichmentURI' : ETenrichmentURI, 'ETmfURI' : ETmfURI, 'ETannotationURI' : ETannotationURI, 'ETbodyURI' : ETbodyURI,
                                'mfURI' : mfURI, 'annotationURI' : annotationURI, 'bodyURI' : bodyURI, 'start' : start,
                                'end' : end, 'label' : label, 'type' : self.getNEType(DCType, RDFType, OWLSameAs),
                                'subTypes' : self.getDCTypes(DCType), 'disambiguationURL' : OWLSameAs, 'relevance' : r, 'confidence' : c,
                                'url' : vocabURL})
            #TODO what to do with related content & enrichments?
            enrichments = self.loadCuratedEnrichmentsOfMediaResource(mediaResourceID)
            mediaResource = {'concepts' : concepts, 'nes' : self.filterStopWordNEs(nes),
                             'shots' : shots, 'chapters' : chapters, 'enrichments' : enrichments}
            
            return mediaResource
        return None
    
    def loadCuratedEnrichmentsOfMediaResource(self, mediaResourceID):
        query = []
        query.append('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ')
        query.append('PREFIX linkedtv: <http://data.linkedtv.eu/ontologies/core#> ')
        query.append('PREFIX oa: <http://www.w3.org/ns/oa#> ')
        query.append('PREFIX ma: <http://www.w3.org/ns/ma-ont#> ')
        query.append('PREFIX nsa: <http://multimedialab.elis.ugent.be/organon/ontologies/ninsuna#> ')
        query.append('PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ')
        query.append('PREFIX owl: <http://www.w3.org/2002/07/owl#> ')
        query.append('PREFIX prov: <http://www.w3.org/ns/prov#> ')
        query.append('PREFIX dc: <http://purl.org/dc/elements/1.1/> ')
        
        query.append('SELECT DISTINCT ?body ?prov ?entity ?source ?date ?creator ?deeplink ?partOf ?poster ?socialInteraction ')
        query.append('?DCType ?start ?end ?bodyProv ')
        query.append('FROM <%s> ' % self.ET_GRAPH)
        query.append('FROM <%s> ' % self.GRAPH)
        query.append('WHERE { ')
        query.append('?mf ma:isFragmentOf <%s%s> . ' % (self.LINKEDTV_MEDIA_RESOURCE_PF, mediaResourceID))
        query.append('?mf nsa:temporalStart ?start . ')
        query.append('?mf nsa:temporalEnd ?end . ')
        query.append('?annotation oa:hasTarget ?mf . ')
        query.append('?annotation rdf:type <http://www.w3.org/ns/oa#Annotation> . ')
        query.append('?annotation oa:motivatedBy oa:linking . ')
        query.append('?annotation oa:hasBody ?body . ')
        query.append('?annotation prov:wasAttributedTo <%s> . ' % self.PROV_ET)
        query.append('?annotation prov:wasDerivedFrom ?prov . ')
        query.append('?prov rdfs:label ?entity . ')
        
        query.append('OPTIONAL {?body prov:wasAttributedTo ?bodyProv } ')
        query.append('OPTIONAL {?body dc:type ?DCType } ')
        query.append('OPTIONAL {?body linkedtv:hasPoster ?poster } ')
        query.append('OPTIONAL {?body linkedtv:hasSocialInteraction ?socialInteraction } ')        
        #query.append('OPTIONAL {?body rdf:type ?RDFType} ')
        query.append('OPTIONAL {?body dc:source ?source} ')
        query.append('OPTIONAL {?body dc:date ?date } ')
        query.append('OPTIONAL {?body ma:locator ?deeplink} ')
        query.append('OPTIONAL {?body dc:isPartOf ?partOf} ')
        query.append('OPTIONAL {?body dc:creator ?creator} ')
        #query.append('OPTIONAL {?body dc:description ?desc . ?desc <http://nlp2rdf.lod2.eu/schema/string/label> ?label}')
        query.append('}')
        logger.debug('---------- CURATED ENRICHMENTS --------------')
        logger.debug(''.join(query))
        resp = self.sendSearchRequest(''.join(query))
        jsonData = None
        try:
            jsonData = simplejson.loads(resp)
        except JSONDecodeError, e:
            logger.error(e)
        enrichments = []
        if jsonData:
            for k in jsonData['results']['bindings']:
                bodyURI = annotationURI = entityLabel = source = date = creator = deeplink = partOf = DCType = ''
                socialInteraction = poster = start = end = bodyProv = ''
                if k.has_key('body'): bodyURI = k['body']['value']                
                if k.has_key('prov'): annotationURI = k['prov']['value']
                if k.has_key('entity'): entityLabel = k['entity']['value']
                if k.has_key('source'): source = k['source']['value']
                if k.has_key('date'): date = k['date']['value']
                if k.has_key('creator'): creator = k['creator']['value']
                if k.has_key('deeplink'): deeplink = k['deeplink']['value']
                if k.has_key('partOf'): partOf = k['partOf']['value']        
                if k.has_key('DCType'): DCType = k['DCType']['value']
                if k.has_key('poster'): poster = k['poster']['value']
                if k.has_key('socialInteraction'): socialInteraction = k['socialInteraction']['value']
                if k.has_key('start'): start = k['start']['value']
                if k.has_key('end'): end = k['end']['value']
                if k.has_key('bodyProv'): bodyProv = k['bodyProv']['value']
                
                enrichments.append({'bodyURI' : bodyURI, 'source' : source, 'date' : date, 'creator' : creator, 
                                    'url' : deeplink, 'partOf' : partOf, 'DCType' : DCType, 'start' : start, 'end' : end,
                                    'annotationURI' : annotationURI, 'ne' : entityLabel, 'poster' : poster,
                                    'socialInteraction' : socialInteraction, 'bodyProv' : bodyProv})
        return enrichments
    
    def filterStopWordNEs(self, nes):
        ta = TextAnalyzer()
        stop = ta.readStopWordsFile(LTV_STOP_FILE)
        nonStopNEs = []
        for ne in nes:
            if ne['label'].lower() in stop:
                continue
            else:
                nonStopNEs.append(ne)
        return nonStopNEs     
    
    def getNEType(self, DCType, RDFType, OWLSameAs):
        """The RDF should be the correct one, however in some cases the OWLSameAs or DCType makes more sense"""
        #TODO maybe later add some intelligence to this! Now handling on the client side...
        if(RDFType.find(self.DBPEDIA_ONTOLOGY_PF) == -1):                
            return RDFType[len(self.NERD_ONTOLOGY_PF):]
        else:
            return RDFType[len(self.DBPEDIA_ONTOLOGY_PF):]
        
    def getDCTypes(self, DCType):
        if len(DCType) > 0 and DCType != 'null':
            types = {}
            if DCType.find('DBpedia') == -1 and DCType.find('Freebase') == -1:
                if DCType.find('dbpedia') == -1:
                    return {'NERD' : [DCType]}
                else:
                    return {'DBpedia' : [DCType[len(self.DBPEDIA_ONTOLOGY_PF):]]}
            dct_arr = DCType.split(';')
            for dct in dct_arr:
                ext_arr = dct.split(',')
                extractorName = None
                values = []
                for index, val in enumerate(ext_arr):
                    if index == 0:
                        extractorName = val[0:val.find(':')]
                        val = val[val.find(':') + 1:]
                    values.append(val)
                types[extractorName] = values
            return types
        else:
            return {}
            