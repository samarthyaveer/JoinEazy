require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[JoinEazy API] Running on port ${PORT}`);
  console.log(`[JoinEazy API] Environment: ${process.env.NODE_ENV || 'development'}`);
});
