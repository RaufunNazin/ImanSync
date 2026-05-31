const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;
const getQiblaBearing = (lat, lon) => {
  const PI = Math.PI;
  const latK = KAABA_LAT * (PI / 180);
  const lonK = KAABA_LON * (PI / 180);
  const phi = lat * (PI / 180);
  const lambda = lon * (PI / 180);

  const y = Math.sin(lonK - lambda);
  const x = Math.cos(phi) * Math.tan(latK) - Math.sin(phi) * Math.cos(lonK - lambda);
  let bearing = Math.atan2(y, x) * (180 / PI);
  return (bearing + 360) % 360;
};
console.log(getQiblaBearing(23.8103, 90.4125));
