import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function MenuPrincipal() {
  const navigate = useNavigate()

  return (
    <div className="menu-principal">
      <h1>🎴 Truco Argentino</h1>

      <button onClick={() => navigate('/Juego/')}>
        Jugar Modo Libre
      </button>

      <button onClick={() => navigate('/Juego/historia')}>
        🌾 Modo Historia
      </button>
    </div>
  )
}
