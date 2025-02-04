const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/polling';

mongoose.connect(MONGO_URI).then(()=>{
    console.log('Connected to MongoDB Database')
}).catch((error)=>{
    console.log('Error: ',error);
});

module.exports = mongoose;