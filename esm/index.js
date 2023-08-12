import VirtualAudioGraph from './VirtualAudioGraph';
export default (function (config) {
    var audioContext = config && config.audioContext || new AudioContext;
    var output = config && config.output || audioContext.destination;
    output.channelInterpretation = 'discrete';
    return new VirtualAudioGraph(audioContext, output);
});
