import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
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
          <NavLink to="/" className="app-logo">SaveDoc</NavLink>
          <nav className="app-nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'ativo' : ''}>Home</NavLink>
            <NavLink to="/nova" className={({ isActive }) => isActive ? 'ativo' : ''}>Nova Saída</NavLink>
            <NavLink to="/relatorio" className={({ isActive }) => isActive ? 'ativo' : ''}>Relatório</NavLink>
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
