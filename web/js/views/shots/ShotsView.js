define([
  'underscore',
  'backbone', 
  'tools/TimeUtils',
  'models/chapter/ChapterModel', 
  'collections/shots/ShotsCollection',
  'text!templates/shots/shotsTemplate.html'
], function(_, Backbone, TimeUtils, ChapterModel, ShotsCollection, shotsTemplate) {

	var ShotsView = Backbone.View.extend({
		
		initialize : function() {
			//get the shots collection from the _App
			this.collection = _App.shots;
			
			//get the current chapter from the _App and listen to changes
			this.chapter = _App.chapter;			
			
			//set the template
			this.template = _.template(shotsTemplate);			
		},
		
		render: function() {
			var filteredShots = [];			
			if(this.chapter.get('id') != undefined) {
				var ch_s = this.chapter.get('start');
				var ch_e = this.chapter.get('end');
				filteredShots = _.filter(this.collection.models, function(item) {
					if(item.get('start') >= ch_s && item.get('end') <= ch_e) {
						return item;
					}
				});
			}
			this.$el.html(this.template({chapter : this.chapter, shots: filteredShots}));			
			return this;
		},
		
		events : {
			'click .shot' : 'viewShot'
		},
		
		viewShot : function (evt) {
			var shot = this.collection.getByCid($(evt.currentTarget).attr('id'));
			_App.seek(shot.get('start'));
		},
		
		//----------------------- PUBLIC FUNCTIONS ----------------------
		//----------------------- PUBLIC FUNCTIONS ----------------------
		//----------------------- PUBLIC FUNCTIONS ----------------------
		//----------------------- PUBLIC FUNCTIONS ----------------------
		
		//show the view
		show : function() {
			if(this.$el.children().length == 0){
				this.render();
			}
			this.$el.css('display', 'block');			
		},
		
		//hide the view
		hide : function() {			
			this.$el.css('display', 'none');			
		}
	});

	return ShotsView;
	
});