<template>
<div class="min-h-screen flex flex-col items-center py-6 px-4"
     @dragover.prevent="dragging=true" @dragleave.prevent="dragging=false" @drop.prevent="onDrop">

  <!-- Header -->
  <header class="mb-6 text-center px-2">
    <div class="hw-label text-neutral-500 mb-3">Nintendo hardware study · 1989–2005</div>
    <h1 class="title-pixel">GAME BOY</h1>
    <div class="title-sub-row">
      <span class="stripe a"></span>
      <span class="title-sub">DISPLAY SIMULATOR</span>
      <span class="stripe b"></span>
    </div>
    <p class="text-xs mt-4 text-neutral-500 tracking-wide">Upload a photo or short clip — see it through seven authentic screens.</p>
  </header>

  <div class="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-10">
  <!-- Device -->
  <div class="shell-wrap flex-none" :style="shellVars">
    <div class="contrast-dial">
      <div class="wheel" :style="{backgroundPosition:'0 ' + (dial*1.5) + 'px'}"></div>
    </div>
    <div class="dial-grip" title="Contrast — drag or scroll"
         @pointerdown.prevent="dialStart" @wheel.prevent="dialScroll"></div>
  <div class="shell">
    <div class="power-rail">
      <div class="power-switch" :class="{on:powerOn}" @click="togglePower"><div class="knob"></div></div>
      <span class="hw-label" style="font-size:8px; color:var(--sh-ink2,#7a776c)">OFF·ON</span>
    </div>

    <div class="dial-marks">
      <span class="mark plus">+</span>
      <span class="dial-label">CONTRAST</span>
      <span class="mark minus">−</span>
    </div>

    <div class="lens">
      <div class="lens-stripes"></div>
      <div class="lens-caption">DOT MATRIX WITH STEREO SOUND</div>
      <div class="screen-row">
        <div class="led-col">
          <div class="led" :class="{lit:powerOn}"></div>
          <div class="led-label">BATTERY</div>
        </div>
        <div class="screen-frame">
          <canvas ref="screen" :style="{opacity: powerOn ? 1 : 0}"></canvas>
          <div class="glare"></div>
        </div>
      </div>
    </div>

    <div class="brand">Nintendo <span>®</span> <span class="font-black not-italic" style="color:#5f2d8e">GAME BOY</span><span>™</span></div>

    <div class="controls">
      <div class="dpad">
        <div class="arm h"></div><div class="arm v"></div>
        <div class="pivot"></div><div class="pit"></div>
        <div class="dz" style="left:31px;top:0;width:30px;height:32px" title="Pan up" @click="nudge(0,-1)"></div>
        <div class="dz" style="left:31px;bottom:0;width:30px;height:32px" title="Pan down" @click="nudge(0,1)"></div>
        <div class="dz" style="left:0;top:31px;width:32px;height:30px" title="Pan left" @click="nudge(-1,0)"></div>
        <div class="dz" style="right:0;top:31px;width:32px;height:30px" title="Pan right" @click="nudge(1,0)"></div>
      </div>
      <div class="ab">
        <div class="wrap">
          <div class="ab-unit">
            <button @click="cycleModel(-1)" title="Previous screen"></button>
            <span>B</span>
          </div>
          <div class="ab-unit">
            <button @click="cycleModel(1)" title="Next screen"></button>
            <span>A</span>
          </div>
        </div>
      </div>
    </div>
    <div class="meta-row">
      <div class="ss-unit selectable" title="Display notes" @click="infoOpen = !infoOpen">
        <div class="pill-groove"><div class="pill"></div></div>
        <span>SELECT</span>
      </div>
      <div class="ss-unit" :class="{selectable:isVideo}" :title="isVideo ? (playing ? 'Pause the clip' : 'Play the clip') : ''" @click="pressStart">
        <div class="pill-groove"><div class="pill"></div></div>
        <span>START</span>
      </div>
    </div>
    <div class="speaker" :class="{selectable:isVideo}" :title="isVideo ? 'Toggle chiptune sound' : ''" @click="toggleSound"><div class="grille"></div></div>
  </div>
  </div>

  <!-- Side panel -->
  <div ref="panel" class="w-full lg:w-[440px] flex flex-col gap-6 lg:self-center">
  <!-- Model selector -->
  <div class="w-full">
    <div class="hw-label text-neutral-500 mb-3 text-center">Screen type — press A / B or pick one</div>
    <div class="flex flex-wrap justify-center gap-2">
      <button v-for="(m,i) in models" :key="m.id" class="cart-btn"
              :class="{active: i===modelIndex}" @click="setModel(i)">
        <span class="chip"></span>
        <span class="tag">{{ m.tag }}</span>
        <span class="sub">{{ m.sub }}</span>
      </button>
    </div>
  </div>

  <!-- Shell colour -->
  <div class="w-full">
    <div class="hw-label text-neutral-500 mb-3 text-center">Shell colour — Play It Loud series</div>
    <div class="flex justify-center gap-3">
      <button v-for="s in shells" :key="s.id" class="shell-dot"
              :class="{active: s.id===shellId}" :style="{background:s.dot}"
              :title="s.name" @click="shellId=s.id"></button>
    </div>
  </div>

  <!-- Upload + options -->
  <div class="flex flex-col items-center gap-5">
    <div class="flex flex-col items-center gap-4 w-full">
      <div class="flex flex-wrap justify-center gap-3 w-full">
        <button class="upload-btn flex-1 sm:flex-none" @click="$refs.file.click()">Insert cartridge</button>
        <button class="upload-btn save-btn flex-1 sm:flex-none" @click="download">Save screenshot</button>
      </div>
      <div class="flex flex-wrap justify-center gap-3 w-full">
        <button class="upload-btn all-btn flex-1 sm:flex-none" title="One PNG with every screen type, side by side" @click="saveAll('row')">Save all × 7 →</button>
        <button class="upload-btn all-btn flex-1 sm:flex-none" title="One PNG with every screen type, stacked" @click="saveAll('col')">Save all × 7 ↓</button>
      </div>
      <div v-if="isVideo" class="flex flex-wrap justify-center gap-3 w-full">
        <button class="upload-btn all-btn flex-1 sm:flex-none" :disabled="gifBusy || webmBusy"
                title="Animated GIF of the current screen — first 10s at 15fps" @click="exportGif">
          {{ gifBusy ? 'Rendering ' + gifProgress + '%' : 'Save clip (GIF)' }}
        </button>
        <button class="upload-btn all-btn flex-1 sm:flex-none" :disabled="webmBusy || gifBusy"
                title="WebM video with chiptune sound — records in real time, first 10s" @click="exportWebm">
          {{ webmBusy ? 'Recording ' + webmProgress + '%' : 'Save clip (WebM)' }}
        </button>
      </div>
      <div class="opt-row">
        <div class="toggle opt" :class="{on:dither}" @click="dither=!dither" v-show="current.mono">
          <span class="hw-label text-neutral-500">Dither</span>
          <div class="slot"></div>
        </div>
        <div class="toggle opt" :class="{on:grid}" @click="grid=!grid">
          <span class="hw-label text-neutral-500">Pixel grid</span>
          <div class="slot"></div>
        </div>
        <div class="toggle opt" :class="{on:soundOn}" @click="toggleSound" v-show="isVideo">
          <span class="hw-label text-neutral-500">Sound</span>
          <div class="slot"></div>
        </div>
      </div>
    </div>
    <div class="text-[10px] text-neutral-400 tracking-wider">
      {{ current.full }} · {{ current.res[0] }}×{{ current.res[1] }} · {{ current.mono ? '4 shades' : '15-bit colour' }}{{ dial ? ' · contrast ' + fmt(dial) : '' }}
    </div>
    <div class="text-[10px] text-neutral-400 tracking-wider">
      {{ isVideo ? 'START or spacebar: play / pause · D-pad moves the frame · SELECT for notes' : 'D-pad or arrow keys to move the image · press SELECT for display notes' }}
    </div>
  </div>
  </div>

  <input ref="file" type="file" accept="image/*,video/*" class="hidden" @change="onFile">

  <!-- drop overlay -->
  <div v-if="dragging" class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
       style="background:rgba(233,231,225,.9)">
    <div class="hw-label text-neutral-600" style="font-size:14px">Release to load</div>
  </div>

  <!-- mobile scroll hint: more machine below -->
  <transition name="hint-fade">
    <button v-if="showScrollHint && !infoOpen" class="scroll-hint lg:hidden" @click="scrollToPanel">
      <span class="scroll-hint-bounce">▼ CONFIG</span>
    </button>
  </transition>

  <!-- display-notes side panel -->
  <transition name="slide">
    <aside v-if="infoOpen" class="info-panel">
      <div class="flex items-start justify-between">
        <div>
          <div class="hw-label" style="color:#8a877c">
            <span class="panel-led" :style="{background: current.led, boxShadow: '0 0 6px 1px ' + current.led}"></span>{{ current.tag }} · {{ current.sub }} · {{ current.res[0] }}×{{ current.res[1] }}
          </div>
          <h2 class="text-xl font-extrabold mt-1" style="color:#2e2e34">{{ current.full }}</h2>
        </div>
        <button class="close-btn" title="Close (ESC)" @click="infoOpen=false">×</button>
      </div>

      <div class="info-sec">
        <div class="sec-title">The real panel</div>
        <p v-for="t in current.traits" :key="t" class="info-p trait">{{ t }}</p>
      </div>

      <div class="info-sec">
        <div class="sec-title">How this app reproduces it</div>
        <p class="info-p">{{ current.sim }}</p>
        <div v-if="current.mono" class="pal-row">
          <div v-for="p in current.palette" :key="p.join()" class="pal-chip">
            <span class="swatch" :style="{background: rgb(p)}"></span>
            <span class="hex">{{ hex(p) }}</span>
          </div>
        </div>
        <div v-else class="grade-grid">
          <div><span>Brightness</span><b>{{ fmt(current.grade.b) }}</b></div>
          <div><span>Contrast</span><b>×{{ current.grade.c }}</b></div>
          <div><span>Saturation</span><b>×{{ current.grade.s }}</b></div>
          <div v-if="current.grade.wash"><span>Frontlit wash</span><b>{{ Math.round(current.grade.wash[3]*100) }}%</b></div>
        </div>
      </div>

      <div class="info-sec">
        <div class="sec-title">Render pipeline</div>
        <div class="pipe">
          <div>Cover-fit the photo and downscale to 160×144 with high-quality smoothing</div>
          <div>{{ current.mono ? 'Per pixel: luminance → 4×4 Bayer ordered dither → snap to 4 palette levels' : 'Per pixel: crush each channel to 5-bit (32 steps) → apply the panel grade' }}</div>
          <div>Nearest-neighbour upscale ×4 via <code>image-rendering: pixelated</code></div>
          <div>Draw the LCD pixel-gap grid{{ current.glow ? ' and the EL backlight bloom' : '' }} over the frame</div>
        </div>
      </div>

      <div class="info-sec panel-tip text-[10px] tracking-wider text-neutral-500">
        Tip: switch screen types while this panel is open — the notes follow the unit.
      </div>
    </aside>
  </transition>
