import { useEffect, useRef } from 'react';

export default function AmbientSynthesizer() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const startAtmosphere = () => {
    // 1. INITIALIZE CONTEXT FIRST
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    // 2. CREATE MASTER EFFECTS CHAIN (Reverb/Delay)
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.5; 
    const feedback = ctx.createGain();
    feedback.gain.value = 0.6; 

    // Connect delay loop
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(ctx.destination);

    // 3. CREATE NOISE (The "Wind")
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400; 
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, ctx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 4);

    // 4. THE "BREATHING" LFO (Modulates the filter)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; 
    lfoGain.gain.value = 100; 
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // Connect Noise to Effects
    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(delay); // Send wind to reverb
    noiseGain.connect(ctx.destination); // Send wind to speakers
    whiteNoise.start();

    // 5. CREATE THE ZEN DRONE (The Chord)
    const chord = [65.41, 98.00, 130.81, 164.81]; 

    chord.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = Math.random() * 10 - 5; 

      oscGain.gain.setValueAtTime(0, ctx.currentTime);
      oscGain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 5 + index);

      osc.connect(oscGain);
      oscGain.connect(delay); // Send chord to reverb
      osc.start();
    });
  };

  useEffect(() => {
    window.addEventListener('click', startAtmosphere, { once: true });
    return () => window.removeEventListener('click', startAtmosphere);
  }, []);

  return null;
}