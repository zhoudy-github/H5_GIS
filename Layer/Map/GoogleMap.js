define(
    function (require) {
        var XmlDoc = require('SynwayMap/Common/Xml/XmlDoc');
        var MarsCoord = require('SynwayMap/Common/Coordinate/MarsCoord');
        var marsCoord = new MarsCoord();
        var WebMercator = require('SynwayMap/Common/Coordinate/WebMercator');
        var webMercator = new WebMercator();
        var ImageShape = require('zrender/shape/Image');
        var GoogleMap = function (name, url) {
            this.Name = name;
            this.LoadConfig(url);
            this.GoogleMapServiceUrl = url;
        };

        //#region 地图属性

        //父对象

        GoogleMap.prototype.Parent;

        //横坐标原点

        GoogleMap.prototype.XOrigin;

        //纵坐标原点

        GoogleMap.prototype.YOrigin;

        //图片尺寸

        GoogleMap.prototype.TileSize;

        //当前级别

        GoogleMap.prototype.Level = -1;

        //解析度数组

        GoogleMap.prototype.ResolutionArray = [];

        //比例尺数组

        GoogleMap.prototype.ScaleArray = [];

        //级别数组

        GoogleMap.prototype.LevelArray = [];

        //最大显示级别

        GoogleMap.prototype.LevelMax;

        //最大视野

        GoogleMap.prototype.FullExtent;

        //最初视野

        GoogleMap.prototype.InitialExtent;


        //平面坐标视野

        GoogleMap.prototype.PojectExtent;

        //前一个平面坐标视野

        GoogleMap.prototype.PrvPojectExtent;

        //#endregion

        //#region 私有方法
        GoogleMap.prototype.LoadConfig = function (url) {
            var xmlDoc = new XmlDoc();
            xmlDoc.load(url + "/conf.xml");
            this.XOrigin = parseFloat(xmlDoc.getElementsByTagName("TileOrigin").getElementsByTagName("X").getValue());
            this.YOrigin = parseFloat(xmlDoc.getElementsByTagName("TileOrigin").getElementsByTagName("Y").getValue());
            this.TileSize = parseFloat(xmlDoc.getElementsByTagName("TileCols").getValue());
            var ResolutionMax = parseFloat(xmlDoc.getElementsByTagName("ResolutionMax").getValue());
            var ScaleMax = parseFloat(xmlDoc.getElementsByTagName("ScaleMax").getValue());
            var LevelMax = parseFloat(xmlDoc.getElementsByTagName("LevelIDMax").getValue());
            this.LevelMax = LevelMax;
            this.Level = -1;
            for (var i = 1; i <= LevelMax; i++) {
                this.LevelArray[i - 1] = i;
                this.ResolutionArray[i - 1] = ResolutionMax / Math.pow(2, i);
                this.ScaleArray[i - 1] = ScaleMax / Math.pow(2, i);
            }
            var minx = parseFloat(xmlDoc.getElementsByTagName("FullExtent").getElementsByTagName("XMin").getValue());
            var miny = parseFloat(xmlDoc.getElementsByTagName("FullExtent").getElementsByTagName("YMin").getValue());
            var maxx = parseFloat(xmlDoc.getElementsByTagName("FullExtent").getElementsByTagName("XMax").getValue());
            var maxy = parseFloat(xmlDoc.getElementsByTagName("FullExtent").getElementsByTagName("YMax").getValue());
            this.FullExtent = { MinX: minx, MinY: miny, MaxX: maxx, MaxY: maxy };
            minx = parseFloat(xmlDoc.getElementsByTagName("InitialExtent").getElementsByTagName("XMin").getValue());
            miny = parseFloat(xmlDoc.getElementsByTagName("InitialExtent").getElementsByTagName("YMin").getValue());
            maxx = parseFloat(xmlDoc.getElementsByTagName("InitialExtent").getElementsByTagName("XMax").getValue());
            maxy = parseFloat(xmlDoc.getElementsByTagName("InitialExtent").getElementsByTagName("YMax").getValue());
            this.InitialExtent = { MinX: minx, MinY: miny, MaxX: maxx, MaxY: maxy };
        }
        /*

        生成地图视野区域

        参数：无


        返回值：无

        */
        GoogleMap.prototype.GenerateExtent = function () {
            //转为经纬度坐标(火星)
            var minPoint = { X: this.PojectExtent.MinX, Y: this.PojectExtent.MinY };
            minPoint = webMercator.webMercatorTOLonLat(minPoint);
            var maxPoint = { X: this.PojectExtent.MaxX, Y: this.PojectExtent.MaxY };
            maxPoint = webMercator.webMercatorTOLonLat(maxPoint);

            //火星转WGS84
            minPoint = marsCoord.gcj_decrypt_exact(minPoint);
            maxPoint = marsCoord.gcj_decrypt_exact(maxPoint);
            this.Parent.Extent = { MinX: minPoint.X, MinY: minPoint.Y, MaxX: maxPoint.X, MaxY: maxPoint.Y };
        }
        //#region 地图拼接

        GoogleMap.prototype.MapImages = [];
        /*

        地图拼接

        参数
        extent
        level

        返回值：无

        */
        GoogleMap.prototype.SpliceMap = function () {
            //地图切图时的切图原点横坐标
            var originX = this.XOrigin;
            //地图切图时的切图原点纵坐标
            var originY = this.YOrigin;
            //瓦片的屏幕像素大小
            var tileSize = this.TileSize;
            //地图屏幕宽度
            var canvasWidth = this.Parent.GetMapScreenWidth();
            //地图屏幕高度
            var canvasHeight = this.Parent.GetMapScreenHeight();

            //1 得到中心点
            centerGeoPoint = { X: (this.PojectExtent.MinX + this.PojectExtent.MaxX) / 2, Y: (this.PojectExtent.MinY + this.PojectExtent.MaxY) / 2 };

            //2 得到级别和解析度
            this.Level = this.GetNestLevel();
            var resolution = this.ResolutionArray[this.Level - 1];

            //3 算出屏幕范围所对应的地理范围

            var minX = centerGeoPoint.X - (resolution * canvasWidth) / 2;
            var maxX = centerGeoPoint.X + (resolution * canvasWidth) / 2;
            var minY = centerGeoPoint.Y - (resolution * canvasHeight) / 2;
            var maxY = centerGeoPoint.Y + (resolution * canvasHeight) / 2;

            this.PojectExtent = { MinX: minX, MinY: minY, MaxX: maxX, MaxY: maxY };

            //4 瓦片起始行列号

            var fixedTileLeftTopNumX = Math.floor((Math.abs(originX - minX)) / (resolution * tileSize));
            var fixedTileLeftTopNumY = Math.floor((Math.abs(originY - maxY)) / (resolution * tileSize));

            //5 实际地理范围
            var realMinX = fixedTileLeftTopNumX * resolution * tileSize + originX;
            var realMaxY = originY - fixedTileLeftTopNumY * resolution * tileSize;

            //6 左上角偏移像素
            var offSetX = ((realMinX - minX) / resolution);
            var offSetY = ((maxY - realMaxY) / resolution);

            //7 X、Y轴上的瓦片个数
            var mapXClipNum = Math.ceil((canvasWidth + Math.abs(offSetX)) / tileSize);
            var mapYClipNum = Math.ceil((canvasHeight + Math.abs(offSetY)) / tileSize);

            //8 拼接地图

            var layer = this.Parent.Zrender.painter.getLayer(-100200);
            for (var i = 0; i < this.MapImages.length; i++) {
                this.MapImages[i]._imageCache[this.MapImages[i].style.image].onload = null;
                this.MapImages[i]._imageCache[this.MapImages[i].style.image] = null;
                this.MapImages[i]._handler = null;
                this.MapImages[i].sytle = null;
                this.MapImages[i].position = null;
                this.MapImages[i].rotation = null;
                this.MapImages[i].scale = null;
                this.MapImages[i].clearCache();
                this.Parent.Zrender.delShape(this.MapImages[i].id);
                this.MapImages[i] = null;
            }
            layer.clear();
            this.Parent.Zrender.storage.delRoot(this.MapImages);


            //初始化zrender
            this.MapImages = [];
            var index = 0;
            var isDraw = false;
            var isRefresh = false;
            for (var i = 0; i < mapXClipNum; i++) {
                for (var j = 0; j < mapYClipNum; j++) {
                    var imageUrl = this.GetImageUrl(fixedTileLeftTopNumX + i, fixedTileLeftTopNumY + j, this.Level);
                    var shapeId = require('zrender/tool/guid')();
                    //zlevel：-10000：地图绘画点层，-10010：地图元素点层，-10020：地图绘画线层，-10030：轨迹图层,-10040：地图绘画面层，-100200：地图瓦片图层，-100300：地图图层图标缓冲层
                    var image = new ImageShape({
                        id: shapeId,
                        zlevel: -100200,
                        hoverable: false,
                        scale: [1, 1],
                        style: {
                            x: i * tileSize + offSetX,
                            y: j * tileSize + offSetY,
                            image: imageUrl,
                            width: tileSize,
                            height: tileSize
                        }
                    });
                    //console.log(i * tileSize + "," + j * tileSize + "," + imageUrl);
                    this.Parent.Zrender.addShape(image);
                    this.MapImages.push(image);
                }
            }
            this.Parent.Zrender.render();
        }
        GoogleMap.prototype.GetImageUrl = function (col, row, level) {
            var imageUrl = this.GoogleMapServiceUrl + "/" + level + "/" + col % 10 + "/" + row % 10 + "/" + col + "_" + row + "_" + level + ".png";
            return imageUrl;
        }
        //得到最接近的级别
        GoogleMap.prototype.GetNestLevel = function () {
            var resolution;
            if (this.Level == -1) {//未指定级别
                resolution = (this.PojectExtent.MaxX - this.PojectExtent.MinX) / this.Parent.GetMapScreenWidth();
                var nesti = 0;
                var nestdeff = 0;
                for (var i = 0; i < this.LevelMax; i++) {
                    if (i == 0) {
                        nestdeff = this.ResolutionArray[i] - resolution;
                        nestdeff = Math.abs(nestdeff);
                    }
                    else {
                        deff = this.ResolutionArray[i] - resolution;
                        deff = Math.abs(deff);
                        if (nestdeff > deff) {
                            nestdeff = deff;
                            nesti = i;
                        }
                    }
                }
                return nesti + 1; ;
            }
            else {
                if (this.Level > this.LevelMax) {
                    this.Level = this.LevelMax;
                }
                return this.Level;
            }
        }
        //#endregion

        //#endregion

        //#region 地图接口

        //#region 显示导航

        /*
        显示地图
        */
        GoogleMap.prototype.ShowMap = function () {
            if (this.PojectExtent == null) {
                //转为火星坐标
                var minPoint = { X: this.InitialExtent.MinX, Y: this.InitialExtent.MinY };
                minPoint = marsCoord.gcj_encrypt(minPoint);
                var maxPoint = { X: this.InitialExtent.MaxX, Y: this.InitialExtent.MaxY };
                maxPoint = marsCoord.gcj_encrypt(maxPoint);

                //转为平面坐标(Web墨卡托坐标)
                minPoint = webMercator.lonLat2WebMercator(minPoint);
                maxPoint = webMercator.lonLat2WebMercator(maxPoint);

                this.PojectExtent = { MinX: minPoint.X, MinY: minPoint.Y, MaxX: maxPoint.X, MaxY: maxPoint.Y };
            }
            this.SpliceMap();
            this.GenerateExtent();
        }
        /*
        全屏
        */
        GoogleMap.prototype.FullExtent = function () {
            //转为火星坐标
            var minPoint = { X: this.FullExtent.MinX, Y: this.FullExtent.MinY };
            minPoint = marsCoord.gcj_encrypt(minPoint);
            var maxPoint = { X: this.FullExtent.MaxX, Y: this.FullExtent.MaxY };
            maxPoint = marsCoord.gcj_encrypt(maxPoint);

            //转为平面坐标(Web墨卡托坐标)
            minPoint = webMercator.lonLat2WebMercator(minPoint);
            maxPoint = webMercator.lonLat2WebMercator(maxPoint);
            this.PrvPojectExtent = this.PojectExtent;
            this.PojectExtent = { MinX: minPoint.X, MinY: minPoint.Y, MaxX: maxPoint.X, MaxY: maxPoint.Y };
            this.Level = -1;
            this.SpliceMap();
            this.GenerateExtent();
        }
        /*
        放大
        */
        GoogleMap.prototype.ZoomIn = function () {
            if (this.Level < this.LevelMax) {
                this.Level = this.Level + 1;
            }
            this.PrvPojectExtent = this.PojectExtent;
            this.SpliceMap();
            this.GenerateExtent();
        }

        /*
        缩小
        */
        GoogleMap.prototype.ZoomOut = function () {
            if (this.Level > 1) {
                this.Level = this.Level - 1;
            }
            this.PrvPojectExtent = this.PojectExtent;
            this.SpliceMap();
            this.GenerateExtent();
        }

        /*
        设置当前中心

        参数：
        x:
        y:

        */
        GoogleMap.prototype.SetViewCenter = function (x, y) {
            //转为火星坐标
            var point = { X: x, Y: y };
            point = marsCoord.gcj_encrypt(point);
            //转为平面坐标(Web墨卡托坐标)
            point = webMercator.lonLat2WebMercator(point);

            // 得到级别和解析度
            this.Level = this.GetLevel();
            var resolution = this.ResolutionArray[this.Level - 1];

            //地图屏幕宽度
            var canvasWidth = this.Parent.GetMapScreenWidth();
            //地图屏幕高度
            var canvasHeight = this.Parent.GetMapScreenHeight();

            //算出屏幕范围所对应的地理范围

            var minX = point.X - (resolution * canvasWidth) / 2;
            var maxX = point.X + (resolution * canvasWidth) / 2;
            var minY = point.Y - (resolution * canvasHeight) / 2;
            var maxY = point.Y + (resolution * canvasHeight) / 2;
            this.PrvPojectExtent = this.PojectExtent;
            this.PojectExtent = { MinX: minX, MinY: minY, MaxX: maxX, MaxY: maxY };
            this.SpliceMap();
            this.GenerateExtent();
        }

        /*
        设置当前视野
        */
        GoogleMap.prototype.SetView = function (minx, miny, maxx, maxy) {
            //转为火星坐标
            var minPoint = { X: minx, Y: miny };
            minPoint = marsCoord.gcj_encrypt(minPoint);
            var maxPoint = { X: maxx, Y: maxy };
            maxPoint = marsCoord.gcj_encrypt(maxPoint);

            //转为平面坐标(Web墨卡托坐标)
            minPoint = webMercator.lonLat2WebMercator(minPoint);
            maxPoint = webMercator.lonLat2WebMercator(maxPoint);
            this.PrvPojectExtent = this.PojectExtent;
            this.PojectExtent = { MinX: minPoint.X, MinY: minPoint.Y, MaxX: maxPoint.X, MaxY: maxPoint.Y };
            this.Level = -1;
            this.SpliceMap();
            this.GenerateExtent();
        }

        /*
        设置比例
        */
        GoogleMap.prototype.SetScale = function (scale) {
            var minDiff = 99999999999999;
            var level = this.LevelMax;
            for (var i = 1; i < this.LevelMax; i++) {
                var diff;
                if (this.ScaleArray[i - 1] >= scale) {
                    diff = this.ScaleArray[i - 1] - scale;
                }
                else {
                    diff = scale - this.ScaleArray[i - 1];
                }
                if (minDiff > diff) {
                    minDiff = diff;
                    level = i;
                }
            }
            this.SetLevel(level);
        }

        /*
        设置级别
        */
        GoogleMap.prototype.SetLevel = function (level) {
            if (level <= 0) {
                this.Level = 1;
            }
            if (level > this.LevelMax) {
                this.Level = this.LevelMax;
            }
            this.PrvPojectExtent = this.PojectExtent;
            this.SpliceMap();
            this.GenerateExtent();
        }
        /*

        移动屏幕

        参数：

        x:移动屏幕坐标

        y:移动屏幕坐标

        */
        GoogleMap.prototype.ScreenMove = function (diffX, diffY) {
            this.PrvPojectExtent = this.PojectExtent;
            var resolution = this.ResolutionArray[this.Level - 1];
            var minx=this.PojectExtent.MinX - diffX * resolution;
            var maxx=this.PojectExtent.MaxX - diffX * resolution;
            var miny=this.PojectExtent.MinY + diffY * resolution;
            var maxy=this.PojectExtent.MaxY + diffY * resolution;
            this.PojectExtent = { MinX: minx, MinY: miny, MaxX: maxx, MaxY: maxy };
        }

        /*

        生成地图视野区域

        参数：无


        返回值：无

        */
        GoogleMap.prototype.GenerateExtent = function () {
            //转为经纬度坐标(火星)
            var minPoint = { X: this.PojectExtent.MinX, Y: this.PojectExtent.MinY };
            minPoint = webMercator.webMercatorTOLonLat(minPoint);
            var maxPoint = { X: this.PojectExtent.MaxX, Y: this.PojectExtent.MaxY };
            maxPoint = webMercator.webMercatorTOLonLat(maxPoint);

            //火星转WGS84
            minPoint = marsCoord.gcj_decrypt_exact(minPoint);
            maxPoint = marsCoord.gcj_decrypt_exact(maxPoint);
            this.Parent.Extent = { MinX: minPoint.X, MinY: minPoint.Y, MaxX: maxPoint.X, MaxY: maxPoint.Y };
        }

        //#endregion

        //#region 地图信息

        /*
        得到当前比例
        */
        GoogleMap.prototype.GetScale = function () {
            return this.ScaleArray[this.Level - 1];
        }

        /*
        得到当前级别
        */
        GoogleMap.prototype.GetLevel = function () {
            return this.Level;
        }

        /*
        是否改变视野
        */
        GoogleMap.prototype.IsChangeView = function () {
            if (this.PrvPojectExtent == null && this.PojectExtent != null) {
                return true;
            }
            if (this.PrvPojectExtent != null && this.PojectExtent != null) {
                if (this.PrvPojectExtent.MinX != this.PojectExtent.MinX) return true;
                if (this.PrvPojectExtent.MinY != this.PojectExtent.MinY) return true;
                if (this.PrvPojectExtent.MaxX != this.PojectExtent.MaxX) return true;
                if (this.PrvPojectExtent.MaxY != this.PojectExtent.MaxY) return true;
            }
            return false;
        }
        //#endregion

        //#endregion

        return GoogleMap;
    }
);