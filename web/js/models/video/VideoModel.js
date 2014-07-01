define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
	var VideoModel = Backbone.Model.extend({
		
		//TODO this is mainly to show what kind of properties are available in the API (and a bit for testing)
		defaults: {	  
			'id' : '8794ac2c-a5b8-11e2-951c-f8bdfd0abfbd',
			'titleName' : 'Tussen Kunst',
			'language' : 'Dutch',
			'locator' : 'http://stream4.noterik.com/progressive/stream4/domain/linkedtv/user/avro/video/5/rawvideo/4/raw.mp4',
			'dateInserted' : null,
			'collection' : null,
			'publisher' : 'S&V',
			'frameSizeWidth' : 1920,
			'frameSizeHeight' : 1080,
			'compression' : null,
			'format' : 'mp4',
			'duration' : null,
			'mediaResourceRelationSet' : null
		}
	
	});

	return VideoModel;

});