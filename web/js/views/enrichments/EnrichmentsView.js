/*
 * YOUTUBE:
 * http://stackoverflow.com/questions/2068344/how-to-get-thumbnail-of-youtube-video-link-using-youtube-api
 * https://developers.google.com/youtube/js_api_reference?hl=nl#Overview
 */

define([
  'underscore',
  'backbone',
  'models/editor/EditorTemplateModel',
  'models/enrichment/EnrichmentModel',
  'tools/TimeUtils',
  'tools/AnnotationUtils',
  'text!templates/enrichments/enrichmentsTemplate.html'
], function(_, Backbone, EditorTemplateModel, EnrichmentModel, TimeUtils, AnnotationUtils, enrichmentsTemplate) {

	var EnrichmentsView = Backbone.View.extend({
		
		//this.collection and this.el are passed in the AnnotationsView
		initialize : function() {
			
			//get the NE collection from the App
			this.collection = _App.enrichments;
			
			//get the ids of approved enrichments
			this.approvedEnrichments = _App.approvedEnrichments;
			
			//get the currently selected enrichments
			this.selectedEnrichments = _App.selectedEnrichments;
			
			//set the template
			this.template = _.template(enrichmentsTemplate);
			
			//get the current chapter from the _App and listen to its changes
			this.chapter = _App.chapter;
			
			//current source filter
			this.selectedSource = null;
			
			//current entity filter
			this.selectedEntity = null;
		},
		
		render: function() {
			if(this.collection) {
				var filteredEnrichmentsOfType = [];
				var filteredEnrichments = [];
				var enrichmentTypes = [];
				if(this.chapter.cid) {
					var ch_s = this.chapter.get('start');
					var ch_e = this.chapter.get('end');
					var self = this;
					
					//filter the NEs so only NEs of the selected chapter and NE type are shown
					filteredEnrichmentsOfType = _.filter(this.collection.models, function(item) {
						if(item.get('start') >= ch_s && item.get('end') <= ch_e) {
							if(self.selectedSource && self.selectedSource != 'all') {							
								if (item.get('source') == self.selectedSource) {
									return item;
								}
							} else if(self.selectedEntity) {
								for(var i=0;i<item.get('derivedFrom').length;i++) {
									//TODO should compare URIs not labels!
									if(item.get('derivedFrom')[i].label == self.selectedEntity) {
										return item;
									}
								}								
							} else {
								return item;
							}
						}
					});
					
					//get the available categories for this chapter (for drawing the filter buttons)
					if((self.selectedEntity == null && self.selectedSource == null) || self.selectedSource == 'all') {
						filteredEnrichments = filteredEnrichmentsOfType;
					} else {					
						filteredEnrichments = _.filter(this.collection.models, function(item) {
							if(item.get('start') >= ch_s && item.get('end') <= ch_e) {
								return item;
							}
						});
					}
					eSources = this.getSources(filteredEnrichments);
					eEntities = this.getEntities(filteredEnrichments);
				}
				
				if(this.selectedSource){
					filteredEnrichmentsOfType.sortField = 'derivedFrom';
				} else {
					filteredEnrichmentsOfType.sortField = 'source';
				}
				//apply the template to update the view
				this.$el.html(this.template({mappings : EditorTemplateModel.BUTTON_MAPPINGS, enrichments: filteredEnrichmentsOfType.sort(), 
					sources : eSources, entities : eEntities, approved : this.approvedEnrichments, selected : this.selectedEnrichments,
					selSource : this.selectedSource, selEntity : this.selectedEntity}));
				}
			return this;
		},
		
		events : {
			'dblclick .enr_wrapper' : 'toggleEnrichmentApproval',
			'click .enr_wrapper' : 'toggleEnrichmentSelection',
			'change #enr_type_select' : 'filterEnrichmentType',
			'click #enr_add_to_ec' : 'addSelectionToAnnotation'
		},
		
		getSources : function (enrichments) {
			var temp = {};
			_.each(enrichments, function(item) {				
				temp[item.get('source')] = 1; 
			});
			return _.keys(temp);			
		},
		
		getEntities : function (enrichments) {
			var temp = {};
			_.each(enrichments, function(item){
				for(var i=0;i<item.get('derivedFrom').length;i++) {
					temp[item.get('derivedFrom')[i].uri] = {label : item.get('derivedFrom')[i].label, uri : item.get('derivedFrom')[i].uri};
				}
			});
			return temp;
		},
		
		filterEnrichmentType : function (evt) {			
			var type = $(evt.currentTarget).find('option:selected').val();
			if (type == 'all') {
				this.selectedSource = null;
				this.selectedEntity = null;
			} else if($(evt.currentTarget).find('option:selected').hasClass('enr_entity')) {				
				this.selectedEntity = type;
				this.selectedSource = null;
			} else if($(evt.currentTarget).find('option:selected').hasClass('enr_source')) {
				this.selectedSource = type;
				this.selectedEntity = null;
			}
			this.render();
		},
		
		toggleEnrichmentApproval : function(evt) {
			var enrID = $(evt.currentTarget).attr('id');
			var selected = $(evt.currentTarget).hasClass('approved');
			if (selected) {
				$(evt.currentTarget).removeClass('approved');
			} else {				
				$(evt.currentTarget).addClass('approved');
			}
			_App.updateApprovedEnrichments(enrID, selected ? false : true);
			return true;
		},
		
		toggleEnrichmentSelection : function(evt) {
			var enrID = $(evt.currentTarget).attr('id');
			var selected = $(evt.currentTarget).hasClass('sel');
			if (selected) {
				$(evt.currentTarget).removeClass('sel');
			} else {				
				$(evt.currentTarget).addClass('sel');
			}			
			_App.updateSelectedEnrichments(enrID, selected ? false : true);
			$('#enr_add_to_ec').text('Add ['+Object.keys(_App.selectedEnrichments).length+']');
			return true;
		},
		
		addSelectionToAnnotation : function(evt) {
			if(_App.selectedAnnotation) {
				_App.addSelectedEnrichmentsToSelectedAnnotation();
				$('.enr_wrapper').removeClass('sel');
				_App.clearSelectedEnrichments();
				$('#enr_add_to_ec').text('Add ['+Object.keys(_App.selectedEnrichments).length+']');
			} else {
				alert("Please select an annotation from the Editor's Choices panel");
			}
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
		},
				
	});

	return EnrichmentsView;
	
});