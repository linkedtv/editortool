//TODO inheritance of the viewView (great name... -_-)

define([
  'underscore',
  'backbone',
  'tools/TimeUtils',
  'models/player/PlayerModel',
  'models/annotation/AnnotationModel',
  'text!templates/player/playerTemplate.html'
], function(_, Backbone, TimeUtils, PlayerModel, AnnotationModel, playerTemplate) {

	var PlayerView = Backbone.View.extend({
		
		initialize : function() {
			//get the chapter from the App and listen to changes
			this.chapter = _App.chapter;
		
			//get the player model from the App
			this.model = _App.playerModel;
		
			//set the template
			this.template = _.template(playerTemplate);
									
			//render the view
			this.render();
		},
		
		render: function() {			
			//render the template
			this.$el.html(this.template({playoutURL : this.model.attributes.url}));			
			
			//define the player modes
			/*
			var modes = [{ type: "html5", 
		        src: "/site_media/jwplayer/player.swf"
			}];*/
			
			//setup the JWPlayer and load the video 
			/*
			jwplayer('jwplayer').setup({
			    height: 288,
			    width: 512,
			    file: this.model.attributes.url,
			    modes : modes
			});
			*/
			return this;
		},
		
		events : {
			'click .ply_ann_save' : 'saveAnnotationTimes'
		},
		
		//TODO later afmaken/gebruiken
		setNEStartTime : function(evt) {			
			//$(evt.currentTarget).closest('.ne_meta').find('.ne_start').val(TimeUtils.toPrettyTime(_App.getPlayerTime()));
			return false;
		},
		
		saveAnnotationTimes : function(evt) {
			if(this.curAnnotation) {
				var ps = this.$el.find('#ply_ann_start').val();
				var pe = this.$el.find('#ply_ann_end').val();
				this.curAnnotation.set('label', this.$el.find('#ply_ann_label').val());
				this.curAnnotation.set('prettyStartTime', ps);
				this.curAnnotation.set('prettyEndTime', pe);
				this.curAnnotation.set('start', TimeUtils.toMillis(ps));
				this.curAnnotation.set('end', TimeUtils.toMillis(pe));
				_App.saveEditorsChoice(this.curAnnotation);
			}
		},
		
		//----------------------- PUBLIC FUNCTIONS ----------------------
		//----------------------- PUBLIC FUNCTIONS ----------------------
		//----------------------- PUBLIC FUNCTIONS ----------------------
		//----------------------- PUBLIC FUNCTIONS ----------------------
		
		playChapter : function () {
			if(this.chapter != null && this.chapter.get('start') != undefined) {
				this.seek(this.chapter.get('start'));
			}
		},
		
		editEntityPlayerTimes : function(annotation) {
			this.curAnnotation = annotation;
			if (annotation) {				
				this.$el.find('#ply_ann_label').val(annotation.get('label'));
				this.$el.find('#ply_ann_start').val(annotation.get('prettyStartTime'));
				this.$el.find('#ply_ann_end').val(annotation.get('prettyEndTime'));
			}
		},
		
		getPlayerTime : function () {			
			//return TimeUtils.toMillis(jwplayer().getPosition());
			var v = document.getElementById("html5player");
			return v.currentTime * 1000;
		},
		
		seek : function(millis) {
			var v = document.getElementById("html5player");
			if(v && v.currentTime) {
				v.currentTime = millis / 1000;
			}
			//jwplayer().seek(millis / 1000);
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

	return PlayerView;
	
});