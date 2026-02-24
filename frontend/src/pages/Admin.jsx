// src/pages/Admin.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useProducts } from '../store/useProducts';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

const CATEGORY_PRESETS = [
  { value: 'branding', label: 'Branding' },
  { value: 'uiux', label: 'UI/UX Design' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'webdev', label: 'Web Development' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'video', label: 'Video' },
];

// Base URL for your uploader API (change if needed or set REACT_APP_API_BASE)
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const empty = {
  title: '',
  category: '', // store just the slug/string
  image: '',
  client: '',
  services: '',
  url: '',
  description: '',
  skillsText: '',
  video: '',
  docsText: ''
};

function parseDocs(text) {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const [label, url, type = 'other'] = l.split('|').map(x => x?.trim() || '');
      return { label, url, type: type || 'other' };
    });
}
function toDocsText(docs) {
  return (docs || []).map(d => [d.label, d.url, d.type || ''].join('|')).join('\n');
}
function strToSkills(text) {
  return text.split(',').map(s => s.trim()).filter(Boolean);
}
function skillsToStr(arr) {
  return (arr || []).join(', ');
}
function slugify(s) {
  return (s || '').toLowerCase().trim().replace(/\s+/g, '-');
}
function extFromName(name = '') {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)(?:\?.*)?$/);
  return m ? m[1] : '';
}
function labelFromName(name = '') {
  return name.replace(/\.[^/.]+$/, '');
}
// ensure URLs are absolute (helpful if server returns "/uploads/..")
function absolutizeUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    return u.href;
  } catch {
    // relative path → join with API_BASE
    return `${API_BASE.replace(/\/+$/,'')}/${url.replace(/^\/+/, '')}`;
  }
}

