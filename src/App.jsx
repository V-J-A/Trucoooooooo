import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import './App.css'
import './index.css'
import { useCards } from './CardsContext' // nuevo import

function App() {
  const { cartas } = useCards()
  const navigate = useNavigate()

  useEffect(() => {
    if (cartas.length > 0) console.log('Cartas cargadas en context:', cartas.length)
  }, [cartas])

    const llevaFacil = () => {
    Swal.fire({
      title: "Sos un pollito, jajajajjaja",
      text: "No te da ni para empezar",
      imageUrl: "https://th.bing.com/th/id/OIP.K48s59M_PX30LE-w1FW-0QHaHa?w=184&h=184&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      imageWidth: 400,
      imageHeight: 200,
      imageAlt: "Pollito"
    });
    navigate('/Juego/facil')
  }

  const llevaMedio = () => {
    Swal.fire({
      title: "Miralo al pibe, se cree truquero",
      text: "Boludoooooo.",
      imageUrl: "https://th.bing.com/th/id/OIP.x2cCQmTLi_q_kK2QNwR4tAHaHa?w=173&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      imageWidth: 400,
      imageHeight: 200,
      imageAlt: "Truquero",
      showDenyButton: true,
      confirmButtonColor: "#3085d6",
      denyButtonColor: "#d33",
      confirmButtonText: "Comenzar"
    }).then((result) => {
      if (result.isConfirmed) {
        // navega a la ruta /dificil
        navigate('/Juego/medio')
      }
    });
  }

  const llevaDificil = () => {
    Swal.fire({
      title: "Felicidades, sos un argentino promedio",
      text: "Porque no te armas el fernet y me avisas",
      imageUrl: "https://th.bing.com/th/id/OIP.WBoqcFMT0OU5WSmbFQ1qegHaIm?w=137&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      imageWidth: 400,
      imageHeight: 200,
      imageAlt: "Fernet",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Comenzar"
    }).then((result) => {
      if (result.isConfirmed) {
        // navega a la ruta /dificil
        navigate('/Juego/dificil')
      }
    });
  }

  const llevaGaucho = () => {
    Swal.fire({
      title: "El gaucho se planta firme ⚔️",
      html: `
      Lo tuyo ya no tiene nombre,<br>
      sin miedo te enfrento, compañero,<br>
      que el truco no espera embustero,<br>
      si el valor no arde en tu huella,<br>
      mejor soltá la botella,<br>
      que el gaucho no teme al acero.<br><br>
      <i>¿Y vos? ¿Tenés las cartas... o el coraje?</i>
      `,
      imageUrl: "https://th.bing.com/th/id/OIP.DRueDa9hXFryBgQsTAm2AAHaJ4?w=208&h=277&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      imageWidth: 400,
      imageHeight: 200,
      imageAlt: "Gaucho Matero",
      showDenyButton: true,
      confirmButtonColor: "#3085d6",
      denyButtonColor: "#d33",
      confirmButtonText: "Comenzar"
    }).then((result) => {
      if (result.isConfirmed) {
        // navega a la ruta /gaucho
        navigate('/Juego/gaucho');
      }
    });
  }


  return (
    <div className="body">
      <div className="contenedor">
        <p>Elegí la dificultad... a ver si sos gaucho 🔪🧉</p>
        <div className="botonera">
          <button onClick={llevaFacil}>Fácil</button>
          <button onClick={llevaMedio}>Medio</button>
          <button onClick={llevaDificil}>Difícil</button>
          <button onClick={llevaGaucho}>GAUCHO</button>
        </div>
      </div>
    </div>
  )
}

export default App
// ...existing code...