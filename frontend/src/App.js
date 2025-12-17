import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'; 
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const chatEndRef = useRef(null);

  // Scroll to bottom when history changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSend = async () => {
    if (!message && !file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('message', message);
    if (file) {
      formData.append('file', file);
    }

    // Create a temporary URL to show the image in chat immediately
    const fileUrl = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

    try {
      // Add User Message to History immediately
      const newHistory = [...chatHistory, { 
        role: 'user', 
        text: message, 
        fileName: file ? file.name : null,
        fileUrl: fileUrl 
      }];
      setChatHistory(newHistory);
      
      // Clear Inputs
      setMessage('');
      setFile(null);
      if(document.getElementById('docInput')) document.getElementById('docInput').value = ""; 
      if(document.getElementById('imgInput')) document.getElementById('imgInput').value = "";

      // --- DEPLOYMENT UPDATE: Pointing to Render Backend ---
      const response = await fetch('https://my-chatbot-backend-4n4v.onrender.com/chat', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'model', text: data.reply }]);
      
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to send message. Make sure the Backend is running!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      // --- DEPLOYMENT UPDATE: Pointing to Render Backend ---
      await fetch('https://my-chatbot-backend-4n4v.onrender.com/reset', { method: 'POST' });
      setChatHistory([]);
      setFile(null);
      setMessage('');
    } catch (error) {
      console.error("Error resetting:", error);
    }
  };

  const triggerFile = (id) => document.getElementById(id).click();

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <header>
        <div className="logo" style={{display: 'flex', alignItems: 'center'}}>
          {/* Unique Gradient Star SVG */}
          <svg width="36" height="36" viewBox="0 0 100 100" style={{marginRight: '10px'}}>
            <defs>
              <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4b90ff" />
                <stop offset="100%" stopColor="#ff5546" />
              </linearGradient>
            </defs>
            <path fill="url(#starGradient)" d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" />
          </svg>
          My Chatbot
        </div>
        
        <div className="header-controls">
            <button onClick={toggleTheme} className="theme-btn" title="Toggle Theme">
                {isDarkMode ? '☀️' : '🌙'}
            </button>
            {chatHistory.length > 0 && (
            <button onClick={handleReset} className="reset-link">New Chat</button>
            )}
        </div>
      </header>

      {/* --- WELCOME SCREEN --- */}
      {chatHistory.length === 0 ? (
        <div className="welcome-container">
          <div className="welcome-text">
            <span className="gradient-text">Hello, Himanshu</span>
            <div className="sub-text">How can I assist you?</div>
          </div>
          
          <div className="input-wrapper centered">
             {/* PREVIEW */}
             {file && (
                <div className="file-preview">
                    {file.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(file)} alt="preview" className="img-thumbnail" />
                    ) : (
                      <span style={{fontSize: '1.5rem'}}>📄</span>
                    )}
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                    </div>
                    <button className="remove-file" onClick={() => setFile(null)}>×</button>
                </div>
             )}

             <div className="input-container">
                <button className="icon-btn" onClick={() => triggerFile('docInput')} title="Attach Document">
                    <span style={{fontSize: '1.2rem'}}>📎</span>
                </button>
                
                <input 
                  type="text" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask My Chatbot"
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                
                <button className="icon-btn" onClick={() => triggerFile('imgInput')} title="Upload Image">
                    <span style={{fontSize: '1.2rem'}}>📷</span>
                </button>
                
                <button className="send-btn" onClick={() => handleSend()} disabled={isLoading}>
                    {isLoading ? <div className="btn-spinner"></div> : '➤'}
                </button>
             </div>
          </div>
        </div>
      ) : (
        /* --- ACTIVE CHAT WINDOW --- */
        <div className="chat-window">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              {/* Show Image in History */}
              {msg.fileUrl ? (
                <img src={msg.fileUrl} alt="uploaded" className="chat-image" />
              ) : msg.fileName && (
                <div style={{fontSize:'0.8rem', marginBottom:'5px', opacity: 0.7}}>
                  📎 {msg.fileName}
                </div>
              )}
              
              <div className="text-content">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          
          {/* Typing Animation */}
          {isLoading && (
            <div className="message model">
                <div className="typing-indicator">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
      )}

      {/* --- BOTTOM INPUT BAR --- */}
      {chatHistory.length > 0 && (
        <div className="input-wrapper bottom">
           {file && (
              <div className="file-preview">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt="preview" className="img-thumbnail" />
                  ) : (
                    <span style={{fontSize: '1.5rem'}}>📄</span>
                  )}
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                  </div>
                  <button className="remove-file" onClick={() => setFile(null)}>×</button>
              </div>
           )}
           <div className="input-container">
              <button className="icon-btn" onClick={() => triggerFile('docInput')} title="Attach Document">
                  <span style={{fontSize: '1.2rem'}}>📎</span>
              </button>
              <input 
                type="text" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask My Chatbot"
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button className="icon-btn" onClick={() => triggerFile('imgInput')} title="Upload Image">
                  <span style={{fontSize: '1.2rem'}}>📷</span>
              </button>
              
              <button className="send-btn" onClick={() => handleSend()} disabled={isLoading}>
                  {isLoading ? <div className="btn-spinner"></div> : '➤'}
              </button>
           </div>
        </div>
      )}

      <input id="docInput" type="file" onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.txt" style={{display:'none'}} />
      <input id="imgInput" type="file" onChange={(e) => setFile(e.target.files[0])} accept=".png,.jpg,.jpeg" style={{display:'none'}} />
    </div>
  );
}

export default App;