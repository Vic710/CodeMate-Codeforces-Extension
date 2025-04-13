const express = require('express');
const cors = require('cors');
const hintRoutes = require('./server/routes/hints');

const app = express();

// Enable CORS for your Chrome extension
app.use(cors({
    origin: 'chrome-extension://*'
}));

app.use(express.json());

// Routes
app.use('/api', hintRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Python environment: ${process.env.VIRTUAL_ENV || 'Not detected'}`);
});