export default function Admin() {
  const { items, add, update, remove, load } = useProducts();
  const authed = useAuth(s => s.isAuthed());

  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const fileRef = useRef();

  // category dropdown + popup state
  const [categories, setCategories] = useState(CATEGORY_PRESETS);
  const [showCatPopup, setShowCatPopup] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // docs upload state
  const [docFiles, setDocFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // ✅ Hooks must not be conditional. So keep this useEffect always running.
  // It will only load when authed is true.
  useEffect(() => {
    if (!authed) return;
    load();
  }, [authed, load]);

  // ✅ Removed duplicate useEffect() that called load() twice.

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { setForm(prev => ({ ...prev, image: reader.result })); };
    reader.readAsDataURL(f);
  }

  async function uploadSelectedDocs() {
    if (!docFiles.length) return;
    try {
      setUploading(true);
      setUploadMsg('Uploading…');

      const fd = new FormData();
      docFiles.forEach(f => fd.append('files', f));

      const res = await fetch(`${API_BASE.replace(/\/+$/, '')}/api/upload`, {
        method: 'POST',
        body: fd
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data || data.ok === false) {
        throw new Error((data && data.error) || 'Upload failed');
      }

      const newLines = (data.files || []).map(file => {
        const label = labelFromName(file.originalname || file.name || 'file');
        const candidateUrl = file.preview || file.url || file.original || '';
        const finalUrl = absolutizeUrl(candidateUrl);
        const type = (file.ext || extFromName(file.originalname || file.name || '') || '').toLowerCase() || 'file';
        return `${label} | ${finalUrl} | ${type}`;
      });

      setForm(prev => ({
        ...prev,
        docsText: newLines.join('\n') // overwrite old docs
      }));

      setUploadMsg(`Uploaded ${(data.files || []).length} file(s).`);
      setDocFiles([]);
    } catch (e) {
      console.error(e);
      setUploadMsg(e.message || 'Upload failed. Check server or CORS.');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadMsg(''), 3500);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const payload = {
      title: form.title.trim(),
      category: (form.category || 'general').trim(),
      image_url: form.image,
      client: form.client.trim(),
      services: form.services.trim(),
      url: form.url.trim(),
      description: form.description.trim(),
      skills: strToSkills(form.skillsText),
      video: form.video.trim(),
      docs: parseDocs(form.docsText)
    };

    if (!payload.title) { alert('Title is required'); return; }

    try {
      if (editId) {
        await update(editId, payload);
        setEditId(null);
      } else {
        await add(payload);
      }
      await load();
    } catch (err) {
      alert(err?.message || 'Save failed');
      return;
    }

    setForm(empty);
    setDocFiles([]);
    if (fileRef.current) fileRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onEdit(it) {
    setEditId(it.id);
    if (it.category && !categories.some(c => c.value === it.category)) {
      setCategories(prev => [...prev, { value: it.category, label: it.category }]);
    }
    setForm({
      title: it.title || '',
      category: it.category || '',
      image: it.image || '',
      client: it.client || '',
      services: it.services || '',
      url: it.url || '',
      description: it.description || '',
      skillsText: skillsToStr(it.skills),
      video: it.video || '',
      docsText: toDocsText(it.docs)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function categoryLabel(cat) {
    if (!cat) return '';
    const preset = categories.find(c => c.value === cat);
    return preset ? preset.label : cat;
  }

  function confirmAddCategory() {
    const label = newCategory.trim();
    if (!label) return;
    const value = slugify(label);
    if (!categories.some(c => c.value === value)) {
      const newOpt = { value, label };
      setCategories(prev => [...prev, newOpt]);
    }
    setForm(f => ({ ...f, category: value }));
    setNewCategory('');
    setShowCatPopup(false);
  }

  // ✅ Auth guard AFTER hooks (safe)
  if (!authed) return <Navigate to="/login" replace />;

  return (
    <div className="admin-wrap">
      <h2 style={{ margin: '0 0 12px' }}>Admin</h2>
      <p style={{ opacity: .75, margin: '0 0 16px' }}>
        Add / edit products. Upload images or use a link. Documents
      </p>

      <form onSubmit={onSubmit} className="admin-card" style={{ marginBottom: 16 }}>
        <div className="admin-grid">
          <div className="field">
            <label className="admin-label">Product/Project Name</label>
            <input
              className="input"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          {/* CATEGORY with "+ Add New…" inside dropdown */}
          <div className="field">
            <label className="admin-label">Category</label>
            <select
              className="input"
              value={form.category}
              onChange={e => {
                const v = e.target.value;
                if (v === 'add_new') {
                  setShowCatPopup(true);
                } else {
                  setForm(f => ({ ...f, category: v }));
                }
              }}
              required
            >
              <option value="" disabled>Select category</option>
              {categories.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
              <option value="add_new">+ Add New Category…</option>
            </select>
          </div>

          <div className="field">
            <label className="admin-label">Client</label>
            <input
              className="input"
              value={form.client}
              onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
            />
          </div>

          <div className="field">
            <label className="admin-label">Services</label>
            <input
              className="input"
              value={form.services}
              onChange={e => setForm(f => ({ ...f, services: e.target.value }))}
            />
          </div>

          <div className="field">
            <label className="admin-label">URL</label>
            <input
              className="input"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            />
          </div>

          <div className="field">
            <label className="admin-label">Skills</label>
            <input
              className="input"
              value={form.skillsText}
              onChange={e => setForm(f => ({ ...f, skillsText: e.target.value }))}
            />
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label className="admin-label">Short description</label>
          <textarea
            className="admin-textarea"
            rows="3"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="admin-grid" style={{ marginTop: 12 }}>
          <div className="field">
            <label className="admin-label">Image Upload</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="admin-file" />
            {form.image && (
              <img
                alt="preview"
                src={form.image}
                style={{ marginTop: 8, width: '100%', maxHeight: 220, objectFit: 'contain', background: '#000', borderRadius: 8 }}
              />
            )}
          </div>
          <div className="field">
            <label className="admin-label">OR Image URL</label>
            <input
              className="input"
              value={form.image && form.image.startsWith('data:') ? '' : form.image}
              onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
            />
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label className="admin-label">Video (YouTube or MP4)</label>
          <input
            className="input"
            value={form.video}
            onChange={e => setForm(f => ({ ...f, video: e.target.value }))}
            placeholder="Paste YouTube link or MP4 URL"
          />
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label className="admin-label">Documents</label>
          <textarea
            className="admin-textarea"
            rows="4"
            placeholder={`One per line, format: Label | URL | type
Examples:
Project PDF | https://example.com/brief.pdf | pdf
Pitch Deck | https://example.com/deck.pptx | pptx
UI Screenshot | https://example.com/ui.png | image`}
            value={form.docsText}
            onChange={e => setForm(f => ({ ...f, docsText: e.target.value }))}
          />

          {/* Upload box (multiple files) */}
          <div style={{ marginTop: 10, padding: 12, border: '1px dashed #cfd3d8', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Upload Documents (PDF, PPT, DOC, XLS, images, videos)</div>
            <input
              type="file"
              multiple
              onChange={(e) => setDocFiles(Array.from(e.target.files || []))}
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp,.avif,.svg,.mp4,.webm,.ogg"
            />
            {docFiles.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                {docFiles.length} file(s) selected
                <button
                  type="button"
                  onClick={uploadSelectedDocs}
                  className="btn primary"
                  style={{ marginLeft: 10 }}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  style={{ marginLeft: 8 }}
                  onClick={() => setDocFiles([])}
                  disabled={uploading}
                >
                  Clear
                </button>
              </div>
            )}
            {uploadMsg && <div style={{ marginTop: 6, fontSize: 12, opacity: .8 }}>{uploadMsg}</div>}
            <div style={{ marginTop: 8, fontSize: 12, opacity: .75 }}>
              After upload, lines are added above automatically. You can still edit them.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <button className="btn primary" type="submit">{editId ? 'Update' : 'Add'} Item</button>
          {editId && (
            <button
              type="button"
              className="btn secondary"
              onClick={() => { setEditId(null); setForm(empty); setDocFiles([]); }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="admin-card">
        <h3 style={{ margin: '0 0 10px' }}>Your Items</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Title</th><th>Category</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td>{it.title}</td>
                  <td>{categoryLabel(it.category)}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn secondary" onClick={() => onEdit(it)}>Edit</button>
                    <button
                      className="btn danger"
                      onClick={async () => {
                        if (!window.confirm('Delete this item?')) return;
                        try {
                          await remove(it.id);
                        } catch (err) {
                          alert(err?.message || 'Delete failed');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="3">
                    <em style={{ opacity: .7 }}>No admin items yet.</em>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup Modal for Add New Category */}
      {showCatPopup && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>Add New Category</h3>
            <input
              className="input"
              placeholder="Enter category name"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn secondary" onClick={() => { setNewCategory(''); setShowCatPopup(false); }}>Cancel</button>
              <button className="btn primary" onClick={confirmAddCategory}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
