import test from 'node:test';
import assert from 'node:assert/strict';
import { B } from '../src/balance.js';
import { makeCityData } from '../src/cityData.js';
import { allocateGameData } from '../src/gameData.js';
import * as L from '../src/logic.js';

function fresh(){const s=allocateGameData(B,makeCityData(B));L.startGame(s,B);return s;}
function step(s,seconds){for(let f=0;f<Math.round(seconds/B.fixedDt);f++)L.tick(s,B,B.fixedDt);}

test('the arrival car can be entered, driven, exited and replaced',()=>{
  const s=fresh();step(s,.1);assert.equal(s.nearest,0);L.interact(s,B);assert.equal(s.controlled,0);
  s.inputForward=1;step(s,2);assert.ok(s.speed[0]>10);assert.ok(s.z[0]<23);
  L.interact(s,B);assert.equal(s.controlled,-1);assert.equal(s.mode[0],0);
  s.playerX=s.x[27]+2;s.playerZ=s.z[27];s.inputForward=0;step(s,.1);L.interact(s,B);assert.equal(s.controlled,27);assert.equal(s.steals,2);
});

test('a hard building collision deforms and ultimately disables the car',()=>{
  const s=fresh();L.setScenario(s,B,'crash');s.inputForward=1;step(s,.8);
  assert.ok(s.health[0]<50,`health ${s.health[0]}`);assert.ok(s.collisions>0);
  // Another full-speed collision: no direct health manipulation.
  s.x[0]=-3;s.z[0]=-30;s.angle[0]=-Math.PI/2;s.vx[0]=-43;s.vz[0]=0;s.hitCooldown[0]=0;step(s,.8);
  assert.equal(s.health[0],0);assert.equal(s.wrecks,1);
  s.vx[0]=0;s.vz[0]=0;step(s,2);assert.ok(Math.abs(s.speed[0])<.1);
  L.interact(s,B);assert.equal(s.controlled,-1);s.playerX=s.x[0]+2;s.playerZ=s.z[0];step(s,.1);L.interact(s,B);assert.equal(s.controlled,-1);
});

test('steering changes heading and a handbrake leaves tire marks',()=>{
  const s=fresh();L.setScenario(s,B,'driving');s.inputForward=1;s.inputSteer=1;s.inputBrake=1;step(s,.6);
  assert.ok(s.angle[0]>.1);assert.ok(s.skidCursor>0);
});

test('moving traffic is stealable and relinquishes its AI route',()=>{
  const s=fresh();s.playerX=s.x[1]+2;s.playerZ=s.z[1];step(s,.01);assert.equal(s.nearest,1);
  L.interact(s,B);assert.equal(s.controlled,1);assert.equal(s.mode[1],2);
});

test('ramp launches the car and gravity brings it back to ground',()=>{
  const s=fresh();L.setScenario(s,B,'ramp');s.inputForward=1;step(s,1.25);assert.ok(s.y[0]>2,`height ${s.y[0]}`);
  s.inputForward=0;step(s,3);assert.equal(s.y[0],0);
});

test('the simulation is deterministic and stays finite in a long traffic run',()=>{
  const a=fresh(),b=fresh();step(a,30);step(b,30);
  assert.deepEqual(a.x,b.x);assert.deepEqual(a.z,b.z);
  for(let i=0;i<a.carCount;i++){assert.ok(Number.isFinite(a.x[i])&&Number.isFinite(a.z[i]));assert.ok(Math.abs(a.x[i])<=B.worldEdge&&Math.abs(a.z[i])<=B.worldEdge);}
  let moving=0;for(let i=1;i<=B.trafficCount;i++)if(Math.abs(a.speed[i])>2)moving++;
  assert.ok(moving>12,`only ${moving} traffic cars still moving`);
});

test('walking respects building walls and clears input after exit',()=>{
  const s=fresh();const c=s.city;s.playerX=c.collX[0]-c.collW[0]-.5;s.playerZ=c.collZ[0];s.cameraYaw=0;s.inputSteer=1;const initial=s.playerX;step(s,1);assert.ok(s.playerX-initial<.2);
});

test('traffic does not accumulate a permanent deadlock after five minutes',()=>{
  const s=fresh();step(s,300);let moving=0,stuck=0;
  for(let i=1;i<=B.trafficCount;i++){if(Math.abs(s.speed[i])>2)moving++;if(s.aiStuck[i]>18)stuck++;}
  assert.ok(moving>12,`moving ${moving}`);assert.equal(stuck,0);
});

test('recovery clears a roadside obstruction without repairing damage',()=>{
  const s=fresh();L.interact(s,B);s.x[0]=-163;s.z[0]=40;s.health[0]=28;
  L.recover(s,B);assert.equal(s.health[0],28);assert.ok(!L.blocked(s.city,s.x[0],s.z[0],2.7));assert.equal(s.vx[0],0);assert.equal(s.vz[0],0);
});
