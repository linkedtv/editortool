// Filename: router.js
define([
  'underscore',
  'backbone',  
  'views/chapters/ChaptersView',
  'views/shots/ShotsView', 
], function(_, Backbone, ChaptersView, ShotsView) {
  
	var AppRouter = Backbone.Router.extend({
		routes: {
			'videos': 'showVideos',
			'chapters' : 'showChapters',
			'*actions': 'defaultAction'
		}
	});
  
	var initialize = function() {
				
		
		var appRouter = new AppRouter;
		
		appRouter.on('route:showVideos', function () {
			_App.videoSelectView.show();
		});
		
		appRouter.on('route:showChapters', function() {
			_App.chapterView.show();			
		});
		
		appRouter.on('route:defaultAction', function (actions) {
			//TODO
		});		
	};
	
	return { 
		initialize: initialize
	};
	
});