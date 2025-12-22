
const mongoose = require('mongoose');
const Class = require('./src/models/Class');
const User = require('./src/models/User');

require('dotenv').config();

const checkDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const classes = await Class.find({}).populate('students.student');
    console.log(`Found ${classes.length} classes`);

    for (const c of classes) {
      console.log(`Class: ${c.name} (${c.code})`);
      console.log('Students:', JSON.stringify(c.students, null, 2));
      console.log('Join Requests:', JSON.stringify(c.joinRequests, null, 2));
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDb();
