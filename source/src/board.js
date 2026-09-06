import * as THREE from 'three';
import { buildWorld } from './world.js';
import { createCar, createPlayer } from './vehicles.js';
import { createAudio, startAudio, updateAudio, horn } from './audio.js';
import * as Logic from './logic.js';

const TAU=Math.PI*2;
const diff=(a,b)=>((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const $=id=>document.getElementById(id);

export function createBoard(s,b) {
  const renderer=new THREE.WebGLRenderer({canvas:$('game'),antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xc0dddb);scene.fog=new THREE.Fog(0xc0dddb,150,400);
  const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.15,740);
  const hemi=new THREE.HemisphereLight(0xc6e4e9,0xbba277,2.1);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffd5a0,3.35);sun.position.set(-100,82,65);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-86;sun.shadow.camera.right=86;sun.shadow.camera.top=86;sun.shadow.camera.bottom=-86;sun.shadow.camera.near=1;sun.shadow.camera.far=340;sun.shadow.bias=-.0003;sun.shadow.normalBias=.055;sun.shadow.radius=2;
  scene.add(sun);scene.add(sun.target);
  const world=buildWorld(scene,s.city);
  const cars=[];for(let i=0;i<s.carCount;i++){const car=createCar(b,s.type[i],s.color[i]);scene.add(car.root);cars.push(car);}
  const player=createPlayer();scene.add(player.root);
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.5,2.55,64),new THREE.MeshBasicMaterial({color:0xffefc8,transparent:true,opacity:.7,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.035;scene.add(ring);
  const marker=new THREE.Group();const diamond=new THREE.Mesh(new THREE.OctahedronGeometry(.18),new THREE.MeshBasicMaterial({color:0xffedc9}));marker.add(diamond);scene.add(marker);
  const particleMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true,transparent:true,opacity:.75,depthWrite:false}),b.particleCount);particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);particleMesh.frustumCulled=false;scene.add(particleMesh);
  const skidMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(.19,1),new THREE.MeshBasicMaterial({color:0x354b4b,transparent:true,opacity:.32,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),b.skidCount);skidMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);skidMesh.frustumCulled=false;scene.add(skidMesh);
  const board={renderer,scene,camera,sun,world,cars,player,ring,marker,particleMesh,skidMesh,
    dummy:new THREE.Object3D(),color:new THREE.Color(),look:new THREE.Vector3(),desired:new THREE.Vector3(),target:new THREE.Vector3(s.playerX,1,s.playerZ),cameraAngle:.27,walkAngle:.27,orbit:0,orbitTimer:0,camInitialized:false,
    keys:new Uint8Array(256),paused:false,manual:false,hidden:false,audio:createAudio(),lastEvent:0,lastUI:0,lastSpeed:-1,lastVehicle:-2,lastHealth:-1,lastNearest:-2,lastDistrict:-1,lastTick:0,
    frameCount:0,fps:60,fpsTime:0,uiTime:0,showWelcome:true,pointerDown:false,pointerX:0,pointerMoved:false,
    minimap:$('minimap').getContext('2d'),mapBase:document.createElement('canvas'),mapLocal:document.createElement('canvas'),
    ui:{speed:$('speed'),gear:$('gear'),vehicleClass:$('vehicle-class'),vehicleName:$('vehicle-name'),telemetry:$('telemetry'),condition:$('condition-label'),value:$('condition-value'),fill:$('condition-fill'),interact:$('interaction'),title:$('interact-title'),detail:$('interact-detail'),tip:$('driving-tip'),ticks:document.querySelectorAll('.speed-ticks i'),toast:$('toast')},
  };
  makeMap(board,s,b);attachInput(board,s,b);updateSoundButton(board);
  camera.position.set(s.playerX+13,18,s.playerZ+24);camera.lookAt(s.playerX,1,s.playerZ);
  return board;
}

