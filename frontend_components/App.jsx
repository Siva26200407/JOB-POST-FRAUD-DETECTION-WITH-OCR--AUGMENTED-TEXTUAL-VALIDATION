import React, { useState } from 'react';
import './index.css';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [textInput, setTextInput] = useState({ title: '', company: '', description: '', requirements: '' });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSuccess = (credentialResponse) => {
    console.log("Login Success:", credentialResponse);
    setIsAuthenticated(true);
  };

  const handleTextPredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend prediction call
      const res = await fetch("http://localhost:8000/predict/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: textInput.title,
          company_profile: textInput.company,
          description: textInput.description,
          requirements: textInput.requirements
        })
      });
      const data = await res.json();
      
      // Backend verification call (SerpAPI)
      const verifyRes = await fetch(`http://localhost:8000/verify-job?title=${textInput.title}&company=${textInput.company}`);
      const verifyData = await verifyRes.json();
      
      setPrediction({ ...data, verification: verifyData });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <GoogleOAuthProvider clientId={clientId}>
        <div className="login-container">
          <div className="glass-card">
            <h1>Fake Job Detection</h1>
            <p>Secure your career with AI-powered job verification.</p>
            <div className="google-btn-wrapper">
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={() => console.log('Login Failed')}
                theme="filled_black"
                shape="pill"
              />
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h2>JobGuard AI</h2>
        <button onClick={() => setIsAuthenticated(false)} className="logout-btn">Logout</button>
      </nav>

      <main className="main-content">
        <section className="input-section glass-card">
          <h3>Analyze Job Post</h3>
          <form onSubmit={handleTextPredict}>
            <input type="text" placeholder="Job Title" required onChange={e => setTextInput({...textInput, title: e.target.value})} />
            <input type="text" placeholder="Company Name" required onChange={e => setTextInput({...textInput, company: e.target.value})} />
            <textarea placeholder="Job Description" required rows="4" onChange={e => setTextInput({...textInput, description: e.target.value})}></textarea>
            <textarea placeholder="Requirements" required rows="4" onChange={e => setTextInput({...textInput, requirements: e.target.value})}></textarea>
            <button type="submit" disabled={loading} className="analyze-btn">
              {loading ? 'Analyzing...' : 'Analyze Post'}
            </button>
          </form>
        </section>

        {prediction && (
          <section className="results-section glass-card">
            <h3>Analysis Result</h3>
            <div className={`status-badge ${prediction.prediction === 'Fake' ? 'status-fake' : 'status-real'}`}>
              {prediction.prediction} ({Math.round(prediction.confidence * 100)}%)
            </div>
            
            <div className="keywords-box">
              <h4>Highlighted Keywords</h4>
              <div className="tags">
                {prediction.keywords.map(kw => <span key={kw} className="tag">{kw}</span>)}
              </div>
            </div>

            {prediction.verification && (
              <div className="verification-box">
                <h4>Real-World Web Search</h4>
                {prediction.verification.found_matches ? (
                  <ul>
                    {prediction.verification.results.map((res, i) => (
                      <li key={i}>
                        <span className="source-tag">{res.source}</span>
                        <a href={res.link} target="_blank" rel="noreferrer">{res.title}</a>
                        <p>{res.snippet}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-match">No matching jobs found on LinkedIn, Indeed, or Naukri.</p>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
