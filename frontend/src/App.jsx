import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import StatusSummary from './components/StatusSummary';
import SaidaList from './components/SaidaList';
import SaidaForm from './components/SaidaForm';
import SaidaDetail from './components/SaidaDetail';
import Relatorio from './components/Relatorio';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <Link to="/" className="app-logo">SaveDoc</Link>
          <nav className="app-nav">
            <Link to="/">Home</Link>
            <Link to="/nova">Nova Saída</Link>
            <Link to="/relatorio">Relatório</Link>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={
              <>
                <StatusSummary />
                <SaidaList />
              </>
            } />
            <Route path="/nova" element={<SaidaForm />} />
            <Route path="/editar/:id" element={<SaidaForm />} />
            <Route path="/saidas/:id" element={<SaidaDetail />} />
            <Route path="/relatorio" element={<Relatorio />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
