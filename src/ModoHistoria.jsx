import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import JuegoFacil from './JuegoFacil'
/*import introVideo from './assets/intro.mp4' // Asegurate de tenerlo en /src/assets/
*/
export default function ModoHistoria() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)

  return (
    <div className="modo-historia">
      <h1>🌾 Modo Historia</h1>
      {paso === 1 && (
        <div className="dialogo-inicial">
          <h2>🌾 El Gaucho Maestro</h2>
          <p>
            “Bienvenido, muchacho. Te voy a enseñar el arte del truco. 
            Prestá atención, que esto no es solo suerte: es picardía y sangre fría.”
          </p>
          {/* Cambié a navegar desde el evento del botón */}
          <button onClick={() => navigate('/Juego/historia/facil')}>Comenzar Partida Guiada</button>
        </div>
      )}

      {/* removí el navigate(...) ejecutado directamente en render */}
    </div>
  )
}
