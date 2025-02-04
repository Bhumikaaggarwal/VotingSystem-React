const express = require('express');
const http = require('http');
const cors = require('cors');
const {Server: SocketServer} = require('socket.io');

const app = express();
app.use(express.json());
app.use(cors());
const server = http.createServer(app);

const PORT = 8000;

require('./connection');

const Questions = require('././models/questionModel');

const io = new SocketServer({
    cors: '*'
});

async function createNewVote(question){
    try {
        const newVote = await Questions.create({
            question,
            yes: 0,
            no: 0
        })
    
        await newVote.save();
    } catch (error) {
        console.error('Error While Saving into DB: ', error);
    }
}

async function updateVote(id, answer){
    try {
        const update = answer === 0 ? {no: 1} : {yes: 1};

        await Questions.updateOne({_id: id}, {$inc: update});
    } catch (error) {
        console.error('Error While Saving into DB: ', error);
    }
}

app.post('/new-vote', async(req, res)=>{
    try {
        const {question} = req.body;

        await createNewVote(question);

        return res.json({msg: 'Saved'});
    } catch (error) {
        console.error('Something Went Wrong: ', error);
        return res.status(500).json({msg: 'Something Went Wrong'});
    }
});

app.get('/getVotes', async(req, res)=>{
    const questions = await Questions.find();

    return res.json(questions);
})

io.on('connection', (socket)=>{
    console.log('New Connection: ', socket.id);

    socket.on('answer:input', async(data)=>{
        try {
        await updateVote(data.id, data.answer);

        io.emit('answer:output', ({id: data.id, answer: data.answer}));
        } catch (error) {
            console.error('Something Went wrong', error)
        }
    })
})

io.attach(server);

server.listen(PORT, ()=> console.log(`Server is Running on ${PORT}`));