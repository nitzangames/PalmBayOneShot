import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addCollider } from './cityData.js';

const C={road:0x5d7276,walk:0xe7d7b8,curb:0xf6e6c9,sand:0xe8d5a1,grass:0xa4ba77,grassDark:0x7fa576,water:0x64b4bc,white:0xffefd4,metal:0x455e58,window:0x416c76,trim:0xf8e9ce};
const facades=[0xe9ad89,0xf2c982,0xe98f8d,0x82b8b0,0xafc49b,0xe9dcc0,0xc4a5ba,0xe2a465,0x86b1bf];
const shopNames=['PALM & CO.','SUN CLUB','BAY MOTEL','MERCADO','THE CORNER','CAFÉ SOL','CASA ROSA','GOOD DAYS','SURF SUPPLY','VISTA','LAUNDROMAT','PALM RECORDS'];

export function buildWorld(scene,city) {
  const batches=new Map(),matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),pos=new THREE.Vector3(),scale=new THREE.Vector3(),euler=new THREE.Euler();
  const boxGeometry=new THREE.BoxGeometry(1,1,1),cylGeometry=new THREE.CylinderGeometry(1,1,1,8),coneGeometry=new THREE.ConeGeometry(1,1,5),icoGeometry=new THREE.IcosahedronGeometry(1,0);
  function shape(geometry,color,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0) {
    let batch=batches.get(color);if(!batch){batch=[];batches.set(color,batch);}
    pos.set(x,y,z);scale.set(sx,sy,sz);euler.set(rx,ry,rz);q.setFromEuler(euler);matrix.compose(pos,q,scale);
    const g=geometry.clone();g.applyMatrix4(matrix);batch.push(g);
  }
  const box=(x,y,z,w,h,d,color,ry=0)=>shape(boxGeometry,color,x,y,z,w,h,d,0,ry);
  const cyl=(x,y,z,r,h,color,rx=0,rz=0)=>shape(cylGeometry,color,x,y,z,r,h,r,rx,0,rz);
  const signs=[];
  const signalV=new THREE.InstancedMesh(new THREE.SphereGeometry(.15,6,4),new THREE.MeshBasicMaterial({color:0x88d09e}),50);
  const signalH=new THREE.InstancedMesh(new THREE.SphereGeometry(.15,6,4),new THREE.MeshBasicMaterial({color:0xf3785f}),50);
  let vCount=0,hCount=0;
  scene.add(signalV,signalH);
  function label(text,x,y,z,w,h,bg,fg='#fff2d9',rotation=0) {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.fillStyle=fg;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 53px sans-serif';
    ctx.fillText(text,256,66,468);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,roughness:1}));
    mesh.position.set(x,y,z);mesh.rotation.y=rotation;scene.add(mesh);signs.push(mesh);
  }
  function palm(x,z,height=11,rotation=0,collide=true) {
    shape(cylGeometry,0xae8863,x+.45,height*.5,z,.23,height,.23,0,0,-.07);
    for(let n=0;n<4;n++)cyl(x+.45+n*.1,1.5+n*2.1,z,.29,.12,0x9a7859);
    const topX=x+.8,topY=height;
    shape(icoGeometry,0x77935e,topX,topY,z,.72,.62,.72);
    for(let p=0;p<7;p++) {
      const a=rotation+p*Math.PI*2/7;
      // Broad, bent fronds built as crisp faceted ribbons.
      const len=4.4+(p%2)*.6,ca=Math.cos(a),sa=Math.sin(a),sideX=-sa*.62,sideZ=ca*.62;
      const v=new Float32Array([topX,topY+.15,z,topX+ca*len*.5+sideX,topY+.65,z+sa*len*.5+sideZ,topX+ca*len,topY-1.15,z+sa*len,topX,topY+.15,z,topX+ca*len,topY-1.15,z+sa*len,topX+ca*len*.5-sideX,topY+.65,z+sa*len*.5-sideZ]);
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(v,3));g.computeVertexNormals();
      let batch=batches.get(p%2?0x4e936e:0x6fa676);if(!batch){batch=[];batches.set(p%2?0x4e936e:0x6fa676,batch);}batch.push(g);
    }
    if(collide)addCollider(city,x,z,.35,.35,height);
  }
  function tree(x,z,size=1,collide=true) {
    cyl(x,1.6*size,z,.25*size,3.2*size,0x9c8662);
    shape(icoGeometry,0x87ab6e,x,4.1*size,z,2.5*size,2.7*size,2.5*size);
    shape(icoGeometry,0xa3bb77,x-.8*size,4.9*size,z,1.7*size,1.6*size,1.8*size);
    if(collide)addCollider(city,x,z,.35,.35,4.5*size);
  }
  function lamp(x,z,a=0) {
    cyl(x,3.5,z,.09,7,C.metal);box(x,7,z,2.7,.13,.16,C.metal,a);box(x+Math.cos(a)*1.2,6.9,z-Math.sin(a)*1.2,.6,.16,.42,C.trim,a);
  }
  function bench(x,z,a=0) {
    box(x,.75,z,2.8,.17,.8,0xbd9067,a);box(x,1.25,z+.4,2.8,.68,.11,0xbd9067,a);
    box(x-1,.33,z,.1,.7,.62,C.metal);box(x+1,.33,z,.1,.7,.62,C.metal);
  }
  function umbrella(x,z,color=0xef8c68) {
    cyl(x,1.65,z,.06,3.3,C.trim);shape(coneGeometry,color,x,3.3,z,2.9,.95,2.9,0,Math.PI/5);
    cyl(x,.8,z,.75,.14,C.trim);cyl(x,.42,z,.07,.8,C.metal);
  }
  // A turquoise bay, quiet horizon, and a wide sweep of sand.
  box(0,-.65,0,460,1.1,460,C.sand);
  box(-415,-.72,0,390,.65,1150,C.water);
  box(-227,-.16,0,22,.23,470,0xf1deb0);
  for(let i=0;i<34;i++)box(-245-i%5*12,-.35,-350+i*22,5+i%3*3,.035,.22,0xb9d7c2,-.03);
  for(let j=0;j<14;j++) {
    shape(coneGeometry,j%2?0xadc2ac:0xa3bab0,180-j*35,-5,-330-(j%3)*16,45,47+j%4*11,30,0,j*.7);
    shape(coneGeometry,j%2?0xb8c9b4:0xa3bab0,310,-6,-260+j*46,38,40+j%3*9,36,0,j);
  }
  // Boardwalk with a coastal cruising lane and a continuous sea wall.
  box(-197,.015,0,25,.14,438,0xd1c5a5);box(-212,.22,0,1.1,.42,438,C.trim);
  box(-218,.39,0,.38,.78,438,0xe7d4b1);
  box(219,.45,0,.65,.9,438,C.trim);box(0,.45,-219,438,.9,.65,C.trim);box(0,.45,219,438,.9,.65,C.trim);
  for(let z=-206;z<218;z+=22){palm(-210,z,10+(z%3),z);bench(-214,z+9);}
  for(let z=-165;z<190;z+=62){umbrella(-229,z,0xeb8f70);box(-233,.15,z+2,1.6,.2,3,0xf7e8cb,.15);umbrella(-237,z+17,0xf1d487);}
  // Asphalt grid and raised curbs, with breaks exactly at intersections.
  for(const r of city.roads) {
    box(r,-.015,0,20,.09,438,C.road);box(0,-.014,r,438,.09,20,C.road);
    for(let k=0;k<4;k++) {
      const center=-132+k*88;
      box(r-12,.075,center,4,.2,67,C.walk);box(r+12,.075,center,4,.2,67,C.walk);
      box(center,.075,r-12,67,.2,4,C.walk);box(center,.075,r+12,67,.2,4,C.walk);
      box(r-10.1,.08,center,.26,.26,67,C.curb);box(r+10.1,.08,center,.26,.26,67,C.curb);
      box(center,.08,r-10.1,67,.26,.26,C.curb);box(center,.08,r+10.1,67,.26,.26,C.curb);
      for(let dash=-28;dash<=28;dash+=12){box(r,.045,center+dash,.16,.015,5,0xebd49a);box(center+dash,.045,r,5,.015,.16,0xebd49a);}
      // Curb parking strips visually separate parked cars from moving lanes.
      box(r-6.75,.041,center,.08,.01,61,0x91a1a0);box(r+6.75,.041,center,.08,.01,61,0x91a1a0);
    }
  }
  // Crosswalks create a readable rhythm through the city.
  for(const x of city.roads)for(const z of city.roads) {
    for(let n=-3;n<=3;n++) {
      box(x+n*2,.048,z-11,1,.02,2.8,C.trim);box(x+n*2,.048,z+11,1,.02,2.8,C.trim);
      box(x-11,.048,z+n*2,2.8,.02,1,C.trim);box(x+11,.048,z+n*2,2.8,.02,1,C.trim);
    }
    box(x-4.8,.048,z+14,7.5,.02,.3,C.trim);box(x+4.8,.048,z-14,7.5,.02,.3,C.trim);
    lamp(x+13,z+14,Math.PI);lamp(x-13,z-14,0);
    for(const side of [-1,1]) {
      const vx=x+side*10.8,vz=z+side*14.7,hx=x-side*14.7,hz=z+side*10.8;
      cyl(vx,2.2,vz,.075,4.4,C.metal);box(vx,4.5,vz,.44,1.1,.35,C.metal);
      cyl(hx,2.2,hz,.075,4.4,C.metal);box(hx,4.5,hz,.35,1.1,.44,C.metal);
      matrix.makeTranslation(vx,4.48,vz+side*.22);signalV.setMatrixAt(vCount++,matrix);
      matrix.makeTranslation(hx-side*.22,4.48,hz);signalH.setMatrixAt(hCount++,matrix);
    }
  }
  // District blocks: bespoke facades, inset windows, storefronts, awnings, rooflines.
  for(const d of city.buildings) {
    const {x,z,w,h,d:depth}=d,color=facades[d.palette];
    box(x,h/2,z,w,h,depth,color);
    box(x,.4,z,w+.35,.8,depth+.35,0xeedfc4);
    box(x,h+.16,z,w+.7,.32,depth+.7,C.trim);
    box(x,h+.48,z,w-.9,.3,depth-.9,0xc5b799);
    // Parapets, elevator housings, and restrained roof details give a strong silhouette.
    box(x,h+.65,z-depth/2,.28,1,1,C.trim);box(x,h+.65,z+depth/2,w,.8,.25,C.trim);
    box(x-w/2,h+.65,z,.25,.8,depth,C.trim);box(x+w/2,h+.65,z,.25,.8,depth,C.trim);
    if(d.style===1){box(x+3,h+1.2,z-2,5,2.1,4,0xc2b798);box(x+3,h+2.3,z-2,5.4,.2,4.4,C.trim);}
    if(d.style===2){cyl(x-3,h+1,z,1.2,1.8,0x929f94);box(x+4,h+.6,z+3,3,1.1,2.2,0xb5b6a4);}
    const floors=Math.floor((h-3.5)/3.05),cols=Math.floor(w/4.2),colsSide=Math.floor(depth/4.2);
    for(let f=0;f<floors;f++) {
      const y=4.9+f*3.05;
      for(let c=0;c<cols;c++) {
        const wx=x+(c-(cols-1)/2)*4.2;
        for(const side of [-1,1]) {
          box(wx,y,z+side*(depth/2+.025),1.7,1.9,.08,C.window);
          box(wx,y-1.02,z+side*(depth/2+.14),2.02,.16,.37,C.trim);
          if(d.style===0){box(wx-.84,y,z+side*(depth/2+.08),.13,2.03,.13,C.trim);box(wx+.84,y,z+side*(depth/2+.08),.13,2.03,.13,C.trim);box(wx,y,z+side*(depth/2+.08),.07,1.9,.1,0xabc0b5);}
          if(d.style===3&&f%2===0){box(wx,y-.88,z+side*(depth/2+.5),2.3,.15,1.1,C.trim);box(wx,y-.47,z+side*(depth/2+1),2.3,.7,.07,color);}
        }
      }
      for(let c=0;c<colsSide;c++) {
        const wz=z+(c-(colsSide-1)/2)*4.2;
        for(const side of [-1,1]) {box(x+side*(w/2+.025),y,wz,.08,1.9,1.7,C.window);box(x+side*(w/2+.12),y-1.02,wz,.35,.16,1.95,C.trim);}
      }
    }
    // Wide glazed shop fronts at street level.
    for(let c=-1;c<=1;c++) {
      const wx=x+c*w*.27;
      box(wx,1.6,z+depth/2+.025,w*.21,2.35,.08,0x365d62);
      box(wx,1.65,z+depth/2+.1,.1,2.4,.09,C.trim);
      box(wx,1.6,z-depth/2-.025,w*.21,2.35,.08,0x365d62);
      box(x-w/2-.025,1.6,z+c*depth*.27,.08,2.35,depth*.21,0x365d62);
      box(x+w/2+.025,1.6,z+c*depth*.27,.08,2.35,depth*.21,0x365d62);
    }
    const awningColor=d.palette%2?0x669c87:0xdb7e61;
    for(let j=0;j<Math.floor(w/1.25);j++) {
      const wx=x-w/2+.625+j*1.25;
      shape(boxGeometry,j%2?C.trim:awningColor,wx,3.15,z+depth/2+.75,1.25,.13,1.8,.15);
      box(wx,2.94,z+depth/2+1.62,1.25,.4,.08,j%2?C.trim:awningColor);
    }
    if(d.sign%2===0)label(shopNames[d.sign],x,3.7,z+depth/2+.07,Math.min(w*.66,12),1.15,d.palette%2?'#4d7a6e':'#b97156');
    if(d.style===1)label(shopNames[d.sign],x-w/2-.08,3.8,z,Math.min(depth*.68,12),1.2,'#507d72','#fff2d9',-Math.PI/2);
    if(d.style===2){box(x+w/2-.8,h+1.9,z+depth/2,1.9,4.9,.65,0xe5a472);label('HOTEL',x+w/2-.8,h+1.9,z+depth/2+.34,1.65,1,'#e5a472','#fff2d9');}
    if(x===-149.5&&z===-26.5) {
      // A recognizable art-deco motel anchors the waterfront skyline.
      box(x-w/2+2,h+2,z+depth/2-2,4,5,4,0xefc590);
      box(x-w/2+2,h+4.7,z+depth/2-2,4.5,.4,4.5,C.trim);
      box(x-w/2+2,h+5.3,z+depth/2-2,3,.6,3,0xe29b78);
      box(x-w/2+2,h+5.8,z+depth/2-2,1.8,.4,1.8,C.trim);
      label('BAY MOTEL',x,4,z+depth/2+.09,13,1.5,'#528f87');
      label('OCEAN VIEW',x-w/2-.09,4,z,15,1.4,'#528f87','#fff2d9',-Math.PI/2);
      for(let stripe=0;stripe<3;stripe++)box(x-w/2-.05,7+stripe*.5,z,.1,.12,depth,0xfad5ae);
    }
  }
  // Carefully placed street planting leaves the intersections open.
  for(let ri=0;ri<city.roads.length;ri++) {
    const r=city.roads[ri];
    for(let j=0;j<4;j++) {
      const z=-132+j*88;
      palm(r-12.7,z,10.6+(j%2),ri*.4);palm(r+12.7,z+19,11.3,ri);
      if(ri!==0){box(r-12.7,.32,z,2.5,.65,2.5,0xcbbd9f);box(r+12.7,.32,z+19,2.5,.65,2.5,0xcbbd9f);}
    }
  }
  for(const park of city.parks) {
    const {x,z,kind}=park;
    box(x,.055,z,62,.17,62,C.walk);
    if(kind===0) {
      box(x,.17,z,55,.16,55,C.grass);
      box(x,.28,z,5,.08,57,C.walk);box(x,.28,z,57,.08,5,C.walk);
      cyl(x,.3,z,9.3,.38,C.trim);cyl(x,.58,z,7.7,.38,0xc5c4ad);cyl(x,.81,z,6.8,.07,0x78b7bc);
      cyl(x,1.1,z,2.2,.65,C.trim);cyl(x,1.95,z,.7,1.4,C.trim);cyl(x,2.65,z,2.8,.28,C.trim);cyl(x,2.82,z,2.5,.06,0x83c5c6);cyl(x,3.35,z,.3,1,C.trim);
      addCollider(city,x,z,8,8,1.2);
      for(const dx of [-21,21])for(const dz of [-21,21]){tree(x+dx,z+dz,1.3);tree(x+dx-5,z+dz+5,.8);}
      for(const dx of [-13,13]){bench(x+dx,z+7);bench(x+dx,z-7,Math.PI);}
      label('PALM SQUARE',x,1.1,z+30,9,1.6,'#6e8f73');box(x,1.1,z+29.7,10,2.3,.5,0x6e8f73);
    } else {
      // The coral filling station is the spawn landmark.
      box(x,2.1,z-15,24,4.2,13,0xf0d8b1);box(x,4.3,z-15,25,.5,14,C.trim);
      box(x,1.75,z-8.46,18,2.6,.08,C.window);label('FILL UP & GO',x,3.4,z-8.36,15,1.1,'#df7e59');
      box(x,4.9,z+4,29,.45,17,0xed926a);box(x,5.16,z+4,30,.14,18,C.trim);
      for(const dx of [-11,11])box(x+dx,2.6,z+4,.4,4.8,.4,C.trim);
      for(const dx of [-7,0,7]){box(x+dx,.22,z+4,3,.44,5,C.trim);box(x+dx,1.35,z+4,1.05,2.2,.85,0xe48762);box(x+dx,1.75,z+4.46,.74,.55,.035,0x395e5c);box(x+dx,1.1,z+4.48,.66,.25,.04,C.trim);addCollider(city,x+dx,z+4,.7,.7,2.5);}
      box(x-27,6,z+22,.3,12,.3,C.trim);box(x-27,10,z+22,5,4,.6,0xe17f59);label('SOL',x-27,10.4,z+22.32,4.2,1.5,'#e17f59');label('24 / 7',x-27,8.9,z+22.32,3.6,.7,'#e17f59');
      addCollider(city,x,z-15,12,6.5,4.5);
      umbrella(x+22,z-18,0x719f8d);palm(x+25,z+23,12);palm(x-25,z-25,10);
    }
  }
  // The boardwalk ramp: warm terracotta with an obvious arrow and safety stripes.
  const rx=city.rampX,rz=city.rampZ;
  const rampG=new THREE.BufferGeometry();
  rampG.setAttribute('position',new THREE.Float32BufferAttribute([rx-4.6,0,rz+13,rx+4.6,0,rz+13,rx+4.6,3.12,rz,rx-4.6,0,rz+13,rx+4.6,3.12,rz,rx-4.6,3.12,rz,rx-4.6,0,rz,rx-4.6,0,rz+13,rx-4.6,3.12,rz,rx+4.6,0,rz+13,rx+4.6,0,rz,rx+4.6,3.12,rz,rx-4.6,0,rz,rx-4.6,3.12,rz,rx+4.6,3.12,rz,rx-4.6,0,rz,rx+4.6,3.12,rz,rx+4.6,0,rz],3));rampG.computeVertexNormals();batches.set(0xc7845e,[rampG]);
  for(let n=0;n<7;n++){shape(boxGeometry,n%2?0x4e6864:0xf5ce77,rx-4.3,1.56,rz+6.5,.25,.06,13.5,-.235);shape(boxGeometry,n%2?0x4e6864:0xf5ce77,rx+4.3,1.56,rz+6.5,.25,.06,13.5,-.235);}
  shape(boxGeometry,C.trim,rx,1.61,rz+6.5,.22,.04,6,-.235);
  shape(boxGeometry,C.trim,rx-.7,2.2,rz+4,.2,.06,2,-.235,-.65);shape(boxGeometry,C.trim,rx+.7,2.2,rz+4,.2,.06,2,-.235,.65);
  // Seafront lifeguard hut, pier and sailboats, all simple flat color geometry.
  box(-241,1,-103,8,.6,7,0xe7bd8f);box(-241,3,-103,6,3.4,4.5,0xb2c7b1);shape(coneGeometry,0xecaf79,-241,5,-103,5,2,4,0,Math.PI/4);box(-241,3.3,-100.72,3,1.3,.08,C.window);
  box(-266,.35,141,91,.7,7,0xbaaa8d);for(let x=-224;x>-310;x-=8){cyl(x,-1,138,.2,4,0x8c9281);cyl(x,-1,144,.2,4,0x8c9281);}
  for(let j=0;j<4;j++) {
    const x=-270-j%2*27,z=65+j*42;
    shape(icoGeometry,C.trim,x,-.15,z,2.2,.8,5);cyl(x,4.7,z,.07,10,C.trim);
    const sail=new THREE.BufferGeometry();sail.setAttribute('position',new THREE.Float32BufferAttribute([x+.1,9,z,x+.1,.9,z+3.8,x+.1,.9,z],3));sail.computeVertexNormals();let batch=batches.get(0xfff2d7);if(!batch){batch=[];batches.set(0xfff2d7,batch);}batch.push(sail);
  }
  // Finish into a small set of shared-material draws. No per-building hot-loop objects.
  const staticMeshes=[];
  for(const [color,geometries] of batches) {
    // Normalize geometries to position/normal only so frond meshes can batch with boxes.
    for(let i=0;i<geometries.length;i++){let g=geometries[i];if(g.index){const replacement=g.toNonIndexed();g.dispose();g=replacement;geometries[i]=g;}g.deleteAttribute('uv');g.computeVertexNormals();}
    // Explicit per-face normals preserve the low-poly finish without recomputing
    // normals per fragment. Ground receives shadows but does not self-shadow.
    const twoSided=color===0x4e936e||color===0x6fa676||color===0xfff2d7;
    const merged=mergeGeometries(geometries,false);const material=new THREE.MeshStandardMaterial({color,roughness:1,metalness:0,side:twoSided?THREE.DoubleSide:THREE.FrontSide});
    const mesh=new THREE.Mesh(merged,material);mesh.castShadow=color!==C.road&&color!==C.water&&color!==C.walk&&color!==C.sand&&color!==C.grass&&color!==C.curb;mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;mesh.updateMatrix();scene.add(mesh);staticMeshes.push(mesh);
    for(const g of geometries)g.dispose();
  }
  boxGeometry.dispose();cylGeometry.dispose();coneGeometry.dispose();icoGeometry.dispose();
  return {staticMeshes,signs,signalV,signalH,signalPhase:-1};
}
