/* GIF encoding worker: receives rendered frames from the main thread and
   assembles the animated GIF off the UI thread.
   Protocol:
     { type:'start',   width, height }      -> begin a new GIF
     { type:'palette', frames:[ArrayBuffer] } -> build one shared palette from sample frames
     { type:'frame',   data, delay, first } -> quantize to the shared palette + append
     { type:'end' }                         -> finish and post back { type:'done', buffer } */
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

let gif = null;
let W = 0, H = 0;
let palette = null;

self.onmessage = e => {
  const msg = e.data;

  if (msg.type === 'start'){
    gif = GIFEncoder();
    W = msg.width;
    H = msg.height;
    palette = null;
    return;
  }

  if (msg.type === 'palette'){
    // one shared palette sampled across the clip: stable colours, no frame-to-frame flicker
    let total = 0;
    for (const b of msg.frames) total += b.byteLength;
    const all = new Uint8Array(total);
    let o = 0;
    for (const b of msg.frames){ all.set(new Uint8Array(b), o); o += b.byteLength; }
    palette = quantize(all, 256);
    return;
  }

  if (msg.type === 'frame'){
    if (!gif || !palette) return;
    const index = applyPalette(new Uint8Array(msg.data), palette);
    const opts = { palette, delay: msg.delay };
    if (msg.first) opts.repeat = 0; // loop forever
    gif.writeFrame(index, W, H, opts);
    return;
  }

  if (msg.type === 'end'){
    if (!gif) return;
    gif.finish();
    const bytes = gif.bytes();
    self.postMessage({ type:'done', buffer: bytes.buffer }, [bytes.buffer]);
    gif = null;
    palette = null;
  }
};
