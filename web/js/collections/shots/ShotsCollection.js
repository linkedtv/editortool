define([
  'underscore',
  'backbone',
  'tools/TimeUtils',
  'tools/AnnotationUtils',
  'models/shot/ShotModel'
], function(_, Backbone, TimeUtils, AnnotationUtils, ShotModel) {

	var ShotsCollection = Backbone.Collection.extend({
      
		model: ShotModel,

		initialize : function(models, options) {},
		
		comparator : function(item) {
			return item.get('start');
		},
		
		setShots : function(shotData) {
			var startMs = null;
			for(var i=0;i<shotData.length;i++) {
				startMs = TimeUtils.toMillis(shotData[i].start);
				this.add(new ShotModel({id : shotData[i].uri, annotationURI : shotData[i].annotationURI, 
					mfURI : shotData[i].mfURI, label : shotData[i].label, start : startMs,
					end : TimeUtils.toMillis(shotData[i].end), image : AnnotationUtils.getThumbnail(startMs)}));
			}
			
		}
     
  });

  return ShotsCollection;

});