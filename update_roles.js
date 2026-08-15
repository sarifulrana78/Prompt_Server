const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: './.env' });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const db = mongoose.connection.db;
    await db.collection('user').updateOne({ email: 'creator@promptbase.com' }, { $set: { role: 'Creator' } });
    await db.collection('user').updateOne({ email: 'admin@promptbase.com' }, { $set: { role: 'Admin' } });
    console.log('Roles updated successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