function dismissWelcome(v) {if(v.showWelcome){v.showWelcome=false;$('welcome').classList.add('dismissed');}}
export function setPaused(v,value,s) {
  v.paused=value;$('pause-overlay').hidden=!value;v.keys.fill(0);s.inputForward=0;s.inputSteer=0;s.inputBrake=0;s.inputRun=0;
  if(value){$('resume').focus();}else{$('game').focus({preventScroll:true});}
}

function updateSoundButton(v){$('sound').setAttribute('aria-label',v.audio.enabled?'Mute sound effects':'Enable sound effects');$('sound').innerHTML=v.audio.enabled?'<svg viewBox="0 0 24 24"><path d="M11 4 6 8H3v8h3l5 4zM15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/></svg>':'<svg viewBox="0 0 24 24"><path d="M11 4 6 8H3v8h3l5 4zM16 9l5 6m0-6-5 6"/></svg>';}
function toggleSound(v){v.audio.enabled=!v.audio.enabled;if(v.audio.enabled)startAudio(v.audio);updateSoundButton(v);}

function attachInput(v,s,b) {
  const codes={KeyW:87,ArrowUp:87,KeyS:83,ArrowDown:83,KeyA:65,ArrowLeft:65,KeyD:68,ArrowRight:68,Space:32,ShiftLeft:16,ShiftRight:16};
  window.addEventListener('keydown',e=>{
    if(e.code in codes){if(!v.paused){v.keys[codes[e.code]]=1;startAudio(v.audio);}e.preventDefault();}
    if(e.repeat)return;
    if(e.code==='Escape'){setPaused(v,!v.paused,s);return;}
    if(e.code==='F2'){e.preventDefault();v.hidden=!v.hidden;$('app').classList.toggle('hide-hud',v.hidden);}
    if(e.code==='KeyM')toggleSound(v);
    if(v.paused)return;
    if(e.code==='KeyE'){Logic.interact(s,b);dismissWelcome(v);startAudio(v.audio);}
    if(e.code==='KeyC'){Logic.setCamera(s,s.cameraMode+1);v.orbit=0;}
    if(e.code==='KeyH'&&s.controlled>=0)horn(v.audio);
    if(e.code==='KeyR')Logic.recover(s,b);
    if(e.code==='Enter'){dismissWelcome(v);startAudio(v.audio);}
  });
  window.addEventListener('keyup',e=>{if(e.code in codes){v.keys[codes[e.code]]=0;e.preventDefault();}});
  window.addEventListener('blur',()=>{v.keys.fill(0);s.inputForward=0;s.inputSteer=0;s.inputBrake=0;s.inputRun=0;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&!v.manual)setPaused(v,true,s);});
  $('dismiss-welcome').addEventListener('click',()=>{dismissWelcome(v);startAudio(v.audio);$('game').focus();});
  $('menu-button').addEventListener('click',()=>setPaused(v,!v.paused,s));$('resume').addEventListener('click',()=>setPaused(v,false,s));
  $('restart').addEventListener('click',()=>{Logic.startGame(s,b);v.camInitialized=false;v.lastVehicle=-2;v.lastEvent=0;setPaused(v,false,s);});
  $('sound').addEventListener('click',()=>toggleSound(v));
  $('game').addEventListener('pointerdown',e=>{v.pointerDown=true;v.pointerX=e.clientX;v.pointerMoved=false;$('game').setPointerCapture(e.pointerId);startAudio(v.audio);});
  $('game').addEventListener('pointermove',e=>{if(v.pointerDown){const d=e.clientX-v.pointerX;v.orbit-=d*.006;v.orbitTimer=3;v.pointerX=e.clientX;v.pointerMoved=true;}});
  $('game').addEventListener('pointerup',()=>{v.pointerDown=false;});
  for(const button of document.querySelectorAll('[data-key]')){const code=codes[button.dataset.key];button.addEventListener('pointerdown',e=>{e.preventDefault();v.keys[code]=1;button.setPointerCapture(e.pointerId);startAudio(v.audio);dismissWelcome(v);});button.addEventListener('pointerup',()=>{v.keys[code]=0;});button.addEventListener('pointercancel',()=>{v.keys[code]=0;});}
  $('touch-enter').addEventListener('click',()=>{Logic.interact(s,b);dismissWelcome(v);startAudio(v.audio);});
  window.addEventListener('resize',()=>{v.camera.aspect=innerWidth/innerHeight;v.camera.updateProjectionMatrix();v.renderer.setSize(innerWidth,innerHeight);});
}

