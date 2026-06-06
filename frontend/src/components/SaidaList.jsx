import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function SaidaList() {
  const [saidas, setSaidas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        const data = await api.saidas.list(filtro || undefined);
        if (!ignore) setSaidas(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchData();
    return () => { ignore = true; };
  }, [filtro, refreshKey]);

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir esta saída?')) return;
    try {
      await api.saidas.delete(id);
      setRefreshKey(k => k + 1);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="saida-list">
      <div className="list-header">
        <h2>Saídas</h2>
        <Link to="/nova" className="btn">Nova Saída</Link>
      </div>

      <div className="filtros">
        <button className={`btn-filtro ${filtro === '' ? 'ativo' : ''}`} onClick={() => setFiltro('')}>Todas</button>
        <button className={`btn-filtro ${filtro === 'pendente' ? 'ativo' : ''}`} onClick={() => setFiltro('pendente')}>Pendentes</button>
        <button className={`btn-filtro ${filtro === 'ok' ? 'ativo' : ''}`} onClick={() => setFiltro('ok')}>Documentadas</button>
      </div>

      {loading ? (
        <p className="loading">Carregando saídas...</p>
      ) : saidas.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"></div>
          <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Nenhuma saída encontrada</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>Crie uma nova saída para começar</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Destinatário</th>
              <th>Valor</th>
              <th>Origem</th>
              <th>Docs</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {saidas.map(s => (
              <tr key={s.id} className={s.qtd_docs === 0 ? 'pendente' : 'ok'}>
                <td>{s.data}</td>
                <td>{s.destinatario}</td>
                <td className="valor">R$ {Number(s.valor).toFixed(2)}</td>
                <td>{s.origem}</td>
                <td>{s.qtd_docs}</td>
                <td className="acoes">
                  <Link to={`/saidas/${s.id}`} className="btn-sm">Ver</Link>
                  <Link to={`/editar/${s.id}`} className="btn-sm">Editar</Link>
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
