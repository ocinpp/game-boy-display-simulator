/* DMG-style chiptune crusher (AudioWorklet).
   Two stages of lo-fi:
     1. sample-and-hold — every `hold` samples one value is kept, mimicking the
        low update rate of the Game Boy's sound channels
     2. bit-crush — amplitude quantized to `bits` levels, like the DMG's 4-bit DAC */
class GBCrush extends AudioWorkletProcessor {
  static get parameterDescriptors(){
    return [
      { name:'bits', defaultValue:6, minValue:2, maxValue:12 },
      { name:'hold', defaultValue:3, minValue:1, maxValue:40 },
    ];
  }
  constructor(){
    super();
    this.held = [0, 0];
    this.phase = 0;
  }
  process(inputs, outputs, params){
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input.length) return true;
    const bits = params.bits[0];
    const steps = (1 << bits) - 1;
    const hold = Math.max(1, Math.round(params.hold[0]));
    const blockLen = input[0].length;
    for (let ch = 0; ch < input.length; ch++){
      const inp = input[ch], out = output[ch];
      let h = this.held[ch] || 0;
      for (let i = 0; i < inp.length; i++){
        if ((this.phase + i) % hold === 0){
          // quantize [-1,1] onto N-bit steps
          h = Math.round((inp[i] * 0.5 + 0.5) * steps) / steps * 2 - 1;
        }
        out[i] = h;
      }
      this.held[ch] = h;
    }
    this.phase = (this.phase + blockLen) % hold;
    return true;
  }
}
registerProcessor('gb-crush', GBCrush);
