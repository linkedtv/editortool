define([
  'underscore',
  'backbone',
  'tools/TimeUtils',
  'tools/AnnotationUtils',
  'models/editor/EditorTemplateModel',
  'models/enrichment/EnrichmentModel',
  'models/annotation/AnnotationModel'
], function(_, Backbone, TimeUtils, AnnotationUtils, EditorTemplateModel, EnrichmentModel, AnnotationModel) {

	var AnnotationsCollection = Backbone.Collection.extend({
      
		model: AnnotationModel,

		initialize : function(models, options) {},
		
		comparator : function(item) {
			return -item.get('confidence');
		},
		
		/*
		 * This function is used to populate a collection to reflect the automatically generated entities and enrichments
		 */
		setComputedAnnotations : function(annotations, enrichments, enrichmentEntityIndex) {
			var temp = [];
			var startMs = null;
			var endMs = null;
			var erms = null;
			for(var i=0;i<annotations.length;i++) {
				startMs = TimeUtils.toMillis(annotations[i].start);
				endMs = TimeUtils.toMillis(annotations[i].end);
				erms = {};
				
				//fetch related enrichments for the entity
				if(enrichmentEntityIndex && enrichmentEntityIndex[annotations[i].bodyURI]){
					var erm = null;
					for(var j=0;j<enrichmentEntityIndex[annotations[i].bodyURI].length;j++) {
						erm = enrichments.getByCid(enrichmentEntityIndex[annotations[i].bodyURI][j]);		
						if(erm && erm.get('url') != "") {
							erms[erm.get('url')] = erm;
						}
					}
				}
				
				temp.push(new AnnotationModel({id : 'org_' + i, bodyURI : annotations[i].bodyURI, annotationURI : annotations[i].annotationURI, 
					mfURI : annotations[i].mfURI, label : annotations[i].label, start : startMs, end : endMs,
					type : annotations[i].type, category : EditorTemplateModel.getNECategory(annotations[i].type), 
					relevance : annotations[i].relevance, confidence : annotations[i].confidence, 
					image : AnnotationUtils.getThumbnail(startMs), enrichments : erms, 
					subTypes : annotations[i].subTypes, disambiguationURL : annotations[i].disambiguationURL}));
			
			}	
			this.add(temp);
		},
		
		/*
		 * This function is used to populate a collection to reflect the editor's choices of entities and enrichments
		 */
		setCuratedAnnotations : function(annotations, curatedEnrichments) {
			var temp = [];
			var startMs = null;
			var endMs = null;
			var erms = null;
			for(var i=0;i<annotations.length;i++) {
				startMs = TimeUtils.toMillis(annotations[i].start);
				endMs = TimeUtils.toMillis(annotations[i].end);
				erms = {};
				//add any related enrichments
				if(curatedEnrichments && curatedEnrichments.length > 0) {
					var erm = null;
					for(var j=0;j<curatedEnrichments.length;j++) {
						erm = curatedEnrichments[j];						
						if(erm.annotationURI == annotations[i].ETbodyURI) {
							if(erm && erm.url != "") {
								erms[erm.url] = erm;
							}
						}
					}
				}
				temp.push(new AnnotationModel({id : 'et_' + i, ETenrichmentURI : annotations[i].ETenrichmentURI,
					ETbodyURI : annotations[i].ETbodyURI, bodyURI : annotations[i].bodyURI,
					ETannotationURI : annotations[i].ETannotationURI, annotationURI : annotations[i].annotationURI, 
					ETmfURI : annotations[i].ETmfURI, mfURI : annotations[i].mfURI, label : annotations[i].label,
					start : startMs, end : endMs, type : annotations[i].type, category : EditorTemplateModel.getNECategory(annotations[i].type), 
					relevance : annotations[i].relevance, confidence : annotations[i].confidence, 
					image : AnnotationUtils.getThumbnail(startMs), enrichments : erms, url : annotations[i].url, 
					subTypes : annotations[i].subTypes, disambiguationURL : annotations[i].disambiguationURL}));
			}	
			this.add(temp);
		}
     
  });

  return AnnotationsCollection;

});