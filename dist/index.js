'use strict';

var capitalize = function (a) { return a.charAt(0).toUpperCase() + a.substring(1); };
var entries = function (o) {
    var xs = [];
    for (var _i = 0, _a = Object.keys(o); _i < _a.length; _i++) {
        var key = _a[_i];
        xs.push([key, o[key]]);
    }
    return xs;
};
var equals = function (a, b) {
    if (a === b)
        return true;
    var typeA = typeof a;
    if (typeA !== typeof b || typeA !== 'object')
        return false;
    if (Array.isArray(a)) {
        if (a.length !== b.length)
            return false;
        for (var i = 0; i < a.length; i++)
            if (!equals(a[i], b[i]))
                return false;
        return true;
    }
    var keysA = Object.keys(a);
    var keysB = Object.keys(b);
    if (keysA.length !== keysB.length)
        return false;
    for (var i = 0; i < keysA.length; i++) {
        var key = keysA[i];
        if (!equals(a[key], b[key]))
            return false;
    }
    return true;
};
var find = function (f, xs) {
    for (var i = 0; i < xs.length; i++)
        if (f(xs[i]))
            return xs[i];
};
var mapObj = function (f, o) {
    var p = {};
    for (var key in o)
        if (Object.prototype.hasOwnProperty.call(o, key))
            p[key] = f(o[key]);
    return p;
};
var values = function (obj) {
    var keys = Object.keys(obj);
    var ret = [];
    for (var i = 0; i < keys.length; i++)
        ret[i] = obj[keys[i]];
    return ret;
};

var audioParamProperties = [
    'attack',
    'delayTime',
    'detune',
    'frequency',
    'gain',
    'knee',
    'pan',
    'playbackRate',
    'ratio',
    'reduction',
    'release',
    'threshold',
    'Q',
];
var constructorParamsKeys = [
    'maxDelayTime',
    'mediaElement',
    'mediaStream',
    'numberOfOutputs',
    'numberOfInputs'
];
var setters = [
    'position',
    'orientation',
];
var startAndStopNodes = [
    'oscillator',
    'bufferSource',
];