export function readInput(v,s) {
  s.inputForward=v.keys[87]-v.keys[83];s.inputSteer=v.keys[68]-v.keys[65];s.inputBrake=v.keys[32];s.inputRun=v.keys[16];s.cameraYaw=v.cameraAngle;
  if((s.inputForward||s.inputSteer)&&s.time>4)dismissWelcome(v);
}

function updateCamera(v,s,dt,snap) {
  const driving=s.controlled>=0,i=s.controlled;
  let angle=driving?s.angle[i]:v.walkAngle;
  v.orbitTimer=Math.max(0,v.orbitTimer-dt);if(v.orbitTimer===0&&!v.pointerDown)v.orbit*=Math.exp(-dt*2.2);
  if(s.cameraMode===2)angle=-Math.PI/4;
  const desiredAngle=angle+v.orbit;
  v.cameraAngle+=diff(desiredAngle,v.cameraAngle)*(snap?1:1-Math.exp(-dt*(driving?2.8:3)));
  if(driving)v.walkAngle=v.cameraAngle-v.orbit;
  const speed=driving?Math.abs(s.speed[i]):0;
  const high=s.cameraMode===1,wide=s.cameraMode===2;
  const portrait=v.camera.aspect<.8;
  const distance=(wide?31:high?27:driving?15.5+speed*.07:19)*(portrait?1.25:1);
  const height=(wide?31:high?26:driving?7.1+speed*.03:7.5)*(portrait?1.15:1);
  const lookahead=driving?Math.min(7,s.speed[i]*.17):3.5;
  const near=!driving&&s.nearest>=0;
  const tx=(near?s.playerX*.65+s.x[s.nearest]*.35:s.playerX)+Math.sin(angle)*lookahead,tz=s.playerZ-Math.cos(angle)*lookahead;
  v.target.lerp(v.look.set(tx,1+(driving?s.y[i]*.65:0),tz),snap?1:1-Math.exp(-dt*7));
  v.desired.set(v.target.x-Math.sin(v.cameraAngle)*distance,v.target.y+height,v.target.z+Math.cos(v.cameraAngle)*distance);
  // Lift the camera above intervening rooftops, preserving a clear player silhouette.
  const city=s.city;
  for(let sample=2;sample<=5;sample++) {
    const f=sample/5,cx=v.target.x+(v.desired.x-v.target.x)*f,cz=v.target.z+(v.desired.z-v.target.z)*f;
    for(let j=0;j<city.colliderCount;j++)if(city.collH[j]>3&&Math.abs(cx-city.collX[j])<city.collW[j]+1.4&&Math.abs(cz-city.collZ[j])<city.collD[j]+1.4){v.desired.y=Math.max(v.desired.y,(city.collH[j]+3-v.target.y)/f+v.target.y);}
  }
  v.camera.position.lerp(v.desired,snap?1:1-Math.exp(-dt*5));
  const impact=driving?s.impact[i]:0;
  if(impact>.05){v.camera.position.x+=Math.sin(s.time*97)*impact*.18;v.camera.position.y+=Math.cos(s.time*79)*impact*.13;}
  v.camera.lookAt(v.target);
  const fov=(wide?48:portrait?58:52)+Math.min(6,speed*.13);if(Math.abs(v.camera.fov-fov)>.05){v.camera.fov=fov;v.camera.updateProjectionMatrix();}
  const sx=Math.round(s.playerX/10)*10,sz=Math.round(s.playerZ/10)*10;
  v.sun.position.set(sx-100,82,sz+65);v.sun.target.position.set(sx,0,sz);
}

