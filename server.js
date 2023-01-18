const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');
const notes = require('./db/db.json');
const uuid = require('./helpers/uuid');

const PORT = process.env.port || 3001;

const app = express();

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// Wildcard route to direct users to the index.html page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Send user to the notes page
app.get('/notes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/notes.html'));
});

// Get the notes
app.get('/api/notes', (req, res) => res.json(notes));

//POST route for adding a note
app.post('/api/notes', (req, res) => {
  // Log that a POST request was received
  console.info(`${req.method} request received to add a note`);

  // Destructuring assignment for the items in req.body
  const { title, text } = req.body;

  // If all the required properties are present
  if (title && text) {
    // Variable for the object we will save
    const newNote = {
      title,
      text,
      id: uuid(),
    };

    // Write the string to a file
    fs.readFile('./db/db.json', 'utf-8', function(err, data){
      var parsedNotes = JSON.parse(data);
      parsedNotes.push(newNote);
  
      fs.writeFile("./db/db.json", JSON.stringify(parsedNotes),(err) => console.log(err) );
    });

    const response = {
      status: 'success',
      body: newNote,
    };

    console.log(response);
    res.status(201).json(response);
  } else {
    res.status(500).json('Error in posting note');
  }
});




app.listen(PORT, () =>
  console.log(`App listening at http://localhost:${PORT} 🚀`)
);
