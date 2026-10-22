const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const crypto = require("crypto");

app.use(express.urlencoded({ extended: false }));

const users = []; // each: { _id, username, log: [{description, duration, date}] }

const findUser = (id) => users.find((u) => u._id === id);

// Create a user
app.post("/api/users", (req, res) => {
  const { username } = req.body;
  if (!username) return res.json({ error: "username is required" });

  const user = {
    _id: crypto.randomBytes(12).toString("hex"),
    username,
    log: []
  };
  users.push(user);

  res.json({ username: user.username, _id: user._id });
});

// List all users
app.get("/api/users", (req, res) => {
  res.json(users.map(({ username, _id }) => ({ username, _id })));
});

// Add an exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  const user = findUser(req.params._id);
  if (!user) return res.json({ error: "unknown user id" });

  const { description, duration, date } = req.body;

  // Use today if no date is supplied
  const exerciseDate = date ? new Date(date) : new Date();
  if (isNaN(exerciseDate.getTime())) {
    return res.json({ error: "Invalid Date" });
  }

  const exercise = {
    description,
    duration: Number(duration),
    date: exerciseDate // stored as a Date so we can filter later
  };
  user.log.push(exercise);

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
    _id: user._id
  });
});

// Get a user's log, with optional from / to / limit
app.get("/api/users/:_id/logs", (req, res) => {
  const user = findUser(req.params._id);
  if (!user) return res.json({ error: "unknown user id" });

  const { from, to, limit } = req.query;
  let log = user.log;

  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      log = log.filter((e) => e.date >= fromDate);
    }
  }
  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      log = log.filter((e) => e.date <= toDate);
    }
  }
  if (limit && !isNaN(parseInt(limit))) {
    log = log.slice(0, parseInt(limit));
  }

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log: log.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }))
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
