import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import DocumentUpload from './DocumentUpload';

export default function SaidaDetail() {
  const { id } = useParams();
  const [saida, setSaida] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        const data = await api.saidas.get(id);
        if (!ignore) setSaida(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchData();
    return () => { ignore = true; };
  }, [id, refreshKey]);

  function refresh() {
    setRefreshKey(k => k + 1);
  }

  async function handleDeleteDoc(docId) {
    if (!confirm('Remover este documento?')) return;
    try {
      await api.documentos.delete(docId);
      refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <p className="loading">Carregando...</p>;
  if (!saida) return <p className="empty">Saída não encontrada.</p>;

  return (
    <div className="saida-detail">
      <div className="detail-header">
        <h2>Saída #{saida.id}</h2>
        <div className="detail-actions">
          <Link to={`/editar/${saida.id}`} className="btn">Editar</Link>
          <Link to="/" className="btn btn-secondary">Voltar</Link>
        </div>
      </div>

      <div className="detail-card">
        <div className="detail-row">
          <span className="label">Destinatário:</span>
          <span>{saida.destinatario}</span>
        </div>
        <div className="detail-row">
          <span className="label">Valor:</span>
          <span>R$ {Number(saida.valor).toFixed(2)}</span>
        </div>
        <div className="detail-row">
          <span className="label">Data:</span>
          <span>{saida.data}</span>
        </div>
        <div className="detail-row">
          <span className="label">Origem:</span>
          <span>{saida.origem}</span>
        </div>
        {saida.descricao && (
          <div className="detail-row">
            <span className="label">Descrição:</span>
            <span>{saida.descricao}</span>
          </div>
        )}
        <div className="detail-row">
          <span className="label">Criado em:</span>
          <span>{saida.created_at}</span>
        </div>
      </div>

      <div className="documentos-section">
        <h3>Documentos ({saida.documentos.length})</h3>
        <DocumentUpload saidaId={saida.id} onUpload={refresh} />

        {saida.documentos.length === 0 ? (
          <p className="empty">Nenhum documento anexado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Tipo</th>
                <th>Tamanho</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {saida.documentos.map(doc => (
                <tr key={doc.id}>
                  <td>{doc.nome_original}</td>
                  <td>{doc.tipo}</td>
                  <td>{(doc.tamanho / 1024).toFixed(1)} KB</td>
                  <td>{doc.created_at}</td>
                  <td>
                    <a href={doc.url} target="_blank" className="btn-sm" download>Download</a>
                    <button className="btn-sm btn-danger" onClick={() => handleDeleteDoc(doc.id)}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
