import React, { useState } from 'react';
import './index.css';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputType, setInputType] = useState('text'); // 'text' or 'image'
  
  const [descriptionInput, setDescriptionInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSuccess = (credentialResponse) => {
    console.log("Login Success:", credentialResponse);
    setIsAuthenticated(true);
  };

  const handleTextPredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/predict/text`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Bypass-Tunnel-Reminder": "true"
        },
        body: JSON.stringify({ description: descriptionInput })
      });
      const data = await res.json();
      setPrediction(data);
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend!");
    }
    setLoading(false);
  };

  const handleImagePredict = async (e) => {
    e.preventDefault();
    if (!imageFile) return;
    setLoading(true);
    setPrediction(null);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/predict/image`, {
        method: "POST",
        headers: {
          "Bypass-Tunnel-Reminder": "true"
        },
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) {
         throw new Error(data.detail || "Error from server");
      }
      
      setPrediction(data);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error processing image!");
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
        <div className="nav-actions">
          <button onClick={() => setIsAuthenticated(false)} className="logout-btn">Logout</button>
        </div>
      </nav>

      <main className="main-content">
        <div className="left-panel">
          <section className="input-section glass-card">
            <div className="tabs">
              <button className={inputType === 'text' ? 'active-tab' : ''} onClick={() => setInputType('text')}>Text Description</button>
              <button className={inputType === 'image' ? 'active-tab' : ''} onClick={() => setInputType('image')}>Image Upload (OCR)</button>
            </div>
            
            {inputType === 'text' ? (
              <form onSubmit={handleTextPredict}>
                <textarea 
                  placeholder="Paste the full Job Description here..." 
                  required 
                  rows="10" 
                  onChange={e => setDescriptionInput(e.target.value)}
                ></textarea>
                <button type="submit" disabled={loading} className="analyze-btn">
                  {loading ? 'Analyzing with BERT & RoBERTa...' : 'Analyze Post'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleImagePredict}>
                <div className="file-upload-box">
                  <input type="file" accept="image/*" required onChange={e => setImageFile(e.target.files[0])} />
                </div>
                <button type="submit" disabled={loading} className="analyze-btn">
                  {loading ? 'Extracting Text & Analyzing...' : 'Analyze Image Post'}
                </button>
              </form>
            )}
          </section>
        </div>

        <div className="right-panel">
          {loading && (
            <section className="results-placeholder glass-card" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
               <div className="loader"></div>
               <p style={{marginTop: '20px', color: '#94a3b8'}}>Processing via BERT & RoBERTa Models...</p>
               <p style={{fontSize: '0.85rem', color: '#64748b'}}>Running Real-Time World Verification...</p>
            </section>
          )}

          {prediction && !loading && (
            <section className="results-section glass-card">
              <h3>Analysis Result</h3>
              
              <div className="prediction-header">
                <div className={`status-badge ${prediction.prediction === 'Fake' ? 'status-fake' : 'status-real'}`}>
                  {prediction.prediction} Job
                </div>
                <div className="ensemble-score">
                  Overall Confidence: <strong>{(prediction.confidence * 100).toFixed(1)}%</strong>
                </div>
              </div>

              {/* Model Confidence Breakdown */}
              <div className="model-breakdown">
                 <h4>Deep Learning Model Breakdown</h4>
                 <div className="model-bars">
                    <div className="model-bar">
                      <span>BERT Model (Fake Probability)</span>
                      <div className="progress-bg">
                         <div className="progress-fill" style={{width: `${prediction.bert_confidence * 100}%`, backgroundColor: prediction.bert_confidence > 0.5 ? '#ef4444' : '#10b981'}}></div>
                      </div>
                      <span className="percent">{(prediction.bert_confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="model-bar">
                      <span>RoBERTa Model (Fake Probability)</span>
                      <div className="progress-bg">
                         <div className="progress-fill" style={{width: `${prediction.roberta_confidence * 100}%`, backgroundColor: prediction.roberta_confidence > 0.5 ? '#ef4444' : '#10b981'}}></div>
                      </div>
                      <span className="percent">{(prediction.roberta_confidence * 100).toFixed(1)}%</span>
                    </div>
                 </div>
              </div>

              {/* Real Time World Prediction */}
              <div className="verification-box">
                <h4>Real-Time World Verification</h4>
                
                {/* SerpAPI Check */}
                <div className="verify-item">
                  <h5>1. Live Web Search (LinkedIn/Indeed)</h5>
                  {prediction.verified_source === "Not Found Online" ? (
                      <p className="no-match" style={{fontSize: '1rem', fontWeight: 'bold', color: '#ef4444'}}>
                        ❌ Not Found on Trusted Job Boards
                      </p>
                  ) : (
                      <div>
                        <p className="real-match" style={{color: '#10b981', fontSize: '1rem', fontWeight: 'bold'}}>
                          ✅ Verified on {prediction.verified_source}
                        </p>
                        {prediction.exact_link && (
                          <a href={prediction.exact_link} target="_blank" rel="noreferrer" className="link-btn">
                            View Original Job Post
                          </a>
                        )}
                      </div>
                  )}
                </div>

                {/* Domain & Email Security Check */}
                <div className="verify-item" style={{marginTop: '15px'}}>
                   <h5>2. Contact & Domain Security</h5>
                   {prediction.suspicious_emails && prediction.suspicious_emails.length > 0 ? (
                      <div className="alert-box danger">
                         <strong>⚠️ Phishing Risk Detected:</strong> The post uses free email domains for a corporate job, which is a massive red flag.
                         <ul>
                           {prediction.suspicious_emails.map((email, i) => <li key={i}>{email}</li>)}
                         </ul>
                      </div>
                   ) : prediction.emails && prediction.emails.length > 0 ? (
                      <div className="alert-box safe">
                         ✅ Found Emails: {prediction.emails.join(', ')}. No suspicious free domains detected.
                      </div>
                   ) : (
                      <div className="alert-box info">
                         ℹ️ No email addresses found in the description.
                      </div>
                   )}
                </div>

                {/* Web Search Snippets */}
                {prediction.search_results && prediction.search_results.length > 0 && (
                  <div className="live-snippets" style={{marginTop: '15px'}}>
                    <h5>3. Live Search Snippets</h5>
                    <ul>
                      {prediction.search_results.map((res, i) => (
                        <li key={i}>
                          <span className="source-tag">{res.source}</span>
                          <a href={res.link} target="_blank" rel="noreferrer">{res.title}</a>
                          <p>{res.snippet}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Keyword Highlighting */}
              {prediction.keywords && prediction.keywords.length > 0 && (
                <div className="keywords-box" style={{marginTop: '20px'}}>
                  <h4>Suspicious Keywords Highlighted</h4>
                  <p style={{fontSize: '0.85rem', color: '#94a3b8', marginBottom: '10px'}}>The Deep Learning models heavily weighed these terms:</p>
                  <div className="tags">
                    {prediction.keywords.map((kw, i) => <span key={i} className="tag" style={{background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444'}}>{kw}</span>)}
                  </div>
                </div>
              )}
              
              {/* OCR Text */}
              {prediction.extracted_text && (
                 <div className="ocr-box" style={{marginTop: '20px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px'}}>
                    <h4>Extracted Text from Image (OCR)</h4>
                    <p className="extracted-text" style={{fontSize: '0.9rem', color: '#cbd5e1', fontStyle: 'italic'}}>{prediction.extracted_text}</p>
                 </div>
              )}

            </section>
          )}
          
          {!prediction && !loading && (
            <section className="results-placeholder glass-card">
              <p>Enter a job description or upload an image to see the BERT & RoBERTa real-time evaluation.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
