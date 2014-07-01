define([
  'underscore',
  'backbone',
  'tools/TimeUtils',
  'tools/AnnotationUtils',
  'models/enrichment/EnrichmentModel'
], function(_, Backbone, TimeUtils, AnnotationUtils, EnrichmentModel) {

	var EnrichmentsCollection = Backbone.Collection.extend({
      
		model: EnrichmentModel,

		initialize : function(models, options) {
			this.sortField = 'source';
		},
		
		comparator : function(item) {
			if(this.sortField == 'derivedFrom'){
				return item.get(this.sortField)[0].uri;
			} else {
				return item.get(this.sortField);
			}
		},
		
		setEnrichments : function(enrichments) {			
			var enrichmentEntityIndex = {};
			var temp = [];
			var startMs = null;
			var endMs = null;
			var idString = null;
			var service = null;
			var prefix = 'http://data.linkedtv.eu/organization/';
			var enrichment = null;
			for(var i=0;i<enrichments.length;i++) {
				startMs = TimeUtils.toMillis(enrichments[i].start);
				endMs = TimeUtils.toMillis(enrichments[i].end);
				service = enrichments[i].source == 'editor_tool' ? 'ET' : enrichments[i].source.substring(prefix.length);
				
				if(enrichments[i].url && enrichments[i].url != "") {
					enrichment = new EnrichmentModel({bodyURI : enrichments[i].uri, source : service, date : enrichments[i].date,
						creator : enrichments[i].creator, url : enrichments[i].url, partOf : enrichments[i].partOf, DCType : enrichments[i].DCType, 
						start : startMs, end : endMs, image : this.getPosterImage(enrichments[i].poster), 
						socialInteraction : enrichments[i].socialInteraction, derivedFrom : enrichments[i].derivedFrom});
					temp.push(enrichment);
								
					//add the enrichment to the enrichmentEntityIndex for convenient lookup (by entities)
					if(enrichments[i].derivedFrom) {
						for (var j=0;j<enrichments[i].derivedFrom.length;j++) {
							if(enrichmentEntityIndex[enrichments[i].derivedFrom[j].uri]) {
								enrichmentEntityIndex[enrichments[i].derivedFrom[j].uri].push(enrichment.cid); 
							} else {
								enrichmentEntityIndex[enrichments[i].derivedFrom[j].uri] = [enrichment.cid];
							}
						}
					}
				}
			}
			this.add(temp);
			return enrichmentEntityIndex;
		},
		
		getPosterImage : function(poster) {
			if (poster) {
				//return RD_LABS_HOST + '/image?id=' + poster;
				return poster;
			}
			return AnnotationUtils.getDummyThumbnail();
		},
		
		getImageURLByService : function(service, url) {
			var imageURL = null;
			if (service == 'YouTube') {
				imageURL = 'http://img.youtube.com/vi/';
				var ytID = url.substring(url.indexOf('embed/') + 6);
				return imageURL + ytID + '/1.jpg';
			} else if (service == 'MobyPicture') {
				return url.replace('large', 'thumbnail');
			} else if (service == 'TwitPic') {
				return url.replace('large', 'thumb');
			} else if (service == 'GooglePlus') {
				return url;
			}
			return AnnotationUtils.getDummyThumbnail();
		}
     
  });

  return EnrichmentsCollection;

});