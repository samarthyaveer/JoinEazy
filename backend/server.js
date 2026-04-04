require('dotenv').config();
const app = require('./src/app');
const { migrate } = require('./src/db/migrate');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await migrate({ closePool: false });
    app.listen(PORT, () => {
      console.log(`[JoinEazy API] Running on port ${PORT}`);
      console.log(`[JoinEazy API] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[JoinEazy API] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
