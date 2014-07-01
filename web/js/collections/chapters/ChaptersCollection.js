/*
 * TODO
 * - add real chapter types to each chapter!
 * - add a constant variables for each chapter type
 * - assign chapter types on the server
 */

define([
  'underscore',
  'backbone',
  'tools/TimeUtils',
  'tools/AnnotationUtils',
  'models/chapter/ChapterModel'
], function(_, Backbone, TimeUtils, AnnotationUtils, ChapterModel) {

	var ChaptersCollection = Backbone.Collection.extend({
      
		model: ChapterModel,

		initialize : function(models, options) {},
		
		comparator : function(item) {			
			return item.get('start');
		},
		
		setChapters : function(chapterData) {			
			var startMs = null;
			if(chapterData && chapterData.length > 0) {
				//create the chapter segmentation from the available chapter metadata
				for(var i=0;i<chapterData.length;i++) {
					startMs = TimeUtils.toMillis(chapterData[i].start);
					this.add(new ChapterModel({id : i, ETbodyURI : chapterData[i].ETbodyURI, bodyURI : chapterData[i].uri,
						ETannotationURI : chapterData[i].ETannotationURI, annotationURI : chapterData[i].annotationURI,
						ETmfURI : chapterData[i].ETmfURI, mfURI : chapterData[i].mfURI,
						title : chapterData[i].label, type : chapterData[i].segmentType, start : startMs,
						end : TimeUtils.toMillis(chapterData[i].end), image : AnnotationUtils.getThumbnail(startMs)}));					
				}
			} else {
				//add dummy chapters for each five minutes of video (based on 45 minute videos)
				for(var i=0;i<9;i++) {
					var s = i * 5 * 60000;
					var e = s + 5 * 60000;
					var t = i == 0 ? 'intro' : 'main';
					this.add(new ChapterModel({id : i, title : 'Chapter' + (i+1), type : t, start : s, end : e,
						image : AnnotationUtils.getThumbnail(s)}));
				}
			}
		}
     
  });

  return ChaptersCollection;

});