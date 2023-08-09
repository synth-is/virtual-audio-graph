import { capitalize, equals, find, values } from '../utils';
import { audioParamProperties, constructorParamsKeys, setters, startAndStopNodes, } from '../data';
import CustomVirtualAudioNode from './CustomVirtualAudioNode';
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
export default StandardVirtualAudioNode;
