define([
  'underscore',
  'backbone',
  'router',
  'views/video/VideoSelectView',
  'models/player/PlayerModel',
  'views/player/PlayerView',  
  'collections/shots/ShotsCollection',
  'collections/annotations/AnnotationsCollection',
  'collections/enrichments/EnrichmentsCollection',
  'models/chapter/ChapterModel',
  'collections/chapters/ChaptersCollection',
  'views/chapters/ChaptersView',
  'views/annotations/AnnotationsView',
  'models/editor/EditorTemplateModel',
  'views/editor/EditorView'
], function(_, Backbone, Router, VideoSelectView, PlayerModel, PlayerView, ShotsCollection, AnnotationsCollection, EnrichmentsCollection,
		ChapterModel, ChaptersCollection, ChaptersView, AnnotationsView, EditorTemplateModel, EditorView) {
	
	var ApplicationModel = Backbone.Model.extend({
		
		//initialize the collections and models
		initialize : function() {
			//global parameters
			this.chapter = new ChapterModel();
			this.selectedAnnotation = null;
			this.videoURL = null;
			this.mediaResourceID = null;
			
			//selected enrichments (only for temporary actions, lekker vaag :0)
			this.selectedEnrichments = {};
			
			//approved enrichments (URI i.e. ID + true/false)
			this.approvedEnrichments = {};
			
			//the number of approved enrichments per entity
			this.approvedPerEntity = {};
									
			this.editorsChoices = new AnnotationsCollection();
			
			//global listeners
			this.chapter.on('change:id', this.onSetChapter, this);
			
			this.playerShouldSeek = false;
						
			//only load these views when there is data available
			if(_mr) {
				//set global variables
				this.videoURL = _mr.locator
				this.mediaResourceID = _mrID;
				
				//initialize the playerModel
				this.playerModel = new PlayerModel({url : this.videoURL});
								
				//initialize the enrichments collection
				this.enrichments = new EnrichmentsCollection();
				this.enrichmentEntityIndex = this.enrichments.setEnrichments(_mr.enrichments);
				
				//initialize the NE collection
				this.nes = new AnnotationsCollection();
				this.nes.setComputedAnnotations(_mr.nes, this.enrichments, this.enrichmentEntityIndex);
				
				//initialize shots for the Annotation- and ChapterView
				this.shots = new ShotsCollection();
				this.shots.setShots(_mr.shots);
				
				//initialize chapter collection (ChaptersView and EditorsView)
				this.chapters = new ChaptersCollection();
				if(_mr.curated.chapters && _mr.curated.chapters.length > 0) {
					this.chapters.setChapters(_mr.curated.chapters);
				} else {
					this.chapters.setChapters(_mr.chapters);
				}
				
				//initialize the editors choices collection				
				if(_mr.curated.nes && _mr.curated.nes.length > 0) {
					this.editorsChoices.setCuratedAnnotations(_mr.curated.nes, _mr.curated.enrichments);					
				}
				//this.editorsChoices.on('add', this.onAddEditorsChoice, this);
				this.editorsChoices.on('remove', this.onRemoveEditorsChoice, this);
				
				//TODO make sure the template is loaded according to the user's organization (now there is just one default template)
				this.editorTemplate = new EditorTemplateModel();
			}
		},
		
		initializeViews : function() {
			//initialize the video selection box
			this.videoSelectView = new VideoSelectView({el: '#videos'});
			
			if(this.mediaResourceID) {
				//intialize the player view
				this.playerView = new PlayerView({el : '#player'});
				this.playerView.show();
				
				//initialize the chapter view			
				this.chaptersView = new ChaptersView({el: '#chapters'});
				this.chaptersView.show();
				
				//intialize the annotation view holding both the shots and named entities and video concepts views
				this.annotationsView = new AnnotationsView({el : '#annotations'});
				this.annotationsView.show();
				
				//initialize the editor's choice view
				this.editorView = new EditorView({el : '#editor'});
				this.editorView.show();
			}
			//finally initialize the jQuery controllers for the elements in home.html
			this.initializeControllers();
		},
		
		//TODO change this later on
		initializeControllers : function() {
			var self = this;
			$('#menu_videos').click(function() {
				self.videoSelectView.toggle();
			});
			$('#menu_chapters').click(function() {
				self.chaptersView.toggle();
			});
			$('#menu_annotations').click(function() {
				self.annotationsView.toggle();
			});
			$('#menu_editor').click(function() {
				self.editorView.toggle();				
			});
		},
		
		//returns the current player time in millis
		getPlayerTime : function () {
			return this.playerView.getPlayerTime();
		},
		
		//when the user selects a different video update all the necessary views
		setMediaResource : function (mrID) {			
			document.location.href = RD_LABS_HOST + '/' + _publisher + '/' + mrID;
		},
		
		/* ------------------ LISTENERS ----------------------*/
		/* ------------------ LISTENERS ----------------------*/
		/* ------------------ LISTENERS ----------------------*/
						
		onSetChapter : function() {
			this.chaptersView.update();
			this.editorView.update();
			this.annotationsView.update();
			if(this.playerShouldSeek) {
				this.playerView.playChapter();
			}
		},
		
		onAddEditorsChoice : function() {
			this.editorView.update();
		},
		
		onRemoveEditorsChoice : function() {			
			this.editorView.update();
		},
		
		onUpdateEditorsChoice : function() {
			this.editorView.update();
		},
		
		/* ------------------ PUBLIC ----------------------*/
		/* ------------------ PUBLIC ----------------------*/
		/* ------------------ PUBLIC ----------------------*/
		
		//go to a certain moment in the video and update any relevant views
		seek : function (sec) {			
			this.playerView.seek(sec);
		},
		
		//when the user selects a chapter update all the necessary views.
		setChapter : function (c) {
			this.playerShouldSeek = true;
			this.chapter.cid = c.cid;
			this.chapter.set({id : c.get('id'), ETbodyURI : c.get('ETbodyURI'), bodyURI : c.get('bodyURI'),
				ETannotationURI : c.get('ETannotationURI'), annotationURI : c.get('annotationURI'),
				ETmfURI : c.get('ETmfURI'), mfURI : c.get('mfURI'), title : c.get('title'),
				start : c.get('start'), end : c.get('end'), prettyStartTime : c.get('prettyStartTime'),
				prettyEndTime : c.get('prettyEndTime'), image : c.get('image'), type : c.get('type'), tags : c.get('tags')});
		},
		
		//whenever a user selects an annotation in the editor's choices
		setAnnotation : function(a) {
			this.selectedAnnotation = a;
			this.editAnnotationPlayerTimes(this.selectedAnnotation);
		},
				
		//---------------------------------------------------------------------------------
		//-------------------------- UI MODEL/CRUD FUNCTIONS ------------------------------
		//---------------------------------------------------------------------------------
		
		deleteChapter : function (c) {
			//delete the chapter on the server
			this.saveChapterOnServer(c, 'delete');
		},
		
		deleteChapterComplete : function(c) {
			//prevent the player from seeking after the chapter has been deleted and automatically another chapter is selected
			this.playerShouldSeek = false;
						
			//remove the chapter from the UI
			this.chapters.remove(c);
			
			//select the first chapter
			if(this.chapters.length > 0) {
				c = this.chapters.at(0);
				this.chapter.cid = c.cid;
				this.chapter.set({id : c.get('id'), ETbodyURI : c.get('ETbodyURI'), bodyURI : c.get('bodyURI'),
					ETannotationURI : c.get('ETannotationURI'), annotationURI : c.get('annotationURI'),
					ETmfURI : c.get('ETmfURI'), mfURI : c.get('mfURI'), title : c.get('title'),
					start : c.get('start'), end : c.get('end'), prettyStartTime : c.get('prettyStartTime'),
					prettyEndTime : c.get('prettyEndTime'), image : c.get('image'), type : c.get('type'), tags : c.get('tags')});
			} else {
				//TODO check if this is ok!
				this.chapter = new ChapterModel();
			}
		},
		
		saveChapter : function(c) {
			//save the chapter on the server
			this.saveChapterOnServer(c);
						
		},
		
		saveChapterComplete : function(c) {
			this.chapters.remove(c);
			this.chapters.add(c);
			
			//select the added chapter
			this.chapter.cid = c.cid;
			this.chapter.set({id : c.get('id'), ETbodyURI : c.get('ETbodyURI'), bodyURI : c.get('bodyURI'),
				ETannotationURI : c.get('ETannotationURI'), annotationURI : c.get('annotationURI'),
				ETmfURI : c.get('ETmfURI'), mfURI : c.get('mfURI'), title : c.get('title'),
				start : c.get('start'), end : c.get('end'), prettyStartTime : c.get('prettyStartTime'),
				prettyEndTime : c.get('prettyEndTime'), image : c.get('image'), type : c.get('type'), tags : c.get('tags')});
			
			//update the views to reflect the chapter changes
			this.playerShouldSeek = false;
			this.onSetChapter();
			
			//animate the save succeeded			
			$('#' + c.cid).animate({
				backgroundColor: "#00aa00"
			}, 1000, function() {
				$('#' + c.cid).animate({
					backgroundColor: "#E3E3E3"
				}, 1000);
			});
		},
		
		saveChapterFailed : function(c) {
			//animate the save succeeded						
			$('#' + c.cid).animate({
				backgroundColor: "#ee0000"
			}, 1000, function(){
				alert('Saving chapter failed, please try again');
			});
		},
		
		deleteEditorsChoice : function(annotation) {						
			//save the annotation on the server
			this.saveAnnotationOnServer(annotation, 'delete');
		},
		
		deleteEditorsChoiceComplete : function(annotation) {
			if(this.selectedAnnotation && annotation) {
				if (this.selectedAnnotation.cid == annotation.cid) {
					this.selectedAnnotation = null;
				}
			}
			this.editorsChoices.remove(annotation);
			 
		},
		
		saveEditorsChoice : function(annotation) {
			//save the annotation on the server
			this.saveAnnotationOnServer(annotation);
		},
		
		saveEditorsChoiceComplete : function (annotation) {
			//FIXME this does not trigger a proper event (can't find it right now)			
			this.editorsChoices.add(annotation, {merge: true});
			
			//manually update the view
			this.editorView.update();
			
			//animate the save succeeded			
			$('#' + annotation.cid).animate({
				backgroundColor: "#00aa00"
			}, 1000, function() {
				$('#' + annotation.cid).animate({
					backgroundColor: "#E3E3E3"
				}, 1000, function() {
					$('#' + annotation.cid).removeAttr('style');
				});
			});
		},
		
		saveEditorsChoiceFailed : function (annotation) {
			$('#' + annotation.cid).animate({
				backgroundColor: "#ee0000"
			}, 1000, function() {
				alert('The annotation could not be saved, try again later');
			});
		},
		
		updateApprovedEnrichments : function(enrID, approved) {
			var enr = this.enrichments.getByCid(enrID);
			this.approvedEnrichments[enr.get('bodyURI')] = approved;
		},
		
		clearSelectedEnrichments : function() {
			for(key in this.selectedEnrichments) {
				delete this.selectedEnrichments[key];
			}
		},
		
		updateSelectedEnrichments : function(enrID, approved) {
			var enr = this.enrichments.getByCid(enrID);
			if (approved) {
				this.selectedEnrichments[enr.get('url')] = enr.attributes;
			} else {
				delete this.selectedEnrichments[enr.get('url')];
			}
		},
		
		addSelectedEnrichmentsToSelectedAnnotation : function() {
			if(this.selectedAnnotation) {
				var enrs = this.selectedEnrichments;
				if(enrs) {
					var oldEnrs = this.selectedAnnotation.get('enrichments');
					if(oldEnrs) {
						for(url in enrs) {
							oldEnrs[url] = enrs[url];
						}
						this.selectedAnnotation.set('enrichments', oldEnrs);
						this.saveEditorsChoice(this.selectedAnnotation);
					}
				}
			}
		},
		
		//---------------------------------------------------------------------------------
		//-------------------------- UI FUNCTIONS -----------------------------------------
		//---------------------------------------------------------------------------------		
		
		/*
		 * This function fetches all of the approved enrichments related to a certain entity
		 */
		getApprovedEnrichmentsOfEntity : function(uri) {
			var enrs = this.enrichmentEntityIndex[uri];
			var approved = {};			
			if(enrs) {
				var enr = null;
				for (var i=0;i<enrs.length;i++) {
					enr = this.enrichments.getByCid(enrs[i]);
					if (this.approvedEnrichments[enr.get('bodyURI')] == true) {
						approved[enr.get('url')] = enr.attributes;
					}
				}
			}
			return approved;
		},
		
		editAnnotationPlayerTimes : function(annotation) {
			this.playerView.editEntityPlayerTimes(annotation);
		},
		
		switchViews : function() {
			this.annotationsView.remove();
			this.editorView.remove();
			
			$('<section id="editor" class="grid_item"></section>').insertAfter('#player');
			$('<section id="annotations" class="grid_item"></section>').insertAfter($('#player').parent());
			
			if (this.annotationsView.$el.attr('id') == 'editor') {				
				
				this.annotationsView = new AnnotationsView({el : '#annotations'});
				this.annotationsView.show();
				
				this.editorView = new EditorView({el : '#editor'});				
				this.editorView.show();
			} else if (this.annotationsView.$el.attr('id') == 'annotations'){			
				
				this.annotationsView = new AnnotationsView({el : '#editor'});
				this.annotationsView.show();
				
				this.editorView = new EditorView({el : '#annotations'});				
				this.editorView.show();
			}
		},
		
		//---------------------------------------------------------------------------------
		//-------------------------- SERVER CALLS (SAVING) --------------------------------
		//---------------------------------------------------------------------------------
		
		saveChapterOnServer : function(chapter, action) {
			var self = this;
			action = action == undefined ? 'save' : action;			
			var saveData = {'mediaResourceID' : this.mediaResourceID, 'chapter' : chapter.toJSON(), 'action' : action};
			$.ajax({
				type: 'POST',
				url: RD_LABS_HOST + '/savechapter',
				data: {savedata: JSON.stringify(saveData)},
				dataType : 'json',
				success: function(json) {
					if(json) {
			    		if(action == 'delete') {
			    			self.deleteChapterComplete(chapter);
			    		} else {		    			
			    			chapter.set('ETmfURI', json['ETmfURI']);
			    			chapter.set('ETbodyURI', json['ETbodyURI']);
			    			chapter.set('ETannotationURI', json['ETannotationURI']);
			    			self.saveChapterComplete(chapter);
			    		}
					} else {
						self.saveChapterFailed(chapter);
					}
				},
				error: function(err) {					
		    		console.debug(err);
		    		self.saveChapterFailed(chapter);
				},
				dataType: 'json'
			});
		},
		
		saveAnnotationOnServer : function(annotation, action) {
			var self = this;
			action = action == undefined ? 'save' : action;			
			var saveData = {'mediaResourceID' : this.mediaResourceID, 'annotation' : annotation.toJSON(), 'action' : action};
			$.ajax({
				type: 'POST',
				url: RD_LABS_HOST + '/saveannotation',
				data: {savedata: JSON.stringify(saveData)},
				dataType : 'json',
				success: function(json) {
					if(json) {
			    		if(action == 'delete') {
			    			self.deleteEditorsChoiceComplete(annotation);
			    		} else {
			    			annotation.set('ETmfURI', json['ETmfURI']);
			    			annotation.set('ETbodyURI', json['ETbodyURI']);
			    			annotation.set('ETannotationURI', json['ETannotationURI']);
			    			annotation.set('ETenrichmentURI', json['ETenrichmentURI']);
			    			self.saveEditorsChoiceComplete(annotation);
			    		}
					} else {
						self.saveEditorsChoiceFailed(annotation);
					}
				},
				error: function(err) {					
		    		console.debug(err);
		    		self.saveEditorsChoiceFailed(annotation);
				},
				dataType: 'json'
			});
		}
		
	});
	
	return ApplicationModel;
	
});
