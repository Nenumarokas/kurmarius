var map = L.map('map').setView([55, 13], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
}).addTo(map);

drawCurrentMap();

function processPolylineData(polylineData) {
    let polylineCoords = [];
    let lines = polylineData.split('\n');
    lines.forEach(line => {
      let [lat, lon] = line.split(';');
      if (lat && lon) {
        polylineCoords.push([parseFloat(lat), parseFloat(lon)]);
      }
    });
    return polylineCoords;
}

async function getPolylineData(filepath){
    const data = await fetch(filepath);
    const polyline = await data.text();
    polylineCoords = processPolylineData(polyline);
    return polylineCoords
}

async function getSleepData(filepath){
    const data = await fetch(filepath);
    const pointData = await data.text();

    let pointCoords = [];
    let points = pointData.split('\n');
    points.forEach(line => {
      let [lat, lon, text] = line.split(';');
      if (lat && lon && text) {
        pointCoords.push([parseFloat(lat), parseFloat(lon), text]);
      }
    });
    return pointCoords
}

async function drawCurrentMap(){
    let polylineCoords1 = [];
    let polylineCoords2 = [];
    try {
        polylineCoords1 = await getPolylineData('js/trip_reduced_points.txt');
        let polylineLayer1 = L.polyline(polylineCoords1, { color: 'blue' }).addTo(map);

        polylineCoords2 = await getPolylineData('js/output_reduced.txt');
        let polylineLayer2 = L.polyline(polylineCoords2, { color: 'red' }).addTo(map);


        polylineLayer2.bringToFront();
        map.fitBounds(polylineCoords1);
    
    } catch (error) {
        console.error('Error fetching or drawing polylines', error);
        return;
    }

    const sleep = await getSleepData('js/sleep.txt');
    console.log(sleep);

    for (var i = 0; i < sleep.length; i++){
        console.log(sleep[i]);
        L.marker([sleep[i][0], sleep[i][1]]).addTo(map).bindPopup(sleep[i][2]);
    }
}