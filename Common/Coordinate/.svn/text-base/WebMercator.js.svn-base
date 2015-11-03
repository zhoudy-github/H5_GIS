define(
    function (require) {
        var WebMercator = function () {
        };

        //#region 经纬度(WGS84)与Web墨卡托坐标转换
        /*

        经纬度转为Web墨卡托坐标

        参数

        point:类型为SynPoint

        返回值：Web墨卡托坐标坐标点，类型为SynPoint

        */
        WebMercator.prototype.lonLat2WebMercator = function (point) {
            //    if ((Math.abs(point.X) > 180 || Math.abs(point.Y) > 90)) { return }
            var d = point.X * 0.017453292519943295; //0.017453292519943295为度转弧度的参数
            var b = 6378137 * d; //6378137为地球半径
            var c = point.Y * 0.017453292519943295;
            var f = 3189068.5 * Math.log((1 + Math.sin(c)) / (1 - Math.sin(c)));
            return { X: b, Y: f };
        }
        /*

        Web墨卡托坐标转为经纬度

        参数

        point:类型为SynPoint

        返回值：经纬度坐标点，类型为SynPoint

        */
        WebMercator.prototype.webMercatorTOLonLat = function (point) {
            //    if ((Math.abs(point.X) > 20037508.3427892) || (Math.abs(point.Y) > 20037508.3427892)) { return }
            var a = point.X;
            var h = point.Y;
            var g = a / 6378137;
            var f = g * 57.29577951308232;
            var e = Math.floor(((f + 180) / 360));
            var d = f - (e * 360);
            var c = 1.5707963267948966 - (2 * Math.atan(Math.exp((-1 * h) / 6378137)));
            a = d;
            h = c * 57.29577951308232;
            return { X: a, Y: h };
        }
        //#endregion
        return WebMercator;
    }
);