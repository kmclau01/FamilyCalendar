require('dotenv').config();
const express = require('express');
const path = require('path');
const { getEvents } = require('./controllers/calendarController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/events', getEvents);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});