var createAudioNode = function (audioContext, name, constructorParam, _a) {
    var offsetTime = _a.offsetTime, startTime = _a.startTime, stopTime = _a.stopTime;
    offsetTime = offsetTime || 0; // tslint:disable-line no-parameter-reassignment
    var func = "create" + capitalize(name);
    if (typeof audioContext[func] !== 'function') {
        throw new Error("Unknown node type: " + name);
    }
    var audioNode = constructorParam
        ? audioContext[func](constructorParam)
        : audioContext[func]();
    if (startAndStopNodes.indexOf(name) !== -1) {
        if ("bufferSource" === name) {
            if (startTime == null)
                audioNode.start(audioContext.currentTime, offsetTime);
            else
                audioNode.start(startTime, offsetTime);
        }
        else {
            if (startTime == null)
                audioNode.start(audioContext.currentTime);
            else
                audioNode.start(startTime);
        }
        if (stopTime != null)
            audioNode.stop(stopTime);
    }
    // https://github.com/ircam-ismm/node-web-audio-api/issues/29
    audioNode.channelInterpretation = 'discrete';
    return audioNode;
};
var StandardVirtualAudioNode = /** @class */ (function () {
    function StandardVirtualAudioNode(audioContext, node, output, params, input) {
        this.node = node;
        this.output = output;
        this.input = input;
        var paramsObj = params || {};
        var offsetTime = paramsObj.offsetTime, startTime = paramsObj.startTime, stopTime = paramsObj.stopTime;
        var constructorParam = paramsObj[find(function (key) { return constructorParamsKeys.indexOf(key) !== -1; }, Object.keys(paramsObj))];
        this.audioNode = createAudioNode(audioContext, node, constructorParam, {
            offsetTime: offsetTime,
            startTime: startTime,
            stopTime: stopTime,
        });
        this.connected = false;
        this.connections = [];
        this.stopCalled = stopTime !== undefined;
        this.update(paramsObj);
    }
    StandardVirtualAudioNode.prototype.connect = function () {
        var connectArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            connectArgs[_i] = arguments[_i];
        }
        var audioNode = this.audioNode;
        var filteredConnectArgs = connectArgs.filter(Boolean);
        var firstArg = filteredConnectArgs[0], rest = filteredConnectArgs.slice(1);
        audioNode.connect && audioNode.connect.apply(audioNode, [firstArg].concat(rest));
        this.connections = this.connections.concat(filteredConnectArgs);
        this.connected = true;
    };
    StandardVirtualAudioNode.prototype.disconnect = function (node) {
        var audioNode = this.audioNode;
        if (node) {
            if (node instanceof CustomVirtualAudioNode) {
                var _loop_1 = function (childNode) {
                    if (!this_1.connections.some(function (x) { return x === childNode.audioNode; }))
                        return "continue";
                    this_1.connections = this_1.connections.filter(function (x) { return x !== childNode.audioNode; });
                };
                var this_1 = this;
                for (var _i = 0, _a = values(node.virtualNodes); _i < _a.length; _i++) {
                    var childNode = _a[_i];
                    _loop_1(childNode);
                }
            }
            else {
                if (!this.connections.some(function (x) { return x === node.audioNode; }))
                    return;
                this.connections = this.connections
                    .filter(function (x) { return x !== node.audioNode; });
            }
        }
        audioNode.disconnect && audioNode.disconnect();
        this.connected = false;
    };
    StandardVirtualAudioNode.prototype.disconnectAndDestroy = function () {
        var _a = this, audioNode = _a.audioNode, stopCalled = _a.stopCalled;
        if (audioNode.stop && !stopCalled)
            audioNode.stop();
        audioNode.disconnect && audioNode.disconnect();
        this.connected = false;
    };
    StandardVirtualAudioNode.prototype.update = function (params) {
        var _this = this;
        if (params === void 0) { params = {}; }
        var _loop_2 = function (key) {
            if (constructorParamsKeys.indexOf(key) !== -1)
                return "continue";
            var param = params[key];
            if (this_2.params && this_2.params[key] === param)
                return "continue";
            if (audioParamProperties.indexOf(key) !== -1) {
                if (Array.isArray(param)) {
                    if (this_2.params && !equals(param, this_2.params[key])) {
                        this_2.audioNode[key].cancelScheduledValues(0);
                    }
                    var callMethod = function (_a) {
                        var methodName = _a[0], args = _a.slice(1);
                        return (_b = _this.audioNode[key])[methodName].apply(_b, args);
                        var _b;
                    };
                    Array.isArray(param[0]) ? param.forEach(callMethod) : callMethod(param);
                    return "continue";
                }
                this_2.audioNode[key].value = param;
                return "continue";
            }
            if (setters.indexOf(key) !== -1) {
                (_a = this_2.audioNode)["set" + capitalize(key)].apply(_a, param);
                return "continue";
            }
            this_2.audioNode[key] = param;
            var _a;
        };
        var this_2 = this;
        for (var _i = 0, _a = Object.keys(params); _i < _a.length; _i++) {
            var key = _a[_i];
            _loop_2(key);
        }
        this.params = params;
        return this;
    };
    return StandardVirtualAudioNode;
}());

var createVirtualAudioNode = (function (audioContext, _a) {
    var node = _a[0], output = _a[1], params = _a[2], input = _a[3];
    return typeof node === 'function'
        ? new CustomVirtualAudioNode(audioContext, node, output, params)
        : new StandardVirtualAudioNode(audioContext, node, output, params, input);
});

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

var connectAudioNodes = (function (virtualGraph, handleConnectionToOutput) {
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

var index = (function (config) {
    var audioContext = config && config.audioContext || new AudioContext;
    var output = config && config.output || audioContext.destination;
    return new VirtualAudioGraph(audioContext, output);
});

module.exports = index;
