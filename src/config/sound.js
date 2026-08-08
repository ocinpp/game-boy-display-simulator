/* ============================================================
   SOUND TUNING KNOBS — the chiptune chain
   ============================================================
   Everything that shapes how clips sound lives here.
   Change a number, save, reload the page — that's it.

   Quick mental model: digital sound is a list of numbers,
   48,000 per second, each saying how far to push the speaker.
   These knobs mess with those numbers in different ways.

   CHEAT SHEET
     Too noisy/fizzy      -> bits UP        (or hold DOWN)
     Too clean, boring    -> bits DOWN      (or drive UP)
     Not Game Boy enough  -> asym UP        (or buzz.gain UP)
     Harsh / piercing     -> lpf DOWN       (e.g. 3200)
     Too thin / tinny     -> hpf DOWN       (e.g. 180)
   ============================================================ */

export const SOUND = {

  /* "Shades of loudness" — like the DMG's 4 shades of green, but for volume.
     Normal audio has ~65,000 fine levels; this rounds to 2^bits levels,
     turning the smooth wave into a staircase. The rounding error is the grit.
       4  = 16 levels — heavy noise blanket (how it used to sound)
       6  = 64 levels — grain you feel more than hear   <-- sweet spot
       8+ = almost clean                                */
  bits: 6,

  /* "Frame rate for sound" — keeps each number for N slots, so the wave
     updates slower and detail gets stepped/smeared (60fps -> 20fps vibe).
       1  = off
       3  = subtle smear                                <-- current
       5+ = choppy broken-cassette territory            */
  hold: 3,

  /* Smoothing before the step-down (Hz) — the anti-aliasing pass, same idea
     as smoothing a photo before shrinking it. Cuts icy top-end so `hold`
     doesn't fold it back down as fake metallic ringing.                  */
  preLpf: 3400,

  /* Buzz intensity — the CONTRAST wheel abused on purpose: push the wave
     too loud, then softly squash the peaks. The squashed peaks ARE the growl.
       lower = polite and warm, higher = angry fuzz     */
  drive: 1.6,

  /* Hollow pulse-channel character — squashes the top of the wave more than
     the bottom, adding the nasal/kazoo hollowness of Game Boy lead melodies.
       0    = symmetric square-ish fuzz
       0.12 = gentle hollowness                         <-- current
       0.3+ = very hollow                               */
  asym: 0.12,

  /* Compressor — an auto-volume hand: loud parts get turned down so quiet
     and loud end up similar. Chip music is flat and confident, like this. */
  comp: {
    threshold: -20,   // dB where the squash starts (lower = more squashed)
    knee: 15,         // softness of the squash onset
    ratio: 3,         // how hard loud parts are turned down
    attack: 0.003,    // seconds to react
    release: 0.15,    // seconds to let go
  },

  /* The tiny 3.3cm plastic speaker, in three EQ moves: */

  hpf: 280,         /* bass cut (Hz) — small speakers can't do bass, so
                       removing it is instantly "handheld".
                       lower (e.g. 180) = fuller; higher = tinnier        */

  buzz: {           /* the nasal "bzzzt" band where the speaker resonates */
    freq: 1400,     // centre of the buzz (Hz)
    q: 1.1,         // width of the band (higher = narrower)
    gain: 3,        // dB boost — more = more Game Boy honk
  },

  lpf: 3800,        /* top rolloff (Hz) — small speakers don't sparkle.
                       lower (e.g. 3200) = darker/softer, through more plastic */
};
