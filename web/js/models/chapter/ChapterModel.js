define([
  'underscore',
  'backbone',
  'tools/TimeUtils'
], function(_, Backbone, TimeUtils) {
  
	var ChapterModel = Backbone.Model.extend({
		
		initialize : function() {
	        this.setPrettyStartTime();
	        this.setPrettyEndTime();
    	},
    	
    	defaults : {
    		'tags' : []
    	},
    	
    	setPrettyStartTime : function() {
    		if(this.attributes.start >= 0) {
				this.set('prettyStartTime', TimeUtils.toPrettyTime(this.attributes.start));
			}			
    	},
    	
    	setPrettyEndTime : function() {    		
    		if(this.attributes.end) {
				this.set('prettyEndTime', TimeUtils.toPrettyTime(this.attributes.end));
			}
    	},
    	
		validate: function(attrs, options) {
			if (attrs.end < attrs.start) {
				return 'cannot end before it starts';
			}
		},
		
		toJSON : function() {
			var attributes = {}
	
	        // go through each attribute
	        $.each(this.attributes, function(key, value) {
	            if (value !== "" && value !== undefined && key != 'image' && key != 'id' && key.indexOf('pretty') == -1) {
	                attributes[key] = value;
	            }
	        });
	        return attributes;
		}
		
	});

	return ChapterModel;

});