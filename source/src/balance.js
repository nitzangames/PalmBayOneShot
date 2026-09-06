export const B = Object.freeze({
  seed: 73129, carCount: 62, trafficCount: 26, particleCount: 220, skidCount: 900,
  roadSpacing: 88, roadHalf: 10, worldEdge: 218, fixedDt: 1 / 60,
  walkSpeed: 4.3, runSpeed: 7.6, interactionRange: 5.2,
  carNames: ['Comet GT', 'Vista Cruiser', 'Pico', 'Sundowner', 'Atlas Van', 'Rallye'],
  carClasses: ['Sport coupe', 'Estate wagon', 'City compact', 'Open-top cruiser', 'Utility van', 'Sport sedan'],
  carLength: new Float32Array([4.7, 5.1, 3.7, 5, 5.4, 4.6]),
  carWidth: new Float32Array([2.15, 2.12, 1.94, 2.22, 2.25, 2.1]),
  carTopSpeed: new Float32Array([49, 36, 35, 42, 30, 45]),
  carAcceleration: new Float32Array([13, 8.5, 10.5, 11, 7, 12]),
  carMass: new Float32Array([1.05, 1.35, .85, 1.2, 1.75, 1.1]),
  carColors: [0xef634a, 0xf5c85e, 0x78b9ba, 0xf2ede0, 0x708fbd, 0x90ad78, 0xce8294, 0x3f827c, 0xe09e62, 0x444f62],
  districtNames: ['PALM AVENUE', 'THE BOARDWALK', 'OLD TOWN', 'SUNSET HEIGHTS', 'GARDEN DISTRICT', 'MARINA DRIVE'],
});

export function validateBalance() {
  if (B.trafficCount >= B.carCount || B.fixedDt <= 0 || B.carTopSpeed.length !== B.carNames.length) throw new Error('Invalid simulation balance');
}
