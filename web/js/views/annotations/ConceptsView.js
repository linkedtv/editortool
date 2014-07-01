//TODO title moet geupdate worden in de 'tile'

define([
  'underscore',
  'backbone', 
  'tools/TimeUtils',
  'models/chapter/ChapterModel',  
  'text!templates/annotations/conceptsTemplate.html'
], function(_, Backbone, TimeUtils, ChapterModel, conceptsTemplate) {

	var ConceptsView = Backbone.View.extend({
		
		//this.collection and this.el are passed in the AnnotationsView
		initialize : function() {
			
			//the selected chapter by default is empty
			this.chapter = new ChapterModel();					
			
			//set the template
			this.template = _.template(conceptsTemplate);
			
			//render the page when the selected chapter has changed
			this.chapter.on('change', this.render, this);
		},
		
		render: function() {
			//console.debug('Rendering the ConceptsView...');
			var ch_s = TimeUtils.toMillis(this.chapter.get('start'));
			var ch_e = TimeUtils.toMillis(this.chapter.get('end'));
			
			//filter the concepts so only concepts of the selected chapter are shown
			var filteredConcepts = _.filter(this.collection.models, function(item) {
				var sh_s = TimeUtils.toMillis(item.get('start'));
				var sh_e = TimeUtils.toMillis(item.get('end'));
				if(sh_s >= ch_s && sh_e <= ch_e){
					return item;
				}
			});			
			this.$el.html(this.template({concepts: filteredConcepts}));
			return this;
		},
		
		//set the chapter (this will cause the view to be rendered again)
		setChapter: function(chapter) {
			console.debug('Setting the chapter in the ConceptsView...');
			this.chapter.set({id : chapter.get('id'), start : chapter.get('start'), end : chapter.get('end'), image : chapter.get('image')})
		},
		
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

	return ConceptsView;
	
});