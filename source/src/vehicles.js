import * as THREE from 'three';

const materialCache=new Map();
const boxGeometry=new THREE.BoxGeometry(1,1,1);
const wheelGeometry=new THREE.CylinderGeometry(.41,.41,.3,12);wheelGeometry.rotateZ(Math.PI/2);
const hubGeometry=new THREE.CylinderGeometry(.22,.22,.315,10);hubGeometry.rotateZ(Math.PI/2);
function mat(color) {if(!materialCache.has(color))materialCache.set(color,new THREE.MeshStandardMaterial({color,roughness:.74,metalness:.03,flatShading:true}));return materialCache.get(color);}
function part(parent,x,y,z,w,h,d,color){const m=new THREE.Mesh(boxGeometry,mat(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}

export function createCar(b,type,color) {
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const w=b.carWidth[type],l=b.carLength[type],paint=b.carColors[color];
  const chassis=part(body,0,.62,0,w,.52,l*.91,paint);
  part(body,0,.4,0,w*.96,.14,l*.91,0x344951);
  const hood=part(body,0,.93,-l*.32,w*.96,.17,l*.28,paint);
  const trunk=part(body,0,.91,l*.35,w*.94,.2,l*.23,paint);
  // Sloped glass cabin: the pronounced rake gives the coupe its silhouette.
  const cabin=new THREE.Group();body.add(cabin);
  const isVan=type===4,isOpen=type===3,cabinH=isVan?1.35:type===2?.9:.72;
  const cabinZ=type===1?.2:type===4?.15:.13,cabinL=type===1?l*.57:type===4?l*.72:l*.46;
  if(!isOpen) {
    const cw=w*.8,roofW=w*.7,y=.99,ch=cabinH,front=cabinZ-cabinL/2,back=cabinZ+cabinL/2;
    const geometry=new THREE.BufferGeometry();
    const vertices=[-cw/2,y,front,cw/2,y,front,roofW/2,y+ch,front+.35,-roofW/2,y+ch,front+.35,-cw/2,y,back,cw/2,y,back,roofW/2,y+ch,back-.25,-roofW/2,y+ch,back-.25];
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex([2,1,0,3,2,0,6,5,1,2,6,1,7,4,5,6,7,5,3,0,4,7,3,4,6,2,3,7,6,3]);geometry.computeVertexNormals();
    const glass=new THREE.Mesh(geometry,mat(0x325865));glass.castShadow=true;cabin.add(glass);
    part(cabin,0,y+ch+.02,cabinZ+.04,roofW+.07,.12,cabinL-.6,isVan?paint:paint);
    for(const x of [-w*.405,w*.405]){part(cabin,x,y+ch*.43,cabinZ,.065,ch*.91,.13,paint);}
    if(isVan){part(cabin,0,1.48,l*.12,w*.83,1.3,l*.53,paint);part(cabin,0,2.17,l*.12,w*.87,.12,l*.56,0xf6e4c9);part(cabin,0,1.52,l*.413,w*.61,.51,.045,0x45646a);}
    if(type===1){part(cabin,-.54,1.91,.15,.075,.075,2,0x4c5953);part(cabin,.54,1.91,.15,.075,.075,2,0x4c5953);}
  } else {
    part(cabin,0,1.02,.3,w*.75,.25,l*.37,0x5c483c);
    for(const x of [-.44,.44]){part(cabin,x,1.25,.28,.6,.64,.22,0xf3d7a2);part(cabin,x,1.12,-.01,.6,.15,.55,0xf3d7a2);}
    const windshield=part(cabin,0,1.4,-.85,w*.8,.65,.07,0x46737a);windshield.rotation.x=.24;
    part(cabin,0,1.75,-.77,w*.83,.065,.08,0xe7dcc9);
  }
  // Bumpers, square lamps, sculpted wheel arches, and tiny readable plates.
  const frontBumper=part(body,0,.54,-l*.485,w*.97,.18,.13,0xe8dac3);
  const backBumper=part(body,0,.54,l*.485,w*.97,.18,.13,0xe8dac3);
  part(body,0,.72,-l*.468,w*.32,.2,.05,0x334b50);
  for(const x of [-w*.33,w*.33]) {
    part(body,x,.79,-l*.466,w*.23,.22,.06,0xffe9b2);
    part(body,x,.79,l*.464,w*.23,.2,.07,0xb74038);
    part(body,x*1.62,1.16,-.47,.19,.13,.25,paint);
  }
  part(body,0,.54,l*.5,.55,.16,.03,0xf6e3ad);
  if(type===0||type===5){part(body,0,1.16,l*.41,w*.91,.075,.3,paint);part(body,-.62,1.04,l*.4,.075,.2,.09,0x3e5254);part(body,.62,1.04,l*.4,.075,.2,.09,0x3e5254);}
  const wheels=[],hubs=[];
  for(const x of [-w*.47,w*.47])for(const z of [-l*.29,l*.29]) {
    const pivot=new THREE.Group();pivot.position.set(x,.43,z);root.add(pivot);
    const tire=new THREE.Mesh(wheelGeometry,mat(0x293c42));tire.castShadow=true;pivot.add(tire);
    const hub=new THREE.Mesh(hubGeometry,mat(0xddd7c8));pivot.add(hub);wheels.push(pivot);hubs.push(hub);
    part(body,x,.7,z,.15,.16,.99,paint);
  }
  // A pool-owned damage piece only becomes visible after a severe impact.
  const cracked=new THREE.Group();cabin.add(cracked);
  for(let i=0;i<3;i++){const c=part(cracked,-.2+i*.16,1.26+i*.1,-.83,.035,.37,.028,0xb8d8cb);c.rotation.z=-.65+i*.42;c.rotation.x=.45;}
  cracked.visible=false;
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(w*1.15,l*1.06),new THREE.MeshBasicMaterial({color:0x344b45,transparent:true,opacity:.15,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.028;root.add(shadow);
  const paintMaterial=mat(paint).clone();root.traverse(node=>{if(node.isMesh&&node.material===mat(paint))node.material=paintMaterial;});
  return {root,body,chassis,hood,trunk,cabin,frontBumper,backBumper,wheels,hubs,cracked,shadow,paintColor:new THREE.Color(paint),paintMaterial};
}

export function createPlayer() {
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  part(body,0,1.16,0,.52,.64,.32,0xf9e9c9);
  part(body,0,.84,0,.48,.15,.33,0xb16547);
  part(body,0,1.72,0,.34,.4,.34,0xc68c63);
  part(body,0,1.94,.025,.38,.1,.38,0x544943);part(body,0,1.82,.17,.36,.19,.07,0x544943);
  part(body,0,1.76,-.179,.34,.06,.025,0x394844);
  const legs=[],arms=[];
  for(const side of [-1,1]) {
    const leg=new THREE.Group();leg.position.set(side*.145,.87,0);body.add(leg);part(leg,0,-.35,0,.21,.66,.25,0x4a7077);part(leg,0,-.73,-.04,.24,.16,.39,0xf7dfb8);legs.push(leg);
    const arm=new THREE.Group();arm.position.set(side*.34,1.43,0);body.add(arm);part(arm,0,-.14,0,.18,.3,.26,0xf9e9c9);part(arm,0,-.44,0,.15,.33,.2,0xc68c63);arms.push(arm);
  }
  return {root,body,legs,arms};
}
