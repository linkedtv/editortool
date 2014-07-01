define([
  'underscore',
  'backbone',
  'tools/TimeUtils'
], function(_, Backbone, TimeUtils) {
	
	var EnrichmentModel = Backbone.Model.extend({
				
		initialize : function() {			
			if(this.attributes.start >= 0) {
				this.set('prettyStartTime', TimeUtils.toPrettyTime(this.attributes.start));
			}
			if(this.attributes.end >= 0) {
				this.set('prettyEndTime', TimeUtils.toPrettyTime(this.attributes.end));
			}
			/* TODO whenever I find the confidence value in the data
			if(this.attributes.confidence) {
				if(this.attributes.confidence <= 0) {
					this.set('confidenceClass', 'verylow');
				} else if (this.attributes.confidence > 0 && this.attributes.confidence <= 0.2) {
					this.set('confidenceClass', 'low');
				} else if (this.attributes.confidence > 0.2 && this.attributes.confidence <= 0.4) {
					this.set('confidenceClass', 'fair');
				} else if (this.attributes.confidence > 0.4 && this.attributes.confidence <= 0.6) {
					this.set('confidenceClass', 'medium');
				} else if (this.attributes.confidence > 0.6 && this.attributes.confidence <= 0.8) {
					this.set('confidenceClass', 'high');
				} else if (this.attributes.confidence > 0.8) {
					this.set('confidenceClass', 'veryhigh');
				}
			}*/
		}
	  
	}, {
		TWITTER : 0,
		YOUTUBE : 1,
		FLICKR : 2,
		OTHER : 3
	});

	return EnrichmentModel;

});