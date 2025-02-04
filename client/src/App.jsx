import { useEffect, useState } from 'react';
import axios from 'axios';
import socket from './socket';

function App() {
  const [votes, setVotes] = useState([]);
  const [newVote, setNewVote] = useState(false); 
  const [question, setQuestion] = useState(''); 
  const [questionAdded, setQuestionAdded] = useState(false); 

 
  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get('http://localhost:8000/getVotes');
      setVotes(response.data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleAnswerOutput = ({ id, answer }) => {
      setVotes((prevVotes) =>
        prevVotes.map((vote) =>
          vote._id === id
            ? {
                ...vote,
                yes: answer === 1 ? vote.yes + 1 : vote.yes,
                no: answer === 0 ? vote.no + 1 : vote.no,
              }
            : vote
        )
      );
    };

    socket.on('answer:output', handleAnswerOutput);

    return () => {
      socket.off('answer:output', handleAnswerOutput);
    };
  }, [votes]);

  const handleAnswerInput = (id, answer) => {
    socket.emit('answer:input', { id, answer });
  };

  const handleAddVote = async () => {
    try {
      const response = await axios.post('http://localhost:8000/new-vote', { question });

      setVotes((prevVotes) => [
        ...prevVotes,
        {
          _id: response.data._id,
          question: question,
          yes: 0,
          no: 0,
        },
      ]);

      setQuestion('');
      setNewVote(false);
      setQuestionAdded(true); 

      socket.emit('new-vote-added', { question });
    } catch (error) {
      console.error("Error adding new vote:", error);
    }
  };

  useEffect(() => {
    socket.on('new-vote-added', () => {
      setQuestionAdded(true);
    });

    return () => {
      socket.off('new-vote-added');
    };
  }, []);

  return (
    <div className="container">
      <div className="flex-between">
        <h1>Voting System</h1>
        <h3>{questionAdded ? 'Question Added' : 'Add Your Question Here'}</h3> {}
        <button onClick={() => setNewVote(!newVote)}>
          {newVote ? 'Cancel' : 'New Vote'}
        </button>
      </div>

      {newVote && (
        <div className="flex-center">
          <input
            type="text"
            placeholder="Enter Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button onClick={handleAddVote}>Add Vote</button>
        </div>
      )}

      <div className="vote-card-container">
        {votes.map((vote, index) => {
          const totalVote = vote.yes + vote.no;
          const yesPercent = totalVote ? (vote.yes * 100) / totalVote : 0;
          const noPercent = totalVote ? (vote.no * 100) / totalVote : 0;
          return (
            <div className="vote-card" key={index}>
              <h1>Q: {vote.question}</h1>
              <div
                className="vote-bar flex-between"
                onClick={() => handleAnswerInput(vote._id, 1)}
              >
                <div
                  className="yes"
                  style={{ width: `${yesPercent}%` }}
                ></div>
                <p>Yes</p>
                <p>{vote.yes}</p>
              </div>
              <div
                className="vote-bar flex-between"
                onClick={() => handleAnswerInput(vote._id, 0)}
              >
                <div
                  className="no"
                  style={{ width: `${noPercent}%` }}
                ></div>
                <p>No</p>
                <p>{vote.no}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
