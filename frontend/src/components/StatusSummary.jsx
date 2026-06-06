import { useState, useEffect } from 'react';
import { api } from '../api';

export default function StatusSummary() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.saidas.status().then(setData).catch(console.error);
  }, []);

  if (!data) return null;

  return (
    <div className="status-summary">
      <div className="status-card total">
        <strong>{data.total}</strong>
        <span>Total</span>
      </div>
      <div className="status-card pendente">
        <strong>{data.pendentes}</strong>
        <span>Pendentes</span>
      </div>
      <div className="status-card ok">
        <strong>{data.ok}</strong>
        <span>Documentadas</span>
      </div>
    </div>
  );
}
