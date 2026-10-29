export class AudioBus{
  play(enabled,kind='build'){
    if(!enabled)return;
    try{this.context??=new(window.AudioContext||window.webkitAudioContext)();const ctx=this.context;ctx.resume();const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(kind==='reward'?660:420,ctx.currentTime);oscillator.frequency.exponentialRampToValueAtTime(kind==='reward'?990:560,ctx.currentTime+.12);gain.gain.setValueAtTime(.04,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.2);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+.22);}catch{}
  }
}