function updateEntities(v,s,b) {
  for(let i=0;i<s.carCount;i++) {
    const car=v.cars[i],health=s.health[i],damage=1-health/100;
    car.root.visible=(s.x[i]-s.playerX)**2+(s.z[i]-s.playerZ)**2<210*210;
    car.root.position.set(s.x[i],s.y[i],s.z[i]);car.root.rotation.y=-s.angle[i];
    car.body.rotation.z=clamp(s.roll[i],-.16,.16)+(health<=0?.04:0);car.body.rotation.x=s.pitch[i];car.body.position.y=Math.sin(s.wheelSpin[i]*2)*Math.min(.025,Math.abs(s.speed[i])*.001)-damage*.1;
    car.paintMaterial.color.copy(car.paintColor).multiplyScalar(1-damage*.45);
    car.chassis.scale.z=b.carLength[s.type[i]]*.91*(1-damage*.12);
    car.hood.rotation.x=-damage*.34;car.hood.position.y=.93-damage*.13;car.hood.scale.x=b.carWidth[s.type[i]]*.96*(1-damage*.14);
    car.frontBumper.rotation.z=damage*.12;car.frontBumper.position.y=.54-damage*.2;
    car.trunk.rotation.x=damage*.08;car.cracked.visible=health<55;car.cabin.rotation.z=health<=0?.07:0;car.cabin.scale.y=1-damage*.16;
    for(let j=0;j<4;j++){car.wheels[j].rotation.y=j%2===0?s.steer[i]:0;car.hubs[j].rotation.x=s.wheelSpin[i];car.wheels[j].rotation.z=health<22?(j%2?-.1:.13):0;}
    car.shadow.visible=s.y[i]<1;
  }
  v.player.root.visible=s.controlled<0;v.player.root.position.set(s.playerX,s.playerY,s.playerZ);v.player.root.rotation.y=-s.playerAngle;
  const stride=s.playerMoving?Math.sin(s.playerStride)*.65:0;
  v.player.legs[0].rotation.x=stride;v.player.legs[1].rotation.x=-stride;v.player.arms[0].rotation.x=-stride*.7;v.player.arms[1].rotation.x=stride*.7;
  v.player.body.position.y=s.playerMoving?Math.abs(Math.cos(s.playerStride))*.07:Math.sin(s.time*2)*.009;v.player.body.rotation.z=s.playerStumble>0?.25:0;
  const nearest=s.nearest,near=nearest>=0&&s.controlled<0;
  v.ring.visible=near;v.marker.visible=near;
  if(near){v.ring.position.set(s.x[nearest],.065,s.z[nearest]);v.ring.scale.set(1,.65,1);v.ring.rotation.z=s.angle[nearest];v.marker.position.set(s.x[nearest],3.1+Math.sin(s.time*2)*.11,s.z[nearest]);v.marker.rotation.y=s.time;}
  for(let p=0;p<b.particleCount;p++) {
    if(s.pLife[p]>0) {
      const progress=1-s.pLife[p]/s.pMaxLife[p];const scale=s.pSize[p]*(s.pKind[p]===0?1-progress*.5:1+progress*3.8)*Math.min(1,s.pLife[p]*3);
      v.dummy.position.set(s.px[p],s.py[p],s.pz[p]);v.dummy.scale.setScalar(scale);v.dummy.rotation.set(progress,progress*2,progress*.7);
      v.color.setHex(s.pKind[p]===0?0xffbe65:s.pKind[p]===1?0x737972:0xc7c2ad);v.particleMesh.setColorAt(p,v.color);
    }else{v.dummy.scale.setScalar(0);}
    v.dummy.updateMatrix();v.particleMesh.setMatrixAt(p,v.dummy.matrix);
  }
  v.particleMesh.instanceMatrix.needsUpdate=true;if(v.particleMesh.instanceColor)v.particleMesh.instanceColor.needsUpdate=true;
  for(let k=0;k<b.skidCount;k++) {
    if(s.skidLife[k]>0){v.dummy.position.set(s.skidX[k],.056,s.skidZ[k]);v.dummy.rotation.set(-Math.PI/2,0,-s.skidAngle[k]);v.dummy.scale.set(Math.min(1,s.skidLife[k]/3),s.skidLength[k],1);}else v.dummy.scale.setScalar(0);
    v.dummy.updateMatrix();v.skidMesh.setMatrixAt(k,v.dummy.matrix);
  }
  v.skidMesh.instanceMatrix.needsUpdate=true;
}

