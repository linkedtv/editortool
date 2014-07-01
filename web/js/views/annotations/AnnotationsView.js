define([
  'underscore',
  'backbone',
  'models/chapter/ChapterModel',  
  'views/shots/ShotsView',  
  'views/annotations/EntitiesView',
  'views/enrichments/EnrichmentsView',
  'text!templates/annotations/annotationsTemplate.html'
], function(_, Backbone, ChapterModel, ShotsView, EntitiesView, EnrichmentsView, annotationsTemplate) {

	var AnnotationsView = Backbone.View.extend({
		
		initialize : function() {
			//set the initial layer to NE
			this.selectedTab = 0;//0=NE, 1=S
			
			//set the template
			this.template = _.template(annotationsTemplate);
			
			//get the selected chapter from the _App and listen to changes to it
			this.chapter = _App.chapter;			
			
			this.nesView = new EntitiesView();
			this.shotsView = new ShotsView();
			this.enrichmentsView = new EnrichmentsView();
			
			//render the view
			this.render();
		},
		
		render: function() {
			this.$el.html(this.template({chapter : this.chapter, selectedTab : this.selectedTab}));
			this.nesView.setElement(this.$('#nes')).render();//.refreshAwesomeCopyControllers();
		    this.shotsView.setElement(this.$('#shots')).render();
		    this.enrichmentsView.setElement(this.$('#enrichments')).render();
		    this.showLayerByIndex(this.selectedTab);
			return this;
		},
		
		events : {			
			'click .tab' : 'showLayer',
			'click .view_close' : 'toggle',
			'click #annotation_switch' : 'switchViews'
		},
		
		switchViews : function(evt) {
			_App.switchViews();
			return false;
		},
		
		showLayer : function (evt) {
			this.$('.tab').removeClass('sel');
			$(evt.currentTarget).addClass('sel');
			this.showLayerByIndex($(evt.currentTarget).parent().index())
		},
		
		//show one of the annotation layers
		showLayerByIndex : function (index) {
			if (index > 2) {
				return;
			}
			if(index == 0) {
				this.nesView.show();
				this.enrichmentsView.hide();
				this.shotsView.hide();
			} else if (index == 1) {
				this.nesView.hide();	
				this.enrichmentsView.show();
				this.shotsView.hide();
			} else if (index == 2) {
				this.nesView.hide();	
				this.enrichmentsView.hide();
				this.shotsView.show();
			}
			this.selectedTab = index;
		},
		
		update : function () {
			this.nesView.selectedNEType = null;
			this.enrichmentsView.selectedSource = null;
			this.enrichmentsView.selectedEntity = null;
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

	return AnnotationsView;
	
});