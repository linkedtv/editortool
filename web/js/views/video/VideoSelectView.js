define([
  'underscore',
  'backbone',  
  'models/video/VideoModel',
  'collections/videos/VideosCollection',
  'text!templates/videos/videoSelectTemplate.html'
], function(_, Backbone, VideoModel, VideosCollection, videoSelectTemplate) {

	var VideoSelectView = Backbone.View.extend({
		
		initialize : function() {
			//get the main ID from the App
			this.mediaResourceID = _App.mediaResourceID;			
		
			//initialize the collection (TODO get it from the App?)
			this.collection = new VideosCollection();
			
			//set the template
			this.template = _.template(videoSelectTemplate);
			
			//render the view
			this.render();
		},
		
		events : {
			'change #mr_select' : 'selectMediaResource',
			'click .view_close' : 'toggle'
		},
		
		selectMediaResource : function(evt) {
			var id = $('#mr_select option:selected').val();
			if(id != '-') {
				_App.setMediaResource(id);
			}
		},
		
		render: function() {
			this.$el.html(this.template({videos: this.collection.models, id : this.mediaResourceID}));
			if(!this.mediaResourceID) {
				this.$el.css('display', 'block');
			}
			return this;
		},
		
		//show/hide this view
		toggle : function() {
			if(this.$el.css('display') == 'block') {
				this.$el.css('display', 'none');
			} else {
				this.$el.css('display', 'block');
			}
		},
		
		//show the view
		show : function() {
			this.$el.css('display', 'block');
		}
	});

	return VideoSelectView;
	
});