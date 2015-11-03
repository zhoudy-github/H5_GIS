define(
    function (require) {
        var zrenderConfig = require('zrender/config');
        var Rest = require('SynwayMap/Common/Rest');
        var zrenderEvent = require('zrender/tool/event');
        var Graphic = require('./Layer/Element/Graphic');
        var SynwayMap = function (containerId) {
            this.Id = containerId; 
            this.Container = document.getElementById(containerId);
            this.Zrender = require('zrender').init(this.Container);
            SynwayMap.Map = this;
            SynwayMap.MapDictionary[containerId] = this;
            this.Zrender.on(zrenderConfig.EVENT.MOUSEWHEEL, MapMouseWheelEvent);
            this.Zrender.on(zrenderConfig.EVENT.MOUSEDOWN, MapMouseDown);
            this.Zrender.on(zrenderConfig.EVENT.MOUSEMOVE, MapMouseMove);
            this.Zrender.on(zrenderConfig.EVENT.MOUSEUP, MapMouseUp);
        };

        //#region 地图鼠标事件
        SynwayMap.prototype.IsExecWheelEvent = true;

        SynwayMap.prototype.IsMapMouseDown = false;

        SynwayMap.prototype.MoveScreenX;

        SynwayMap.prototype.MoveScreenY;

        function MapMouseWheelEvent(params) {
            var divMapId = SynwayMap.GetSynwayMapId(params.event);
            var synwayMap = SynwayMap.GetSynwayMap(divMapId);
            if (synwayMap.IsExecWheelEvent) {
                synwayMap.IsExecWheelEvent = false;
                var event = params.event;
                var delta = zrenderEvent.getDelta(event);
                if (delta > 0) {
                    synwayMap.ZoomIn();
                }
                else {
                    synwayMap.ZoomOut();
                }
                //控制只执行一次
                window.setTimeout(function () { synwayMap.IsExecWheelEvent = true; }, 100);
            }
        }

        function MapMouseDown(params) {
            var divMapId = SynwayMap.GetSynwayMapId(params.event);
            var synwayMap = SynwayMap.GetSynwayMap(divMapId);
            synwayMap.IsMapMouseDown = true;
            var event = params.event;
            synwayMap.MoveScreenX = zrenderEvent.getX(event);
            synwayMap.MoveScreenY = zrenderEvent.getY(event);
            var geox = synwayMap.toMapX(synwayMap.MoveScreenX);
            var geoy = synwayMap.toMapY(synwayMap.MoveScreenY);
            for (var i = 0; i < synwayMap.MapMouseDownEventList.length; i++) {
                synwayMap.MapMouseDownEventList[i](synwayMap.Id, geox, geoy);
            }
        }

        function MapMouseMove(params) {
            var divMapId = SynwayMap.GetSynwayMapId(params.event);
            var synwayMap = SynwayMap.GetSynwayMap(divMapId);
            var event = params.event;
            //console.log(divMapId);
            if (synwayMap.Zrender.handler._draggingTarget == null && synwayMap.IsMapMouseDown && IsMouseLeftDown(event, synwayMap.IsMapMouseDown)) 
            {
                synwayMap.Container.style.cursor = "move";
                var x = zrenderEvent.getX(event);
                var y = zrenderEvent.getY(event);
                var diffX = x - synwayMap.MoveScreenX;
                var diffY = y - synwayMap.MoveScreenY;
                if ((diffX != 0 && (diffX > 25 || diffX < -25)) || (diffY != 0 && (diffY > 25 || diffY < -25))) {
                    synwayMap.ClearTag();
                    synwayMap.ScreenMove(diffX, diffY);
                    synwayMap.SpliceMap();
                    synwayMap.AfterScreenMove(diffX, diffY);
                    synwayMap.MoveScreenX = x;
                    synwayMap.MoveScreenY = y;
                    if (synwayMap.ShowMode == 0) {
                        synwayMap.GenerateExtent();
                        synwayMap.ViewChange();
                    }
                }
            }
            else {
                if (synwayMap.IsMapMouseDown && IsMouseLeftDown(event, synwayMap.IsMapMouseDown)) {
                    synwayMap.IsMapMouseDown = false;
                    synwayMap.GenerateExtent();
                }
            }
            var geox = synwayMap.toMapX(zrenderEvent.getX(event));
            var geoy = synwayMap.toMapY(zrenderEvent.getY(event));
            for (var i = 0; i < synwayMap.MapMouseDownEventList.length; i++) {
                synwayMap.MapMouseDownEventList[i](synwayMap.Id, geox, geoy);
            }
        }
        var timeoutID=-1;
        function MapMouseUp(params) {
            var divMapId = SynwayMap.GetSynwayMapId(params.event);
            var synwayMap = SynwayMap.GetSynwayMap(divMapId)
            synwayMap.IsMapMouseDown = false;
            if (synwayMap.IsChangeView()) {
                if (synwayMap.ShowMode == 1) {
                    window.clearTimeout(timeoutID);
                    timeoutID=window.setTimeout(function(){
                        synwayMap.GenerateExtent();
                        synwayMap.ViewChange();
                    },1);
                }
            }
        }
        function IsMouseLeftDown(event, isMapMouseDown) {
            if (navigator.userAgent.indexOf("Firefox") > 0) {
                return isMapMouseDown;
            }
            if (navigator.userAgent.indexOf("MSIE") > 0) {
                if (event.button == 1 || event.button == 0) {
                    return true;
                }
            }
            if (navigator.userAgent.indexOf("Chrome") > 0) {
                if (event.button == 0) {
                    return true;
                }
            }
            return false;
        }

        //#endregion

        //#region 地图全局属性

        //地图目录(指html页面上不同的地图)

        SynwayMap.MapDictionary = [];

        //#endregion 

        //#region 地图全局方法

        SynwayMap.GetSynwayMap = function (id) {
            return SynwayMap.MapDictionary[id];
        }
        SynwayMap.GetSynwayMapId = function (event) {
            if (navigator.userAgent.indexOf("Firefox") > 0 || navigator.userAgent.indexOf("Chrome") > 0) {
                return event.currentTarget.id;
            }
            if (navigator.userAgent.indexOf("MSIE") > 0) {
                if (navigator.userAgent.indexOf("MSIE 6.0") > 0 || navigator.userAgent.indexOf("MSIE 7.0") > 0 || navigator.userAgent.indexOf("MSIE 8.0") > 0) {
                    return event.srcElement.parentElement.parentElement.parentElement.id;
                }
                else if(navigator.userAgent.indexOf("MSIE 10.0") > 0)
                {
                    return event.currentTarget.id;
                }
                else {
                    return event.srcElement.id;
                }
            }
        }
        //#endregion 

        //#region 地图属性

        //地图容器ID

        SynwayMap.prototype.Id;

        //地图容器

        SynwayMap.prototype.Container;

        //是否已加载完成

        SynwayMap.prototype.IsMapLoadFinish;

        //Zrender对象

        SynwayMap.prototype.Zrender;

        //地图显示模式 0：效果优先 1：性能优先

        SynwayMap.prototype.ShowMode = 0;

        //当前地图类索引

        SynwayMap.prototype.MapClassIndex = -1;

        //当前地图索引

        SynwayMap.prototype.MapIndex = -1;

        //地图类列表：

        SynwayMap.prototype.MapClassList = [];

        //图片缓冲目录

        SynwayMap.prototype.ImageBufferDictionary = [];

        //轨迹线目录

        SynwayMap.prototype.TrackLineDictionary = [];

        //地图视野

        SynwayMap.prototype.Extent;

        SynwayMap.prototype.IsShowMap = false;

        //#region 地图事件

        //地图加载完成事件列表

        SynwayMap.prototype.MapLoadFinishEventList = [];

        //地图鼠标点击事件列表

        SynwayMap.prototype.MapMouseDownEventList = [];

        //地图鼠标移动事件列表

        SynwayMap.prototype.MapMouseMoveEventList = [];

        //地图视野改变事件列表

        SynwayMap.prototype.MapViewChangeEventList = [];

        //#endregion

        //#region 地图tag标记图形列表

        SynwayMap.prototype.TagShapeList = [];

        //#endregion

        //#endregion

        //#region 地图方法

        /*
        设置地图显示模式
        */
        SynwayMap.prototype.SetShowMode = function (showMode) {
            this.ShowMode = showMode;
        }

        /*
        添加地图

        参数：
        Class：分类，大类，中文，如：警用地图
        map：地图对象
        */
        SynwayMap.prototype.AddMap = function (Class, map) {
            for (var mapClass in this.MapClassList) {
                if (mapClass.Class == Class) {
                    mapClass.Parent = this;
                    mapClass.MapList.push(map);
                    return true;
                }
            }
            map.Parent = this;
            var mapClass = {};
            mapClass.Class = Class;
            mapClass.MapList = [];
            mapClass.MapList.push(map);
            this.MapClassList.push(mapClass);
            if (this.MapClassIndex == -1) this.MapClassIndex = 0;
            if (this.MapIndex == -1) {
                this.MapIndex = 0;
                this.Extent = this.GetMap().InitialExtent;
            }
        }

        /*
        图片缓冲
        */
        SynwayMap.prototype.ImageBuffer = function (tag, imgUrl) {
            var imageObj = new Image();
            var map = this;
            imageObj.onload = function () {
                this.isload = true;
                ImageBufferFinish();
            }
            imageObj.onerror = function () {
                this.isload = true;
                this.iserror = true;
                ImageBufferFinish();
            };
            imageObj.src = imgUrl;
            this.ImageBufferDictionary[tag] = imageObj;
            function ImageBufferFinish() {
                if (map.IsShowMap) {
                    if (!map.IsMapLoadFinish) {
                        if (map.ImageBufferFinish()) {
                            for (var i = 0; i < map.MapLoadFinishEventList.length; i++) {
                                map.MapLoadFinishEventList[i](map.Id);
                            }
                        }
                    }
                    map.IsMapLoadFinish = true;
                }

            }
        }

        SynwayMap.prototype.ImageBufferFinish = function () {
            for (var key in this.ImageBufferDictionary) {
                if (this.ImageBufferDictionary[key].isload == null) {
                    return false;
                }
            }
            return true;
        }

        //#endregion

        //#region 私有方法

        /*
        得到地图
        */

        SynwayMap.prototype.GetMap = function () {
            if (SynwayMap.Map.MapClassIndex == -1) return null;
            return SynwayMap.Map.MapClassList[SynwayMap.Map.MapClassIndex].MapList[SynwayMap.Map.MapIndex];
        }
        /*
        视野改变，图层上元素位置调整
        */
        SynwayMap.prototype.ViewChange = function () {
            var synwayMap = this;
            this.Zrender.storage.iterShape(
                function (shape) {
                    if (shape.zlevel != -100200) {
                        switch (shape.classname) {
                            case "point":
                                shape.style.x = synwayMap.toScreenX(shape.geox);
                                shape.style.y = synwayMap.toScreenY(shape.geoy);
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "polyline":
                                for (var i = 0; i < shape.style.pointList.length; i++) {
                                    shape.style.pointList[i][0] = synwayMap.toScreenX(shape.geoPointList[i][0]);
                                    shape.style.pointList[i][1] = synwayMap.toScreenY(shape.geoPointList[i][1]);
                                }
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "rectangle":
                                var minx = synwayMap.toScreenX(shape.geominx);
                                var miny = synwayMap.toScreenY(shape.geominy);
                                var maxx = synwayMap.toScreenX(shape.geomaxx);
                                var maxy = synwayMap.toScreenY(shape.geomaxy);
                                shape.style.x = minx;
                                shape.style.y = miny;
                                shape.style.width = maxx - minx;
                                shape.style.height = maxy - miny;
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "polygon":
                                for (var i = 0; i < shape.style.pointList.length; i++) {
                                    shape.style.pointList[i][0] = synwayMap.toScreenX(shape.geoPointList[i][0]);
                                    shape.style.pointList[i][1] = synwayMap.toScreenY(shape.geoPointList[i][1]);
                                }
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "circle":
                                shape.style.x = synwayMap.toScreenX(shape.geox);
                                shape.style.y = synwayMap.toScreenY(shape.geoy);
                                var maxx = synwayMap.toScreenX(shape.geopoint.X);
                                shape.style.r = maxx - shape.style.x;
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "sector":
                                shape.style.x = synwayMap.toScreenX(shape.geox);
                                shape.style.y = synwayMap.toScreenY(shape.geoy);
                                var maxx = synwayMap.toScreenX(shape.geopoint.X);
                                shape.style.r = maxx - shape.style.x;
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "image":
                                shape.style.x = synwayMap.toScreenX(shape.geox);
                                shape.style.y = synwayMap.toScreenY(shape.geoy);
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "text":
                                shape.style.x = synwayMap.toScreenX(shape.geox);
                                shape.style.y = synwayMap.toScreenY(shape.geoy);
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "isogon":
                                shape.style.x = synwayMap.toScreenX(shape.geox);
                                shape.style.y = synwayMap.toScreenY(shape.geoy);
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                        }
                    }
                }
                ,
                { normal: 'up', update: false }
            );
            var tempTagShapeList = this.TagShapeList;
            this.TagShapeList = [];
            for (var i = 0; i < tempTagShapeList.length; i++) {
                switch (tempTagShapeList[i].classname) {
                    case "point":
                        this.AddPoint(tempTagShapeList[i]);
                        break;
                    case "polyline":
                        this.AddPolyLine(tempTagShapeList[i]);
                        break;
                    case "rectangle":
                        this.AddRectangle(tempTagShapeList[i]);
                        break;
                    case "polygon":
                        this.AddPolygon(tempTagShapeList[i]);
                        break;
                    case "circle":
                        this.AddCircle(tempTagShapeList[i]);
                        break;
                    case "sector":
                        this.AddSector(tempTagShapeList[i]);
                        break;
                    case "image":
                        this.AddImage(tempTagShapeList[i]);
                        break;
                    case "text":
                        this.AddText(tempTagShapeList[i]);
                        break;
                    case "isogon":

                        break;
                }
            }
            for (var i = 0; i < this.MapViewChangeEventList.length; i++) {
                this.MapViewChangeEventList[i](this.Id, this.Extent);
            }

        }
        /*
        地图拼接
        */
        SynwayMap.prototype.SpliceMap = function () {
            var map = this.GetMap();
            if (map != null) map.SpliceMap();
        }

        /*

        移动屏幕

        参数：

        x:移动屏幕坐标

        y:移动屏幕坐标

        */
        SynwayMap.prototype.ScreenMove = function (x, y) {
            var map = this.GetMap();
            if (map != null) map.ScreenMove(x, y);
        }
        SynwayMap.prototype.AfterScreenMove = function (x, y) {
            var synwayMap = this;
            this.Zrender.storage.iterShape(
                function (shape) {
                    if (shape.zlevel != -100200) {
                        switch (shape.classname) {
                            case "point":
                                shape.style.x += x;
                                shape.style.y += y;
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "polyline":
                                for (var i = 0; i < shape.style.pointList.length; i++) {
                                    shape.style.pointList[i][0] += x;
                                    shape.style.pointList[i][1] += y;
                                }
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "rectangle":
                                shape.style.x += x;
                                shape.style.y += y;
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "polygon":
                                for (var i = 0; i < shape.style.pointList.length; i++) {
                                    shape.style.pointList[i][0] += x;
                                    shape.style.pointList[i][1] += y;
                                }
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "circle":
                                shape.style.x += x;
                                shape.style.y += y;
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "sector":
                                shape.style.x += x;
                                shape.style.y += y;
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "image":
                                shape.style.x += x;
                                shape.style.y += y;
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "text":
                                shape.style.x += x;
                                shape.style.y += y;
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                            case "isogon":
                                shape.style.x += x;
                                shape.style.y += y;
                                synwayMap.Zrender.modShape(shape.id, shape);
                                break;
                        }
                    }
                }
                ,
                { normal: 'up', update: false }
            );
        }
        /*

        生成地图视野区域

        参数：无


        返回值：无

        */
        SynwayMap.prototype.GenerateExtent = function () {
            var map = this.GetMap();
            if (map != null) map.GenerateExtent();
        }
        /*

        得到当前地图屏幕宽

        参数：无

        返回值：地图屏幕宽，类型为Number

        */

        SynwayMap.prototype.GetMapScreenWidth = function () {
            return this.Container.offsetWidth;
        }

        /*

        得到当前地图屏幕高

        参数：无

        返回值：地图屏幕高，类型为Number

        */

        SynwayMap.prototype.GetMapScreenHeight = function () {
            return this.Container.offsetHeight;
        }
        //#endregion

        //#region 地图接口

        //#region 显示导航

        /*
        显示地图
        */
        SynwayMap.prototype.ShowMap = function () {
            var map = this.GetMap();
            if (map != null) {
                map.ShowMap();
                this.IsShowMap = true;
                if (this.ImageBufferFinish()) {
                    if (!this.IsMapLoadFinish) {
                        for (var i = 0; i < this.MapLoadFinishEventList.length; i++) {
                            this.MapLoadFinishEventList[i](this.Id);
                        }
                    }
                    this.IsMapLoadFinish = true;
                }
            }
        }
        /*
        全屏
        */
        SynwayMap.prototype.FullExtent = function () {
            var map = this.GetMap();
            if (map != null) {
                this.ClearTag();
                map.FullExtent();
                this.ViewChange();
            }
        }
        /*
        放大
        */
        SynwayMap.prototype.ZoomIn = function () {
            var map = this.GetMap();
            if (map != null) {
                this.ClearTag();
                map.ZoomIn();
                this.ViewChange();
            }
        }
        /*
        缩小
        */
        SynwayMap.prototype.ZoomOut = function () {
            var map = this.GetMap();
            if (map != null) {
                this.ClearTag();
                map.ZoomOut();
                this.ViewChange();
            }
        }
        /*
        漫游,参数为空的情况下设置地图操作状态为平移状态
        
        */
        SynwayMap.prototype.Pan = function () {
        }

        /*
        设置当前中心

        参数：
        x:
        y:

        */
        SynwayMap.prototype.SetViewCenter = function (x, y) {
            var map = this.GetMap();
            if (map != null) {
                this.ClearTag();
                map.SetViewCenter(x, y);
                this.ViewChange();
            }
        }

        /*
        设置当前视野
        */
        SynwayMap.prototype.SetView = function (minx, miny, maxx, maxy) {
            var map = this.GetMap();
            if (map != null) {
                this.ClearTag();
                map.SetView(minx, miny, maxx, maxy);
                this.ViewChange();
            }
        }

        /*
        设置比例尺
        */
        SynwayMap.prototype.SetScale = function (scale) {
            var map = this.GetMap();
            if (map != null) {
                this.ClearTag();
                map.SetScale(minx, miny, maxx, maxy);
                this.ViewChange();
            }
        }

        /*
        设置级别
        */
        SynwayMap.prototype.SetLevel = function (level) {
            var map = this.GetMap();
            if (map != null) {
                this.ClearTag();
                map.SetLevel(minx, miny, maxx, maxy);
                this.ViewChange();
            }
        }
        /*
        清空
        */
        SynwayMap.prototype.Clear = function (tag) {
            if (tag == null) {
                this.Zrender.clear();
                this.TagShapeList = [];
                var view = this.GetView();
                this.SetView(view.MinX, view.MinY, view.MaxX, view.MaxY);
            }
            else {
                var synwayMap = this;
                this.Zrender.storage.iterShape(
                function (shape) {
                    if (shape.tag) {
                        if (shape.tag == tag) {
                            synwayMap.DelShape(shape.id);
                        }
                    }
                });
                var tempTagShapeList = [];
                for (var i = 0; i < this.TagShapeList.length; i++) {
                    if (this.TagShapeList[i].tag != tag) {
                        tempTagShapeList.push(this.TagShapeList[i]);
                    }
                }
                this.TagShapeList = tempTagShapeList;
            }
        }
        SynwayMap.prototype.DelTagShape = function (shape) {
            var index = this.TagShapeList.indexOf(shape);
            this.TagShapeList.slice(index, 1);
        }
        /*
        清空Tag
        */
        SynwayMap.prototype.ClearTag = function () {
            var tempelements = [];
            for (var key in this.Zrender.storage._elements) {
                var shape = this.Zrender.storage._elements[key];
                if (shape.tag == null) {
                    tempelements[key] = shape;
                }
                else {
                    if (shape._storage) shape._storage = null;
                }
            }
            this.Zrender.storage._elements = tempelements;
            var temproots = [];
            for (var key in this.Zrender.storage._roots) {
                var shape = this.Zrender.storage._roots[key];
                if (shape.tag == null) {
                    temproots.push(shape);
                }
            }
            this.Zrender.storage._roots = temproots;
            //            var synwayMap = this;
            //            this.Zrender.storage.iterShape(
            //                function (shape) {
            //                    if (shape.tag) {
            //                        synwayMap.DelShape(shape.id);
            //                    }
            //                });
        }
        //#endregion     

        //#region 地图信息

        /*
        得到当前视野
        */
        SynwayMap.prototype.GetView = function () {
            return this.Extent;
        }

        /*
        得到当前视野中心点
        */
        SynwayMap.prototype.GetViewCenter = function () {
            var x = (this.Extent.MinX + this.Extent.MaxX) / 2;
            var y = (this.Extent.MinY + this.Extent.MaxY) / 2;
            return { X: x, Y: y };
        }

        /*
        得到当前比例
        */
        SynwayMap.prototype.GetScale = function () {
            var map = this.GetMap();
            if (map != null) {
                map.GetScale();
            }
        }

        /*
        得到当前级别
        */
        SynwayMap.prototype.GetLevel = function () {
            var map = this.GetMap();
            if (map != null) {
                map.GetLevel();
            }
        }
        /*
        是否改变视野
        */
        SynwayMap.prototype.IsChangeView = function () {
            var map = this.GetMap();
            if (map != null) {
                return map.IsChangeView();
            }
            return false;
        }

        //#endregion

        //#endregion

        //#region 地图事件

        SynwayMap.prototype.AddMapLoadFinishEvent = function (mapLoadFinishEvent) {
            this.MapLoadFinishEventList.push(mapLoadFinishEvent);
        }

        SynwayMap.prototype.RemoveMapLoadFinishEvent = function (mapLoadFinishEvent) {
            this.MapLoadFinishEventList = RemoveEvent(this.MapLoadFinishEventList, mapLoadFinishEvent);
        }

        SynwayMap.prototype.AddMapMouseDownEvent = function (mapMouseDownEvent) {
            this.MapMouseDownEventList.push(mapMouseDownEvent);
        }

        SynwayMap.prototype.RemoveMapMouseDownEvent = function (mapMouseDownEvent) {
            this.MapMouseDownEventList = RemoveEvent(this.MapMouseDownEventList, mapMouseDownEvent);
        }

        SynwayMap.prototype.AddMapMouseMoveEvent = function (mapMouseMoveEvent) {
            this.MapMouseMoveEventList.push(mapMouseMoveEvent);
        }

        SynwayMap.prototype.RemoveMapMouseMoveEvent = function (mapMouseMoveEvent) {
            this.MapMouseMoveEventList = RemoveEvent(this.MapMouseMoveEventList, mapMouseMoveEvent);
        }

        SynwayMap.prototype.AddMapViewChangeEvent = function (mapViewChangeEvent) {
            this.MapViewChangeEventList.push(mapViewChangeEvent);
        }

        SynwayMap.prototype.RemoveMapViewChangeEvent = function (mapViewChangeEvent) {
            this.MapViewChangeEventList = RemoveEvent(this.MapViewChangeEventList, mapViewChangeEvent);
        }

        function RemoveEvent(eventList, eventFun) {
            var isRemove = false;
            for (var i = 0; i < eventList.length; i++) {
                if (eventList[i] == eventFun) {
                    isRemove = true;
                }
                if (isRemove) {
                    if (i != eventList.length - 1) {
                        eventList[i] = eventList[i + 1];
                    }
                }
            }
            if (isRemove) {
                eventList.pop();
            }
            return eventList;
        }
        //#endregion

        //#region 图形管理

        SynwayMap.prototype.GetShape = function (shapeId) {
            return this.Zrender.storage.get(shapeId);
        }

        SynwayMap.prototype.ModShape = function (shapeId, shape) {
            return this.Zrender.modShape(shapeId, shape);
        }

        SynwayMap.prototype.DelShape = function (shapeId) {
            return this.Zrender.delShape(shapeId);
        }

        //#endregion

        //#region 地图绘图
        /*
        方法绘点
        */
        SynwayMap.prototype.AddPoint = function (point) {
            Graphic.AddPoint(this, point);
            if (point.tag) {
                this.TagShapeList.push(point);
            }
        }

        /*
        方法绘线
        */
        SynwayMap.prototype.AddPolyLine = function (polyline) {
            Graphic.AddPolyLine(this, polyline);
            if (polyline.tag) {
                this.TagShapeList.push(polyline);
            }
        }

        /*
        方法绘多边形
        */
        SynwayMap.prototype.AddPolygon = function (polygon) {
            Graphic.AddPolygon(this, polygon);
            if (polygon.tag) {
                this.TagShapeList.push(polygon);
            }
        }

        /*
        方法绘矩形
        */
        SynwayMap.prototype.AddRectangle = function (rectangle) {
            Graphic.AddRectangle(this, rectangle);
            if (rectangle.tag) {
                this.TagShapeList.push(rectangle);
            }
        }

        /*
        方法绘圆
        */
        SynwayMap.prototype.AddCircle = function (circle) {
            Graphic.AddCircle(this, circle);
            if (circle.tag) {
                this.TagShapeList.push(circle);
            }
        }

        /*
        方法绘扇区
        */
        SynwayMap.prototype.AddSector = function (sector) {
            Graphic.AddSector(this, sector);
            if (sector.tag) {
                this.TagShapeList.push(sector);
            }
        }

        /*
        添加图像
        */
        SynwayMap.prototype.AddImage = function (image) {
            Graphic.AddImage(this, image);
            if (image.tag) {
                this.TagShapeList.push(image);
            }
        }

        /*
        添加文字
        */
        SynwayMap.prototype.AddText = function (text) {
            Graphic.AddText(this, text);
            if (text.tag) {
                this.TagShapeList.push(text);
            }
        }
        
        /*
        画图工具
        */
        SynwayMap.prototype.Draw = function (type, callback) {
            var Draw = require('./Layer/Tool/Draw');
            this.Zrender.un(zrenderConfig.EVENT.MOUSEMOVE, MapMouseMove);
            Draw.active(this, type, callback);
        }

        /*
        取消绘图
        */
        SynwayMap.prototype.Destroy = function () {
            var Draw = require('./Layer/Tool/Draw');
            this.Zrender.on(zrenderConfig.EVENT.MOUSEMOVE, MapMouseMove);
            Draw.unbind(this);
            
        }

        //#endregion

        SynwayMap.prototype.MeasureLength = function (callback) {
            var Draw = require('./Layer/Tool/Draw');
            var Measure = require('./Layer/Tool/Measure')
            this.Zrender.un(zrenderConfig.EVENT.MOUSEMOVE, MapMouseMove);
            var self = this;
            // console.log(this);
            Draw.active(this, 'polyline', function(err,j) {
                if(err){
                    alert(err);
                    return;
                }
                var geopolylineList = Draw.GeopolylineList();
                var distance = Measure.Distance(geopolylineList);
                alert("当前距离:"+distance+" 米");
                self.Zrender.delShape(j.gid);
                callback(distance);
            });
        }


        // SynwyMap.prototype.aaaa = function () {
        //     //var Draw = require('./Layer/Tool/Draw');
        //     //this.Zrender.un(zrenderConfig.EVENT.MOUSEMOVE, MapMouseMove);
        //     //Draw.active(this, 'polyline','getLength');
        // }

        //#region 几何服务

        /*


        点缓冲
        */

        SynwayMap.prototype.PointBuffer = function (geometryServerUrl, x, y, distance) {
            var rest = new Rest();
            var url = geometryServerUrl + "/buffer";
            var geometries = "geometries={";
            geometries += "\"geometryType\":\"esriGeometryPoint\",";
            geometries += "\"geometries\":[{\"x\":" + x + ",\"y\":" + y + "}]}";
            url += "?f=json&" + geometries + "&inSR=4326&outSR=4326&bufferSR=102113&distances=" + distance + "&unit=9001&unionResults=true";
            var result = rest.HttpGet(url);
            result = result.replace("{\"geometries\":[{\"rings\":[[", "");
            result = result.replace(/]]}]}/g, "");
            result = result.replace(/],/g, ";");
            result = result.replace(/\[/g, "");
            result = result.replace(/]/g, "");
            return result;
        }

        /*

        线缓冲

        */

        SynwayMap.prototype.LineBuffer = function (geometryServerUrl, pointList, distance) {
            var rest = new Rest();
            var url = geometryServerUrl + "/buffer";
            var geometries = "geometries={";
            geometries += "\"geometryType\":\"esriGeometryPolyline\",";
            geometries += "\"geometries\":[{\"paths\":[[[" + pointList[0][0] + "," + pointList[0][1] + "]";
            for (var i = 1; i < pointList.length; i++) {
                geometries += ",[" + pointList[i][0] + "," + pointList[i][1] + "]";
            }
            geometries += "]]}]}";
            var data = "f=json&" + geometries + "&inSR=4326&outSR=4326&bufferSR=102113&distances=" + distance + "&unit=9001&unionResults=true";
            var result = rest.HttpPost(url, data);
            result = result.replace("{\"geometries\":[{\"rings\":[[", "");
            result = result.replace(/]]}]}/g, "");
            result = result.replace(/],/g, ";");
            result = result.replace(/\[/g, "");
            result = result.replace(/]/g, "");
            return result;
        }

        /*

        面缓冲

        */

        SynwayMap.prototype.AreaBuffer = function (geometryServerUrl, pointList, distance) {
            var rest = new Rest();
            var url = geometryServerUrl + "/buffer";
            var geometries = "geometries={";
            geometries += "\"geometryType\":\"esriGeometryPolygon\",";
            geometries += "\"geometries\":[{\"rings\":[[[" + pointList[0][0] + "," + pointList[0][1] + "]";
            for (var i = 1; i < pointList.length; i++) {
                geometries += ",[" + pointList[i][0] + "," + pointList[i][1] + "]";
            }
            geometries += "]]}]}";
            var data = "f=json&" + geometries + "&inSR=4326&outSR=4326&bufferSR=102113&distances=" + distance + "&unit=9001&unionResults=true";
            var result = rest.HttpPost(url, data);
            result = result.replace("{\"geometries\":[{\"rings\":[[", "");
            result = result.replace(/]]}]}/g, "");
            result = result.replace(/],/g, ";");
            result = result.replace(/\[/g, "");
            result = result.replace(/]/g, "");
            return result;
        }

        //#endregion

        //#region 坐标转换

        /*

        地图横坐标转换为屏幕横坐标

        参数

        mapX：地图横坐标，类型为Number

        返回值：屏幕横坐标，类型为Number

        */
        SynwayMap.prototype.toScreenX = function (mapX) {
            var view = this.Extent;
            //console.log(view);
            var minx = view.MinX;
            var maxx = view.MaxX;
            var screenX = ((mapX - minx) / (maxx - minx)) * this.GetMapScreenWidth();
            return screenX;
        }

        /*

        地图纵坐标转换为屏幕纵坐标

        参数

        mapY：地图纵坐标，类型为Number

        返回值：屏幕纵坐标，类型为Number

        */
        SynwayMap.prototype.toScreenY = function (mapY) {
            var view = this.Extent;
            var miny = view.MinY;
            var maxy = view.MaxY;
            var screenY = this.GetMapScreenHeight() - ((mapY - miny) / (maxy - miny)) * this.GetMapScreenHeight();
            return screenY;
        }

        /*

        屏幕横坐标转换为地图横坐标

        参数

        screenX：屏幕横坐标，类型为Number

        返回值：地图横坐标，类型为Number

        */

        SynwayMap.prototype.toMapX = function (screenX) {
            var view = this.Extent;
            var minx = view.MinX;
            var maxx = view.MaxX;
            var mapX = minx + screenX / this.GetMapScreenWidth() * (maxx - minx);
            return mapX;
        }

        /*

        屏幕纵坐标转换为地图纵坐标

        参数

        screenY：屏幕纵坐标，类型为Number

        返回值：地图纵坐标，类型为Number

        */
        SynwayMap.prototype.toMapY = function (screenY) {
            var view = this.Extent;
            var miny = view.MinY;
            var maxy = view.MaxY;
            var mapY = miny + (this.GetMapScreenHeight() - screenY) / this.GetMapScreenHeight() * (maxy - miny);
            return mapY;
        }

        //#endregion

        return SynwayMap;
    }
);