define([
  'underscore',
  'backbone',
  'tools/TimeUtils'
], function(_, Backbone, TimeUtils) {
	
	var AnnotationModel = Backbone.Model.extend({
				
		initialize : function() {
			if(this.attributes.start >= 0) {
				this.set('prettyStartTime', TimeUtils.toPrettyTime(this.attributes.start));
			}
			if(this.attributes.end >= 0) {
				this.set('prettyEndTime', TimeUtils.toPrettyTime(this.attributes.end));
			}
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
			}
		},
		
		toJSON : function() {
			var attributes = {}
	
	        // go through each attribute
	        $.each(this.attributes, function(key, value) {
	            if (value !== "" && value !== undefined && key != 'image' && key != 'id' && key != 'category'
	            	&& key != 'confidence' && key != 'relevance' && key != 'subTypes' && key.indexOf('pretty') == -1) {
	                attributes[key] = value;
	            }
	        });
	        return attributes;
		}
	  
	}, {
		NAMED_ENTITY : 0,
		VISUAL_CONCEPT : 1,
		FACE : 2
	});

	return AnnotationModel;

});