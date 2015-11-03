define(
    function (require) {
        var Rest = function () {
        }
        Rest.prototype.HttpGet = function (url) {
            var xmlhttp;
            xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", url, false);
            xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
            xmlhttp.send(null);
            if (xmlhttp.Status = 200) return xmlhttp.responseText;
        }
        Rest.prototype.HttpPost = function (url, data) {
            var xmlhttp;
            xmlhttp = new XMLHttpRequest();
            xmlhttp.open("POST", url, false);
            xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
//            xmlhttp.setRequestHeader("Content-Length", data.length);
            xmlhttp.send(data);
            xmlhttp.onload = function () {
                alert(xmlhttp.responseText);
            }
            if (xmlhttp.Status = 200) return xmlhttp.responseText;

        }
        return Rest;
    }
);