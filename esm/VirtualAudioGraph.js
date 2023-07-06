import { entries, equals, values } from './utils';
import connectAudioNodes from './connectAudioNodes';
import createVirtualAudioNode from './createVirtualAudioNode';
var VirtualAudioGraph = /** @class */ (function () {
    function VirtualAudioGraph(audioContext, output) {
        this.audioContext = audioContext;
        this.output = output;
        this.virtualNodes = {};
    }
    Object.defineProperty(VirtualAudioGraph.prototype, "currentTime", {
        get: function () {
            return this.audioContext.currentTime;
        },
        enumerable: true,
        configurable: true
    });
    VirtualAudioGraph.prototype.disconnectParents = function (vNode) {
        for (var _i = 0, _a = values(this.virtualNodes); _i < _a.length; _i++) {
            var node = _a[_i];
            node.disconnect(vNode);
        }
    };
    VirtualAudioGraph.prototype.getAudioNodeById = function (id) {
        var vNode = this.virtualNodes[id];
        return vNode && vNode.audioNode;
    };
    VirtualAudioGraph.prototype.update = function (newGraph) {
        var _this = this;
        if (newGraph.hasOwnProperty('output'))
            throw new Error('"output" is not a valid id');
        for (var _i = 0, _a = entries(this.virtualNodes); _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], virtualAudioNode = _b[1];
            if (newGraph.hasOwnProperty(id))
                continue;
            virtualAudioNode.disconnectAndDestroy();
            this.disconnectParents(virtualAudioNode);
            delete this.virtualNodes[id];
        }
        for (var _c = 0, _d = Object.keys(newGraph); _c < _d.length; _c++) {
            var key = _d[_c];
            var newNodeParams = newGraph[key];
            var paramsNodeName = newNodeParams[0], paramsOutput = newNodeParams[1], paramsParams = newNodeParams[2];
            if (paramsOutput == null && paramsNodeName !== 'mediaStreamDestination') {
                throw new Error("output not specified for node key " + key);
            }
            var virtualAudioNode = this.virtualNodes[key];
            if (virtualAudioNode == null) {
                this.virtualNodes[key] = createVirtualAudioNode(this.audioContext, newNodeParams);
                continue;
            }
            if ((paramsParams && paramsParams.startTime) !==
                (virtualAudioNode.params && virtualAudioNode.params.startTime) ||
                (paramsParams && paramsParams.stopTime) !==
                    (virtualAudioNode.params && virtualAudioNode.params.stopTime) ||
                paramsNodeName !== virtualAudioNode.node) {
                virtualAudioNode.disconnectAndDestroy();
                this.disconnectParents(virtualAudioNode);
                this.virtualNodes[key] = createVirtualAudioNode(this.audioContext, newNodeParams);
                continue;
            }
            if (!equals(paramsOutput, virtualAudioNode.output)) {
                virtualAudioNode.disconnect();
                this.disconnectParents(virtualAudioNode);
                virtualAudioNode.output = paramsOutput;
            }
            virtualAudioNode.update(paramsParams);
        }
        connectAudioNodes(this.virtualNodes, function (vNode) { return vNode.connect(_this.output); });
        return this;
    };
    return VirtualAudioGraph;
}());
export default VirtualAudioGraph;
