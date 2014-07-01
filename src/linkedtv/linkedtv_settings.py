"""configuration file for the LinkedTV editor tool"""

from django.conf import settings

LTV_STOP_FILE = getattr(settings, 'LTV_STOP_FILE', '/Users/jblom/projects/accelerator/workspace/linkedtv-et/resources/stoplist_tno.tab')
LTV_SPARQL_ENDPOINT = getattr(settings, 'LTV_SPARQL_ENDPOINT', 'http://data.linkedtv.eu/sparql')
LTV_REDIS_SETTINGS = getattr(settings, 'LTV_REDIS_SETTINGS', {'host' : 'localhost', 'port' : 6379, 'db' : 0})
LTV_SAVE_GRAPH = getattr(settings, 'LTV_SAVE_GRAPH', 'http://data.linkedtv.eu/graph/linkedtv_et_test')