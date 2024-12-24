import React from 'react';
// import logo from './logo.svg';
import './App.css';
import {useState} from 'react';

function App() {
// const [codeVerifier, setCodeVerifier] = useState<string>("");
const [accessToken, setAccessToken] = useState<string>("");

const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const generateCodeChallenge = async (verifier: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const startPKCEFlow = async () => {
  const verifier = generateCodeVerifier();
  // setCodeVerifier(verifier); // Store it in state (optional)
  localStorage.setItem('code_verifier', verifier); // Persist in local storage
  console.log('Code Verifier:', verifier);

  const challenge = await generateCodeChallenge(verifier);
  console.log('Code Challenge:', challenge);

  const authUrl = `http://localhost:4000/authorize?response_type=code&client_id=your-client-id&redirect_uri=http://localhost:3000/callback&code_challenge=${challenge}&code_challenge_method=S256`;
  window.location.href = authUrl; // Redirect to the authorization server
};

const exchangeCodeForToken = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const storedCodeVerifier = localStorage.getItem('code_verifier'); // Retrieve from local storage
  console.log('Authorization Code:', code);
  console.log('Stored Code Verifier:', storedCodeVerifier);

  if (code && storedCodeVerifier) {
    try {
      const response = await fetch('http://localhost:4000/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          code_verifier: storedCodeVerifier, // Use the stored code verifier
          client_id: 'your-client-id',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      setAccessToken(data.access_token);
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  } else {
    console.log("Code or Code Verifier is missing");
  }
};

  return (
    <div className="App">
      <button onClick={startPKCEFlow}>Start PKCE Flow</button>
      <button onClick={exchangeCodeForToken}>Exchange Code for Token</button>
      {accessToken && <p>Access Token: {accessToken}</p>}
    </div>
  );
}

export default App;
