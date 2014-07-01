/*
 * SORTING STUFF:
 * - http://jsfiddle.net/tunafish/VBG5V/
 * - http://stackoverflow.com/questions/16866633/jquery-sortable-allow-some-items-to-be-dropped-only-into-certain-lists
 * - http://jsfiddle.net/NY7Ms/4/
 * - http://stackoverflow.com/questions/14199681/jquery-ui-sortable-move-clone-but-keep-original
 */

define([
  'underscore',
  'backbone',
  'models/editor/EditorTemplateModel',
  'models/annotation/AnnotationModel',
  'tools/TimeUtils',
  'tools/AnnotationUtils',
  'text!templates/annotations/EntitiesTemplate.html',
  'text!templates/annotations/entityDetailsDialogTemplate.html' 
], function(_, Backbone, EditorTemplateModel, AnnotationModel, TimeUtils, AnnotationUtils, nesTemplate, entityDialog) {

	var EntitiesView = Backbone.View.extend({
		
		//this.collection and this.el are passed in the AnnotationsView
		initialize : function() {
			
			//get the NE collection from the App
			this.collection = _App.nes;
			
			//for separately rendering the entity dialog
			this.entityDialogTemplate = _.template(entityDialog);
			
			//set the template
			this.template = _.template(nesTemplate);
			
			//get the current chapter from the _App and listen to its changes
			this.chapter = _App.chapter;			
			
			//current NE-type filter
			this.selectedNEType = null;
			
			//for the awesome function
			this.iSender = this.iTarget =  this.Index = this.iId = this.iCid = this.iSrc = this.iCopy = undefined;
			this.overCount = 0;
			
		},
		
		render: function() {			
			var filteredNEsOfType = [];
			var filteredNEs = [];
			var NETypes = [];
			if(this.chapter.cid) {
				var ch_s = this.chapter.get('start');
				var ch_e = this.chapter.get('end');
				var self = this;				
				//filter the NEs so only NEs of the selected chapter and NE type are shown
				filteredNEsOfType = _.filter(this.collection.models, function(item) {
					if(item.get('start') >= ch_s && item.get('end') <= ch_e) {
						if(self.selectedNEType && self.selectedNEType != 'all') {							
							if (item.get('category') == self.selectedNEType) {
								return item;
							}
						} else {
							return item;
						}
					}
				});
				//get the available categories for this chapter (for drawing the filter buttons)
				if(self.selectedNEType == null || self.selectedNEType == 'all') {
					filteredNEs = filteredNEsOfType;
				} else {					
					filteredNEs = _.filter(this.collection.models, function(item) {
						if(item.get('start') >= ch_s && item.get('end') <= ch_e) {
							return item;
						}
					});
				}
				NETypes = this.getTypes(filteredNEs);
			}
			this.$el.html(this.template({mappings : EditorTemplateModel.BUTTON_MAPPINGS, annotations: filteredNEsOfType, types : NETypes, 
				selectedCategory : this.selectedNEType/*, approved : _App.approvedPerEntity*/}));
									
			return this;
		},
		
		events : {
			'click .ne_types' : 'filterNEType',			
			'click .ne_wrapper' : 'viewNEDetails',
			'click .add' : 'onAddToEditorsChoice'
		},
		
		getTypes : function (nes) {
			var temp = {};
			_.each(nes, function(item){
				temp[item.get('category')] = 1; 
			});
			return _.keys(temp);
		},		
		
		filterNEType : function (evt) {			
			var type = $(evt.currentTarget).text();			
			//change this later with a proper listener
			this.selectedNEType = type;
			this.render();
		},
		
		viewNEDetails : function(evt) {
			this.openEntityDetailsDialog($(evt.currentTarget).find('.ne').attr('id'));
			return false;
		},
		
		viewAnnotation : function (neID) {
			var ne = this.collection.getByCid(neID);
			_App.seek(ne.get('start'));
			return false;
		},
		
		onAddToEditorsChoice : function(neID) {
			this.addToEditorsChoice(neID);
			return false;
		},
		
		addToEditorsChoice : function (neID) {
			var ne = this.collection.getByCid(neID);
			var enrs = _App.getApprovedEnrichmentsOfEntity(ne.get('bodyURI'));
			var htmlLabel = ne.get('label') ? $('<div/>').text(ne.get('label').replace(/\n/g, '').replace(/\t/g, '')).html() : ne.get('label');
			var annotation = new AnnotationModel({id : ne.get('id'), bodyURI : ne.get('bodyURI'), annotationURI : ne.get('annotationURI'),
				mfURI : ne.get('mfURI'), bodyType : ne.get('bodyType'), label : htmlLabel, start : ne.get('start'), end : ne.get('end'),
				type : ne.get('type'), category : ne.get('category'), relevance : ne.get('relevance'), confidence : ne.get('confidence'), 
				image : ne.get('image'), enrichments : enrs, subTypes : ne.get('subTypes'),
				disambiguationURL : ne.get('disambiguationURL')});
						
			_App.saveEditorsChoice(annotation);
		},
		
		openEntityDetailsDialog : function(neID) {			
			var self = this;
			var ne = this.collection.getByCid(neID);
			this.$el.append(this.entityDialogTemplate({entity : ne, mappings : EditorTemplateModel.BUTTON_MAPPINGS}));
			$('#entity_details_dialog').dialog({
				'width' : 520,
				'height' : 425,
				'buttons' : {
					'Add' : function() {
						self.addToEditorsChoice(neID);
						$(this).dialog('close');
					},
					'Cancel' : function() {
						$(this).dialog('close');
					}
				},
				'close' : function() {
					$(this).dialog('destroy').remove();
					$(this).remove();
				}
			});
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

	return EntitiesView;
	
});