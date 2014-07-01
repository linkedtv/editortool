define([  
  'backbone',
  'models/editor/EditorTemplateModel'
], function(Backbone, EditorTemplateModel) {
  
	//this is a static class. The methods can be called by class name
	var AnnotationUtils = Backbone.Model.extend({}, {
		
		RENDER_DBPEDIA : 0,
		
		RENDER_ORIGINAL : 1,
		
		groupByTime : function (nes) {			
			temp = {};
			$.each(nes, function() {
				if (temp[$(this)[0].get('start') + '']) {
					temp[$(this)[0].get('start') + ''].push($(this)[0]);
				} else {
					temp[$(this)[0].get('start') + ''] = [$(this)[0]];
				}
			});
			//sort each group by confidence score
			var groups = {}
			var group = null;
			for(var k in temp) {
				group = temp[k];
				group = group.sort(function(a, b) {
					return b.get('confidence') - a.get('confidence');
				});
				groups[k] = group;
			}
			//put the groups with the highest confidence scores at the top			
			var tmp =[];
			for (var k in groups) {
				if (groups.hasOwnProperty(k)) {
					tmp.push({key: k, value:  groups[k]});
				}
			}			
			tmp.sort(function(o1, o2) {
				return o2.value[0].get('confidence') > o1.value[0].get('confidence');
			});
			var sortedGroups = {};
			$.each(tmp, function(index, value){
				sortedGroups[value.key]=value.value;
            });
			return sortedGroups;
		}, 				
		
		getThumbnail : function (millis) {
			if (!_mr['thumb_base']) {
				return RD_LABS_HOST + '/image?ms=' + millis + '&id=' + _mrID;
			}
			var h = m = s = 0;
			while (millis >= 3600000) {
				h ++;
                millis -= 3600000;
			}
            while (millis >= 60000){
                m ++;
                millis -= 60000;
            }
            while (millis >= 1000) {
                s++;        
                millis -= 1000;
            }
            var url = _mr['thumb_base'];
            url += 'h/' + h + '/m/' + m + '/sec' + s + '.jpg';
            return url;
		},
		
		getDummyThumbnail : function() {
			return '/site_media/images/snowscreen.gif';
		},
		
		autocomplete : {
			ORIGINAL :  $.ui.autocomplete.prototype._renderItem,
			
			DBPEDIA : function(ul, item) {
				var v_arr = item.label.split('\|');
				var l = v_arr[0];
				var t = v_arr[1];
				var c = v_arr[2];
				t = '<button class="button small">' + t + '</button>';
				c = '<button class="button small '+EditorTemplateModel.BUTTON_MAPPINGS[c]+'">' + c + '</button>';
				var row = l + '&nbsp;' + t + '&nbsp;' + c;
				return $("<li></li>").data("item.autocomplete", item).append("<a>" + row + "</a>").appendTo(ul);
			}
		},
		
		setAutocompleteRendering : function(type) {
			if(type == AnnotationUtils.RENDER_DBPEDIA) {				
				$.ui.autocomplete.prototype._renderItem = AnnotationUtils.autocomplete.DBPEDIA;
			} else {				
				$.ui.autocomplete.prototype._renderItem = AnnotationUtils.autocomplete.ORIGINAL;
			}
		}
		
	});

	return AnnotationUtils;

});