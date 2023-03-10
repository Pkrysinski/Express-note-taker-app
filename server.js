const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');
const notes = require('./db/db.json');
const uuid = require('./helpers/uuid');

// Set the port to be either what Heroku uses (case-sensitive), or our defaul localhost:3001
const PORT = process.env.PORT || 3001;

const app = express();

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// Promise version of fs.readFile
const readFromFile = util.promisify(fs.readFile);

/**
 *  Function to write data to the JSON file given a destination and some content
 *  @param {string} destination The file you want to write to.
 *  @param {object} content The content you want to write to the file.
 *  @returns {void} Nothing
 */
const writeToFile = (destination, content) =>
  fs.writeFile(destination, JSON.stringify(content, null, 4), (err) =>
    err ? console.error(err) : console.info(`\nData written to ${destination}`)
  );

/**
 *  Function to read data from a given a file and append some content
 *  @param {object} content The content you want to append to the file.
 *  @param {string} file The path to the file you want to save to.
 *  @returns {void} Nothing
 */
const readAndAppend = (content, file) => {
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
    } else {
      const parsedData = JSON.parse(data);
      parsedData.push(content);
      writeToFile(file, parsedData);
    }
  });
};

// Function to remove an object from an array, based on ID
const removeObjectWithId = (array, id) => {
  const objectWithID = array.findIndex((obj) => obj.id === id);

  // Make sure that object with ID exists in array, then use splice method to remove.
  if (objectWithID > -1) {
    array.splice(objectWithID, 1);
  }

  // Return the new array
  return array;
}

// Wildcard route to direct users to the index.html page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Send user to the notes page
app.get('/notes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/notes.html'));
});

// Get the notes
app.get('/api/notes', (req, res) => {
  readFromFile('./db/db.json').then((data) => res.json(JSON.parse(data)));
});

// POST route for adding a note
app.post('/api/notes', (req, res) => {

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

    // Read the db.json file, and append new note (aka refresh page)
    readAndAppend(newNote, './db/db.json');    

    const response = {
      status: 'success',
      body: newNote,
    };

    res.status(201).json(response);
  } else {
    res.status(500).json('Error in posting note');
  };
});

// DELETE route for deleting a note
app.delete('/api/notes/:id', (req, res) => {

  let id = req.params.id;

  if(id) {
    fs.readFile('./db/db.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
      } else {
        // Read data
        const parsedData = JSON.parse(data);
  
        // Delete Item (remove from the array)
        removeObjectWithId(parsedData,id);
  
        // Write data
        writeToFile('./db/db.json', parsedData);
  
        // Return new data back to UI
        const response = {
          status: 'success',
          body: parsedData,
        };
        res.status(201).json(response);      
      };
    });
  } else {
    res.status(500).json('Error in deleting note');    
  };
});


app.listen(PORT, () =>
  console.log(`App listening at http://localhost:${PORT} ????`)
);
