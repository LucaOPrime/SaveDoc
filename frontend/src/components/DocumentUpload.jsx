import { useState } from 'react';
import { api } from '../api';

export default function DocumentUpload({ saidaId, onUpload }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.documentos.upload(saidaId, file);
      onUpload();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  }

  return (
    <div className="document-upload">
      <label className="btn btn-upload">
        {uploading ? 'Enviando...' : 'Adicionar Documento'}
        <input type="file" onChange={handleFile} disabled={uploading} hidden />
      </label>
    </div>
  );
}
