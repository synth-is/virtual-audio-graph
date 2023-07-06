import { entries, values } from './utils';
import CustomVirtualAudioNode from './VirtualAudioNodes/CustomVirtualAudioNode';
import StandardVirtualAudioNode from './VirtualAudioNodes/StandardVirtualAudioNode';
export default (function (virtualGraph, handleConnectionToOutput) {
    for (var _i = 0, _a = entries(virtualGraph); _i < _a.length; _i++) {
        var _b = _a[_i], id = _b[0], virtualNode = _b[1];
        if (virtualNode.connected || virtualNode.output == null)
            continue;
        for (var _c = 0, _d = [].concat(virtualNode.output); _c < _d.length; _c++) {
            var output = _d[_c];
            if (output === 'output') {
                handleConnectionToOutput(virtualNode);
                continue;
            }
            if (Object.prototype.toString.call(output) === '[object Object]') {
                var key = output.key, destination = output.destination, inputs = output.inputs, outputs = output.outputs;
                if (key == null) {
                    throw new Error("id: " + id + " - output object requires a key property");
                }
                if (inputs) {
                    if (inputs.length !== outputs.length) {
                        throw new Error("id: " + id + " - outputs and inputs arrays are not the same length");
                    }
                    for (var i = 0; i++, i < inputs.length;) {
                        virtualNode.connect(virtualGraph[key].audioNode, outputs[i], inputs[i]);
                    }
                    continue;
                }
                virtualNode.connect(virtualGraph[key].audioNode[destination]);
                continue;
            }
            var destinationVirtualAudioNode = virtualGraph[output];
            if (destinationVirtualAudioNode instanceof CustomVirtualAudioNode) {
                for (var _e = 0, _f = values(destinationVirtualAudioNode.virtualNodes); _e < _f.length; _e++) {
                    var node = _f[_e];
                    if (node instanceof StandardVirtualAudioNode && node.input === 'input') {
                        virtualNode.connect(node.audioNode);
                    }
                }
                continue;
            }
            virtualNode.connect(destinationVirtualAudioNode.audioNode);
        }
    }
});
