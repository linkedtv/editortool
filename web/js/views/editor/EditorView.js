/*
 * INFO
 * - http://www.kanzaki.com/works/2006/misc/0308turtle.html
 * 
 * TODO
 * - delete function for links
 * - way to show the details of an annotation
 * - add custom link function
 */

define([
  'underscore',
  'backbone',  
  'tools/TimeUtils',
  'tools/AnnotationUtils',  
  'models/chapter/ChapterModel',
  'models/editor/EditorTemplateModel',
  'views/editor/EditorEntityView',
  'text!templates/editor/editorMainTemplate.html',
], function(_, Backbone, TimeUtils, AnnotationUtils, ChapterModel, EditorTemplateModel, NEView, editorMainTemplate) {

	var EditorView = Backbone.View.extend({
		
		initialize : function() {
			//set the template
			this.template = _.template(editorMainTemplate);
									
			//get the selected chapter from the _App and listen to changes to it
			this.chapter = _App.chapter;			
			
			//load the editor template from the App
			this.editorTemplate = _App.editorTemplate;
			
			this.neView = new NEView();
			
			this.selectedTab = 0;
			
			//render the view
			this.render();
		},		
		
		render: function() {			
			this.$el.html(this.template({chapter : this.chapter, selectedTab : this.selectedTab}));
			
			this.neView.setElement(this.$('#ne_view')).render();		    
		    this.neView.show();
			return this;
		},

		setChapter : function(event) {
			var cid = $(event.currentTarget).attr('id').substring('__ef__'.length);
			_App.setChapter(this.chapters.getByCid(cid));
		},
		
		/* ------------------ PUBLIC ----------------------*/
		/* ------------------ PUBLIC ----------------------*/
		/* ------------------ PUBLIC ----------------------*/
		
		update : function() {
			this.render();
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

	return EditorView;
	
});