define([
  'underscore',
  'backbone',
  'models/video/VideoModel'
], function(_, Backbone, VideoModel) {

	var VideosCollection = Backbone.Collection.extend({
      
		model: VideoModel,

		initialize : function(models, options) {
			//populate this collection using the globally initialized _videoData
			//var mrs = _videoData.pagedListHolder.pageList;			
			//var mrs = _videoData.mediaResources.mediaResources;
			var mrs = _videoData.mediaResources;			
			for (index in mrs) {
				this.add(new VideoModel({
					'id' : mrs[index].substring('http://data.linkedtv.eu/media/'.length)
				}));
			}
			/*
			var mr = null;
			for (var key in mrs){
				mr = mrs[key];
				this.add(new VideoModel({
					'id' : mr.id,
					'titleName' : mr.titleName,
					'language' : mr.language,
					'locator' : mr.locator,
					'dateInserted' : mr.dateInserted,
					'collection' : mr.collection,
					'publisher' : mr.publisher,
					'frameSizeWidth' : mr.frameSizeWidth,
					'frameSizeHeight' : mr.frameSizeHeight,
					'compression' : mr.compression,
					'format' : mr.format,
					'duration' : mr.duration,
					'mediaResourceRelationSet' : mr.mediaResourceRelationSet
				}));
			}*/
		}
     
	});

	return VideosCollection;

});