function makeMap(v,s,b) {
  const canvas=v.mapBase;canvas.width=880;canvas.height=880;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#e3dec8';ctx.fillRect(0,0,880,880);ctx.fillStyle='#a6c9c4';ctx.fillRect(0,0,38,880);
  const scale=2;
  for(const r of s.city.roads){ctx.fillStyle='#fff9e9';ctx.fillRect((r+220)*scale-11,0,22,880);ctx.fillRect(0,(r+220)*scale-11,880,22);}
  for(const d of s.city.buildings){ctx.fillStyle=['#c2c6ac','#c6c7b1','#cac7ac'][d.palette%3];ctx.fillRect((d.x+220-d.w/2)*scale,(d.z+220-d.d/2)*scale,d.w*scale,d.d*scale);}
  for(const p of s.city.parks){ctx.fillStyle=p.kind===0?'#acc297':'#d8c8a6';ctx.fillRect((p.x+190)*scale,(p.z+190)*scale,120,120);}
  v.mapLocal.width=340;v.mapLocal.height=280;
}

function renderMap(v,s) {
  const ctx=v.minimap,w=340,h=280,zoom=1.22;
  ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(w/2,h/2);ctx.scale(zoom,zoom);
  ctx.drawImage(v.mapBase,-(s.playerX+220)*2,-(s.playerZ+220)*2);
  for(let i=0;i<s.carCount;i++){const x=(s.x[i]-s.playerX)*2,z=(s.z[i]-s.playerZ)*2;if(Math.abs(x)<160&&Math.abs(z)<140){ctx.fillStyle=s.health[i]<=0?'#957c6c':'#7d9b85';ctx.beginPath();ctx.arc(x,z,i===s.nearest?2.6:1.9,0,TAU);ctx.fill();}}
  ctx.restore();ctx.save();ctx.translate(w/2,h/2);ctx.rotate(s.controlled>=0?s.angle[s.controlled]:s.playerAngle);
  ctx.shadowColor='#c95e3344';ctx.shadowBlur=7;ctx.fillStyle='#e8774f';ctx.strokeStyle='#fff8e8';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(0,4);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}

