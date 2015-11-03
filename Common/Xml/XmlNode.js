define(
    function (require) {
        var XmlNode = function (node) {
            this.Node = node;
        };
        XmlNode.prototype.getElementsByTagName = function (name) {
            return new XmlNode(this.Node[0].getElementsByTagName(name));
        }
        XmlNode.prototype.getValue = function () {
            if (!window.DOMParser && window.ActiveXObject) {
                return this.Node[0].text;
            }
            else if (window.XMLHttpRequest) {
                return this.Node[0].firstChild.nodeValue
            }
        }
        XmlNode.prototype.getAttribute = function (name) {
            return this.Node[0].getAttribute(name);
        }
        return XmlNode;
    }
);