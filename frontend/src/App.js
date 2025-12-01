import React, { useState, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || ''; // proxy in dev or set REACT_APP_API_BASE for production

export default function App(){
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const fileRef = useRef();

  function onFilesSelected(e){
    const f = e.target.files[0];
    if(!f) return;
    setFile(f);
    setMessage('');
  }

  function onDrop(e){
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if(!f) return;
    setFile(f);
    setMessage('');
  }

  async function convert(){
    if(!file){ setMessage('Please upload a file'); return; }
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isWord = ['doc','docx'].includes(ext);
    const isImage = file.type && file.type.startsWith('image');

    const fd = new FormData();
    fd.append('file', file);

    try{
      setMessage('Uploading...');
      let endpoint = '';
      if(isWord) endpoint = (API_BASE || '') + '/word-to-pdf';
      else if(isImage) endpoint = (API_BASE || '') + '/image-to-pdf';
      else { setMessage('Unsupported file type'); return; }

      const resp = await fetch(endpoint, { method: 'POST', body: fd });
      if(!resp.ok) throw new Error('Server error');

      const blob = await resp.blob();
      const filename = (file.name.replace(/\.[^.]+$/, '') || 'converted') + '.pdf';
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage('Conversion complete — download should start');
    }catch(err){
      console.error(err);
      setMessage('Conversion failed: ' + (err.message || err));
    }
  }

  return (
    <div className="app">
      <div className="card">
        <div className="panel" onDragOver={(e)=>e.preventDefault()} onDrop={onDrop}>
          <h2>Convert Word / Image to PDF</h2>
          <div className="drop" onClick={()=>fileRef.current.click()}>
            <input ref={fileRef} type="file" style={{display:'none'}} accept=".doc,.docx,image/*" onChange={onFilesSelected} />
            <div style={{fontWeight:700, fontSize:18}}>Drag & drop files here or click to browse</div>
            <div className="muted" style={{marginTop:8}}>Supported: .doc, .docx, .jpg, .jpeg, .png, .webp</div>
          </div>

          <div className="preview">
            {file && (
              <div className="file-row">
                {file.type && file.type.startsWith('image') ? (
                  <img src={URL.createObjectURL(file)} alt="preview" onLoad={(e)=>URL.revokeObjectURL(e.target.src)} />
                ) : (
                  <div style={{width:64,height:64,display:'flex',alignItems:'center',justifyContent:'center',background:'#eef2ff',borderRadius:8,fontWeight:700}}>DOC</div>
                )}
                <div style={{flex:1}}>
                  <div style={{fontWeight:700}}>{file.name}</div>
                  <div className="muted">{Math.round(file.size/1024)} KB</div>
                </div>
                <div>
                  <button className="btn" onClick={convert}>Convert to PDF</button>
                </div>
              </div>
            )}
          </div>

          <div style={{marginTop:12}} className="muted">{message}</div>
        </div>

        <div className="panel">
          <h3>How it works</h3>
          <p className="muted">Upload a Word document or an image and click Convert. The file is sent to the Node.js backend which returns the generated PDF.</p>
          <hr />
          {/* <p className="muted">For production, set REACT_APP_API_BASE to your backend URL when building the app.</p> */}
        </div>
      </div>
    </div>
  );
}
