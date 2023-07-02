const express = require("express");
const mongoose = require("mongoose");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/index.html');
})

mongoose.connect('mongodb://127.0.0.1:27017', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.log(error));

// User model
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required:true },
    password:{ type:String, required:true }
  });
  
  const User = mongoose.model('User', userSchema);


// Configure Google OAuth
passport.use(new GoogleStrategy({
    clientID: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    callbackURL: 'http://localhost:3000/auth/google/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    // Find or create a user based on the Google profile
    User.findOne({ email: profile.emails[0].value }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        user = new User({
          email: profile.emails[0].value,
          password: '' // You can set a random password for Google users or handle it differently
        });
        user.save(err => {
          if (err) console.log(err);
          return done(err, user);
        });
      } else {
        return done(err, user);
      }
    });
  }
));

// Passport session setup
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

app.use(passport.initialize());
app.use(passport.session());

// Sign Up

  app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/signup.html'); // Render the 'signup.html' file
});


app.post('/signup', async (req, res) => {

    const data = {
        email: req.body.email,
        password: req.body.password
    }

    const checking = await User.findOne({ email: req.body.email })

   try{
    if (checking.email === req.body.email && checking.password===req.body.password) {
        res.send("user details already exists")
    }
    else{
        await User.insertMany([data])
    }
   }
   catch{
    res.send("Wrong input")
   }

    res.status(201).sendFile(__dirname + '/index.html', {
        naming: req.body.email
    })
})

// LogIn

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html'); // Render the 'login.html' file
});

app.post('/login', async (req, res) => {

    try {
        const check = await User.findOne({ email: req.body.email })

        if (check.password === req.body.password) {
            res.status(201).sendFile(__dirname + '/login.html', { naming: `${req.body.password}+${req.body.email}` })
        }
        else {
            res.send("incorrect password")
        }
    } 
    catch {
        res.send("wrong details")
    }
})

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to dashboard
    res.redirect('/dashboard');
  });

// Dashboard route
app.get('/dashboard', (req, res) => {
  if (req.user) {
    res.send('Welcome to the dashboard!');
  } else {
    res.redirect('/login');
  }
});

app.listen(3000,()=>{
    console.log("Server listening on port 3000");
})