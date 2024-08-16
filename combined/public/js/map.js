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

async function getPolylineDataFromDB(){
    const response = await fetch('/coords');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const coords = await response.json();
    const tuples = coords.map(coord => [coord.lat, coord.lon]);
    return tuples
}

async function getLastCoordinate(){
    const response = await fetch('/coords/last');
    if (!response.ok)
        return []
    const coords = await response.json();
    if (coords == null)
        return []
    return [coords.latitude, coords.longitude]
}

async function getCurrentSpeed(){
    const response = await fetch('/coords/speed');
    if (!response.ok)
        return 0
    const speed = await response.json();
    if (speed == null)
        return 0
    return speed.speed_kmh;
}

function getDateTime(datetimeString){
    const date = new Date(datetimeString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return year+"/"+month+"/"+day+" "+hours+":"+minutes+":"+seconds;
}

async function getLastTime(){
    const response = await fetch('/coords/last');
    if (!response.ok)
        return getDateTime(new Date())
    const coord = await response.json();
    if (coord == null)
        return getDateTime(new Date())

    const date = new Date(coord.createdAt);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return year+"/"+month+"/"+day+" "+hours+":"+minutes+":"+seconds;
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

    // const lastCoordinate = await getLastCoordinate();
    // const currentSpeed = await getCurrentSpeed();
    // const lastUpdated = await getLastTime();

    const sleep = await getSleepData('js/sleep.txt');
    console.log(sleep);

    for (var i = 0; i < sleep.length; i++){
        console.log(sleep[i]);
        L.marker([sleep[i][0], sleep[i][1]]).addTo(map).bindPopup(sleep[i][2]);
    }

    

    // if (lastCoordinate.length == 2){
    //     L.marker(lastCoordinate).addTo(map)
    //         .bindPopup('Marius is currently here.\nCurrent speed: ' + currentSpeed + 'km/h.(last updated:' + lastUpdated +")")
    //         .openPopup();

    //     var timeout = 1000;
    //     setTimeout(function() {map.flyTo(lastCoordinate, 8);}, timeout);    
    // }
}