export function allocateGameData(b, city) {
  const s = {
    time: 0, tick: 0, rng: b.seed, carCount: b.carCount, playerX: -165.3, playerZ: 47,
    playerY: 0, playerAngle: 0, playerMoving: 0, playerStride: 0, playerStumble: 0,
    controlled: -1, nearest: -1, steals: 0, wrecks: 0, collisions: 0, distance: 0, topSpeed: 0,
    eventId: 0, eventType: 0, eventStrength: 0, eventCar: -1, eventTime: 0,
    cameraMode: 0, cameraYaw: -.4, inputForward: 0, inputSteer: 0, inputBrake: 0, inputRun: 0,
    particleCursor: 0, skidCursor: 0, district: 0, city,
  };
  for (const k of ['x','z','y','vx','vz','vy','angle','speed','steer','health','hitCooldown','impact','roll','pitch','wheelSpin','aiWait','aiStuck','aiTargetSpeed','lastSkidLX','lastSkidLZ','lastSkidRX','lastSkidRZ']) s[k] = new Float32Array(b.carCount);
  for (const k of ['type','color','mode','route','routePoint','countedWreck','skidding']) s[k] = new Uint8Array(b.carCount);
  for (const k of ['px','py','pz','pvx','pvy','pvz','pLife','pMaxLife','pSize']) s[k] = new Float32Array(b.particleCount);
  s.pKind = new Uint8Array(b.particleCount);
  for (const k of ['skidX','skidZ','skidAngle','skidLength','skidLife']) s[k] = new Float32Array(b.skidCount);
  return s;
}
