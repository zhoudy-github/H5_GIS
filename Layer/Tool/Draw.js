/**
 * @name Draw
 * @describ 手绘工具（点、折线、多边形、矩形、圆、扇区、文字）
 * @author 华凌锋
 * @create Time 2015-09-20
 */
define(
	function(require){
		var zrenderConfig = require('zrender/config');
		var zrenderEvent  = require('zrender/tool/event');
		var Circle        = require('zrender/shape/Circle');
		var Polyline      = require('zrender/shape/Polyline');
		var Polygon       = require('zrender/shape/Polygon');
		var Rectangle     = require('zrender/shape/Rectangle');
		var Text          = require('zrender/shape/Text');
		var Sector        = require('zrender/shape/Sector');
		var Graphic        = require('../Element/Graphic');

		var Draw = function(){
			var moveTo;
			var lineTo;
			var map;
			var type;
			var callback;
			var polygonList     = [];
			var polylineList    = [];
			var geopolygonList  = [];
			var geopolylineList = [];
			var shapeId         = '';
			var shapeId2        = '';
			var mouseDowned     = 0;
			var mouseMoveed     = 0;
			var mouseUped       = 0;
			var dblClicked      = 0;


			this.active = function(Map,Type,Callback){
				map = Map||{};
				type = Type||'';
				callback = Callback||{};
				this.unbind(Map);
				Map.Zrender.on(zrenderConfig.EVENT.MOUSEDOWN, MouseDown);
				Map.Zrender.on(zrenderConfig.EVENT.DBLCLICK, DblClick);
				Map.Zrender.on(zrenderConfig.EVENT.MOUSEUP, MouseUp);
			}
			this.unbind = function(map){
				map.Zrender.un(zrenderConfig.EVENT.MOUSEDOWN, MouseDown);
				map.Zrender.un(zrenderConfig.EVENT.DBLCLICK, DblClick);
				map.Zrender.un(zrenderConfig.EVENT.MOUSEUP, MouseUp);
				map.Zrender.un(zrenderConfig.EVENT.MOUSEMOVE, MouseMove);
			}
			this.GeopolylineList = function  () {
				return geopolylineList;
			}

			var MouseDown = function (params) {
					var e = params.event;
					if(type == 'point'){
						var point = new Circle({
							geox: map.toMapX(zrenderEvent.getX(e)),
			                geoy: map.toMapY(zrenderEvent.getY(e)),
							style:{
								color:'rgba(135, 206, 250, 0.8)',
								r:10
							}
						});
						Graphic.AddPoint(map,point);
						// map.Zrender.addShape(point);
						if(callback) 
							callback(null,{
								gid:point.id,
								mid:map.Id
							});
					}else if(type == 'polyline'){
						map.Zrender.delShape(shapeId2);
						var guid = require('zrender/tool/guid')();
						moveTo = {
							x:zrenderEvent.getX(e),
							y:zrenderEvent.getY(e)
						}
						polylineList.push([moveTo.x,moveTo.y]);
						geopolylineList.push([map.toMapX(moveTo.x),map.toMapY(moveTo.y)]);
						if(moveTo&&lineTo){
							map.Zrender.addShape(new Polyline({
								id    : guid,
								style : {
									pointList : polylineList,
									lineWidth : 3,
									color     : 'rgba(135, 206, 250, 0.8)'
								},
								hoverable:false
							}));
							shapeId2 = guid;
						}
						map.Zrender.on(zrenderConfig.EVENT.MOUSEMOVE, MouseMove);
					}else if(type == 'polygon'){
						moveTo = {
							x:zrenderEvent.getX(e),
							y:zrenderEvent.getY(e)
						}
						polygonList.push([moveTo.x,moveTo.y]);
						geopolygonList.push([map.toMapX(moveTo.x),map.toMapY(moveTo.y)]);
						map.Zrender.on(zrenderConfig.EVENT.MOUSEMOVE, MouseMove);
					}else if(type == 'rectangle'){
						moveTo = {
							x:zrenderEvent.getX(e),
							y:zrenderEvent.getY(e)
						}
						map.Zrender.on(zrenderConfig.EVENT.MOUSEMOVE, MouseMove);
					}else if(type == 'circle'){
						moveTo = {
							x:zrenderEvent.getX(e),
							y:zrenderEvent.getY(e)
						}
						map.Zrender.on(zrenderConfig.EVENT.MOUSEMOVE, MouseMove);
					}else if(type == 'sector'){
						var content = prompt("依次输入:半径&起始角&结束角","");
						moveTo = {
							x:zrenderEvent.getX(e),
							y:zrenderEvent.getY(e)
						}
						if(content){
							var params = content.split('&');
							var sector = new Sector({
								geox:map.toMapX(moveTo.x),
								geoy:map.toMapY(moveTo.y),
								radius:Number(params[0]),
								style:{
									startAngle:Number(params[1]),
									endAngle:Number(params[2]),
									color : 'rgba(135, 206, 250, 0.8)'
								}
							});
							Graphic.AddSector(map,sector);
							if(callback) 
								callback(null,{
									gid:sector.id,
									mid:map.Id
								});
						}
					}else if(type == 'text'){
						moveTo = {
							x:zrenderEvent.getX(e),
							y:zrenderEvent.getY(e)
						}
						var content = prompt("输入文字","");
						if(content){
							var text = new Text({
								geox:map.toMapX(moveTo.x),
								geoy:map.toMapY(moveTo.y),
								style:{
									text:content,
									textFont : 'bold 40px Arial',
									color:'rgba(135, 206, 250, 1)'
								}
							});
							Graphic.AddText(map,text);
							if(callback) 
								callback(null,{
									gid:text.id,
									mid:map.Id
								});
						}
					}
			};
			var MouseMove = function (params) {
				var guid = require('zrender/tool/guid')();
				var e = params.event;
				map.Zrender.delShape(shapeId);
				if(type == 'polyline'){
					lineTo = {
						x :zrenderEvent.getX(e),
						y :zrenderEvent.getY(e)
					}
					var polyline = new Polyline({
						id:guid,
						style:{
							pointList:[[moveTo.x, moveTo.y], [lineTo.x, lineTo.y]],
							lineWidth:3,
							color:'rgba(135, 206, 250, 0.8)'
						},
						hoverable:false
					});
					map.Zrender.addShape(polyline);
					// Graphic.AddPolyLine(map,new Polyline({
					// 	id :guid,
					// 	geoPointList:[[map.toMapX(moveTo.x), map.toMapY(moveTo.y)], [map.toMapX(lineTo.x), map.toMapY(lineTo.y)]],
					// 	style:{
					// 		lineWidth : 3,
					// 		color : 'rgba(135, 206, 250, 0.8)'
					// 	},
					// 	hoverable:false
					// }));
					shapeId = guid;
				}else if (type == 'polygon'){
					lineTo = {
						x :zrenderEvent.getX(e),
						y :zrenderEvent.getY(e)
					}
					var list = [];
					var polygon = new Polygon({
						id :guid,
						style:{
							pointList:list.concat(polygonList,[[lineTo.x,lineTo.y],[polygonList[0][0],polygonList[0][1]]]),
							color : 'rgba(135, 206, 250, 0.8)'
						},
						hoverable:false
					});
					shapeId = guid;
					map.Zrender.addShape(polygon);
				}else if(type == 'rectangle'){
					lineTo = {
						x :zrenderEvent.getX(e),
						y :zrenderEvent.getY(e)
					}
					if(moveTo&&lineTo){
						var rectangle = new Rectangle({
							id :guid,
							style:{
							x:moveTo.x,
							y:moveTo.y,
							width:lineTo.x-moveTo.x,
							height:lineTo.y-moveTo.y,
							color : 'rgba(135, 206, 250, 0.8)'
							},
							hoverable:false
						});
						map.Zrender.addShape(rectangle);
						shapeId = guid;
					}
				}else if(type == 'circle'){
					lineTo = {
						x :zrenderEvent.getX(e),
						y :zrenderEvent.getY(e)
					}
					if(moveTo&&lineTo){
						var circle = new Circle({
							id :guid,
							style:{
							x:moveTo.x,
							y:moveTo.y,
							r:Math.abs(lineTo.x - moveTo.x),
							color : 'rgba(135, 206, 250, 0.8)'
							},
							hoverable:false
						});
						shapeId = guid;
						map.Zrender.addShape(circle);
					}
				}
			};
			var DblClick  = function (params) {
				map.Zrender.delShape(shapeId);
				if(type == 'polyline'){
					map.Zrender.delShape(shapeId2);
					var polyline = new Polyline({
						geoPointList:geopolylineList,
						style:{
							lineWidth : 3,
							color : 'rgba(135, 206, 250, 0.8)'
						}
					});
					Graphic.AddPolyLine(map,polyline);
					map.Zrender.un(zrenderConfig.EVENT.MOUSEMOVE, MouseMove);
					if(callback)
						if( polylineList.length == 2 && polylineList[0][0] == polylineList[1][0] && polylineList[0][1] == polylineList[1][1]){
							callback('failed draw');
						}else{
							callback(null,{
								gid:polyline.id,
								mid:map.Id
							});
						}
						//map.Zrender.delShape(polyline.id);
					destroy();
				}else if (type == 'polygon'){
					var list = [];
					var polygon  = new Polygon({
						geoPointList:geopolygonList,
						style:{
							color : 'rgba(135, 206, 250, 0.8)'
						}
					});
					Graphic.AddPolygon(map,polygon);
					map.Zrender.un(zrenderConfig.EVENT.MOUSEMOVE, MouseMove);
					if(callback) 
						if( polygonList.length == 2 && polygonList[0][0] == polygonList[1][0] && polygonList[0][1] == polygonList[1][1]){
							callback('failed draw');
						}else{
							callback(null,{
								gid:polygon.id,
								mid:map.Id
							});
						}
					destroy();
				}
			};
			var MouseUp   = function (params) {
				map.Zrender.delShape(shapeId);
				if(type == 'rectangle'){
					if(moveTo&&lineTo){
						map.Zrender.un(zrenderConfig.EVENT.MOUSEMOVE, MouseMove);
						var rectangle = new Rectangle({
							geominx:map.toMapX(moveTo.x<lineTo.x?moveTo.x:lineTo.x),
			                geominy:map.toMapY(moveTo.y<lineTo.y?moveTo.y:lineTo.y),
			                geomaxx:map.toMapX(moveTo.x>lineTo.x?moveTo.x:lineTo.x),
			                geomaxy:map.toMapY(moveTo.y>lineTo.y?moveTo.y:lineTo.y),
							style:{
								color:'rgba(135, 206, 250, 0.8)'
							}
						});
						Graphic.AddRectangle(map,rectangle);
						if(callback)
							if(rectangle.style.width == 0 || rectangle.style.height == 0){
								callback('failed draw');
							}else{
								callback(null,{
									gid:rectangle.id,
									mid:map.Id
								});
							}
					}
					destroy();
				}else if(type == 'circle'){
					var WebMercator = require('../../Common/Coordinate/WebMercator');
					if(moveTo&&lineTo)
					{
						var webMercator = new WebMercator();
						var circle = new Circle({
							geox:map.toMapX(moveTo.x),
							geoy:map.toMapY(moveTo.y),
							radius:Math.abs(webMercator.lonLat2WebMercator({X:map.toMapX(lineTo.x),Y:map.toMapY(lineTo.y)}).X - webMercator.lonLat2WebMercator({X:map.toMapX(moveTo.x),Y:map.toMapY(moveTo.y)}).X),
							style:{
								color : 'rgba(135, 206, 250, 0.8)'
							}
						});
						Graphic.AddCircle(map,circle);
						map.Zrender.un(zrenderConfig.EVENT.MOUSEMOVE, MouseMove);
						if(callback)
							if(circle.style.r == 0)
							{
								callback('failed draw');
							}else{
								callback(null,{
									gid:circle.id,
									mid:map.Id
								});
							}
					}
					destroy();
				}
			};
			var destroy   = function () {
				lineTo = null;
				moveTo = null;
				polygonList = [];
				polylineList = [];
				geopolylineList = [];
				geopolygonList = [];
			};
			function getLength(err,obj){
				alert(obj.gid+','+obj.mid);
			};
		}
	 return new Draw();
});
