/**
*方法绘图
*
**/
define(
	function(require){
    var Graphic;
    return Graphic = {
        //点
        AddPoint:function(map,point) {
          //经纬度转屏幕
          var screenX = map.toScreenX(point.geox);
          var screenY = map.toScreenY(point.geoy);
          point.style.x= screenX;
          point.style.y = screenY;
          point.style.r = point.style.r||10;
          point.classname = 'point';
          map.Zrender.addShape(point);
        },
        //线
        AddPolyLine:function(map,polyline) {
          var pointList = [];
          for(var i in polyline.geoPointList){
            pointList.push([map.toScreenX(polyline.geoPointList[i][0]),map.toScreenY(polyline.geoPointList[i][1])])
          }
          polyline.style.pointList = pointList;
          polyline.style.lineWidth = polyline.style.lineWidth||3;
          polyline.classname = 'polyline';
          map.Zrender.addShape(polyline);
        },
        //多边形
        AddPolygon:function(map,polygon) {
          var pointList = [];
          for(var i in polygon.geoPointList){
            pointList.push([map.toScreenX(polygon.geoPointList[i][0]),map.toScreenY(polygon.geoPointList[i][1])])
          }
          polygon.style.pointList = pointList;
          polygon.classname = 'polygon';
          map.Zrender.addShape(polygon);
        },
        //矩形
        AddRectangle:function(map,rectangle) {
          var x = map.toScreenX(rectangle.geominx);
          var y = map.toScreenY(rectangle.geominy);
          var width = map.toScreenX(rectangle.geomaxx) - map.toScreenX(rectangle.geominx);
          var height = map.toScreenY(rectangle.geomaxy) - map.toScreenY(rectangle.geominy);
          rectangle.style.x = x;
          rectangle.style.y = y;
          rectangle.style.width = width;
          rectangle.style.height = height;
          rectangle.classname = 'rectangle';
          map.Zrender.addShape(rectangle);
        },
        //圆
        AddCircle:function(map,circle){
          var WebMercator = require('../../Common/Coordinate/WebMercator');
          var webMercator = new WebMercator();
          var centerScreenX = map.toScreenX(circle.geox);
          var centerScreenY = map.toScreenY(circle.geoy);
          var centerLatLon = {
            X:circle.geox,
            Y:circle.geoy
          }
          var centerWebMercator = webMercator.lonLat2WebMercator(centerLatLon);
          var rightLatLon = webMercator.webMercatorTOLonLat({X:centerWebMercator.X+circle.radius, Y:centerWebMercator.Y});
          var rightScreenX = map.toScreenX(rightLatLon.X);
          //var rightScreenY = map.toScreenY(rightLatLon.Y);
          circle.geopoint = rightLatLon;
          circle.style.x = centerScreenX;
          circle.style.y = centerScreenY;
          circle.style.r = rightScreenX - centerScreenX;
          circle.classname = 'circle';
          map.Zrender.addShape(circle);
        },
        //扇区
        AddSector:function(map,sector){
          var WebMercator = require('../../Common/Coordinate/WebMercator');
          var webMercator = new WebMercator();
          var centerScreenX = map.toScreenX(sector.geox);
          var centerScreenY = map.toScreenY(sector.geoy);
          var centerLatLon = {
            X:sector.geox,
            Y:sector.geoy
          }
          var centerWebMercator = webMercator.lonLat2WebMercator(centerLatLon);
          var rightLatLon = webMercator.webMercatorTOLonLat({X:centerWebMercator.X+sector.radius, Y:centerWebMercator.Y});
          var rightScreenX = map.toScreenX(rightLatLon.X);
          //var rightScreenY = map.toScreenY(rightLatLon.Y);
          sector.geopoint = rightLatLon;
          sector.style.x = centerScreenX;
          sector.style.y = centerScreenY;
          sector.style.r = rightScreenX - centerScreenX;
          sector.classname = 'sector';
          map.Zrender.addShape(sector);
        },
        //图像
        AddImage:function(map,image){
          var startX = map.toScreenX(image.geox);
          var startY = map.toScreenY(image.geoy);
          image.style.x = startX;
          image.style.y = startY;
          image.classname = 'image';
          map.Zrender.addShape(image);
        },
        //文字
        AddText:function  (map,text) {
          var x = map.toScreenX(text.geox);
          var y = map.toScreenY(text.geoy);
          text.style.x = x;
          text.style.y = y;
          text.classname = 'text';
          map.Zrender.addShape(text);
        }
    }
	}
);