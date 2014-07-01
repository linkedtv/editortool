/*
 * TODO
 * - by nieuw hoofdstuk, type selectie toevoegen
 */


define([  
  'underscore',
  'backbone',
  'tools/TimeUtils',
  'models/editor/EditorTemplateModel',
  'models/chapter/ChapterModel',
  'collections/chapters/ChaptersCollection',  
  'text!templates/chapters/chaptersTemplate.html'
], function(_, Backbone, TimeUtils, EditorTemplateModel, ChapterModel, ChaptersCollection, chaptersTemplate) {

	var ChaptersView = Backbone.View.extend({
		
		//the el and shots collection is passed to the ChaptersView
		initialize : function() {			
			//get the resource ID from the App
			this.mediaResourceID = _App.mediaResourceID;
		
			//the currently selected chapter
			this.chapter = _App.chapter;
						
			//get the chapters from the App and listen to any changes to them
			this.chapters = _App.chapters;
			
			this.editorTemplate = _App.editorTemplate;
			
			//set the template
			this.template = _.template(chaptersTemplate);
			
			//render the view
			this.render();
		},
		
		render: function() {
			this.$el.html(this.template({chapters: this.chapters.models, selectedChapter : this.chapter,
				segmentTypes : this.editorTemplate.getSegmentTypes()}));
			
			return this;
		},
		
		//view the chaptersTemplate.html to find information about the elements
		events: {
			'mouseover .chapter' : 'chapterOver',
			'mouseout .chapter' : 'chapterOut',
			'click .chapter' : 'selectChapter',
			
			'click #ch_set_start' : 'setChapterStart',
			'click #ch_set_end' : 'setChapterEnd',
			
			'click #ch_add' : 'addChapter',
			'click #ch_delete' : 'deleteChapter',
			'click #ch_save' : 'saveChapter',
			
			'click .view_close' : 'toggle'
		},
		
		selectChapter : function (evt) {
			this.addMode = false;
			var cid = $(evt.currentTarget).attr('id');
			_App.setChapter(this.chapters.getByCid(cid));
		},
		
		//mouseover function for each chapter
		chapterOver: function(evt) {
			$(evt.currentTarget).find('label').css('font-weight', 'bold');
			$(evt.currentTarget).addClass('hover');			
		},
		
		//mouseout function for each chapter
		chapterOut: function(evt) {
			$(evt.currentTarget).find('label').css('font-weight', 'normal');
			$(evt.currentTarget).removeClass('hover');
		},
		
		setChapterStart : function(evt) {
			$('#ch_start').val(TimeUtils.toPrettyTime(_App.getPlayerTime()));
		},
		
		setChapterEnd : function(evt) {
			$('#ch_end').val(TimeUtils.toPrettyTime(_App.getPlayerTime()));
		},
		
		//saves the currently edited chapter 
		saveChapter : function(evt) {
			var c = null;			
			if(this.addMode) {
				c = new ChapterModel();
			} else {
				//FIXME cloning might not work so well!! (clone but copy the same cid)
				c = this.chapter.clone();
				c.cid = this.chapter.cid;
			}
			
			var chapterStart = TimeUtils.toMillis($('#ch_start').val());
			var imgURL = RD_LABS_HOST + '/image?ms=' + chapterStart + '&id=' + this.mediaResourceID;			
						
			//when setting the parameters, already validation is done. When there are errors an alert is triggered (see ChapterModel)
			c.set({title : $('#ch_title').val(), start : chapterStart, end : TimeUtils.toMillis($('#ch_end').val()), 
				prettyStartTime : $('#ch_start').val(), prettyEndTime : $('#ch_end').val(), image : imgURL,
				type : $('#ch_segment_type').val()}, {validate:true});
			
			//update or add the chapter in the collection
			_App.saveChapter(c);
		},
		
		addChapter : function(evt) {
			//set the focus on the title field
			$('#ch_title').focus();
			
			//delete all form fields
			$('#chapter_form input').attr('value', '');
			
			//set add mode (default is edit mode) 
			this.addMode = true;
		},
		
		deleteChapter : function(evt) {
			if(this.chapter) {
				_App.deleteChapter(this.chapter);
			}
		},
		
		//called from the app whenever a chapter is changed
		update : function() {
			this.addMode = false;
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

	return ChaptersView;
	
});