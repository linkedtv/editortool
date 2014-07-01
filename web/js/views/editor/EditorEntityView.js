/*
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
  'models/annotation/AnnotationModel',
  'models/chapter/ChapterModel',
  'models/editor/EditorTemplateModel',
  'collections/annotations/AnnotationsCollection',
  'text!templates/editor/editorEntityTemplate.html',
  'text!templates/editor/addAnnotationDialogTemplate.html'  
], function(_, Backbone, TimeUtils, AnnotationUtils, AnnotationModel, ChapterModel, EditorTemplateModel, AnnotationsCollection, 
		editorNETemplate, annotationDialog) {

	var EditorEntityView = Backbone.View.extend({
		
		initialize : function() {
			//set the template
			this.template = _.template(editorNETemplate);
			
			//for separately rendering the annotation dialog
			this.annotationDialogTemplate = _.template(annotationDialog);
			
			//get the selected chapter from the _App and listen to changes to it
			this.chapter = _App.chapter;			
			
			//load the template from the App
			this.editorTemplate = _App.editorTemplate;
			
			//get the chapters collection from the _App
			this.chapters = _App.chapters;
			
			//the AnnotationCollection containing all of the choices made by the editor
			this.editorsChoices = _App.editorsChoices;
			
			this.approvedEnrichments = _App.approvedEnrichments;
			
			//contains the approved/selected links per chapterID (for visualizing the annotations/links per chapter)
			this.chapterAnnotations = {};
			
			//contains the available & mandatory categories per chapterID (for visualizing the tabs per chapter)
			this.chapterCategories = {};
			
			//selected dbpedia annotation
			this.selectedDBpediaInstance = null;
			
			//selected annotation (for filling in the dialog)
			this.selectedAnnotation = null;
			
			this.selectedEnrichments = null;
			
			//render the view
			this.render();
		},
		
		render: function() {		
			//then make sure the available chapter categories are up-to-date
			this.updateChapterData();
			
			//render the template
			this.$el.html(this.template({editorTemplate : this.editorTemplate, mappings : EditorTemplateModel.BUTTON_MAPPINGS, 
				chapters : this.chapters.models, chapterAnnotations : this.chapterAnnotations, chapterCategories : this.chapterCategories, 
				selectedChapter : this.chapter, isDialogOpen : this.dialogOpened, selectedAnnotation : this.selectedAnnotation}));
			return this;
		},
		
		/*
		 * This function updates the list of chapterCategories (based on the editorTemplate and the available chapterAnnotations)
		 */
		updateChapterData : function() {
			var self = this;
			
			//make sure to correctly distribute the editor's choices among the chapters
			var ch_s = 0;
			var ch_e = 0;
			var nes = [];
			_.each(this.chapters.models, function(chapter) {
				ch_s = chapter.get('start');
				ch_e = chapter.get('end');
				nes = _.filter(self.editorsChoices.models, function(item) {
					if(item.get('start') >= ch_s && item.get('end') <= ch_e) {
						return item;
					}
				});
				if(nes && nes.length >= 0) {
					self.chapterAnnotations[chapter.cid] = nes;
				}
			});
			
			//update the categories & related numbers
			_.each(this.chapters.models, function(chapter) {
				var temp = {};
				var k = chapter.cid;
				//if there are already annotations/links added check the available categories there
				if (self.chapterAnnotations && self.chapterAnnotations[k]) {
					for(var i=0;i<self.chapterAnnotations[k].length;i++) {
						if(!temp[self.chapterAnnotations[k][i].get('category')]) {
							temp[self.chapterAnnotations[k][i].get('category')] = 1;
						} else {
							temp[self.chapterAnnotations[k][i].get('category')] += 1;
						}
					}
				}
				
				//check the mandatory categories of the editor's template (there should always be an editorTemplate)
				for(var i=0;i<self.editorTemplate.get('segmentTypes')[self.chapters.getByCid(k).get('type')].fields.length;i++) {										
					if(!temp[self.editorTemplate.get('segmentTypes')[self.chapters.getByCid(k).get('type')].fields[i].type]) {
						temp[self.editorTemplate.get('segmentTypes')[self.chapters.getByCid(k).get('type')].fields[i].type] = 0;
					}
				}
				//TODO do some ordering
				self.chapterCategories[k] = temp;
			});
		},
		
		events : {
			'click .view_close' : 'toggle',
			'click .ec_chapter' : 'setChapter',
			'click .ne_wrapper' : 'selectAnnotation',
			'dblclick .ne_wrapper' : 'editAnnotation',
			'click .add_button' : 'addAnnotation',
			'click .ne .del_button' : 'deleteAnnotation',
			'click .ne_meta' : 'metaClick'
		},
		
		setChapter : function(evt) {
			var cid = $(evt.currentTarget).attr('id').substring('__ef__'.length);
			_App.setChapter(this.chapters.getByCid(cid));
		},
		
		addAnnotation : function(evt) {
			//var cid = $(evt.currentTarget).closest('.ec_chapter').attr('id').substring('__ef__'.length);
			this.selectedAnnotation = null;
			this.openAddAnnotationDialog();
		},
		
		editAnnotation : function(evt) {
			this.openAddAnnotationDialog();
		},
		
		/*
		 * This function unfolds the details for a clicked annotation
		 */
		selectAnnotation : function(evt) {
			var neID = $(evt.currentTarget).find('.ne').attr('id');
			$('.ne_wrapper').removeClass('sel');
			$(evt.currentTarget).addClass('sel');
			this.selectedAnnotation = this.editorsChoices.getByCid(neID);
			_App.setAnnotation(this.selectedAnnotation);
			return false;
		},

		openAddAnnotationDialog : function () {						
			var self = this;
			this.selectedEnrichments = {};
			this.selectedDBpediaInstance = null;
			if(this.selectedAnnotation) {								
				for (i in this.selectedAnnotation.get('enrichments')) {
					this.selectedEnrichments[this.selectedAnnotation.get('enrichments')[i]['url']] = this.selectedAnnotation.get('enrichments')[i];
				}
			}
			this.$el.append(this.annotationDialogTemplate({annotation : this.selectedAnnotation, selectedChapter : this.chapter}));
			AnnotationUtils.setAutocompleteRendering(AnnotationUtils.RENDER_DBPEDIA);
			
			this.$('#add_annotation_dialog').dialog({
				'option' : 'show',
				'resizable' : true,
				'width' : 660,
				'height' : 425,
				'modal' : false,
				'buttons' : {
					'Save' : function() {
						//if no annotation was selected add a new annotation
						if(self.selectedAnnotation == null) {	
							var s = TimeUtils.toMillis($('#start_time').attr('value'));
							var e = TimeUtils.toMillis($('#end_time').attr('value'));
							self.selectedAnnotation = new AnnotationModel({label : $('#entity').attr('value'), start : s, end : e,
								relevance : 1, confidence : 1, enrichments : [], subTypes : [], url : $('#entity_url').attr('value'),
								image : AnnotationUtils.getThumbnail(s)});
							if(self.selectedDBpediaInstance != null){
								self.selectedAnnotation.set('category', self.selectedDBpediaInstance.category);
								self.selectedAnnotation.set('type', self.selectedDBpediaInstance.type);
							}
						} else {
							var ps = $('#start_time').attr('value');
							var pe = $('#end_time').attr('value');
							self.selectedAnnotation.set('prettyStartTime', ps);
							self.selectedAnnotation.set('prettyEndTime', pe);
							self.selectedAnnotation.set('start', TimeUtils.toMillis(ps));
							self.selectedAnnotation.set('end', TimeUtils.toMillis(pe));
							self.selectedAnnotation.set('label', $('#entity').attr('value'));
							self.selectedAnnotation.set('url', $('#entity_url').attr('value'));
							if(self.selectedDBpediaInstance != null){
								self.selectedAnnotation.set('category', self.selectedDBpediaInstance.category);
								self.selectedAnnotation.set('type', self.selectedDBpediaInstance.type);
							}
						}
						self.saveAnnotation();
						$(this).dialog('close');
					}
				},
				'close' : function() {
					self.dialogOpened = false;
					self.$('.add_button').removeClass('sel');
					self.$('.tag_button').removeClass('sel');
					$(this).dialog('destroy').remove();
					$(this).remove();
				}
			});
			
			//activates the DPpedia autocomplete functionality of the dialog's first field
			var url = RD_LABS_HOST + '/autocomplete';
			$('#dbpedia').autocomplete({
				source: url,
				minLength: 3,
				select: function(event, ui) {
					if(ui.item) {
						var v_arr = ui.item.label.split('\|');
						var l = v_arr[0];
						var t = v_arr[1];
						var c = v_arr[2];
						var dbpediaURL = ui.item.value;
						//stores the selected DBpedia entry
						self.selectedDBpediaInstance = {'label' : l, 'type' : t, 'category' : c, 'url' : dbpediaURL};
						
						//use the selected DBpedia entry to fill in the label and vocab URL of the annotation
						$('#entity').attr('value', l);
						$('#entity_url').attr('value', dbpediaURL);
						this.value = l;
						return false;
					}
				}
			});
			
			//activates the functionality of the dialog's "Add" button
			$('.add_link').click(function() {
				self.addLinkToSelection($('#hyperlink').val());
			});
			
			//activates the delete function of each added link
			$('#hyperlinks .button').click(function() {
				self.removeLinkFromSelection($(this).attr('id'), $(this).text());
			});
			
			this.dialogOpened = true;
		},
		
		addLinkToSelection : function(link) {
			if(link) {
				var html = [];
				html.push('<div id="'+link.hashCode()+'" class="button medium red">');
				html.push(link);
				html.push('</div>');
				$('#hyperlinks').append(html.join(''));
				$('#hyperlink').text('');
				$('#hyperlink').attr('value', '');
				$('#hyperlink').focus();
				var self = this;
				$('#hyperlinks .button').click(function() {
					self.removeLinkFromSelection($(this).attr('id'), $(this).text());
				});
				this.selectedEnrichments[link] = {url : link, source : 'editor_tool'};				
			}
		},
		
		removeLinkFromSelection : function(linkID, link) {
			$('#' + linkID).remove();
			delete this.selectedEnrichments[link]
		},
		
		//this function adds a custom annotation to the editor's choices
		saveAnnotation : function() {
			this.selectedAnnotation.set('enrichments', this.selectedEnrichments);
			_App.saveEditorsChoice(this.selectedAnnotation);
		},
		
		deleteAnnotation : function(evt) {
			var neID = $(evt.currentTarget).closest('.ne').attr('id');
			var ne = this.editorsChoices.getByCid(neID);
			if(this.selectedAnnotation && ne) {
				if(this.selectedAnnotation.cid == ne.cid) {
					this.selectedAnnotation = null;				
				}
			}
			_App.deleteEditorsChoice(ne);
		},
		
		metaClick : function(evt) {
			return false;
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

	return EditorEntityView;
	
});