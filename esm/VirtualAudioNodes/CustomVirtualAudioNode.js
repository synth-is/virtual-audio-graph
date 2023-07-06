import connectAudioNodes from '../connectAudioNodes';
import { mapObj, values, } from '../utils';
import createVirtualAudioNode from '../createVirtualAudioNode';
var CustomVirtualAudioNode = /** @class */ (function () {
    function CustomVirtualAudioNode(audioContext, node, output, params) {
        this.node = node;
        this.output = output;
        this.audioNode = undefined;
        this.connected = false;
        this.params = params || {};
        this.virtualNodes = mapObj(function (virtualAudioNodeParam) { return createVirtualAudioNode(audioContext, virtualAudioNodeParam); }, node(params));
        connectAudioNodes(this.virtualNodes, function () { });
    }
    CustomVirtualAudioNode.prototype.connect = function () {
        var connectArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            connectArgs[_i] = arguments[_i];
        }
        for (var _a = 0, _b = values(this.virtualNodes); _a < _b.length; _a++) {
            var childVirtualNode = _b[_a];
            var output = childVirtualNode.output;
            if (output === 'output' ||
                Array.isArray(output) && output.indexOf('output') !== -1)
                childVirtualNode.connect.apply(childVirtualNode, connectArgs.filter(Boolean));
        }
        this.connected = true;
    };
    CustomVirtualAudioNode.prototype.disconnect = function (node) {
        for (var _i = 0, _a = values(this.virtualNodes); _i < _a.length; _i++) {
            var virtualNode = _a[_i];
            var output = virtualNode.output;
            if (output === 'output' ||
                Array.isArray(output) && output.indexOf('output') !== -1)
                virtualNode.disconnect();
        }
        this.connected = false;
    };
    CustomVirtualAudioNode.prototype.disconnectAndDestroy = function () {
        for (var _i = 0, _a = values(this.virtualNodes); _i < _a.length; _i++) {
            var virtualNode = _a[_i];
            virtualNode.disconnectAndDestroy();
        }
        this.connected = false;
    };
    CustomVirtualAudioNode.prototype.update = function (params) {
        if (params === void 0) { params = {}; }
        var audioGraphParamsFactoryValues = values(this.node(params));
        var keys = Object.keys(this.virtualNodes);
        for (var i = 0; i < keys.length; i++) {
            this.virtualNodes[keys[i]].update(audioGraphParamsFactoryValues[i][2]);
        }
        this.params = params;
        return this;
    };
    return CustomVirtualAudioNode;
}());
export default CustomVirtualAudioNode;
