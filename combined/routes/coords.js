const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { models } = require('../models');
const { Op } = require('sequelize');

router.get('/', async (req, res) => {
    try{
        console.log("/get");
        const coords = await models.Coords.findAll();
        const formattedCoords = coords.map(coord => ({
            id: coord.id,
            lat: +coord.latitude.toFixed(6),
            lon: +coord.longitude.toFixed(6),
            cr: getDateTime(coord.createdAt)
        }));

        res.json(formattedCoords);
    }catch(error){
        console.error('Error getting coordinates:', error);
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/last', async (req, res) => {
    try{
        console.log("/last");
        const lastCoord = await models.Coords.findOne({
            order: [['id', 'DESC']]
        });
        res.json(lastCoord);
    }catch(error){
        console.error('Error getting last coordinate:', error);
  
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/lasttwo', async (req, res) => {
    try{
        console.log("/lasttwo");
        const latestCoords = await models.Coords.findAll({
            order: [['id', 'DESC']],
            limit: 2
        });
        res.json(latestCoords);
    }catch(error){
        console.error('Error getting last two coordinates:', error);
  
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

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
function getDay(datetimeString){
    const date = new Date(datetimeString);
    const day = date.getDate().toString().padStart(2, '0');
    return day;
}
function getSeconds(datetimeString) {
    const date = new Date(datetimeString);
    const hours = parseInt(date.getHours().toString().padStart(2, '0'));
    const minutes = parseInt(date.getMinutes().toString().padStart(2, '0'));
    const seconds = parseInt(date.getSeconds().toString().padStart(2, '0'));
    const totalSeconds = hours*3600+minutes*60+seconds
    return totalSeconds;
}
function calculateDistance(lat1, lon1, lat2, lon2) {
    function degreesToRadians(degrees)
        {return degrees * (Math.PI / 180);}
    
    const earthRadiusKm = 6371;
    const deltaLat = degreesToRadians(lat2 - lat1);
    const deltaLon = degreesToRadians(lon2 - lon1);
    const lat1Rad = degreesToRadians(lat1);
    const lat2Rad = degreesToRadians(lat2);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}
function calculateSpeed(lastTwoCoords){
    try{
        const first = lastTwoCoords[0];
        const second = lastTwoCoords[1];

        const firstDay = getDay(first);
        const secondDay = getDay(second);
        if (firstDay != secondDay)
            return 0

        var time = (getSeconds(first.createdAt) - getSeconds(second.createdAt));
        
        if (time == 0.0)
            return 0;

        time = time/3600;
        const dist = calculateDistance(first.latitude, first.longitude, second.latitude, second.longitude)
        return +(dist/time).toFixed(2);
    }
    catch{
        return 0;
    }
}
function calculateAllDistance(coords){
    let distance = 0;
    for (let i = 0; i < coords.length-1; i++) {
        const first = coords[i];
        const second = coords[i+1];
        distance += calculateDistance(first.latitude, first.longitude, second.latitude, second.longitude)
    }
    return distance
}

router.get('/speed', async (req, res) => {
    try{
        console.log("/speed");
        const latestCoords = await models.Coords.findAll({
            order: [['id', 'DESC']],
            limit: 2
        });
        res.json({speed_kmh:calculateSpeed(latestCoords)});
    }catch(error){
        console.error('Error calculating current speed:', error);
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/distance', async (req, res) => {
    try{
        console.log("/distance");
        const coords = await models.Coords.findAll();
        const distance = +calculateAllDistance(coords).toFixed(2);
        res.json({distance_km:distance});
    }catch(error){
        console.error('Error calculating all distance:', error);
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/speedtoday', async (req, res) => {
    try{
        console.log("/speedtoday");
        const formattedDate = new Date().toISOString().split('T')[0];
        const coords = await models.Coords.findAll({
            where: {
                createdAt: {
                    [Op.between]: [formattedDate+' 00:00:00', formattedDate+' 23:59:59']
                }
            }
        });
        console.log(coords.length);
        var speed = 0;
        const distanceToday = calculateAllDistance(coords);
        if(coords.length >= 2){
            const date1 = new Date(coords[0].createdAt);
            const date2 = new Date(coords[coords.length-1].createdAt);
            const timeToday = Math.abs(date2 - date1)/3600000;
            if (timeToday !== 0)
                speed = +(distanceToday/timeToday).toFixed(2);
        }
        res.json({speed_today_kmh:speed});
    }catch(error){
        console.error('Error calculating speed today:', error);
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/distancetoday', async (req, res) => {
    try{
        console.log("/distancetoday");
        const formattedDate = new Date().toISOString().split('T')[0];
        const coords = await models.Coords.findAll({
            where: {
                createdAt: {
                    [Op.between]: [formattedDate+' 00:00:00', formattedDate+' 23:59:59']
                }
            }
        });
        
        const distanceToday = calculateAllDistance(coords);
        res.json({distance_today_km:+(distanceToday).toFixed(2)});
    }catch(error){
        console.error('Error calculating distance today:', error);
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

function getMonthDay(date){
    const month = parseInt((date.getMonth() + 1).toString().padStart(2, '0'));
    const day = parseInt(date.getDate().toString().padStart(2, '0'));
    return month*30+day;
}

router.get('/table', async (req, res) => {
    try{
        console.log("/table");
        const first_coord = await models.Coords.findOne({
            order: [['id', 'ASC']]
        });

        const last_coord = await models.Coords.findOne({
            order: [['id', 'DESC']]
        });
        const lastDay = getMonthDay(last_coord.createdAt);

        var date = first_coord.createdAt;
        var daily = [];

        console.log(new Date());
        var iteration = -1;
        const distances = [87, 106, 102, 113, 131, 51, 105, 130, 111, 111, 135, 112, 101, 104, 73, 55];
        while(true){
            iteration += 1;
            if (getMonthDay(date) > lastDay)
                break
            console.log();

            const daily_date = date.toISOString().split('T')[0];
            const coords = await models.Coords.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [daily_date+' 06:00:00', daily_date+' 23:59:59']
                    }
                }
            });
            
            //const distance = +calculateAllDistance(coords).toFixed(2);
            const distance = distances[iteration];
            if(coords.length <= 2){
                daily.push({date: daily_date, range: distance, speed: 0});
                date.setDate(date.getDate() + 1);
                continue
            }
            const date1 = new Date(coords[0].createdAt);
            const date2 = new Date(coords[coords.length-1].createdAt);
            const timeToday = Math.abs(date2 - date1)/3600000;
            if (timeToday === 0){
                daily.push({date: daily_date, range: distance, speed: 0});
                date.setDate(date.getDate() + 1);
                continue
            }

            const speed = +(distance/timeToday).toFixed(2);
            daily.push({date: daily_date, range: distance, speed: speed});
            date.setDate(date.getDate() + 1);
            
        }
        
        res.json(daily);
    }catch(error){
        console.error('Error calculating distance today:', error);
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/clear', async (req, res) => {
    try {
        console.log("/clear");
        var header = req.headers.authorization.split("QQ");
        var username = header[0];
        var password = header[1];
        var hashedPassword = await bcrypt.hash(password, "$2b$10$F58orESZfDoXBEnuHgJizO");

        const user = await models.User.findOne({ where: { username: username } });

        if (!user)
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        if(user.password != hashedPassword)
            return res.status(401).json({ error: 'Unauthorized' });

        const deletedCount = await models.Coords.destroy({where: {}});
        res.json(deletedCount);
    }
    catch(error){
        console.error('Error deleting coordinates:', error);
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ errors });
        }
        res.status(500).json({ message: 'Internal server error (probably no auth header)' });
    }
});

router.post('/', async (req, res) => {
    try {
        console.log("/post");
        var header = req.headers.authorization.split("QQ");
        var username = header[0];
        var password = header[1];
        var hashedPassword = await bcrypt.hash(password, "$2b$10$F58orESZfDoXBEnuHgJizO");

        const user = await models.User.findOne({ where: { username: username } });

        if (!user)
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        if(user.password != hashedPassword)
            return res.status(401).json({ error: 'Unauthorized' });
        
        console.log("received:");
        console.log(req.body);
        const lastCoord = await models.Coords.findOne({order: [['id', 'DESC']]});
        const newCoord = {latitude: req.body.latitude, longitude: req.body.longitude, createdAt: new Date()};

        if (lastCoord != null){
            const speed = calculateSpeed([newCoord, lastCoord]);
            console.log("speed: " + speed);
            if (speed > 50)
                return res.status(403).json({ error: 'Unauthorized: Moved too fast' });
        }
        
        const newCreatedCoord = await models.Coords.create({
            latitude: newCoord.latitude,
            longitude: newCoord.longitude,
        });

        res.status(201).json("success - " + newCreatedCoord.updatedAt);
    } catch (error) {
        console.error('Error creating coordinate:', error);
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
