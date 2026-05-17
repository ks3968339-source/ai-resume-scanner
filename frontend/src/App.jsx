import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import './index.css';

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const analyzeResume = async () => {
    if (!file || !jobDescription.trim()) {
      alert("Please provide both a resume PDF and a job description.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setResults(data);
    } catch (error) {
      alert("Error analyzing resume: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- UI COMPONENTS ---

  const renderUploadState = () => (
    <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI Resume Scanner
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Match your resume against any job description in seconds.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Drag & Drop Zone */}
        <div 
          onClick={() => fileInputRef.current.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
            borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer',
            background: isDragging ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
            transition: 'all 0.3s ease'
          }}
        >
          <input type="file" ref={fileInputRef} hidden accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} />
          <UploadCloud size={48} color={isDragging ? 'var(--accent-primary)' : 'var(--text-muted)'} style={{ margin: '0 auto', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            {file ? file.name : 'Drag & drop your PDF resume'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>or click to browse files</p>
        </div>

        {/* Job Description Textarea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-muted)' }}>Target Job Description</label>
          <textarea 
            rows={5}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job requirements here..."
            style={{
              width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)',
              borderRadius: '12px', padding: '1rem', color: 'var(--text-main)',
              fontFamily: 'inherit', resize: 'vertical', outline: 'none'
            }}
          />
        </div>

        {/* Submit Button */}
        <button 
          onClick={analyzeResume}
          disabled={loading || !file || !jobDescription}
          style={{
            background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '1rem',
            borderRadius: '12px', fontSize: '1.1rem', fontWeight: '600', cursor: (loading || !file || !jobDescription) ? 'not-allowed' : 'pointer',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
            opacity: (loading || !file || !jobDescription) ? 0.7 : 1,
            boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)', transition: 'all 0.2s ease'
          }}
        >
          {loading ? <Sparkles className="animate-spin" /> : 'Analyze Match'}
        </button>
      </div>
    </div>
  );

  const renderResults = () => {
    // Calculate stroke dasharray for the circular progress
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (results.score / 100) * circumference;
    const scoreColor = results.score >= 75 ? 'var(--success)' : results.score >= 50 ? '#eab308' : 'var(--danger)';

    return (
      <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '900px' }}>
        <button onClick={() => setResults(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ← Scan Another Resume
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }}>
          {/* Left Column: Score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '16px' }}>
            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
              <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="80" cy="80" r={radius} fill="transparent" stroke="var(--glass-border)" strokeWidth="12" />
                <circle cx="80" cy="80" r={radius} fill="transparent" stroke={scoreColor} strokeWidth="12"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '700', color: scoreColor }}>{results.score}%</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Match Rate</span>
              </div>
            </div>
          </div>

          {/* Right Column: Skills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '1rem' }}><CheckCircle size={20} /> Matched Skills</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {results.matchedTechnologies.map((tech, i) => (
                  <span key={i} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{tech}</span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '1rem' }}><AlertCircle size={20} /> Missing Skills</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {results.missingTechnologies.map((tech, i) => (
                  <span key={i} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{tech}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Actionable Advice */}
        <div style={{ marginTop: '2.5rem', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '16px' }}>
          <h3 style={{ color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--accent-primary)" /> Actionable Advice
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.actionableAdvice.map((advice, i) => (
              <li key={i} style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <ChevronRight size={20} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{advice}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      {!results ? renderUploadState() : renderResults()}
    </div>
  );
}

export default App;
