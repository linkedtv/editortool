/*Editor tool - JavaScript main.js*/

_mr = null;
_App = null;
RD_LABS_HOST = '';

//TODO later move to another place
String.prototype.hashCode = function(){
    var hash = 0, i, char;
    if (this.length == 0) return hash;
    for (i = 0, l = this.length; i < l; i++) {
        char  = this.charCodeAt(i);
        hash  = ((hash<<5)-hash)+char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

//define the shortcut aliases for require.js (see also router.js)
require.config({	
	paths: {
	    underscore: 'libs/underscore/underscore-min',
	    backbone: 'libs/backbone/backbone-min',
	    templates: '../templates'
	}
});

//main initializing point
require(['app'], function(ApplicationModel) {
	
	//only load the app if the ID is passed
	if(_mrID != null && _mrID != '') {
		//load the media resource data
		$('#loading').css('display', 'block');
		$.ajax({
			type: 'GET',
			url: RD_LABS_HOST + '/resource?id=' + _mrID + '&ts=' + Date.now(),
			dataType : 'json',
			success: function(json) {
				//store the media resource data globally
				_mr = json;
				console.debug(_mr);
				//create the main application model and store it globally
				_App = new ApplicationModel();
				_App.initializeViews();
				$('#loading').remove();
			},
			error: function(err) {
				console.debug('error: ' + err);
			},
			dataType: 'json'
		});
	} else {
		//create the main application model and store it globally
		_App = new ApplicationModel();
		_App.initializeViews();
	}
	
});