import './style.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/barlow-condensed/latin-800.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import { B, validateBalance } from './balance.js';
import { makeCityData } from './cityData.js';
import { allocateGameData } from './gameData.js';
import * as Logic from './logic.js';
import * as Board from './board.js';

try {
  validateBalance();
  const city=makeCityData(B),state=allocateGameData(B,city);
  Logic.startGame(state,B);
  const board=Board.createBoard(state,B);
  const params=new URLSearchParams(location.search);
  board.manual=params.get('test')==='1';
  if(params.has('scenario')){Logic.setScenario(state,B,params.get('scenario'));Board.resetPresentation(board);}
  let last=performance.now(),accumulator=0;
  function frame(now) {
    const dt=Math.min((now-last)/1000,.1);last=now;
    if(!board.paused&&!board.manual) {
      Board.readInput(board,state);accumulator+=dt;
      while(accumulator>=B.fixedDt){Logic.tick(state,B,B.fixedDt);accumulator-=B.fixedDt;}
    }
    Board.render(board,state,B,Math.min(dt,.04),now/1000);
    requestAnimationFrame(frame);
  }
  // A stable public interface for browser agents, capture scripts and repeatable QA.
  const snapshot=()=>({
    ready:true,version:1,coordinates:'meters; +x east, +z south; heading 0 north, clockwise radians',
    time:+state.time.toFixed(3),tick:state.tick,paused:board.paused,mode:state.controlled<0?'walking':'driving',
    player:{x:+state.playerX.toFixed(3),y:+state.playerY.toFixed(3),z:+state.playerZ.toFixed(3),heading:+state.playerAngle.toFixed(3)},
    vehicle:state.controlled<0?null:{id:state.controlled,name:B.carNames[state.type[state.controlled]],x:+state.x[state.controlled].toFixed(3),y:+state.y[state.controlled].toFixed(3),z:+state.z[state.controlled].toFixed(3),heading:+state.angle[state.controlled].toFixed(3),speedKph:+(Math.abs(state.speed[state.controlled])*3.6).toFixed(2),health:+state.health[state.controlled].toFixed(2),wrecked:state.health[state.controlled]<=0},
    nearest:state.nearest<0?null:{id:state.nearest,name:B.carNames[state.type[state.nearest]],distance:+Math.hypot(state.playerX-state.x[state.nearest],state.playerZ-state.z[state.nearest]).toFixed(2),health:+state.health[state.nearest].toFixed(1)},
    district:B.districtNames[state.district],camera:{mode:state.cameraMode,yaw:+board.cameraAngle.toFixed(4)},stats:{carsTaken:state.steals,wrecks:state.wrecks,collisions:state.collisions,distanceMeters:+state.distance.toFixed(1),topSpeedKph:+state.topSpeed.toFixed(1)},
    traffic:{total:state.carCount,moving:Array.from(state.mode).filter(x=>x===1).length},
    effects:{skidSegments:state.skidCursor,particles:Array.from(state.pLife).filter(x=>x>0).length},
    renderer:{calls:board.renderer.info.render.calls,triangles:board.renderer.info.render.triangles,fps:+board.fps.toFixed(1)},
    controls:{move:'WASD / Arrow keys',enterExit:'E',handbrake:'Space',run:'Shift',camera:'C',pause:'Escape',horn:'H',sound:'M',recover:'R',hideHUD:'F2'},
  });
  function advance(seconds=1/60,input={}) {
    board.manual=true;
    state.inputForward=input.forward||0;state.inputSteer=input.steer||0;state.inputBrake=input.brake?1:0;state.inputRun=input.run?1:0;state.cameraYaw=board.cameraAngle;
    const frames=Math.max(0,Math.round(Math.min(seconds,120)/B.fixedDt));
    if(!board.paused)for(let f=0;f<frames;f++)Logic.tick(state,B,B.fixedDt);
    Board.render(board,state,B,1,performance.now()/1000,true);return snapshot();
  }
  window.game=Object.freeze({
    getState:snapshot,
    step:advance,
    setInput(input){state.inputForward=input.forward||0;state.inputSteer=input.steer||0;state.inputBrake=input.brake?1:0;state.inputRun=input.run?1:0;},
    interact(){Logic.interact(state,B);Board.render(board,state,B,1/60,performance.now()/1000,true);return snapshot();},
    scenario(name='walking'){Logic.setScenario(state,B,name);Board.resetPresentation(board);Board.render(board,state,B,1,performance.now()/1000,true);return snapshot();},
    setManual(enabled){board.manual=!!enabled;accumulator=0;},
    pause(value=true){Board.setPaused(board,value,state);return snapshot();},
    camera(mode=0){Logic.setCamera(state,mode);Board.render(board,state,B,1,performance.now()/1000,true);},
    setHUD(visible=true){document.getElementById('app').classList.toggle('hide-hud',!visible);},
    screenshot(){Board.render(board,state,B,1/60,performance.now()/1000);return board.renderer.domElement.toDataURL('image/png');},
    cars(){return Array.from({length:state.carCount},(_,i)=>({id:i,name:B.carNames[state.type[i]],x:state.x[i],z:state.z[i],heading:state.angle[i],health:state.health[i],traffic:state.mode[i]===1}));},
  });
  window.render_game_to_text=()=>JSON.stringify(snapshot());
  window.advanceTime=milliseconds=>advance(milliseconds/1000,{forward:state.inputForward,steer:state.inputSteer,brake:state.inputBrake,run:state.inputRun});
  Board.render(board,state,B,1/60,performance.now()/1000,true);
  document.getElementById('loading').style.opacity='0';document.getElementById('loading').style.pointerEvents='none';
  setTimeout(()=>document.getElementById('loading').remove(),700);
  requestAnimationFrame(frame);
} catch(error) {
  console.error(error);document.getElementById('loading').hidden=true;
  document.getElementById('fatal').hidden=false;document.getElementById('fatal-message').textContent=error.message+' — Please use a browser with WebGL 2 enabled.';
}
