// Author-time city geometry. Simulation only reads these bounds and lane routes.
export function makeCityData(b) {
  const city = { colliderCount: 0, blockCount: 0, collX: new Float32Array(1024), collZ: new Float32Array(1024), collW: new Float32Array(1024), collD: new Float32Array(1024), collH: new Float32Array(1024), buildings: [], parks: [], roads: new Float32Array([-176,-88,0,88,176]), routes: [], rampX: -197, rampZ: -52 };
  let seed = b.seed;
  const rand = () => { seed = Math.imul(1664525, seed) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
  for (let bx = 0; bx < 4; bx++) for (let bz = 0; bz < 4; bz++) {
    const x = -132 + bx * 88, z = -132 + bz * 88;
    if ((bx === 2 && bz === 1) || (bx === 0 && bz === 2)) { city.parks.push({x,z,kind:0}); continue; }
    if (bx === 2 && bz === 2) { city.parks.push({x,z,kind:1}); continue; }
    for (let a = -1; a <= 1; a += 2) for (let c = -1; c <= 1; c += 2) {
      const w = 22 + rand() * 7, d = 20 + rand() * 9;
      const h = 7 + Math.floor(rand() * 4) * 3.1 + (bz === 0 ? rand() * 6 : 0);
      const building = {x:x+a*17.5,z:z+c*17.5,w,d,h,palette:Math.floor(rand()*9),style:Math.floor(rand()*4),sign:city.buildings.length % 12};
      if(bx===0&&bz===1&&a===-1&&c===1){building.palette=2;building.style=3;building.sign=2;}
      city.buildings.push(building);
      addCollider(city, building.x, building.z, w/2, d/2, h);
    }
  }
  // Small beachfront stores and houses around the perimeter.
  for (let j = 0; j < 9; j++) {
    const z = -155 + j * 39;
    const building = {x:203,z,w:24,d:24,h:8+(j%3)*3,palette:j%9,style:j%4,sign:j%12};
    city.buildings.push(building); addCollider(city,203,z,12,12,building.h);
  }
  for (let j = 0; j < 8; j++) {
    const x=-148+j*44;
    const building={x,z:-205,w:30,d:20,h:9+(j%3)*4,palette:(j+3)%9,style:j%4,sign:j%12};
    city.buildings.push(building);addCollider(city,x,-205,15,10,building.h);
  }
  // clockwise and counterclockwise lane loops, always on the right side of the road
  const rectangles=[[-176,-176,176,176],[-88,-88,88,88],[-176,-88,88,176],[-88,-176,176,88],[-176,0,0,176],[0,-176,176,0]];
  for(const rect of rectangles) {
    const [l,t,r,d]=rect, lane=4.7;
    city.routes.push(new Float32Array([l+lane,t+lane,r-lane,t+lane,r-lane,d-lane,l+lane,d-lane]));
    city.routes.push(new Float32Array([l-lane,t-lane,l-lane,d+lane,r+lane,d+lane,r+lane,t-lane]));
  }
  return city;
}

export function addCollider(city,x,z,w,d,h) {
  const i=city.colliderCount++;
  city.collX[i]=x;city.collZ[i]=z;city.collW[i]=w;city.collD[i]=d;city.collH[i]=h;
}
