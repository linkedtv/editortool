define([
  'underscore',
  'backbone'
], function(_, Backbone){
	
	var EditorTemplateModel = Backbone.Model.extend({
		
		//default template for testing
		defaults : {
			//for TKK there are 3 segment types: Introduction, Main item and Intermission
			segmentTypes : {
			                //Introduction has where and who to fill in
			                'intro' : {title : 'Introduction', fields : [
			                                                   {id : 1, 
			                                                   title : 'where', 
			                                                   description : 'Please fill in the location of this episode',
			                                                   type : 'where' },
			                                                   {id : 2,
			                                                   title : 'who',
			                                                   description : 'Please fill in the name of the presenter of this episode',
			                                                   type : 'who'}
			                                                   ]},
			                //Main item has what, who, and object details to fill in
			                'main': {title : 'Main item', fields : [
			                                                {id : 1,
			                								title : 'what',
			                								description : 'Please fill in the topic/object of this item',
			                								type : 'what'},
			                								{id : 2,
			                								title : 'who',
			                								description : 'Please fill in the expert who examines the object',
			                								type : 'who'},
			                								{id : 3,
			                								title : 'object details',
			                								description : 'Please fill in any details about the object, such as art styles',
			                								type : 'what'}
			                								]},
			                //Intermission items do not have any mandatory fields
			                'inter' : {title : 'Intermission', fields : []}
			}
		},
		
		//TODO sort the segment types
		getSegmentTypes : function() {
			var types = [];
			$.each(this.get('segmentTypes'), function(key, value) {			
				types.push({'id' : key, 'label' : value.title});
			});
			/*
			types.sort(function(a, b) {
				return a - b; 
			});*/
						
			return types;
		},
		
		initialize : function() {
			//TODO empty
		}
		
	}, 
	
	//static functions and variables
	{
		//the NERD core mapping of NE types with the who/what/where category (ALSO ADD DBPEDIA and other vocabs HERE!!!!!!!)
		mappings : {
			who : ['Person', 'Organization', 'Criminal', 'SoccerPlayer', 'Astronaut', 'Athlete',
			       'ComicsCharacter', 'Celebrity', 'Architect', 'MusicalArtist', 'TennisPlayer',
			       'Artist', 'Politician', 'FictionalCharacter', 'Mayor', 'Ambassador', 'EducationalInstitution',
			       'University', 'Legislature', 'Company', 'SoccerClub', 'Broadcast', 'RadioStation',
			       'Airline', 'NonProfitOrganization', 'SportsTeam', 'TVStation', 'Band', 'SportsLeague'],
			what : ['Event', 'Time', 'Product', 'Amount', 'Function', 'Animal', 'PoliticalEvent',
			        'SportEvent', 'MilitaryConflict', 'Holiday', 'SchoolNewspaper', 'PhoneNumber', 'ProgrammingLanguage',
			        'OperatingSystem', 'Aircraft', 'VideoGame', 'Drug', 'EmailAddress', 'Album', 'Automobile',
			        'Movie', 'Software', 'Newspaper', 'Website', 'Song', 'Book', 'Spacecraft', 'Magazine',
			        'Weapon', 'URL', 'RadioProgram', 'Bird', 'Insect', 'Thing'],
			where : ['Location', 'Country', 'Valley', 'River', 'Continent', 'AdministrativeRegion', 'Airport',
			         'City', 'Mountain', 'Road', 'Station', 'Restaurant', 'Island', 'Hospital', 'Museum',
			         'Lake', 'Park', 'Canal', 'Lighthouse', 'Bridge', 'ShoppingMall', 'Stadium', 'Place']
		},
		
		/*
		 * This function returns the who/what/where category based on the type of the supplied NE type
		 */
		getNECategory : function(neType) {			
			if (neType) {
				if(EditorTemplateModel.mappings.who.indexOf(neType) != -1) {
					return 'who';
				} else if(EditorTemplateModel.mappings.what.indexOf(neType) != -1) {
					return 'what';
				} else if(EditorTemplateModel.mappings.where.indexOf(neType) != -1) {
					return 'where';
				}
			}
			return 'unknown';
		},
		
		BUTTON_MAPPINGS : {'who' : 'orange', 'unknown' : 'red', 'where' : 'blue', 
				'what' : 'yellow', 'Freebase' : 'pink', 'DBpedia' : 'green', 'NERD' : 'yellow'}
		
	});
	
	return EditorTemplateModel;
});