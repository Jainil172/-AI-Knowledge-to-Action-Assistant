import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, X, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { documentsApi } from '../services/api';

const MAX_SIZE_MB = 10;

export default function Upload() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const validateAndSetFile = (f) => {
    setError('');
    setUploadSuccess(false);
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are supported. Please select a valid PDF.');
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum allowed size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFile(f);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => { e.preventDefault(); validateAndSetFile(e.dataTransfer.files[0]); };
  const handleChange = (e) => validateAndSetFile(e.target.files[0]);
  const removeFile = () => { setFile(null); setError(''); setUploadSuccess(false); setProgress(0); };

  const handleUpload = async () => {
    if (!file) { setError('Please select a PDF file to upload.'); return; }
    setIsUploading(true);
    setProgress(10);

    // Simulate progress stages
    const fake = setInterval(() => {
      setProgress(p => p < 85 ? p + 5 : p);
    }, 400);

    try {
      const res = await documentsApi.upload(file);
      clearInterval(fake);
      setProgress(100);
      setUploadSuccess(true);
      setSuccessData(res.document);
    } catch (err) {
      clearInterval(fake);
      setError(err.message || 'Upload failed. Please try again.');
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div style={{ maxWidth: '640px' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Upload Document</h1>
          <p className="page-subtitle">
            Upload a PDF document. The AI will analyze the content and extract tasks, risks, decisions, and key insights automatically.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '28px' }}>
        {!file ? (
          /* Drop zone */
          <div>
            <label
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '200px', border: '2px dashed var(--color-surface-border)',
                borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-raised)',
                cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = '#eff6ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-surface-border)'; e.currentTarget.style.background = 'var(--color-surface-raised)'; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <UploadCloud size={24} color="var(--color-primary)" />
              </div>
              <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Drag and drop a PDF here
              </span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                or click to browse from your computer
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: 'white', border: '1px solid var(--color-surface-border)', borderRadius: '20px', padding: '3px 12px' }}>
                PDF only · Max {MAX_SIZE_MB} MB
              </span>
              <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleChange} id="file-input" />
            </label>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px', color: 'var(--color-danger)' }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                {error}
              </div>
            )}
          </div>
        ) : (
          /* File selected */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* File info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-surface-border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {uploadSuccess
                  ? <CheckCircle2 size={22} color="var(--color-success)" />
                  : <File size={20} color="var(--color-primary)" />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB · PDF Document
                </div>

                {/* Progress bar */}
                {isUploading && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: 500 }}>
                      <span style={{ color: 'var(--color-primary)' }}>
                        {progress < 100 ? 'Processing with AI…' : 'Analysis complete'}
                      </span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{progress}%</span>
                    </div>
                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: 'var(--color-primary)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )}
              </div>

              {!isUploading && !uploadSuccess && (
                <button
                  onClick={removeFile}
                  className="btn-icon"
                  aria-label="Remove file"
                  style={{ flexShrink: 0 }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px', color: 'var(--color-danger)' }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                {error}
              </div>
            )}

            {/* Success banner */}
            {uploadSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-lg)', padding: '16px 18px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={20} color="var(--color-success)" />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#15803d' }}>Analysis complete!</div>
                    <div style={{ fontSize: '13px', color: '#16a34a' }}>AI has extracted insights from this document.</div>
                  </div>
                </div>
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--color-success)', color: 'white', borderColor: '#15803d' }}
                  onClick={() => navigate(`/documents/${successData?.id}`)}
                >
                  View Insights <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Actions */}
            {!isUploading && !uploadSuccess && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={removeFile}>Cancel</button>
                <button className="btn btn-primary" onClick={handleUpload} id="upload-btn">
                  <UploadCloud size={16} /> Process Document
                </button>
              </div>
            )}

            {isUploading && !uploadSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                AI is analyzing your document. This may take a moment…
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info note */}
      <div style={{ marginTop: '16px', padding: '14px 18px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--radius-md)', fontSize: '13px', color: '#0c4a6e', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <span style={{ fontWeight: 700, flexShrink: 0 }}>ℹ</span>
        <span>
          The AI will extract <strong>tasks</strong>, <strong>risks</strong>, <strong>decisions</strong>, and key insights from your document.
          Make sure your PDF contains readable text (not just scanned images).
        </span>
      </div>
    </div>
  );
}