</div>
</div>
</template>

<script>
import { nextTick } from 'vue';
import { MODELS, SHELLS } from './data/models.js';
import { SOUND } from './config/sound.js';
import { BAYER, clamp } from './utils.js';
import GifWorker from './workers/gifWorker.js?worker';
import crushUrl from './workers/crushWorklet.js?url';

export default {
  data(){
    return {
      models: MODELS,
      modelIndex: 0,
      powerOn: true,
      dither: true,
      grid: true,
      dragging: false,
      panX: 0,
      panY: 0,
      infoOpen: false,
      shells: SHELLS,
      shellId: 'gray',
      dial: 0,
      booting: false,
      source: null,
      isVideo: false,
      playing: false,
      showScrollHint: false,
      gifBusy: false,
      gifProgress: 0,
      soundOn: false,
      webmBusy: false,
      webmProgress: 0,
    };
  },
  computed:{
    current(){ return this.models[this.modelIndex]; },
    shellVars(){
      const t = this.shells.find(s => s.id === this.shellId) || this.shells[0];
      return {
        '--led-color': this.current.led,
        '--sh-hi': t.hi, '--sh-mid': t.mid, '--sh-lo': t.lo,
        '--sh-ink': t.ink, '--sh-ink2': t.ink2,
        '--ab': t.ab, '--ab-hi': t.abHi,
        '--wh1': t.wh1, '--wh2': t.wh2,
      };
    },
  },
  watch:{
    modelIndex(){ this.render(); },
    dither(){ this.render(); },
    grid(){ this.render(); },
    dial(){ this.render(); },
    powerOn(on){
      if (on) this.startBoot();
      else {
        // powering down mid-clip pauses it; the boot sequence resumes it
        this.wasPlaying = this.isVideo && this.playing;
        if (this.isVideo && this.source && this.playing) this.source.pause();
        this.booting = false; cancelAnimationFrame(this.raf); this.render();
      }
    },
  },
  mounted(){
    this.source = this.makeSample();
    nextTick(() => this.startBoot());
    window.addEventListener('keydown', this.onKey);
    // mobile: nudge users toward the config panel until it scrolls into view
    if (window.matchMedia('(max-width:1023px)').matches){
      this.scrollObs = new IntersectionObserver(entries => {
        this.showScrollHint = !entries[0].isIntersecting;
      }, { threshold: 0.05 });
      nextTick(() => { if (this.$refs.panel) this.scrollObs.observe(this.$refs.panel); });
    }
  },
  beforeUnmount(){
    window.removeEventListener('keydown', this.onKey);
    if (this.scrollObs) this.scrollObs.disconnect();
    this.clearMedia();
    if (this.audioCtx) this.audioCtx.close().catch(() => {});
  },
  methods:{
    togglePower(){ this.powerOn = !this.powerOn; },
    pressStart(){
      // START belongs to the clip now — with a photo loaded it's decorative, like real hardware
      if (this.isVideo) this.togglePlay();
    },
    scrollToPanel(){
      if (this.$refs.panel) this.$refs.panel.scrollIntoView({ behavior:'smooth', block:'start' });
    },
    togglePlay(){
      if (!this.isVideo || !this.source) return;
      if (this.source.paused) this.source.play().catch(() => {});
      else this.source.pause();
    },
    onVideoPlay(){
      this.playing = true;
      this.videoLoopOn = false; // allow a fresh loop even if a stale flag lingered
      this.startVideoLoop();
    },
    onVideoPause(){
      this.playing = false;
      this.videoLoopOn = false;
    },
    startVideoLoop(){
      if (this.videoLoopOn) return;
      this.videoLoopOn = true;
      const step = () => {
        if (!this.isVideo || !this.source || this.source.paused || this.source.ended){
          this.videoLoopOn = false;
          return;
        }
        this.render();
        if (this.source.requestVideoFrameCallback) this.source.requestVideoFrameCallback(step);
        else requestAnimationFrame(step);
      };
      step();
    },
    clearMedia(){
      if (this.isVideo && this.source){
        this.source.pause();
        this.source.removeEventListener('play', this.onVideoPlay);
        this.source.removeEventListener('pause', this.onVideoPause);
        this.source.removeAttribute('src');
        this.source.load();
      }
      if (this.mediaUrl){ URL.revokeObjectURL(this.mediaUrl); this.mediaUrl = null; }
      this.playing = false;
      this.videoLoopOn = false;
    },
    setModel(i){ this.modelIndex = i; },
    cycleModel(d){
      this.modelIndex = (this.modelIndex + d + this.models.length) % this.models.length;
    },
    resetPan(){ this.panX = 0; this.panY = 0; },
    dialStart(e){
      const startY = e.clientY, startV = this.dial;
      const move = ev => {
        this.dial = Math.max(-60, Math.min(60, Math.round(startV + (ev.clientY - startY) * 0.6)));
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    dialScroll(e){
      this.dial = Math.max(-60, Math.min(60, Math.round(this.dial - e.deltaY * 0.08)));
    },

    /* --- boot sequence: logo sweep + chime, then the image --- */
    startBoot(){
      if (!this.source){ this.render(); return; }
      this.booting = true;
      this.chimed = false;
      this.t0 = performance.now();
      const step = now => {
        if (!this.booting) return;
        const t = (now - this.t0) / 1000;
        this.drawBoot(t);
        if (t < 2.1) this.raf = requestAnimationFrame(step);
        else {
          this.booting = false; this.render();
          if (this.wasPlaying && this.isVideo && this.source){
            this.wasPlaying = false;
            this.source.play().catch(() => {});
          }
        }
      };
      this.raf = requestAnimationFrame(step);
    },
    drawBoot(t){
      const cv = this.$refs.screen;
      if (!cv) return;
      const m = this.current;
      const W = m.res[0], H = m.res[1], S = m.scale;
      cv.width = W*S; cv.height = H*S;
      const ctx = cv.getContext('2d');
      const bg = m.mono ? this.rgb(m.palette[3]) : '#f4f4f2';
      const fg = m.mono ? this.rgb(m.palette[0]) : '#151517';
      ctx.fillStyle = bg; ctx.fillRect(0,0,cv.width,cv.height);
      const ease = 1 - Math.pow(1 - Math.min(t/0.9, 1), 3);
      const y = -cv.height*0.25 + (cv.height/2 + cv.height*0.25) * ease;
      const cap = Math.round(cv.height * 0.11);
      ctx.fillStyle = fg;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'italic 900 ' + cap + 'px "Helvetica Neue", Arial, sans-serif';
      ctx.globalAlpha = t > 1.7 ? Math.max(0, 1 - (t-1.7)/0.4) : 1;
      const logoW = ctx.measureText('Nintendo').width;
      ctx.fillText('Nintendo', cv.width/2, y);
      if (t >= 0.9){
        if (!this.chimed){ this.chimed = true; this.playChime(); }
        ctx.font = 'italic 700 ' + Math.round(cap*0.38) + 'px Arial, sans-serif';
        ctx.fillText('®', cv.width/2 + logoW/2 + cap*0.28, y - cap*0.28);
      }
      ctx.globalAlpha = 1;
    },
    playChime(){
      try{
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!this.ac) this.ac = new AC();
        const ac = this.ac;
        if (ac.state === 'suspended') ac.resume();
        const t0 = ac.currentTime;
        const blip = (freq, at, dur, vol) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = 'square'; o.frequency.value = freq;
          g.gain.setValueAtTime(vol, at);
          g.gain.exponentialRampToValueAtTime(0.001, at + dur);
          o.connect(g); g.connect(ac.destination);
          o.start(at); o.stop(at + dur + 0.02);
        };
        blip(880, t0, 0.09, 0.05);
        blip(1760, t0 + 0.09, 0.35, 0.06);
      }catch(err){ /* audio unavailable — boot stays silent */ }
    },
    rgb(p){ return 'rgb(' + p[0] + ',' + p[1] + ',' + p[2] + ')'; },
    hex(p){ return '#' + p.map(v => v.toString(16).padStart(2,'0')).join(''); },
    fmt(b){ return (b > 0 ? '+' : '') + b; },
    nudge(dx, dy){
      if (!this.powerOn) return;
      this.panX += dx * 6;
      this.panY += dy * 6;
      this.render(); // clamping happens inside render
    },
    onKey(e){
      if (e.key === 'Escape' && this.infoOpen){ this.infoOpen = false; return; }
      if (e.key === ' ' && this.isVideo){ e.preventDefault(); this.togglePlay(); return; }
      const map = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] };
      const d = map[e.key];
      if (d){ e.preventDefault(); this.nudge(d[0], d[1]); }
    },
    download(){
      const cv = this.$refs.screen;
      if (!cv || !this.source) return;
      const m = this.current;
      cv.toBlob(blob => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'gameboy-' + m.id + '-' + m.res[0] + 'x' + m.res[1] + '.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, 'image/png');
    },
    /* --- filmstrip: all seven screens in one PNG --- */
    saveAll(direction = 'row'){
      if (!this.source) return;
      const pad = 24, labelH = 52;
      const vert = direction === 'col';
      const cells = this.models.map(m => {
        const cell = document.createElement('canvas');
        this.paintScreen(cell, m);
        return { m, cell };
      });
      const cw = cells[0].cell.width, ch = cells[0].cell.height;
      const W = vert ? cw + pad * 2 : cells.length * cw + (cells.length + 1) * pad;
      const H = vert ? cells.length * (ch + labelH) + (cells.length + 1) * pad : ch + labelH + pad * 2;
      const strip = document.createElement('canvas');
      strip.width = W; strip.height = H;
      const ctx = strip.getContext('2d');
      ctx.fillStyle = '#e9e7e1'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      cells.forEach(({ m, cell }, i) => {
        const x = vert ? pad : pad + i * (cw + pad);
        const y = vert ? pad + i * (ch + labelH + pad) : pad;
        ctx.drawImage(cell, x, y);
        ctx.fillStyle = '#3a3a40';
        ctx.font = '14px "Press Start 2P", ui-monospace, monospace';
        ctx.fillText(m.tag, x + cw/2, y + ch + 20);
        ctx.fillStyle = '#8a877c';
        ctx.font = '10px "Press Start 2P", ui-monospace, monospace';
        ctx.fillText(m.sub, x + cw/2, y + ch + 40);
      });
      strip.toBlob(blob => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = vert ? 'gameboy-all-7-screens-vertical.png' : 'gameboy-all-7-screens.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, 'image/png');
    },
    /* --- chiptune audio: clip soundtrack through a DMG-style output stage ---
       the trick is to model the Game Boy's SPEAKER, not to mangle the samples:
       anti-alias lowpass -> gentle crush (6-bit grain, no noise blanket)
       -> asymmetric soft drive (pulse-wave-ish harmonics) -> compression
       -> tiny-speaker bandpass (no bass, nasal 1.4kHz buzz, 3.8kHz top end)
       -> gain -> speakers (user-controlled), plus an always-live recording tap */
    async ensureAudio(){
      if (!this.isVideo || !this.source) return false;
      try {
        if (!this.audioCtx){
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return false;
          this.audioCtx = new AC();
          await this.audioCtx.audioWorklet.addModule(crushUrl);
          // every tunable value lives in src/config/sound.js
          this.crush = new AudioWorkletNode(this.audioCtx, 'gb-crush');
          this.crush.parameters.get('bits').value = SOUND.bits;
          this.crush.parameters.get('hold').value = SOUND.hold;

          // anti-alias: bandlimit before the sample-and-hold so highs don't
          // fold back down as metallic noise
          this.preLPF = this.audioCtx.createBiquadFilter();
          this.preLPF.type = 'lowpass';
          this.preLPF.frequency.value = SOUND.preLpf;
          this.preLPF.Q.value = 0.7;

          // asymmetric soft drive: even+odd harmonics, like a pulse channel
          this.shaper = this.audioCtx.createWaveShaper();
          const curve = new Float32Array(512);
          let peak = 0;
          for (let i = 0; i < 512; i++){
            const x = i/255.5 - 1;
            curve[i] = Math.tanh(SOUND.drive*(x + SOUND.asym)) - Math.tanh(SOUND.drive*SOUND.asym);
            peak = Math.max(peak, Math.abs(curve[i]));
          }
          for (let i = 0; i < 512; i++) curve[i] = curve[i] / peak * 0.9;
          this.shaper.curve = curve;

          // chip music is flat and loud
          this.comp = this.audioCtx.createDynamicsCompressor();
          this.comp.threshold.value = SOUND.comp.threshold;
          this.comp.knee.value = SOUND.comp.knee;
          this.comp.ratio.value = SOUND.comp.ratio;
          this.comp.attack.value = SOUND.comp.attack;
          this.comp.release.value = SOUND.comp.release;

          // the 3.3cm speaker: no bass, a nasal buzz band, soft top end
          this.hpf = this.audioCtx.createBiquadFilter();
          this.hpf.type = 'highpass';
          this.hpf.frequency.value = SOUND.hpf;
          this.buzz = this.audioCtx.createBiquadFilter();
          this.buzz.type = 'peaking';
          this.buzz.frequency.value = SOUND.buzz.freq;
          this.buzz.Q.value = SOUND.buzz.q;
          this.buzz.gain.value = SOUND.buzz.gain;
          this.lowpass = this.audioCtx.createBiquadFilter();
          this.lowpass.type = 'lowpass';
          this.lowpass.frequency.value = SOUND.lpf;

          this.audioGain = this.audioCtx.createGain();
          this.audioGain.gain.value = 0;
          this.audioTap = this.audioCtx.createMediaStreamDestination();
          this.preLPF.connect(this.crush);
          this.crush.connect(this.shaper);
          this.shaper.connect(this.comp);
          this.comp.connect(this.hpf);
          this.hpf.connect(this.buzz);
          this.buzz.connect(this.lowpass);
          this.lowpass.connect(this.audioGain);
          this.audioGain.connect(this.audioCtx.destination);
          this.lowpass.connect(this.audioTap);  // WebM recording taps here
        }
        if (this.audioSrcEl !== this.source){
          if (this.audioSrc) this.audioSrc.disconnect();
          this.audioSrc = this.audioCtx.createMediaElementSource(this.source);
          this.audioSrc.connect(this.preLPF);
          this.audioSrcEl = this.source;
          // once routed through the graph, element.muted gates the graph input
          this.source.muted = !this.soundOn;
        }
        return true;
      } catch(err){
        return false;
      }
    },
    async toggleSound(){
      if (!this.isVideo) return;
      const ok = await this.ensureAudio();
      this.soundOn = !this.soundOn;
      if (ok){
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume().catch(() => {});
        this.audioGain.gain.value = this.soundOn ? 1 : 0;
        this.source.muted = !this.soundOn;
      }
    },

    /* --- GIF export: deterministic offline render, encoded in a worker --- */
    async exportGif(){
      if (!this.isVideo || !this.source || this.gifBusy || this.webmBusy || this.booting) return;
      const src = this.source;
      const m = this.current;
      const FPS = 15, MAXDUR = 10, S = 2;   // 320×288 output — crisp but shareable
      const W = m.res[0]*S, H = m.res[1]*S;
      const dur = Math.min(src.duration || 0, MAXDUR);
      if (!dur) return;

      this.gifBusy = true; this.gifProgress = 0;
      const wasPlaying = this.playing;
      const t0 = src.currentTime;
      if (wasPlaying) src.pause();

      const worker = new GifWorker();
      const cv = document.createElement('canvas');
      const seekTo = t => new Promise(res => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          src.removeEventListener('seeked', finish);
          res();
        };
        src.addEventListener('seeked', finish);
        src.currentTime = t;
        setTimeout(finish, 600); // safety net if 'seeked' never fires
      });
      const grab = () => {
        this.paintScreen(cv, m, src, S);
        return cv.getContext('2d').getImageData(0, 0, W, H);
      };

      try {
        worker.postMessage({ type:'start', width: W, height: H });
        // shared palette sampled across the clip — no per-frame quantize flicker
        const s1 = (await seekTo(0), grab().data.buffer);
        const s2 = (await seekTo(dur/2), grab().data.buffer);
        const s3 = (await seekTo(Math.max(0, dur - 1/FPS)), grab().data.buffer);
        worker.postMessage({ type:'palette', frames: [s1, s2, s3] }, [s1, s2, s3]);

        const frames = Math.max(1, Math.round(dur * FPS));
        for (let i = 0; i < frames; i++){
          await seekTo(Math.min(i / FPS, dur - 0.001));
          const g = grab();
          worker.postMessage(
            { type:'frame', data: g.data.buffer, delay: Math.round(1000/FPS), first: i === 0 },
            [g.data.buffer]
          );
          this.gifProgress = Math.round(((i + 1) / frames) * 95);
        }

        const buffer = await new Promise(res => {
          worker.onmessage = e => { if (e.data.type === 'done') res(e.data.buffer); };
          worker.postMessage({ type:'end' });
        });
        this.gifProgress = 100;

        const blob = new Blob([buffer], { type:'image/gif' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'gameboy-' + m.id + '-clip.gif';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      } finally {
        worker.terminate();
        this.gifBusy = false;
        src.currentTime = t0;          // put the playhead back where the user left it
        if (wasPlaying) src.play().catch(() => {});
        else this.render();
      }
    },
    /* --- WebM export: real-time recording of the live screen + chiptune audio --- */
    async exportWebm(){
      if (!this.isVideo || !this.source || this.webmBusy || this.gifBusy || this.booting) return;
      const src = this.source;
      const cv = this.$refs.screen;
      const dur = Math.min(src.duration || 0, 10);
      if (!dur || !cv || !cv.captureStream || !window.MediaRecorder) return;
      const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
        .find(c => MediaRecorder.isTypeSupported(c));
      if (!mime) return;

      this.webmBusy = true; this.webmProgress = 0;
      const wasPlaying = this.playing;
      const t0 = src.currentTime;
      const wasMuted = src.muted;
      if (wasPlaying) src.pause();

      let rec = null, timer = null;
      try {
        const audioOk = await this.ensureAudio();
        const stream = cv.captureStream(30);
        const tracks = [...stream.getVideoTracks()];
        if (audioOk && this.audioTap){
          if (this.audioCtx.state === 'suspended') await this.audioCtx.resume().catch(() => {});
          src.muted = false;  // feed the graph — speaker gain may still be 0
          tracks.push(...this.audioTap.stream.getAudioTracks());
        }
        rec = new MediaRecorder(new MediaStream(tracks), {
          mimeType: mime,
          videoBitsPerSecond: 2500000,
          audioBitsPerSecond: 96000,
        });
        const chunks = [];
        rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
        const stopped = new Promise(res => { rec.onstop = res; });

        // record from the top of the clip, in real time — what you watch is what you get
        await new Promise(r => {
          let done = false;
          const finish = () => { if (!done){ done = true; src.removeEventListener('seeked', finish); r(); } };
          src.addEventListener('seeked', finish);
          src.currentTime = 0;
          setTimeout(finish, 600);
        });
        rec.start(250);
        await src.play().catch(() => {});
        timer = setInterval(() => {
          this.webmProgress = Math.min(99, Math.round(src.currentTime / dur * 100));
          if (src.currentTime >= dur - 0.08){
            clearInterval(timer); timer = null;
            src.pause();
            rec.stop();
          }
        }, 100);
        await stopped;
        this.webmProgress = 100;

        const blob = new Blob(chunks, { type:'video/webm' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'gameboy-' + this.current.id + '-clip.webm';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      } finally {
        if (timer) clearInterval(timer);
        if (rec && rec.state !== 'inactive'){ try{ rec.stop(); }catch(e){} }
        this.webmBusy = false;
        src.muted = wasMuted;
        src.currentTime = t0;
        if (wasPlaying) src.play().catch(() => {});
        else this.render();
      }
    },
    onFile(e){
      const f = e.target.files[0];
      if (f) this.loadFile(f);
      e.target.value = '';
    },
    onDrop(e){
      this.dragging = false;
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f && (f.type.startsWith('image/') || f.type.startsWith('video/'))) this.loadFile(f);
    },
    loadFile(file){
      if (file.type.startsWith('video/')){ this.loadVideo(file); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        this.clearMedia();
        this.isVideo = false;
        this.source = img; this.resetPan(); this.render();
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    loadVideo(file){
      const url = URL.createObjectURL(file);
      const v = document.createElement('video');
      v.muted = true;      // silent for now — sound design arrives with the export phase
      v.loop = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.addEventListener('play', this.onVideoPlay);
      v.addEventListener('pause', this.onVideoPause);
      v.addEventListener('loadeddata', () => {
        this.clearMedia();          // release the previous source first
        this.isVideo = true;
        this.source = v;
        this.mediaUrl = url;        // keep the blob URL alive while the clip plays
        this.resetPan();
        this.render();              // first frame immediately, then motion
        if (this.audioCtx) this.ensureAudio();  // re-hook the new clip element
        v.play().catch(() => {});   // muted autoplay is allowed everywhere
      });
      v.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        alert("This clip's format isn't supported by your browser — try an MP4 (H.264).");
      });
      v.src = url;
    },

    /* --- default "pack-in" artwork so the unit isn't blank --- */
    makeSample(){
      const c = document.createElement('canvas');
      c.width = 480; c.height = 432;
      const x = c.getContext('2d');
      const bands = ['#7ec8e3','#8fd0e8','#a2d8ec','#b6e0f0','#cbe8f4'];
      bands.forEach((col,i)=>{ x.fillStyle=col; x.fillRect(0, i*48, 480, 48); });
      x.fillStyle = '#ffd94a';
      x.beginPath(); x.arc(372, 84, 40, 0, Math.PI*2); x.fill();
      x.fillStyle = '#ffe98a';
      x.beginPath(); x.arc(364, 76, 26, 0, Math.PI*2); x.fill();
      x.fillStyle = '#f4f8fa';
      [[80,70,54],[140,58,40],[250,96,46],[60,120,36]].forEach(([cx,cy,r])=>{
        x.beginPath(); x.arc(cx,cy,r,0,Math.PI*2); x.arc(cx+r*.9,cy+8,r*.7,0,Math.PI*2); x.arc(cx-r*.9,cy+10,r*.65,0,Math.PI*2); x.fill();
      });
      x.fillStyle = '#5d8a6e';
      x.beginPath(); x.moveTo(0,300); x.lineTo(120,180); x.lineTo(240,300); x.closePath(); x.fill();
      x.fillStyle = '#4c755c';
      x.beginPath(); x.moveTo(150,300); x.lineTo(300,150); x.lineTo(450,300); x.closePath(); x.fill();
      x.fillStyle = '#e8f0ea';
      x.beginPath(); x.moveTo(300,150); x.lineTo(268,196); x.lineTo(292,188); x.lineTo(306,202); x.lineTo(330,186); x.closePath(); x.fill();
      x.fillStyle = '#6fae4f'; x.fillRect(0, 300, 480, 70);
      x.fillStyle = '#3f7fbf'; x.fillRect(0, 370, 480, 62);
      x.fillStyle = '#5c9bd6';
      for(let i=0;i<8;i++) x.fillRect(20+i*60, 384+(i%3)*14, 34, 5);
      const px = 8, ox = 216, oy = 300;
      const P = (gx,gy,w,h,col)=>{ x.fillStyle=col; x.fillRect(ox+gx*px, oy+gy*px, w*px, h*px); };
      P(1,0,3,1,'#c03028'); P(0,1,5,1,'#c03028');
      P(1,1,4,2,'#f0c8a0');
      P(2,1,1,1,'#2a2a30');
      P(1,3,3,3,'#2a4a8c');
      P(0,3,1,2,'#f0c8a0'); P(4,3,1,2,'#f0c8a0');
      P(1,6,1,2,'#3a3a40'); P(3,6,1,2,'#3a3a40');
      return c;
    },

    render(){
      if (this.booting) return;
      const cv = this.$refs.screen;
      if (!cv || !this.source) return;
      if (!this.powerOn){
        const m = this.current;
        cv.width = m.res[0]*m.scale; cv.height = m.res[1]*m.scale;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0,0,cv.width,cv.height);
        return;
      }
      this.paintScreen(cv, this.current);
    },
    paintScreen(cv, m, src, S){
      src = src || this.source;
      S = S || m.scale;
      const W = m.res[0], H = m.res[1];

      // 1. cover-fit source into a tiny native-res buffer
      const buf = document.createElement('canvas');
      buf.width = W; buf.height = H;
      const bx = buf.getContext('2d');
      const sw = this.isVideo ? src.videoWidth : src.width;
      const sh = this.isVideo ? src.videoHeight : src.height;
      if (!sw || !sh) return;
      const scale = Math.max(W/sw, H/sh);
      const dw = sw*scale, dh = sh*scale;
      const baseX = (W-dw)/2, baseY = (H-dh)/2;
      // clamp pan so the image always covers the full screen — no blank space
      let offX = baseX + this.panX, offY = baseY + this.panY;
      offX = dw > W ? Math.min(0, Math.max(W-dw, offX)) : baseX;
      offY = dh > H ? Math.min(0, Math.max(H-dh, offY)) : baseY;
      this.panX = offX - baseX; this.panY = offY - baseY;
      bx.imageSmoothingEnabled = true;
      bx.imageSmoothingQuality = 'high';
      bx.drawImage(src, offX, offY, dw, dh);
      const img = bx.getImageData(0,0,W,H);
      const d = img.data;

      // 2. contrast dial pre-pass (like the LCD voltage wheel)
      if (this.dial){
        const f = 1 + this.dial/140, off = this.dial * 0.5;
        for (let p=0;p<d.length;p+=4){
          d[p]   = clamp((d[p]-128)*f + 128 + off);
          d[p+1] = clamp((d[p+1]-128)*f + 128 + off);
          d[p+2] = clamp((d[p+2]-128)*f + 128 + off);
        }
      }

      // 3. per-model colour science
      if (m.mono){
        const pal = m.palette;
        for (let y=0;y<H;y++) for (let xx=0;xx<W;xx++){
          const i = (y*W+xx)*4;
          let lum = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
          if (this.dither) lum += ((BAYER[y&3][xx&3] + 0.5) / 16 - 0.5) * 72;
          let lvl = Math.floor(lum / 256 * 4);
          lvl = lvl < 0 ? 0 : lvl > 3 ? 3 : lvl;
          d[i]=pal[lvl][0]; d[i+1]=pal[lvl][1]; d[i+2]=pal[lvl][2]; d[i+3]=255;
        }
      } else {
        const g = m.grade;
        for (let p=0;p<d.length;p+=4){
          let r=(d[p]>>3)<<3, gg=(d[p+1]>>3)<<3, b=(d[p+2]>>3)<<3;
          r=(r-128)*g.c+128+g.b; gg=(gg-128)*g.c+128+g.b; b=(b-128)*g.c+128+g.b;
          const l=0.299*r+0.587*gg+0.114*b;
          r=l+(r-l)*g.s; gg=l+(gg-l)*g.s; b=l+(b-l)*g.s;
          if (g.wash){ const a=g.wash[3];
            r=r*(1-a)+g.wash[0]*a; gg=gg*(1-a)+g.wash[1]*a; b=b*(1-a)+g.wash[2]*a;
          }
          d[p]=clamp(r); d[p+1]=clamp(gg); d[p+2]=clamp(b); d[p+3]=255;
        }
      }
      bx.putImageData(img,0,0);

      // 3. upscale to the lens, pixel-perfect
      cv.width = W*S; cv.height = H*S;
      const ctx = cv.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf,0,0,W*S,H*S);

      // 4. LCD pixel-gap grid
      if (this.grid){
        const ink = m.gridInk || [0,0,0];
        ctx.fillStyle = 'rgba(' + ink[0] + ',' + ink[1] + ',' + ink[2] + ',0.16)';
        for (let gx=1; gx<W; gx++) ctx.fillRect(gx*S, 0, 1, H*S);
        for (let gy=1; gy<H; gy++) ctx.fillRect(0, gy*S, W*S, 1);
      }
      if (m.glow){
        ctx.fillStyle = m.glow;
        ctx.fillRect(0,0,cv.width,cv.height);
      }
    },
  },
}
</script>
