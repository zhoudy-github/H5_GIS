define(
    function (require) {
        var XmlNode = require('SynwayMap/Common/Xml/XmlNode');
        var XmlDoc = function () {
            //if (!window.DOMParser && window.ActiveXObject) {
             if(window.ActiveXObject){
                var xmlDomVersions = ['MSXML.2.DOMDocument.6.0', 'MSXML.2.DOMDocument.3.0', 'Microsoft.XMLDOM'];
                for (var i = 0; i < xmlDomVersions.length; i++) {
                    try {
                        this.XmlObj = new ActiveXObject(xmlDomVersions[i]);
                        this.XmlObj.async = false;
                        break;
                    } catch (e) {
                    }
                }
            }
            else if (window.XMLHttpRequest) {
                this.XmlObj = new window.XMLHttpRequest();
            }
            else {
                return null;
            }
        };
        XmlDoc.prototype.load = function (url) {
            //if (!window.DOMParser && window.ActiveXObject) {
            if(window.ActiveXObject){
                this.XmlObj.load(url);
            }
            else if (window.XMLHttpRequest) {
                this.XmlObj.open("GET", url, false);
                this.XmlObj.send(null);
                if (this.XmlObj.readyState == 4) {
                    var domParser = new DOMParser();
                    this.XmlObj = domParser.parseFromString(this.XmlObj.responseXML.documentElement.outerHTML, 'text/xml');
                }
            }
        }
        XmlDoc.prototype.getElementsByTagName = function (name) {
            return new XmlNode(this.XmlObj.getElementsByTagName(name));
        }
        return XmlDoc;
    }
);