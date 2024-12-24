const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const crypto = require("crypto");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000',
}));

const CLIENT_ID = 'your-client-id';
const SECRET_KEY = 'your-secret-key';
const REDIRECT_URI = 'http://localhost:3000/callback';
let codeStore = {};

app.get('/authorize', (req, res) => {
    const { response_type, client_id, redirect_uri, code_challenge, code_challenge_method } = req.query;

    if (client_id !== CLIENT_ID || redirect_uri !== REDIRECT_URI) {
        return res.status(400).send("Invalid ClientId or RedirectURI");
    }

    const authorizationCode = Math.random().toString(36).substring(2, 15);
    codeStore[authorizationCode] = { code_challenge, code_challenge_method };

    res.redirect(`${redirect_uri}?code=${authorizationCode}`);
});

app.post('/token', (req, res) => {
    const { code_verifier, code, client_id } = req.body;

    if (client_id !== CLIENT_ID || !codeStore[code]) {
    return res.status(400).send("Invalid request");
    }

    const { code_challenge, code_challenge_method } = codeStore[code];

    const verifierHash = crypto.createHash('sha256').update(code_verifier).digest('base64')
    .replace(/\+/g, '-') // URL-safe replacements
    .replace(/\//g, '_')
    .replace(/=+$/, '');

    if (verifierHash !== code_challenge) {
        return res.status(400).send("Invalid code verifier");
    }

    const accessToken = jwt.sign({ client_id }, SECRET_KEY, { expiresIn: '1h' });

    delete codeStore[code];

    res.json({ access_token: accessToken });
});


app.listen(4000, () => console.log("Server running on http://localhost:4000"));