export function createAudio() {
  return {context:null,enabled:true,engine:null,engineGain:null,filter:null,lastEvent:0,noise:null};
}
export function startAudio(a) {
  if(!a.context) {
    const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
    a.context=new Context();
    a.engine=a.context.createOscillator();a.engine.type='sawtooth';
    a.filter=a.context.createBiquadFilter();a.filter.type='lowpass';a.filter.frequency.value=250;
    a.engineGain=a.context.createGain();a.engineGain.gain.value=0;
    a.engine.connect(a.filter);a.filter.connect(a.engineGain);a.engineGain.connect(a.context.destination);a.engine.start();
    a.noise=a.context.createBuffer(1,a.context.sampleRate*.45,a.context.sampleRate);
    const d=a.noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/d.length*5);
  }
  if(a.context.state==='suspended')a.context.resume();
}
export function updateAudio(a,s,paused) {
  if(!a.context)return;
  const i=s.controlled,t=a.context.currentTime,active=a.enabled&&!paused&&i>=0&&s.health[i]>0;
  const speed=i>=0?Math.abs(s.speed[i]):0,gear=Math.floor(speed/11);
  const rpm=active?35+(speed-gear*11)*5+Math.abs(s.inputForward)*13:30;
  a.engine.frequency.setTargetAtTime(rpm,t,.08);a.filter.frequency.setTargetAtTime(180+speed*10,t,.1);
  a.engineGain.gain.setTargetAtTime(active?.033+Math.abs(s.inputForward)*.022:0,t,.12);
  if(s.eventId!==a.lastEvent){a.lastEvent=s.eventId;if(a.enabled&&!paused&&(s.eventType===3||s.eventType===4))crashSound(a,s.eventStrength);}
}
function crashSound(a,power) {
  const source=a.context.createBufferSource(),gain=a.context.createGain(),filter=a.context.createBiquadFilter();
  source.buffer=a.noise;filter.type='lowpass';filter.frequency.value=950;gain.gain.value=Math.min(.35,power*.012);
  source.connect(filter);filter.connect(gain);gain.connect(a.context.destination);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
}
export function horn(a) {
  if(!a.enabled)return;startAudio(a);if(!a.context)return;
  const osc=a.context.createOscillator(),gain=a.context.createGain(),t=a.context.currentTime;
  osc.type='square';osc.frequency.value=330;gain.gain.setValueAtTime(.035,t);gain.gain.exponentialRampToValueAtTime(.001,t+.3);
  osc.connect(gain);gain.connect(a.context.destination);osc.start(t);osc.stop(t+.32);osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
