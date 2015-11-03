define(function (require) {
	var WebMercator = require('../../Common/Coordinate/WebMercator');
    var webMercator = new WebMercator();
	var Measure;
	var EarchRadius = 6371004;

	function rad(d){
		return d * Math.PI / 180.0;
	}

	function LengthSelf (x1,y1,x2,y2) {
		var x0 = (x1-x2)/2;
		var y0 = (y1-y2)/2;
		
		var s1 = Math.sin(rad(y0))*Math.sin(rad(y0));
		var s2 = Math.cos(rad(y1))*Math.cos(rad(y2));
		var s3 = Math.sin(rad(x0))*Math.sin(rad(x0));
		var f = Math.sqrt(s1+s2*s3);
		var result = Math.asin(f)*2*EarchRadius;
		return result;
	}

	function AreaSelf () {
		// body...
	}

	return Measure = {
		Distance:function (gelist) {
			var distance = 0;
			//console.log(typeof gelist);
			for(var i = 0;i<gelist.length-1;i++){
				var latlon1 = {
					X:gelist[i][0],
					Y:gelist[i][1]
				};
				var latlon2 = {
					X:gelist[i+1][0],
					Y:gelist[i+1][1]
				}; 
				var WebMercator1 = webMercator.lonLat2WebMercator(latlon1);
				var WebMercator2 = webMercator.lonLat2WebMercator(latlon2);
				distance += LengthSelf(latlon1.X,latlon1.Y,latlon2.X,latlon2.Y);
			}
			return distance.toFixed(3);
		},
		Area:function (gelist) {
			
		}
	}
})