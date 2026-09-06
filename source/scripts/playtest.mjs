import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined,args:process.platform==='darwin'?['--use-angle=metal']:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:960}});
const errors=[],checks=[],report={};
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const check=(name,condition)=>{assert.ok(condition,name);checks.push(name);console.log('PASS '+name);};
try {
  await page.goto((process.env.GAME_URL||'http://127.0.0.1:5173')+'/?test=1',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.game?.getState().ready);
  let s=await page.evaluate(()=>game.getState());
  check('Arrive on foot beside a healthy, stealable car',s.mode==='walking'&&s.nearest?.health===100);
  await page.keyboard.press('KeyE');s=await page.evaluate(()=>game.getState());
  check('Keyboard E enters the car',s.mode==='driving'&&s.stats.carsTaken===1);
  // Real-time keyboard input, no time stepping, tests the actual game loop.
  await page.evaluate(()=>game.setManual(false));await page.keyboard.down('KeyW');await page.waitForTimeout(3100);await page.keyboard.up('KeyW');
  s=await page.evaluate(()=>game.getState());report.keyboardDrive=s;
  check('Keyboard W accelerates the live simulation',s.vehicle.speedKph>80&&s.stats.distanceMeters>35);
  await page.keyboard.press('Escape');s=await page.evaluate(()=>game.getState());const pausedTick=s.tick;
  await page.waitForTimeout(300);s=await page.evaluate(()=>game.getState());
  check('Pause freezes the simulation',s.paused&&s.tick===pausedTick);
  await page.getByRole('button',{name:'Back to the sunshine'}).click();
  check('Resume restores gameplay',!(await page.evaluate(()=>game.getState())).paused);
  await page.evaluate(()=>{game.setManual(true);game.scenario('driving');game.step(.65,{forward:1,steer:1,brake:true});});
  s=await page.evaluate(()=>game.getState());check('Handbrake produces yaw and persistent tire marks',s.effects.skidSegments>0&&s.vehicle.heading>.3);
  await page.keyboard.press('KeyC');check('Camera key cycles the view',(await page.evaluate(()=>game.getState())).camera.mode===1);
  await page.evaluate(()=>{game.scenario('crash');game.step(.8,{forward:1});});
  s=await page.evaluate(()=>game.getState());report.wreck=s;
  check('An actual collision totals the vehicle',s.vehicle.wrecked&&s.stats.collisions>0&&s.effects.particles>0);
  await page.keyboard.press('KeyE');s=await page.evaluate(()=>game.getState());
  check('Keyboard E leaves a wreck',s.mode==='walking');
  // Walk to a second nearby car with movement input. No teleport or health edits.
  const target=await page.evaluate(()=>{const p=game.getState().player;return game.cars().filter(c=>c.health>0&&!c.traffic).sort((a,b)=>(a.x-p.x)**2+(a.z-p.z)**2-(b.x-p.x)**2-(b.z-p.z)**2)[0];});
  for(let n=0;n<100;n++) {
    s=await page.evaluate(()=>game.getState());if(s.nearest?.id===target.id)break;
    const dx=target.x+2.5*Math.cos(target.heading)-s.player.x,dz=target.z+2.5*Math.sin(target.heading)-s.player.z,len=Math.hypot(dx,dz),a=s.camera.yaw;
    await page.evaluate(input=>game.step(.12,input),{forward:(dx*Math.sin(a)-dz*Math.cos(a))/len,steer:(dx*Math.cos(a)+dz*Math.sin(a))/len,run:true});
  }
  s=await page.evaluate(()=>game.getState());check('A fresh car can be reached on foot after the crash',s.nearest?.id===target.id);
  await page.keyboard.press('KeyE');s=await page.evaluate(()=>game.getState());report.nextRide=s;
  check('The complete steal, drive, wreck, exit, steal loop repeats',s.mode==='driving'&&s.vehicle.id===target.id&&s.vehicle.health>0&&s.stats.carsTaken===2);
  await page.evaluate(()=>{game.scenario('ramp');game.step(1.25,{forward:1});});s=await page.evaluate(()=>game.getState());check('The boardwalk ramp launches the car',s.vehicle.y>2);
  await page.evaluate(()=>game.step(3));s=await page.evaluate(()=>game.getState());check('The airborne car lands safely',s.vehicle.y===0);
  // Let the renderer settle before measuring; initial shader compilation is excluded.
  await page.evaluate(()=>game.scenario('walking'));await page.waitForTimeout(2200);
  report.performance=await page.evaluate(()=>game.getState().renderer);
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>game.scenario('walking'));await page.waitForTimeout(400);
  const layout=await page.evaluate(()=>{
    const ids=['interaction','telemetry','touch-controls','minimap'];const rects=ids.map(id=>{const r=document.getElementById(id).getBoundingClientRect();return{id,x:r.x,y:r.y,right:r.right,bottom:r.bottom};});
    return{rects,overflow:document.documentElement.scrollWidth>innerWidth};
  });report.mobile=layout;
  check('Mobile HUD stays within the viewport',!layout.overflow&&layout.rects.every(r=>r.x>=0&&r.right<=390&&r.y>=0&&r.bottom<=844));
  await page.getByRole('button',{name:'E',exact:true}).click();check('Touch enter button works',(await page.evaluate(()=>game.getState())).mode==='driving');
  check('No browser runtime or resource errors',errors.length===0);
  report.checks=checks;report.errors=errors;
  await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});await writeFile(new URL('../artifacts/playtest-report.json',import.meta.url),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:checks.length,performance:report.performance}));
} finally { await browser.close(); }
