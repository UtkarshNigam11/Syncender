const express = require('express');
const dotenv = require('dotenv');
const eventRoutes = require('./routes/eventRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
const app = express();
app.use(express.json());
app.use('/', eventRoutes);
app.use('/', authRoutes);

app.listen(5000, () => {
  console.log('Server running at http://localhost:5000');
});
