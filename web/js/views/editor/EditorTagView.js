/*
 * TODO
 * - implement editing of tags
 */

define([
  'underscore',
  'backbone',  
  'tools/TimeUtils',
  'tools/AnnotationUtils',  
  'models/chapter/ChapterModel',
  'models/editor/EditorTemplateModel',  
  'text!templates/editor/editorTagTemplate.html',
  'text!templates/editor/tagChapterDialogTemplate.html'
], function(_, Backbone, TimeUtils, AnnotationUtils, ChapterModel, EditorTemplateModel, editorTagTemplate, tagChapterDialog) {

	var EditorFaceView = Backbone.View.extend({
		
		initialize : function() {
			//set the template
			this.template = _.template(editorTagTemplate);
			
			//for separately rendering the tag chapter dialog
			this.tagChapterDialogTemplate = _.template(tagChapterDialog);
									
			//get the selected chapter from the _App and listen to changes to it
			this.chapter = _App.chapter;			
			
			//get the chapters collection from the _App
			this.chapters = _App.chapters;
			
			//load the editor template from the App
			this.editorTemplate = _App.editorTemplate;			
									
			//render the view
			this.render();
		},		
		
		render: function() {
			this.$el.html(this.template({chapters : this.chapters.models, selectedChapter : this.chapter, isDialogOpen : this.dialogOpened,
				mappings : EditorTemplateModel.BUTTON_MAPPINGS}));
			return this;
		},
		
		events : {
			'click .tag_button' : 'openTagChapterDialog',
			'click .ec_chapter' : 'setChapter'
		},
		
		setChapter : function(evt) {
			var cid = $(evt.currentTarget).attr('id').substring('__ef__'.length);
			_App.setChapter(this.chapters.getByCid(cid));
		},
		
		openTagChapterDialog : function (evt) {			
			var cid = $(evt.currentTarget).closest('.ec_chapter').attr('id').substring('__ef__'.length);
			var self = this;
			this.selectedTags = [];
			this.$el.append(this.tagChapterDialogTemplate);
									
			this.$('#tag_chapter_dialog').dialog({
				option : 'show',
				resizable : false,
				width : 560,
				height : 225,
				modal : false,				
				buttons : {
					'Done' : function() {
						var tags = [];
						$.each($('#tags .button'), function(){
							tags.push($(this).text());
						});
						self.addTagsToChapter(cid);
						$(this).dialog('close');
					}
				},				
				close : function() {
					self.dialogOpened = false;
					self.$('.add_button').removeClass('sel');
					self.$('.tag_button').removeClass('sel');
					$(this).dialog('destroy').remove();
					$(this).remove();
				}
			});
			
			//setup the autocomplete field			
			AnnotationUtils.setAutocompleteRendering(AnnotationUtils.RENDER_DBPEDIA);
			
			var url = RD_LABS_HOST + '/autocomplete';
			$('#tag').autocomplete({
				source: url,
				minLength: 2,				
				select: function(event, ui) {
					if(ui.item) {
						var v_arr = ui.item.label.split('\|');
						var l = v_arr[0];
						var t = v_arr[1];
						var c = v_arr[2];
						var id = l + t;
						this.value = l;
						self.addTagToSelection({id : id.hashCode(), label : l, type : t, category : c});
						return false;
					}
				},
				focus : function(event, ui) {					
					if(ui.item) {
						var v_arr = ui.item.label.split('\|');
						var l = v_arr[0];
						$('#tag').val(l);
					}
					return false;
				},
			});
			
			this.dialogOpened = true;
		},
		
		addTagsToChapter : function(cid) {			
			var c = this.chapters.getByCid(cid).clone();
			c.cid = cid;
			c.set({tags : this.selectedTags});
			_App.saveChapter(c);
		},
		
		addTagToSelection : function(tag) {
			if(tag) {
				var html = [];
				html.push('<div id="'+tag.id+'" class="button medium '+EditorTemplateModel.BUTTON_MAPPINGS[tag.category]+'">');
				html.push(tag.label);
				html.push('</div>');
				$('#tags').append(html.join(''));
				$('#tag').text('');
				$('#tag').attr('value', '');
				$('#tag').focus();
				var self = this;
				$('#tags .button').click(function() {
					self.removeTagFromSelection($(this).attr('id'));
				});
				this.selectedTags.push(tag);
			}
		},
		
		removeTagFromSelection : function(tagID) {
			$('#' + tagID).remove();
			for(var i=0;i<this.selectedTags.length;i++) {
				if (this.selectedTags[i].id == tagID) {
					this.selectedTags.pop();
					break;
				}
			}
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
		},
		
		//hide the view
		hide : function() {			
			this.$el.css('display', 'none');			
		}
	});

	return EditorFaceView;
	
});