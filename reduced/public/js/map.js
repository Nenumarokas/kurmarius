var map = L.map('map').setView([55, 13], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
}).addTo(map);

drawCurrentMap();

var blueMarker = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [50, 82],
  iconAnchor: [25, 82],
  popupAnchor: [1, -68],
});

var greenMarker = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function processPolylineData(polylineData)
{
  let polylineCoords = [];
  let lines = polylineData.split('\n');
  lines.forEach(line => {
    let [lat, lon] = line.split(';');
    if (lat && lon)
    {
      polylineCoords.push([parseFloat(lat), parseFloat(lon)]);
    }
  });
  return polylineCoords;
}

async function getPolylineData(filepath)
{
  const data = await fetch(filepath);
  const polyline = await data.text();
  polylineCoords = processPolylineData(polyline);
  return polylineCoords
}

async function getFileCoordData(filepath)
{
  const pointData = await (await fetch(filepath)).text();

  let pointCoords = [];
  let points = pointData.split('\n');
  points.forEach(line =>
  {
    let [lat, lon, text1, text2] = line.split(';');
    if (lat && lon && text1)
    {
      pointCoords.push([
        parseFloat(lat),
        parseFloat(lon),
        text1.trim(),
        text2.trim()
      ]);
    }
  });
  return pointCoords
}

async function drawCurrentMap()
{
  let polylineCoords1 = await getPolylineData('js/trip_reduced_points.txt');
  let polylineLayer1 = L.polyline(polylineCoords1, { color: 'blue' }).addTo(map);

  let polylineCoords2 = await getPolylineData('js/output_reduced.txt');
  let polylineLayer2 = L.polyline(polylineCoords2, { color: 'red' }).addTo(map);

  polylineLayer2.bringToFront();
  map.fitBounds(polylineCoords1);

  const images = await getFileCoordData('js/images.txt');
  images.forEach(row => {
    var color = blueMarker;
    var opacity = 0.5;
    if(row[3] == '')
    {
      color = greenMarker;
      opacity = 1.0;
    }
    L.marker(
      [row[0], row[1]],
      {
        icon: color,
        opacity: opacity
      })
      .addTo(map)
      .bindPopup(`<img src="./images/${row[2]}" style="max-width:500px; max-height:500px; width:auto; height:auto;"><p>${row[3]}</p>`);
  });
}