define(
    function (require) {
        var UTF8 = function () {
        }
        UTF8.prototype.Encode = function (str) {
            var temp = "", rs = "";
            for (var i = 0, len = str.length; i < len; i++) {
                temp = str.charCodeAt(i).toString(16);
                rs += "\\u" + new Array(5 - temp.length).join("0") + temp;
            }
            return rs;
        }
        UTF8.prototype.Decode = function (str) {
            return str.replace(/(\\u)(\w{4}|\w{2})/gi, function($0,$1,$2){  
                return String.fromCharCode(parseInt($2,16));
            });
        }
        return UTF8;
    }
);