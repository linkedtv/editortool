define([  
  'backbone'
], function(Backbone) {
  
	//this is a static class. The methods can be called by class name
	var TimeUtils = Backbone.Model.extend({}, {
		
		
		toMillis : function(t) {
			var ms = -1;
			var tmp = t + '';
			if (tmp.indexOf(':') == -1) {
				//converts seconds to millis (e.g. strings like 24124.22)
				ms = t * 1000 + '';
				if(ms.indexOf('.') == -1) {
					return parseInt(ms);
				} else {
					return parseInt(ms.substring(0, ms.indexOf('.')));
				}
			} else if (t.indexOf(':') != -1) {
				//converts a hh:mm:ss.ms timestring into millis 
				var t_arr = t.split(':');
				if(t_arr.length == 3) {
					//add the hours
					ms = parseInt(t_arr[0]) * 3600000;
					//add the minutes
					ms += parseInt(t_arr[1]) * 60000;
					if(t_arr[2].indexOf('.') == -1) {
						//add the seconds
						ms += parseInt(t_arr[2]) * 1000;
					} else {
						//add the seconds before the '.'
						ms += parseInt(t_arr[2].substring(0, t_arr[2].indexOf('.'))) * 1000;
						//add the remaining ms after the '.'
						ms += parseInt(t_arr[2].indexOf('.') + 1);
					}
					return ms;
				}
			}
			return -1;
		},
		
		toPrettyTime : function(millis) {			
			var h = 0;
			var m = 0;
			var s = 0;
			while (millis >= 3600000) {
				h++;
				millis -= 3600000;
			}
			while (millis >= 60000) {
				m++;
				millis -= 60000;
			}
			while (millis >= 1000) {
				s++;
				millis -= 1000;
			}
			h = h < 10 ? '0' + h : h + '';
			m = m < 10 ? '0' + m : m + '';
			s = s < 10 ? '0' + s : s + '';
			millis = millis + '';
			for(var i=millis.length;i<3;i++) {
				millis += '0';
			}
			return h + ':' + m + ':' + s; //+ '.' + millis;
		}		
	
	});

	return TimeUtils;

});