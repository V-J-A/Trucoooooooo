// ...existing code...
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import JuegoDificil from './JuegoDificil'
import JuegoFacil from './JuegoFacil'
import JuegoGaucho from './JuegoGaucho'
import JuegoMedio from './JuegoMedio'
import ModoHistoria from './ModoHistoria' // 👈 agregado
import './index.css'
import { CardsProvider } from './CardsContext'
import MenuPrincipal from './MenuPrincipal'
import JuegoFacilHistoria from './JuegoFacilHistoria'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CardsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MenuPrincipal />} />
          <Route path="/Juego" element={<App />} />
          <Route path="/Juego/facil" element={<JuegoFacil />} />
          <Route path="/Juego/medio" element={<JuegoMedio />} />
          <Route path="/Juego/dificil" element={<JuegoDificil />} />
          <Route path="/Juego/gaucho" element={<JuegoGaucho />} />
          <Route path="/Juego/historia" element={<ModoHistoria />} /> {/* 👈 nueva ruta */}
          <Route path="/Juego/historia/facil" element={<JuegoFacilHistoria />} />
        </Routes>
      </BrowserRouter>
    </CardsProvider>
  </React.StrictMode>
)