function updateUI(v,s,b,now) {
  const ui=v.ui,i=s.controlled,driving=i>=0,speed=driving?Math.round(Math.abs(s.speed[i])*3.6):Math.round(s.playerMoving*(s.inputRun?b.runSpeed:b.walkSpeed)*3.6);
  if(speed!==v.lastSpeed){ui.speed.textContent=String(speed).padStart(2,'0');ui.gear.textContent=driving?(s.speed[i]<-1?'R':speed<1?'N':String(Math.min(5,Math.floor(speed/38)+1))):'—';v.lastSpeed=speed;for(let n=0;n<12;n++)ui.ticks[n].classList.toggle('lit',driving&&n<speed/15);}
  if(i!==v.lastVehicle){ui.telemetry.classList.toggle('on-foot',!driving);ui.vehicleClass.textContent=driving?b.carClasses[s.type[i]].toUpperCase():'ON FOOT';ui.vehicleName.textContent=driving?b.carNames[s.type[i]].toUpperCase():'THE GOOD LIFE';$('move-label').textContent=driving?'Drive':'Walk';$('enter-label').textContent=driving?'Exit car':'Enter car';$('special-key').textContent=driving?'SPACE':'SHIFT';$('special-label').textContent=driving?'Handbrake':'Run';v.lastVehicle=i;v.lastHealth=-999;v.lastSpeed=-1;}
  const health=driving?Math.round(s.health[i]):-1;
  if(health!==v.lastHealth){ui.condition.textContent=driving?(health<=0?'TOTALED':health<25?'CRITICAL':health<55?'DAMAGED':'CONDITION'):'READY WHEN YOU ARE';ui.value.textContent=driving?health+'%':'∞';ui.fill.style.width=(driving?health:100)+'%';ui.fill.style.background=health>=0&&health<40?'#ff8460':'#f7c17d';v.lastHealth=health;}
  const near=s.nearest;
  ui.interact.style.opacity=!driving&&near>=0?'1':driving&&health<=0?'1':'0';ui.interact.style.pointerEvents='none';
  if(near!==v.lastNearest||driving&&health<=0){if(driving&&health<=0){ui.title.textContent='Time for a new ride';ui.detail.textContent='Leave the wreck. The city is full of cars.';}else if(near>=0){ui.title.textContent=s.health[near]<=0?'This one’s had its day':'Take the wheel';ui.detail.textContent=b.carNames[s.type[near]]+' · '+b.carClasses[s.type[near]];}v.lastNearest=near;}
  ui.tip.style.display=driving&&health>0?'block':'none';
  if(s.district!==v.lastDistrict){$('district').textContent=b.districtNames[s.district];$('map-district').textContent=b.districtNames[s.district];v.lastDistrict=s.district;}
  if(s.eventId!==v.lastEvent){v.lastEvent=s.eventId;let title='',sub='';
    if(s.eventType===1){title=b.carNames[s.type[s.eventCar]].toUpperCase();sub='Yours for the afternoon.  W to go · Space to slide';}
    if(s.eventType===2){title='THE NEXT ONE IS OUT THERE';sub='Walk up to any car. Press E. Keep going.';}
    if(s.eventType===3&&s.eventStrength>13){title=s.health[s.eventCar]<35?'THAT DIDN’T SOUND GOOD':'JUST A LITTLE BODYWORK';sub='Still rolling. For now.';}
    if(s.eventType===4){title='WELL, THAT WAS A GOOD RUN.';sub='Press E to leave the wreck and find another ride.';}
    if(s.eventType===6){title='THIS ONE’S GOING NOWHERE';sub='Find a fresh set of wheels.';}
    if(s.eventType===7){title='BACK ON FOUR WHEELS';sub='Keep the afternoon going.';}
    if(title){$('toast-title').textContent=title;$('toast-sub').textContent=sub;v.uiTime=now;ui.toast.classList.add('visible');}
  }
  if(now-v.uiTime>4.2)ui.toast.classList.remove('visible');
  renderMap(v,s);
}

export function render(v,s,b,dt,now,snap=false) {
  updateEntities(v,s,b);updateCamera(v,s,dt,snap||!v.camInitialized);v.camInitialized=true;
  const phase=Math.floor(s.time/9)%2;if(phase!==v.world.signalPhase){v.world.signalPhase=phase;v.world.signalV.material.color.setHex(phase===0?0x88d09e:0xf3785f);v.world.signalH.material.color.setHex(phase===1?0x88d09e:0xf3785f);}
  if(now-v.lastUI>.08||snap){updateUI(v,s,b,now);v.lastUI=now;}
  updateAudio(v.audio,s,v.paused);v.renderer.render(v.scene,v.camera);
  v.frameCount++;if(now-v.fpsTime>1){v.fps=v.frameCount/(now-v.fpsTime);v.frameCount=0;v.fpsTime=now;}
}

export function resetPresentation(v) {v.camInitialized=false;v.lastVehicle=-2;v.lastNearest=-2;v.lastSpeed=-1;v.lastHealth=-999;v.lastEvent=0;v.lastDistrict=-1;v.keys.fill(0);v.cameraAngle=.27;v.walkAngle=.27;v.orbit=0;v.ui.toast.classList.remove('visible');dismissWelcome(v);}
