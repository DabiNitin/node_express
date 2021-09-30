const express = require('express');
const session = require('express-session');
const router = express.Router();
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs')
const path = require('path');
const options = {
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": '*',
    "Access-Control-Allow-Headers": 'Content-Type,x-xsrf-token',
    "Access-Control-Expose-Headers": true,
    "Access-Control-Allow-Methods": 'POST, GET, PUT, DELETE, OPTIONS'
};

app.use(session({ secret: 'secret_key', saveUninitialized: true, resave: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(options));

let userSession;

function authenticateUser(req, res, next) {
    if (req.session.email !== undefined) {
        console.log("User is authenticated!");
        next();
    } else {
        console.log("Unauthorised access!");
        res.send(`<h3>Please login to access feature.</h3><a href='/'>Login</a>`);
    }
}

router.get('/', (req, res) => {
    userSession = req.session;
    if (userSession.email) {
        return res.redirect('/api/proxy/');
    }
    res.sendFile(path.join(__dirname + '/index.html'));
});


router.post('/login', (req, res) => {
    userSession = req.session;
    userSession.email = req.body.email;
    res.end('done');
});

router.get('/api/proxy/*', authenticateUser, (req, res, next) => {
    res.write(`<div>`);
    res.write(`<h3>Hello ${userSession.email},</h3>`);
    res.write(`<h4>Open Postman with interceptor and browse '/save/:id' with post method and set Cookie data, and pass some JSON to store in the file</h4>`);
    res.write(`</div>`);
    res.end('<a href=' + '/logout' + '>Logout</a>');
    next();
});

router.get('/pub/proxy/*', authenticateUser, (req, res, next) => {
    res.write(`<div>`);
    res.write(`<h3>Hello ${userSession.email},</h3>`);
    res.write(`<h4>Open Postman and browse '/save/:id' with post method 
    and pass some Json to store file</h4>`);
    res.write(`</div>`);
    res.end('<a href=' + '/logout' + '>Logout</a>');
    next();
});

router.post('/save/:id', authenticateUser, function (req, res) {
    if (!fs.existsSync(`${__dirname}/data`)) {
        fs.mkdirSync(`${__dirname}/data`);
    }
    fs.writeFile(`${__dirname}/data/${req.params.id}.json`, JSON.stringify(req.body), (err) => {
        if (err) throw err;
        res.status(201).json('The file has been saved!');
    });
});

router.get('/save/:id', authenticateUser, (req, res, next) => {
    if (fs.existsSync(`${__dirname}/data/${req.params.id}.json`)) {
        let data = fs.readFileSync(`${__dirname}/data/${req.params.id}.json`);
        res.status(200).json(JSON.parse(data));
    } else {
        res.status(201).json('File not found');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/');
    });
});

app.use('/', router);
app.get('*', function (req, res) {
    res.end('Page not found');
});
app.listen(process.env.PORT || 3000, () => {
    console.log(`App Started on PORT ${process.env.PORT || 3000}`);
});
