const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Database connected'))
  .catch((err) => console.error('Database connection error:', err));

mongoose.connection.on('error', (err) => {
  console.error('Database connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Database disconnected');
});

module.exports = mongoose;
