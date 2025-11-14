import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { useCards } from './CardsContext'

export default function JuegoFacilHistoria() {
  const { cartas } = useCards()

  // Estados básicos del juego
  const [empezoLaPartida, setEmpezoLaPartida] = useState(false)
  const [turnoActual, setTurnoActual] = useState(0)
  const [ordenTiradas, setOrdenTiradas] = useState([])
  const [cartasJugador, setCartasJugador] = useState([])
  const [cartasComputadora, setCartasComputadora] = useState([])
  const [cartasTiradasJugador, setCartasTiradasJugador] = useState([])
  const [cartasTiradasRival, setCartasTiradasRival] = useState([])
  const [ronda, setRonda] = useState(1)
  const [quienEmpieza, setQuienEmpieza] = useState('maquina')
  const [bloquearMaquina, setBloquearMaquina] = useState(false)
  const [seCantoEnvido, setSeCantoEnvido] = useState(false)

  // Puntos y constantes
  const [puntosJugador, setPuntosJugador] = useState(0)
  const [puntosMaquina, setPuntosMaquina] = useState(0)
  const PUNTOS_PARA_GANAR = 15

  // Valores por ronda / truco
  const [puntosALaRonda, setPuntosALaRonda] = useState(1)
  const [trucoActivo, setTrucoActivo] = useState(false)

  // Contadores de manos ganadas
  const [manosGanadasJugador, setManosGanadasJugador] = useState(0)
  const [manosGanadasMaquina, setManosGanadasMaquina] = useState(0)

  const imagenAtras = "https://deckofcardsapi.com/static/img/back.png"

  // -------------------- FUNCIONES --------------------

  const cargarPuntos = (ganador, puntos) => {
    if (ganador === 'jugador') {
      setPuntosJugador((prev) => prev + puntos)
    } else {
      setPuntosMaquina((prev) => prev + puntos)
    }
  }

  const verificarGanadorPartida = () => {
    if (puntosJugador >= PUNTOS_PARA_GANAR) {
      Swal.fire('🎉 ¡Felicidades! ¡Ganaste la partida!')
      pasasteElTutorial()
    } else if (puntosMaquina >= PUNTOS_PARA_GANAR) {
      Swal.fire('Tranqulo muchacho. ¡Lo lograras la próxima vez!')
      navigate('/Juego/historia/medio')
    }
  }

  const pasasteElTutorial = () => {
    Swal.fire({
      icon: 'success',
      title: '¡Has completado el tutorial de Truco Fácil!',
      text: 'Ahora estás listo para enfrentar desafíos más difíciles. ¡Buena suerte!',
    })
    resetJuegoCompleto()
  }
  const resetJuegoCompleto = () => {
    setPuntosJugador(0)
    setPuntosMaquina(0)
    setEmpezoLaPartida(false)
    setRonda(1)
    setCartasJugador([])
    setCartasComputadora([])
    setCartasTiradasJugador([])
    setCartasTiradasRival([])
    setManosGanadasJugador(0)
    setManosGanadasMaquina(0)
    setTrucoActivo(false)
    setPuntosALaRonda(1)
    setBloquearMaquina(false)
    setSeCantoEnvido(false)
  }

  const generarOrden = (primero) => {
    return primero === 'maquina' ? ['maquina', 'jugador'] : ['jugador', 'maquina']
  }

  // -------------------- REPARTO --------------------
  const repartirCartas = () => {
    if (!cartas || cartas.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las cartas no están disponibles todavía. Esperá unos segundos y recargá la página.',
      })
      return
    }

    if (!empezoLaPartida) {
      const cartasBarajadas = [...cartas].sort(() => Math.random() - 0.5)
      setCartasJugador(cartasBarajadas.slice(0, 3))
      setCartasComputadora(cartasBarajadas.slice(3, 6))
      setEmpezoLaPartida(true)
      setTurnoActual(0)
      setCartasTiradasJugador([])
      setCartasTiradasRival([])
      const orden = generarOrden(quienEmpieza)
      setOrdenTiradas(orden)
      setManosGanadasJugador(0)
      setManosGanadasMaquina(0)
      setTrucoActivo(false)
      setPuntosALaRonda(1)
      setBloquearMaquina(false)

      Swal.fire({
        icon: 'info',
        title: `Comienza la ronda ${ronda}`,
        text: `Empieza ${quienEmpieza === 'jugador' ? 'el jugador' : 'la máquina'}.`,
      })
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Atención',
        text: 'Ya se repartieron las cartas para esta ronda.',
      })
    }
  }

  const avanzarTurno = () => {
    if (!ordenTiradas || ordenTiradas.length === 0) return
    setTurnoActual((prev) => (prev + 1) % ordenTiradas.length)
  }

  // -------------------- MÁQUINA --------------------
  const tirarCartaMaquina = () => {
    if (cartasComputadora.length === 0) return
    const carta = cartasComputadora[0]
    setCartasTiradasRival(prev => [...prev, carta])
    setCartasComputadora(prev => prev.filter(c => c.code !== carta.code))
  }

  // -------------------- JUGADOR --------------------
  const tirarCartaJugador = (carta) => {
    const jugadorActual = ordenTiradas[turnoActual]
    if (jugadorActual !== 'jugador') {
      Swal.fire('⏳ No es tu turno aún.')
      return
    }
    setCartasTiradasJugador((prev) => [...prev, carta])
    setCartasJugador((prev) => prev.filter((c) => c.code !== carta.code))
    avanzarTurno()
  }

  // -------------------- EFECTO DE LA MÁQUINA --------------------
  useEffect(() => {
    if (!empezoLaPartida || bloquearMaquina) return
    if (!ordenTiradas || ordenTiradas.length === 0) return

    const jugadorActual = ordenTiradas[turnoActual]
    if (jugadorActual === 'maquina' && cartasComputadora.length > 0) {
      const timer = setTimeout(() => {
        tirarCartaMaquina()
        avanzarTurno()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [turnoActual, empezoLaPartida, bloquearMaquina, ordenTiradas, cartasComputadora.length])

  // -------------------- ENVIDO --------------------
  const envido = async () => {
    if (seCantoEnvido) {
      Swal.fire('⚠️ Ya se cantó Envido en esta ronda.')
      return
    }

    if (!empezoLaPartida) {
      Swal.fire('⚠️ Primero repartí las cartas para iniciar la partida.')
      return
    }

    if (cartasJugador.length < 3) {
      Swal.fire('⚠️ No podés cantar Envido después de haber tirado cartas.')
      return
    }

    setSeCantoEnvido(true)

    const { value: declarado } = await Swal.fire({
      title: 'Cantar Envido',
      text: 'Ingresá el valor que querés declarar (0-33)',
      input: 'number',
      inputAttributes: { min: 0, max: 33, step: 1 },
      showCancelButton: true,
    })

    if (!declarado) return

    const declaradoNumero = Math.max(0, Math.min(33, parseInt(declarado, 10) || 0))
    const realJugador = calcularEnvido(cartasJugador)

    if (declaradoNumero === realJugador) {
      const envidoMaquina = calcularEnvido(cartasComputadora)
      if (realJugador > envidoMaquina) {
        Swal.fire(`🃏 Verdadero. Ganás Envido (${realJugador} vs ${envidoMaquina}). +2 pts`)
        cargarPuntos('jugador', 2)
      } else {
        Swal.fire(`🤖 Verdadero. La máquina gana Envido (${envidoMaquina} vs ${realJugador}). +2 pts`)
        cargarPuntos('maquina', 2)
      }
    } else {
      const azar = Math.floor(Math.random() * 5) + 1
      if (azar === 2) {
        Swal.fire('🤖 La máquina te descubrió. Gana 2 puntos.')
        cargarPuntos('maquina', 2)
      } else {
        const envidoMaquina = calcularEnvido(cartasComputadora)
        if (declaradoNumero > envidoMaquina) {
          Swal.fire(`🃏 No te descubrieron. Tu declarado (${declaradoNumero}) vence (${envidoMaquina}). +2 pts`)
          cargarPuntos('jugador', 2)
        } else {
          Swal.fire(`🤖 No te descubrieron. La máquina (${envidoMaquina}) gana (${declaradoNumero}). +2 pts`)
          cargarPuntos('maquina', 2)
        }
      }
    }

    verificarGanadorPartida()
  }

  const calcularEnvido = (cartasParam) => {
    const valores = cartasParam.map(carta => {
      const valor = parseInt(carta.value)
      return isNaN(valor) ? 0 : Math.min(valor, 7)
    })
    let maxEnvido = 0
    for (let i = 0; i < valores.length; i++) {
      for (let j = i + 1; j < valores.length; j++) {
        if (cartasParam[i].suit === cartasParam[j].suit) {
          const envido = valores[i] + valores[j] + 20
          if (envido > maxEnvido) maxEnvido = envido
        }
      }
    }
    return maxEnvido
  }

  // -------------------- TRUCO --------------------
  const truco = () => {
    if (!empezoLaPartida) {
      Swal.fire('⚠️ Primero repartí las cartas para iniciar la partida.')
      return
    }
    if (trucoActivo) {
      Swal.fire('⚠️ El Truco ya fue cantado.')
      return
    }
    setTrucoActivo(true)
    setPuntosALaRonda(2)
    Swal.fire(`🃏 Truco cantado! Ahora la ronda vale ${2} puntos.`)
  }

  // -------------------- COMPARAR CARTAS --------------------
  useEffect(() => {
    if (cartasTiradasJugador.length === 0 || cartasTiradasJugador.length !== cartasTiradasRival.length) return

    const ultimaJugador = cartasTiradasJugador.at(-1)
    const ultimaRival = cartasTiradasRival.at(-1)
    if (!ultimaJugador || !ultimaRival) return

    let ganadorMano = null
    if (ultimaJugador.trucoValor > ultimaRival.trucoValor) {
      ganadorMano = 'jugador'
      setManosGanadasJugador(p => p + 1)
      Swal.fire('🧠 Ganaste esta mano.')
    } else if (ultimaJugador.trucoValor < ultimaRival.trucoValor) {
      ganadorMano = 'maquina'
      setManosGanadasMaquina(p => p + 1)
      Swal.fire('🤖 La máquina ganó esta mano.')
    } else {
      ganadorMano = 'maquina'
      setManosGanadasMaquina(p => p + 1)
      Swal.fire('⚖️ Empate: la máquina gana la mano.')
    }

    setBloquearMaquina(true)

    setTimeout(() => {
      const mgJugador = manosGanadasJugador + (ganadorMano === 'jugador' ? 1 : 0)
      const mgMaquina = manosGanadasMaquina + (ganadorMano === 'maquina' ? 1 : 0)

      if (mgJugador >= 2 || mgMaquina >= 2) {
        const ganadorRonda = mgJugador >= 2 ? 'jugador' : 'maquina'
        Swal.fire(`🏆 ${ganadorRonda === 'jugador' ? 'Ganaste' : 'La máquina ganó'} el Truco. +${puntosALaRonda} pts`)
        cargarPuntos(ganadorRonda, puntosALaRonda)
        reiniciarRonda()
      } else {
        const nuevoInicio = ganadorMano
        setQuienEmpieza(nuevoInicio)
        setTurnoActual(0)
        setOrdenTiradas(generarOrden(nuevoInicio))
        setBloquearMaquina(false)
      }
    }, 500)
  }, [cartasTiradasJugador, cartasTiradasRival])

  const reiniciarRonda = () => {
    setRonda(r => r + 1)
    setEmpezoLaPartida(false)
    setCartasTiradasJugador([])
    setCartasTiradasRival([])
    setManosGanadasJugador(0)
    setManosGanadasMaquina(0)
    setTrucoActivo(false)
    setPuntosALaRonda(1)
    setBloquearMaquina(false)
    setSeCantoEnvido(false)
    setTimeout(() => verificarGanadorPartida(), 200)
  }

  // -------------------- RENDER --------------------
  return (
    <div className="juego-container">
      <h1 className="titulo-juego">Juego Fácil</h1>
      <h2>Truco con cartas de blackjack</h2>

      <p>Ronda {ronda}</p>
      <p>Puntos Jugador: {puntosJugador} | Puntos Máquina: {puntosMaquina}</p>
      <p>Manos ganadas - Jugador: {manosGanadasJugador} | Máquina: {manosGanadasMaquina}</p>
      <p>Valor ronda: {puntosALaRonda} {trucoActivo ? '(Truco activo)' : ''}</p>

      <button onClick={repartirCartas}>Repartir Cartas</button>
      <button onClick={envido}>Cantar Envido</button>
      <button onClick={truco}>Cantar Truco</button>

      <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
        <div>
          <h3>Cartas del Rival</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {cartasComputadora.map((c) => (
              <img key={c.code} src={imagenAtras} alt="espalda" style={{ width: 90 }} />
            ))}
          </div>
        </div>

        <div>
          <h3>Tus Cartas</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {cartasJugador.map((c) => (
              <button
                key={c.code}
                onClick={() => tirarCartaJugador(c)}
                disabled={ordenTiradas[turnoActual] !== 'jugador' || bloquearMaquina}
                style={{ padding: 0, border: 'none', background: 'transparent' }}
              >
                <img src={c.image} alt={c.code} style={{ width: 90, opacity: (ordenTiradas[turnoActual] !== 'jugador' || bloquearMaquina) ? 0.6 : 1 }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h4>Cartas Tiradas</h4>
        <div style={{ display: 'flex', gap: 80 }}>
          <div>
            <h5>Rival</h5>
            <div style={{ display: 'flex', gap: 8 }}>
              {cartasTiradasRival.map((c) => (
                <img key={c.code} src={c.image} alt={c.code} style={{ width: 80 }} />
              ))}
            </div>
          </div>

          <div>
            <h5>Jugador</h5>
            <div style={{ display: 'flex', gap: 8 }}>
              {cartasTiradasJugador.map((c) => (
                <img key={c.code} src={c.image} alt={c.code} style={{ width: 80 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
