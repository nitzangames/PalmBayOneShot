const TAU = Math.PI * 2;
const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
const angleDiff = (a,b) => ((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI;

export function random(s) { s.rng = Math.imul(1664525,s.rng)+1013904223|0; return (s.rng>>>0)/4294967296; }
export function notify(s,type,car=-1,strength=0) { s.eventId++;s.eventType=type;s.eventCar=car;s.eventStrength=strength;s.eventTime=s.time; }
export function setCamera(s,mode){s.cameraMode=((mode%3)+3)%3;}

export function startGame(s,b) {
  s.time=0;s.tick=0;s.rng=b.seed;s.playerX=-165.3;s.playerZ=47;s.playerY=0;s.playerAngle=0;s.playerStride=0;s.playerStumble=0;s.district=1;s.skidCursor=0;s.particleCursor=0;
  s.controlled=-1;s.nearest=0;s.steals=0;s.wrecks=0;s.collisions=0;s.distance=0;s.topSpeed=0;s.eventId=0;s.eventType=0;s.eventTime=0;s.cameraMode=0;
  s.pLife.fill(0);s.skidLife.fill(0);s.countedWreck.fill(0);s.skidding.fill(0);s.vx.fill(0);s.vz.fill(0);s.vy.fill(0);s.y.fill(0);s.roll.fill(0);s.pitch.fill(0);s.impact.fill(0);s.hitCooldown.fill(0);s.aiWait.fill(0);s.aiStuck.fill(0);s.speed.fill(0);
  s.inputForward=0;s.inputSteer=0;s.inputBrake=0;s.inputRun=0;
  for(let i=0;i<s.carCount;i++) {
    s.type[i]=i%6;s.color[i]=i%b.carColors.length;s.health[i]=100;s.steer[i]=0;s.mode[i]=0;
    s.aiTargetSpeed[i]=9+random(s)*6;
    if(i>0&&i<=b.trafficCount) {
      const r=(i-1)%s.city.routes.length,route=s.city.routes[r],p=Math.floor(random(s)*4),q=(p+1)%4,t=.08+random(s)*.78;
      s.x[i]=route[p*2]+(route[q*2]-route[p*2])*t;s.z[i]=route[p*2+1]+(route[q*2+1]-route[p*2+1])*t;
      s.angle[i]=Math.atan2(route[q*2]-s.x[i],-(route[q*2+1]-s.z[i]));s.route[i]=r;s.routePoint[i]=q;s.mode[i]=1;
    } else {
      const p=i-b.trafficCount-1;
      const road=s.city.roads[((p%5)+5)%5];
      s.x[i]=road+(p%2?7.8:-7.8);s.z[i]=-145+Math.floor(p/5)*43;s.angle[i]=p%2?Math.PI:0;
    }
  }
  s.x[0]=-168.2;s.z[0]=45;s.angle[0]=0;s.type[0]=0;s.color[0]=0;
  // The corner store has a spare ride for the first wreck-and-repeat loop.
  s.x[27]=-183.5;s.z[27]=42;s.type[27]=2;s.color[27]=1;s.angle[27]=Math.PI;
  s.x[28]=7.5;s.z[28]=65;s.type[28]=3;s.color[28]=2;s.angle[28]=0;
  s.x[29]=-7.5;s.z[29]=-28;s.type[29]=1;s.color[29]=3;s.angle[29]=Math.PI;
  // Keep initial traffic clear of parked cars and each other.
  for(let i=1;i<=b.trafficCount;i++) for(let j=0;j<i;j++) if((s.x[i]-s.x[j])**2+(s.z[i]-s.z[j])**2<81){s.x[i]+=Math.sin(s.angle[i])*12;s.z[i]-=Math.cos(s.angle[i])*12;}
}

export function interact(s,b) {
  if(s.controlled>=0) {
    const i=s.controlled, a=s.angle[i];
    let x=s.x[i]+Math.cos(a)*2.5,z=s.z[i]+Math.sin(a)*2.5;
    if(blocked(s.city,x,z,.5)) {x=s.x[i]-Math.cos(a)*2.5;z=s.z[i]-Math.sin(a)*2.5;}
    if(blocked(s.city,x,z,.5)) {x=s.x[i]-Math.sin(a)*3.5;z=s.z[i]+Math.cos(a)*3.5;}
    s.playerX=clamp(x,-b.worldEdge,b.worldEdge);s.playerZ=clamp(z,-b.worldEdge,b.worldEdge);s.playerY=0;s.playerAngle=a;
    s.mode[i]=0;s.controlled=-1;s.nearest=i;s.playerStumble=Math.abs(s.speed[i])>12?.6:0;
    s.inputForward=0;s.inputSteer=0;notify(s,2,i);
  } else if(s.nearest>=0) {
    const i=s.nearest;
    if(s.health[i]<=0) notify(s,6,i);
    else {s.controlled=i;s.mode[i]=2;s.steals++;s.nearest=-1;s.playerMoving=0;s.playerX=s.x[i];s.playerZ=s.z[i];s.playerY=s.y[i];notify(s,1,i);}
  }
}

export function recover(s,b) {
  if(s.controlled>=0) {
    const i=s.controlled;let best=Infinity,bx=s.x[i],bz=s.z[i],ba=s.angle[i];
    for(let r=0;r<s.city.roads.length;r++)for(let axis=0;axis<2;axis++) {
      const x=axis===0?s.city.roads[r]+4.7:s.x[i],z=axis===1?s.city.roads[r]+4.7:s.z[i],distance=(x-s.x[i])**2+(z-s.z[i])**2;
      let clear=!blocked(s.city,x,z,2.7);for(let j=0;j<s.carCount;j++)if(j!==i&&(x-s.x[j])**2+(z-s.z[j])**2<36)clear=false;
      if(clear&&distance<best){best=distance;bx=x;bz=z;ba=axis===0?0:Math.PI/2;}
    }
    s.x[i]=bx;s.z[i]=bz;s.angle[i]=ba;s.playerX=bx;s.playerZ=bz;s.y[i]=0;s.vy[i]=0;s.vx[i]=0;s.vz[i]=0;s.roll[i]=0;s.pitch[i]=0;notify(s,7,i);
  }
}

export function blocked(city,x,z,r) {
  for(let j=0;j<city.colliderCount;j++) if(Math.abs(x-city.collX[j])<city.collW[j]+r&&Math.abs(z-city.collZ[j])<city.collD[j]+r) return true;
  return false;
}

function particles(s,b,x,y,z,count,kind,power) {
  for(let j=0;j<count;j++) {
    const p=s.particleCursor++%b.particleCount;
    s.px[p]=x;s.py[p]=y;s.pz[p]=z;s.pKind[p]=kind;
    const a=random(s)*TAU,v=(.5+random(s))*power;
    s.pvx[p]=Math.cos(a)*v;s.pvz[p]=Math.sin(a)*v;s.pvy[p]=kind===1?1.8+random(s)*1.7:1+random(s)*power;
    s.pLife[p]=s.pMaxLife[p]=kind===1?1.5+random(s)*1.7:.5+random(s)*.7;s.pSize[p]=kind===1?.4+random(s)*.4:.06+random(s)*.14;
  }
}

function damage(s,b,i,power,nx,nz) {
  if(power>3.4&&s.hitCooldown[i]<=0) {
    s.health[i]=Math.max(0,s.health[i]-(power-2)*2.3);s.hitCooldown[i]=.35;s.impact[i]=Math.min(1,power/18);
    particles(s,b,s.x[i]-nx*1.4,.7+s.y[i],s.z[i]-nz*1.4,Math.min(20,Math.floor(power)),0,power*.26);
    if(i===s.controlled){s.collisions++;notify(s,3,i,power);}
    if(s.health[i]<=0&&!s.countedWreck[i]) {s.countedWreck[i]=1;s.wrecks++;s.mode[i]=0;particles(s,b,s.x[i],1.3,s.z[i],12,1,1.7);if(i===s.controlled)notify(s,4,i,power);}
  }
}

function collideWorld(s,b,i) {
  const city=s.city, a=s.angle[i],sa=Math.sin(a),ca=Math.cos(a),r=b.carWidth[s.type[i]]*.48,offset=b.carLength[s.type[i]]*.29;
  for(let end=-1;end<=1;end+=2) {
    let cx=s.x[i]+sa*offset*end,cz=s.z[i]-ca*offset*end;
    for(let j=0;j<city.colliderCount;j++) {
      if(s.y[i]>city.collH[j])continue;
      const dx=cx-city.collX[j],dz=cz-city.collZ[j],w=city.collW[j],d=city.collD[j];
      if(Math.abs(dx)>w+r||Math.abs(dz)>d+r)continue;
      let nx=dx-clamp(dx,-w,w),nz=dz-clamp(dz,-d,d),dist2=nx*nx+nz*nz;
      if(dist2<r*r) {
        let dist=Math.sqrt(dist2),penetration=r-dist;
        if(dist<.0001){if(w-Math.abs(dx)<d-Math.abs(dz)){nx=dx>=0?1:-1;nz=0;penetration=r+w-Math.abs(dx);}else{nz=dz>=0?1:-1;nx=0;penetration=r+d-Math.abs(dz);}}else{nx/=dist;nz/=dist;}
        s.x[i]+=nx*penetration;s.z[i]+=nz*penetration;cx+=nx*penetration;cz+=nz*penetration;
        const impact=-(s.vx[i]*nx+s.vz[i]*nz);
        if(impact>0){s.vx[i]+=nx*impact*1.3;s.vz[i]+=nz*impact*1.3;s.angle[i]+=end*(nx*ca+nz*sa)*Math.min(.13,impact*.006);damage(s,b,i,impact,nx,nz);}
      }
    }
  }
  if(Math.abs(s.x[i])>b.worldEdge||Math.abs(s.z[i])>b.worldEdge) {
    const nx=Math.abs(s.x[i])>b.worldEdge?(s.x[i]>0?-1:1):0,nz=Math.abs(s.z[i])>b.worldEdge?(s.z[i]>0?-1:1):0;
    const power=-(s.vx[i]*nx+s.vz[i]*nz);s.x[i]=clamp(s.x[i],-b.worldEdge,b.worldEdge);s.z[i]=clamp(s.z[i],-b.worldEdge,b.worldEdge);
    if(power>0){s.vx[i]+=nx*power*1.4;s.vz[i]+=nz*power*1.4;damage(s,b,i,power,nx,nz);}
  }
}

function collideCars(s,b) {
  for(let i=0;i<s.carCount;i++) for(let j=i+1;j<s.carCount;j++) {
    if(Math.abs(s.y[i]-s.y[j])>1.8)continue;
    const dx=s.x[i]-s.x[j],dz=s.z[i]-s.z[j];
    if(dx*dx+dz*dz>37)continue;
    const ai=s.angle[i],aj=s.angle[j],oi=b.carLength[s.type[i]]*.27,oj=b.carLength[s.type[j]]*.27,r=(b.carWidth[s.type[i]]+b.carWidth[s.type[j]])*.47;
    for(let a=-1;a<=1;a+=2) for(let c=-1;c<=1;c+=2) {
      let nx=s.x[i]+Math.sin(ai)*oi*a-s.x[j]-Math.sin(aj)*oj*c,nz=s.z[i]-Math.cos(ai)*oi*a-s.z[j]+Math.cos(aj)*oj*c;
      const dist2=nx*nx+nz*nz;
      if(dist2<r*r&&dist2>.00001) {
        const dist=Math.sqrt(dist2),push=(r-dist)*.51;nx/=dist;nz/=dist;
        s.x[i]+=nx*push;s.z[i]+=nz*push;s.x[j]-=nx*push;s.z[j]-=nz*push;
        const relative=-((s.vx[i]-s.vx[j])*nx+(s.vz[i]-s.vz[j])*nz);
        if(relative>0) {
          const mi=b.carMass[s.type[i]],mj=b.carMass[s.type[j]],impulse=relative*1.25/(1/mi+1/mj);
          s.vx[i]+=nx*impulse/mi;s.vz[i]+=nz*impulse/mi;s.vx[j]-=nx*impulse/mj;s.vz[j]-=nz*impulse/mj;
          damage(s,b,i,relative*.8,nx,nz);damage(s,b,j,relative*.8,-nx,-nz);
          if(relative>6){s.angle[i]+=a*.04;s.angle[j]-=c*.04;if(s.mode[j]===1)s.aiWait[j]=1;if(s.mode[i]===1)s.aiWait[i]=1;}
        }
      }
    }
  }
}

function addSkid(s,b,x,z,angle,length) {
  const k=s.skidCursor++%b.skidCount;s.skidX[k]=x;s.skidZ[k]=z;s.skidAngle[k]=angle;s.skidLength[k]=length;s.skidLife[k]=24;
}

function driveCars(s,b,dt) {
  for(let i=0;i<s.carCount;i++) {
    const type=s.type[i],a=s.angle[i],sa=Math.sin(a),ca=Math.cos(a);
    let forward=s.vx[i]*sa-s.vz[i]*ca,side=s.vx[i]*ca+s.vz[i]*sa,throttle=0,steer=0,brake=0;
    s.hitCooldown[i]=Math.max(0,s.hitCooldown[i]-dt);s.impact[i]*=Math.exp(-8*dt);
    if(i===s.controlled&&s.health[i]>0) {throttle=s.inputForward;steer=-s.inputSteer;brake=s.inputBrake;}
    else if(s.mode[i]===1&&s.health[i]>0) {
      const route=s.city.routes[s.route[i]],p=s.routePoint[i];
      let dx=route[p*2]-s.x[i],dz=route[p*2+1]-s.z[i],dist=Math.sqrt(dx*dx+dz*dz);
      if(dist<5.5){s.routePoint[i]=(p+1)%4;dx=route[s.routePoint[i]*2]-s.x[i];dz=route[s.routePoint[i]*2+1]-s.z[i];dist=Math.sqrt(dx*dx+dz*dz);}
      const current=s.routePoint[i],previous=(current+3)%4,lookAhead=Math.min(dist,9+Math.max(0,forward)*.3);
      if(Math.abs(route[current*2]-route[previous*2])>.1){dx=Math.sign(route[current*2]-route[previous*2])*lookAhead;dz=route[current*2+1]-s.z[i];}
      else{dx=route[current*2]-s.x[i];dz=Math.sign(route[current*2+1]-route[previous*2+1])*lookAhead;}
      const turn=angleDiff(Math.atan2(dx,-dz),a);steer=clamp(-turn*2.2,-1,1);
      let target=s.aiTargetSpeed[i]*Math.max(.25,1-Math.abs(turn)*.75);if(dist<13)target=Math.min(target,6.5);
      // Alternating junction priority prevents perpendicular streams from deadlocking.
      const vertical=Math.abs(ca)>.7,green=(Math.floor(s.time/9)%2===0)===vertical;
      if(!green)for(let r=0;r<s.city.roads.length;r++) {
        const ahead=vertical?(s.city.roads[r]-s.z[i])*-ca:(s.city.roads[r]-s.x[i])*sa;
        if(ahead>13&&ahead<30)target=Math.min(target,Math.max(0,(ahead-15)*1.6));
      }
      // A forward lane probe lets traffic queue around collisions and stopped cars.
      for(let j=0;j<s.carCount;j++) if(j!==i) {const rx=s.x[j]-s.x[i],rz=s.z[j]-s.z[i],along=rx*sa-rz*ca,lateral=rx*ca+rz*sa;if(along>0&&along<9+Math.max(forward,0)*.6&&Math.abs(lateral)<2.45){const crossing=Math.abs(Math.cos(a-s.angle[j]))<.45;if(!crossing||!green||along<5.5)target=Math.min(target,Math.max(0,(along-5)*1.2));}}
      s.aiWait[i]=Math.max(0,s.aiWait[i]-dt);if(s.aiWait[i]>0)target=0;
      throttle=clamp((target-forward)*.7,-1,1);
    }
    s.steer[i]+=(steer*.53-s.steer[i])*Math.min(1,dt*9);
    if(s.health[i]<=0)throttle=0;
    if(s.y[i]<.3) {
      const accel=b.carAcceleration[type]*(.4+.6*s.health[i]/100);
      if(throttle>=0)forward+=throttle*accel*dt*Math.max(0,1-Math.max(0,forward)/b.carTopSpeed[type]*.65);
      else forward+=throttle*(forward>1?23:accel*.65)*dt*Math.max(.1,1-Math.max(0,-forward)/13);
      const drag=s.mode[i]===0&&i!==s.controlled?1.5:.035;
      forward*=Math.exp(-(drag+Math.abs(forward)*.0012+(brake?1.65:0))*dt);
      const grip=brake?1.35:7.4;side*=Math.exp(-grip*dt);
      const yaw=-(s.steer[i])*forward/(3.25+Math.abs(forward)*.15)*(brake?1.55:1);
      s.angle[i]+=yaw*dt;
      // Momentum remains in world space: steering gradually bends the velocity.
      s.vx[i]=sa*forward+ca*side;s.vz[i]=-ca*forward+sa*side;
      s.roll[i]+=(-yaw*forward*.006-s.roll[i])*dt*7;
      s.pitch[i]+=(-throttle*.027*Math.min(1,Math.abs(forward)/5)-s.pitch[i])*dt*7;
      if(i===s.controlled&&Math.abs(forward)>7&&(brake||Math.abs(side)>3.8)) {
        const lx=s.x[i]-ca*.82-sa*1.35,lz=s.z[i]-sa*.82+ca*1.35,rx=s.x[i]+ca*.82-sa*1.35,rz=s.z[i]+sa*.82+ca*1.35;
        if(s.skidding[i]&&s.tick%3===0){
          const ldx=lx-s.lastSkidLX[i],ldz=lz-s.lastSkidLZ[i],rdx=rx-s.lastSkidRX[i],rdz=rz-s.lastSkidRZ[i];
          addSkid(s,b,(lx+s.lastSkidLX[i])*.5,(lz+s.lastSkidLZ[i])*.5,Math.atan2(ldx,-ldz),Math.sqrt(ldx*ldx+ldz*ldz)+.05);
          addSkid(s,b,(rx+s.lastSkidRX[i])*.5,(rz+s.lastSkidRZ[i])*.5,Math.atan2(rdx,-rdz),Math.sqrt(rdx*rdx+rdz*rdz)+.05);
        }
        if(!s.skidding[i]||s.tick%3===0){s.lastSkidLX[i]=lx;s.lastSkidLZ[i]=lz;s.lastSkidRX[i]=rx;s.lastSkidRZ[i]=rz;}
        s.skidding[i]=1;if(s.tick%6===0)particles(s,b,s.x[i]-sa*1.7,.25,s.z[i]+ca*1.7,1,2,.6);
      }else{s.skidding[i]=0;}
    }
    s.x[i]+=s.vx[i]*dt;s.z[i]+=s.vz[i]*dt;
    // A clearly marked, driveable boardwalk ramp. Airborne cars retain momentum.
    let ground=0;
    if(Math.abs(s.x[i]-s.city.rampX)<4.6&&s.z[i]>s.city.rampZ&&s.z[i]<s.city.rampZ+13) {
      ground=(s.city.rampZ+13-s.z[i])*.24;
      if(s.y[i]<=ground+.12){s.y[i]=ground;s.vy[i]=Math.max(0,-s.vz[i]*.24);s.pitch[i]=-.2;}
    }
    if(s.y[i]>ground||s.vy[i]>0){s.vy[i]-=18*dt;s.y[i]+=s.vy[i]*dt;if(s.y[i]<ground){const landing=-s.vy[i];s.y[i]=ground;s.vy[i]=0;s.pitch[i]=.1;if(landing>5){particles(s,b,s.x[i],.1,s.z[i],5,2,1.5);damage(s,b,i,landing*.55,0,0);}}}
    collideWorld(s,b,i);
    s.speed[i]=s.vx[i]*Math.sin(s.angle[i])-s.vz[i]*Math.cos(s.angle[i]);s.wheelSpin[i]+=s.speed[i]*dt/.39;
    if(s.mode[i]===1){s.aiStuck[i]=Math.abs(s.speed[i])<1?s.aiStuck[i]+dt:0;
      // Recycle only AI traffic well beyond the player; stolen and parked cars persist.
      if(s.aiStuck[i]>18&&(s.x[i]-s.playerX)**2+(s.z[i]-s.playerZ)**2>160*160){
        const route=s.city.routes[s.route[i]],p=Math.floor(random(s)*4),q=(p+1)%4,t=.2+random(s)*.6;
        const x=route[p*2]+(route[q*2]-route[p*2])*t,z=route[p*2+1]+(route[q*2+1]-route[p*2+1])*t;
        let clear=(x-s.playerX)**2+(z-s.playerZ)**2>160*160;
        for(let j=0;j<s.carCount;j++)if(j!==i&&(x-s.x[j])**2+(z-s.z[j])**2<100)clear=false;
        if(clear){s.x[i]=x;s.z[i]=z;s.angle[i]=Math.atan2(route[q*2]-x,-(route[q*2+1]-z));s.routePoint[i]=q;s.vx[i]=0;s.vz[i]=0;s.aiStuck[i]=0;}
      }
    }
    if(s.health[i]<45&&s.tick%(s.health[i]<=0?5:14)===0)particles(s,b,s.x[i]+sa*1.4,1.15+s.y[i],s.z[i]-ca*1.4,1,1,.35);
  }
}

function walk(s,b,dt) {
  s.playerStumble=Math.max(0,s.playerStumble-dt);
  if(s.controlled<0) {
    const length=Math.sqrt(s.inputSteer*s.inputSteer+s.inputForward*s.inputForward);
    s.playerMoving=length>0?1:0;
    if(length>0) {
      const speed=(s.inputRun?b.runSpeed:b.walkSpeed)*(s.playerStumble>0?.25:1);
      // Movement is relative to the current camera: W always goes into the view.
      const forward=s.inputForward/length,side=s.inputSteer/length,ca=Math.cos(s.cameraYaw),sa=Math.sin(s.cameraYaw);
      const dx=(side*ca+forward*sa)*speed*dt,dz=(side*sa-forward*ca)*speed*dt;
      if(!blocked(s.city,s.playerX+dx,s.playerZ,.38))s.playerX=clamp(s.playerX+dx,-b.worldEdge,b.worldEdge);
      if(!blocked(s.city,s.playerX,s.playerZ+dz,.38))s.playerZ=clamp(s.playerZ+dz,-b.worldEdge,b.worldEdge);
      s.playerAngle+=angleDiff(Math.atan2(dx,-dz),s.playerAngle)*Math.min(1,dt*14);s.playerStride+=speed*dt*2;
    }
    s.nearest=-1;let nearest=b.interactionRange*b.interactionRange;
    for(let i=0;i<s.carCount;i++) {
      const dx=s.playerX-s.x[i],dz=s.playerZ-s.z[i],dist=dx*dx+dz*dz;
      if(dist<nearest){nearest=dist;s.nearest=i;}
      // Walking into a car slides the character around its actual oriented body.
      const ca=Math.cos(s.angle[i]),sa=Math.sin(s.angle[i]),lx=dx*ca+dz*sa,lz=dx*sa-dz*ca,w=b.carWidth[s.type[i]]*.5+.34,l=b.carLength[s.type[i]]*.5+.34;
      if(Math.abs(lx)<w&&Math.abs(lz)<l&&s.y[i]<1){const pushX=w-Math.abs(lx),pushZ=l-Math.abs(lz);if(pushX<pushZ){s.playerX+=ca*Math.sign(lx||1)*pushX;s.playerZ+=sa*Math.sign(lx||1)*pushX;}else{s.playerX+=sa*Math.sign(lz||1)*pushZ;s.playerZ-=ca*Math.sign(lz||1)*pushZ;}if(Math.abs(s.speed[i])>5)s.playerStumble=.5;}
    }
  } else {
    const i=s.controlled;s.playerX=s.x[i];s.playerZ=s.z[i];s.playerY=s.y[i];s.playerAngle=s.angle[i];s.distance+=Math.abs(s.speed[i])*dt;s.topSpeed=Math.max(s.topSpeed,Math.abs(s.speed[i])*3.6);
  }
  const x=s.playerX,z=s.playerZ;
  s.district=x<-150?1:z<-90?3:x>80?4:z>105?5:x<-50?2:0;
}

export function tick(s,b,dt) {
  s.time+=dt;s.tick++;driveCars(s,b,dt);collideCars(s,b);walk(s,b,dt);
  for(let p=0;p<b.particleCount;p++) if(s.pLife[p]>0){s.pLife[p]-=dt;s.px[p]+=s.pvx[p]*dt;s.py[p]+=s.pvy[p]*dt;s.pz[p]+=s.pvz[p]*dt;s.pvy[p]-=(s.pKind[p]===0?12:-.12)*dt;if(s.py[p]<.08){s.py[p]=.08;s.pvy[p]*=-.25;s.pvx[p]*=.92;s.pvz[p]*=.92;}}
  for(let i=0;i<b.skidCount;i++)if(s.skidLife[i]>0)s.skidLife[i]-=dt;
}

// Review scenarios share the same live simulation. No fake rendered states.
export function setScenario(s,b,name) {
  startGame(s,b);
  if(name==='driving'||name==='coast'||name==='crash'||name==='ramp') {
    s.controlled=0;s.mode[0]=2;s.steals=1;s.nearest=-1;
    if(name==='coast'){s.x[0]=-176;s.z[0]=80;s.angle[0]=0;s.vz[0]=-20;}
    if(name==='driving'){s.x[0]=4.5;s.z[0]=22;s.angle[0]=0;s.vz[0]=-18;}
    if(name==='crash'){s.x[0]=-3;s.z[0]=-30;s.angle[0]=-Math.PI/2;s.vx[0]=-42;}
    if(name==='ramp'){s.x[0]=s.city.rampX;s.z[0]=s.city.rampZ+28;s.angle[0]=0;s.vz[0]=-27;}
    s.playerX=s.x[0];s.playerZ=s.z[0];
  }
  s.speed[0]=s.vx[0]*Math.sin(s.angle[0])-s.vz[0]*Math.cos(s.angle[0]);
  walk(s,b,0);
}
