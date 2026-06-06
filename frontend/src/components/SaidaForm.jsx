import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

export default function SaidaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    destinatario: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    origem: '',
    descricao: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.saidas.get(id).then(s => {
      setForm({
        destinatario: s.destinatario,
        valor: s.valor,
        data: s.data,
        origem: s.origem,
        descricao: s.descricao || '',
      });
    }).catch(err => {
      alert(err.message);
      navigate('/');
    });
  }, [id, isEdit, navigate]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.saidas.update(id, form);
      } else {
        await api.saidas.create(form);
      }
      navigate('/');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="saida-form">
      <h2>{isEdit ? 'Editar Saída' : 'Nova Saída'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Destinatário *</label>
          <input name="destinatario" value={form.destinatario} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Valor *</label>
          <input name="valor" type="number" step="0.01" min="0" value={form.valor} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Data *</label>
          <input name="data" type="date" value={form.data} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Origem *</label>
          <input name="origem" value={form.origem} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Descrição</label>
          <textarea name="descricao" value={form.descricao} onChange={handleChange} rows={3} />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Cadastrar')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
