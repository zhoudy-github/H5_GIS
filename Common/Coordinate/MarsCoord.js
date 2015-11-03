define(
    function (require) {
        var PI = 3.14159265358979324;
        var x_pi = 3.14159265358979324 * 3000.0 / 180.0;
        var MarsCoord = function () {
        };
        //#region 相关方法

        MarsCoord.prototype.outOfChina = function (lat, lon) {
            if (lon < 72.004 || lon > 137.8347)
                return true;
            if (lat < 0.8293 || lat > 55.8271)
                return true;
            return false;
        }
        MarsCoord.prototype.delta = function (lat, lon) {
            // Krasovsky 1940
            //
            // a = 6378245.0, 1/f = 298.3
            // b = a * (1 - f)
            // ee = (a^2 - b^2) / a^2;
            var a = 6378245.0; //  a: 卫星椭球坐标投影到平面地图坐标系的投影因子。
            var ee = 0.00669342162296594323; //  ee: 椭球的偏心率。
            var dLat = this.transformLat(lon - 105.0, lat - 35.0);
            var dLon = this.transformLon(lon - 105.0, lat - 35.0);
            var radLat = lat / 180.0 * PI;
            var magic = Math.sin(radLat);
            magic = 1 - ee * magic * magic;
            var sqrtMagic = Math.sqrt(magic);
            dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
            dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
            return { 'lat': dLat, 'lon': dLon };
        }
        MarsCoord.prototype.gcj_decrypt = function (gcjLat, gcjLon) {
            if (this.outOfChina(gcjLat, gcjLon))
                return { 'lat': gcjLat, 'lon': gcjLon };

            var d = this.delta(gcjLat, gcjLon);
            return { 'lat': gcjLat - d.lat, 'lon': gcjLon - d.lon };
        }
        MarsCoord.prototype.transformLat = function (x, y) {
            var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
            ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
            return ret;
        }
        MarsCoord.prototype.transformLon = function (x, y) {
            var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
            ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
            return ret;
        }
        //#endregion

        /*

        经纬度(WGS84)转为火星坐标

        参数

        point：WGS84经纬度坐标点

        返回值：火星坐标

        */
        MarsCoord.prototype.gcj_encrypt = function (point) {
            if (this.outOfChina(point.Y, point.X))
                return point;

            var d = this.delta(point.Y, point.X);
            return { X: point.X + d.lon, Y: point.Y + d.lat };
        }

        /*

        火星坐标转为经纬度(WGS84)

        参数

        point：火星坐标

        返回值：经纬度(WGS84)

        */
        MarsCoord.prototype.gcj_decrypt_exact = function (point) {
            var initDelta = 0.01;
            var threshold = 0.000000001;
            var dLat = initDelta, dLon = initDelta;
            var mLat = point.Y - dLat, mLon = point.X - dLon;
            var pLat = point.Y + dLat, pLon = point.X + dLon;
            var wgsLat, wgsLon, i = 0;
            while (1) {
                wgsLat = (mLat + pLat) / 2;
                wgsLon = (mLon + pLon) / 2;
                var tmp = this.gcj_encrypt({ Y: wgsLat, X: wgsLon })
                dLat = tmp.Y - point.Y;
                dLon = tmp.X - point.X;
                if ((Math.abs(dLat) < threshold) && (Math.abs(dLon) < threshold))
                    break;

                if (dLat > 0) pLat = wgsLat; else mLat = wgsLat;
                if (dLon > 0) pLon = wgsLon; else mLon = wgsLon;

                if (++i > 10000) break;
            }
            //console.log(i);
            return { X: wgsLon, Y: wgsLat };
        }

        /*

        火星坐标转为BD-09(百度坐标)

        参数

        point：火星坐标

        返回值：BD-09(百度坐标)

        */
        MarsCoord.prototype.bd_encrypt = function (point) {
            var x = point.X, y = point.Y;
            var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
            var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
            bdLon = z * Math.cos(theta) + 0.0065;
            bdLat = z * Math.sin(theta) + 0.006;
            return { X: bdLon, Y: bdLat };
        }

        /*

        BD-09(百度坐标)转为火星坐标

        参数

        point：BD-09(百度坐标)

        返回值：火星坐标

        */
        MarsCoord.prototype.bd_decrypt = function (point) {
            var x = point.X - 0.0065, y = point.Y - 0.006;
            var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
            var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
            var gcjLon = z * Math.cos(theta);
            var gcjLat = z * Math.sin(theta);
            return { X: gcjLon, Y: gcjLat };
        }

        return MarsCoord;
    }
);