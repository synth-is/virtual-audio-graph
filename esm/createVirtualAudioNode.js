import StandardVirtualAudioNode from './VirtualAudioNodes/StandardVirtualAudioNode';
import CustomVirtualAudioNode from './VirtualAudioNodes/CustomVirtualAudioNode';
export default (function (audioContext, _a) {
    var node = _a[0], output = _a[1], params = _a[2], input = _a[3];
    return typeof node === 'function'
        ? new CustomVirtualAudioNode(audioContext, node, output, params)
        : new StandardVirtualAudioNode(audioContext, node, output, params, input);
});
