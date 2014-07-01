import codecs
import logging
logger = logging.getLogger(__name__)

class TextAnalyzer:
                
    def __init__(self):
        logger.debug('-- Initializing TextAnalyzer --')
    
    """
    Deze functie leest een stopwoorden file (stoplist_tno.tab) in en retourneert deze woorden in 
    een dictionary
    """
    def readStopWordsFile(self, strStopFile):
        if not strStopFile:
            strStopFile = self._stopWordsFile
        """ read stopwords from file as dictionary. """       
        stopWords = {}
        try:
            f = codecs.open(strStopFile,'rU','utf-8')  # NB. Use 'U'-mode for UniversalNewline Support
            for line in f.readlines():
                word = line.partition('::')[0].strip()#.decode('utf-8')
                stopWords[word] = 1
            f.close()
        except IOError, e:
            msg =  'Can\'t open stopfile %s for reading. %s' % (strStopFile, str(e))
            logger.error(msg)
            return None
        return stopWords