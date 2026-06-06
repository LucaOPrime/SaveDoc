import { useState } from 'react';
import { api } from '../api';

export default function Relatorio() {
  const [periodo, setPeriodo] = useState({
    data_inicio: '',
    data_fim: '',
  });
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!periodo.data_inicio || !periodo.data_fim) {
      alert('Selecione o período');
      return;
    }
    setLoading(true);
    try {
      const result = await api.relatorio(periodo.data_inicio, periodo.data_fim);
      setDados(result);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relatorio">
      <div className="relatorio-header">
        <h2>Relatório</h2>
        <a href="/" className="btn btn-secondary">Voltar</a>
      </div>

      <form className="relatorio-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Data Início</label>
          <input type="date" value={periodo.data_inicio} onChange={e => setPeriodo({ ...periodo, data_inicio: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Data Fim</label>
          <input type="date" value={periodo.data_fim} onChange={e => setPeriodo({ ...periodo, data_fim: e.target.value })} required />
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Gerando...' : 'Gerar Relatório'}
        </button>
      </form>

      {dados && (
        <div className="relatorio-resultado">
          <div className="resumo-cards">
            <div className="status-card total">
              <strong>{dados.resumo.total_saidas}</strong>
              <span>Total</span>
            </div>
            <div className="status-card ok">
              <strong>{dados.resumo.documentadas}</strong>
              <span>Documentadas</span>
            </div>
            <div className="status-card pendente">
              <strong>{dados.resumo.pendentes}</strong>
              <span>Pendentes</span>
            </div>
            <div className="status-card valor">
              <strong>R$ {dados.resumo.total_valor}</strong>
              <span>Valor Total</span>
            </div>
          </div>

          <p className="periodo-info">Período: {dados.periodo.inicio} a {dados.periodo.fim}</p>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Destinatário</th>
                <th>Valor</th>
                <th>Origem</th>
                <th>Docs</th>
              </tr>
            </thead>
            <tbody>
              {dados.saidas.map(s => (
                <tr key={s.id} className={s.qtd_docs === 0 ? 'pendente' : 'ok'}>
                  <td>{s.data}</td>
                  <td>{s.destinatario}</td>
                  <td className="valor">R$ {Number(s.valor).toFixed(2)}</td>
                  <td>{s.origem}</td>
                  <td>{s.qtd_docs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
