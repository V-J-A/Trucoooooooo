import React, { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'
import { useCards } from './CardsContext'
import { Navigate } from 'react-router-dom'

export default function JuegoMedioHistoria() {
  const { cartas } = useCards()

  // ==================== ESTADOS ====================
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
  const [puntosJugador, setPuntosJugador] = useState(0)
  const [puntosMaquina, setPuntosMaquina] = useState(0)
  const [puntosALaRonda, setPuntosALaRonda] = useState(1)
  const [trucoActivo, setTrucoActivo] = useState(false)
  const [manosGanadasJugador, setManosGanadasJugador] = useState(0)
  const [manosGanadasMaquina, setManosGanadasMaquina] = useState(0)
  const [mostrarApartadoEnvido, setMostrarApartadoEnvido] = useState(false)
  const [empezoEnvido, setEmpezoEnvido] = useState(false)
  const [puntosEnvidoJugador, setPuntosEnvidoJugador] = useState(0)
  const [puntosEnvidoMaquina, setPuntosEnvidoMaquina] = useState(0)
  // banderita para evitar múltiples disparos del canto automático
const envidoAutoTriggeredRef = useRef(false)



  const PUNTOS_PARA_GANAR = 5
  const imagenAtras = "https://deckofcardsapi.com/static/img/back.png"

  // ==================== FUNCIONES PRINCIPALES ====================

  const cargarPuntos = (ganador, puntos) => {
    ganador === 'jugador'
      ? setPuntosJugador(p => p + puntos)
      : setPuntosMaquina(p => p + puntos)
  }

  const generarOrden = (primero) =>
    primero === 'maquina' ? ['maquina', 'jugador'] : ['jugador', 'maquina']

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
    setSeCantoEnvido(false)
    setTrucoActivo(false)
    setBloquearMaquina(false)
    setPensandoIA(false)
    setPuntosALaRonda(1)
  }

  const pasasteDeDificultad = () => {
    Navigate('/Juego/historia/dificil')
  }
  const verificarGanadorPartida = () => {
    if (puntosJugador >= PUNTOS_PARA_GANAR) {
      Swal.fire('🎉 ¡Felicidades! ¡Ganaste la partida!')
      pasasteDeDificultad()
    } else if (puntosMaquina >= PUNTOS_PARA_GANAR) {
      Swal.fire('🤖 La máquina ha ganado la partida. ¡Mejor suerte la próxima vez!')
      resetJuegoCompleto()
    }
  }

  // ==================== REPARTIR ====================
  const repartirCartas = () => {
    if (!cartas || cartas.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las cartas no están disponibles todavía. Esperá unos segundos y recargá la página.',
      })
      return
    }

    if (empezoLaPartida) {
      Swal.fire({ icon: 'info', title: 'Atención', text: 'Ya se repartieron las cartas para esta ronda.' })
      return
    }

    const cartasBarajadas = [...cartas].sort(() => Math.random() - 0.5)
    setCartasJugador(cartasBarajadas.slice(0, 3))
    setCartasComputadora(cartasBarajadas.slice(3, 6))
    setEmpezoLaPartida(true)
    setTurnoActual(0)
    setCartasTiradasJugador([])
    setCartasTiradasRival([])
    setOrdenTiradas(generarOrden(quienEmpieza))
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
  }

  const avanzarTurno = () => {
    if (!ordenTiradas.length) return
    setTurnoActual(prev => (prev + 1) % ordenTiradas.length)
  }

  // ==================== MÁQUINA ====================
  const tirarCartaMaquina = () => {
    if (!cartasComputadora.length) return
    const carta = cartasComputadora[0]
    setCartasTiradasRival(prev => [...prev, carta])
    setCartasComputadora(prev => prev.filter(c => c.code !== carta.code))
  }

  // ==================== JUGADOR ====================
  const tirarCartaJugador = (carta) => {
    if (ordenTiradas[turnoActual] !== 'jugador') {
      Swal.fire('⏳ No es tu turno aún.')
      return
    }
    setCartasTiradasJugador(prev => [...prev, carta])
    setCartasJugador(prev => prev.filter(c => c.code !== carta.code))
    avanzarTurno()
  }

  // ==================== EFECTO MÁQUINA ====================

useEffect(() => {
  // condiciones REALES para que pueda cantar
  const tieneCartasRepartidas =
    cartasComputadora.length === 3 &&
    cartasJugador.length === 3 &&
    empezoLaPartida

  const debeCantar =
    puntosMaquina >= 28 &&
    tieneCartasRepartidas &&
    !seCantoEnvido &&
    !envidoAutoTriggeredRef.current

  if (!debeCantar) return

  // evitar dobles disparos
  envidoAutoTriggeredRef.current = true
  setSeCantoEnvido(true)

  Swal.fire({
    title: '🤖 La máquina te canta ENVIDO',
    text: '¿Querés aceptar o rechazar?',
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Aceptar',
    denyButtonText: 'Rechazar',
    cancelButtonText: 'Real envido (A POR TODO)'
  }).then(async (result) => {
    if (result.isConfirmed) {
      // Aceptar -> mostrar opciones: verdadero / mentir / real (la UI que ya tenías)
      Swal.fire({
        title: '¿Qué querés hacer?',
        showDenyButton: true,
        showCancelButton: false,
        showConfirmButton: false,
        denyButtonText: '¿Que diras?',
        cancelButtonText: 'Real envido (A POR TODO)'
      }).then(async (res) => {
        if (res.isDenied) {
          // Mentir (declarar) - tu lógica ya existente
          const { value: declarado } = await Swal.fire({
            title: 'Declarar Envido (podés mentir)',
            input: 'number',
            text: 'Ingresá cualquier valor del 0 al 33',
            inputAttributes: { min: 0, max: 33, step: 1 },
          })
          if (declarado === undefined || declarado === null) return
          const declaradoNum = Math.max(0, Math.min(33, parseInt(declarado, 10) || 0))
          const realJugador = calcularEnvido(cartasJugador)
          const envidoMaquina = calcularEnvido(cartasComputadora)
          const azar = Math.floor(Math.random() * 5) + 1
          if (declaradoNum !== realJugador && azar === 2) {
            Swal.fire('🤖 La máquina te descubrió. Gana 2 puntos.')
            cargarPuntos('maquina', 2)
            verificarGanadorPartida()
            return
          }
          if (declaradoNum > envidoMaquina) {
            Swal.fire(`Ganaste declarando ${declaradoNum}. +2 pts`)
            cargarPuntos('jugador', 2)
          } else {
            Swal.fire(`La máquina gana (${envidoMaquina} vs ${declaradoNum}). +2 pts`)
            cargarPuntos('maquina', 2)
          }
          verificarGanadorPartida()
          return
        }
        // aquí podés mantener el caso res.isConfirmed (decir verdadero) si lo tenés en otra parte
      })
    } else if (result.isDenied) {
      // Rechazo -> la máquina gana 1
      Swal.fire('🤖 La máquina gana 1 puntos por tu rechazo.')
      cargarPuntos('maquina', 1)
      verificarGanadorPartida()
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      // CANCEL = Real Envido -> ejecutar flujo igual que "mentir" pero con 4 puntos
      // setear valor de ronda a 4 para este envido
      setPuntosALaRonda(4)
      // pedir declarado (puede mentir también)
      const { value: declaradoReal } = await Swal.fire({
        title: 'Real Envido - Declará tus puntos',
        input: 'number',
        inputAttributes: { min: 0, max: 33, step: 1 },
        text: 'Real Envido vale 4 puntos. Podés declarar cualquier número (0-33).',
        showCancelButton: false
      })
      if (declaradoReal === undefined || declaradoReal === null) return
      const declaradoNum = Math.max(0, Math.min(33, parseInt(declaradoReal, 10) || 0))
      const realJugador = calcularEnvido(cartasJugador)
      const envidoMaquina = calcularEnvido(cartasComputadora)
      const descubierto = Math.random() < 0.2
      if (declaradoNum !== realJugador && descubierto) {
        await Swal.fire('🤖 Te descubrieron en el Real Envido. La máquina gana 4 puntos.')
        cargarPuntos('maquina', 4)
        verificarGanadorPartida()
        return
      }
      if (declaradoNum > envidoMaquina) {
        await Swal.fire(`🃏 Ganaste el Real Envido declarando ${declaradoNum}. +4 pts`)
        cargarPuntos('jugador', 4)
      } else {
        await Swal.fire(`🤖 La máquina gana el Real Envido (${envidoMaquina} vs ${declaradoNum}). +4 pts`)
        cargarPuntos('maquina', 4)
      }
      verificarGanadorPartida()
      return
    }
  })
}, [
  puntosMaquina,
  empezoLaPartida,
  cartasJugador.length,
  cartasComputadora.length,
  seCantoEnvido,
])



  useEffect(() => {
    if (!empezoLaPartida || bloquearMaquina || !ordenTiradas.length) return
    // ======== CANTO AUTOMÁTICO DE LA MÁQUINA ========
    if (ordenTiradas[turnoActual] === 'maquina' && cartasComputadora.length > 0) {
      const timer = setTimeout(() => {
        tirarCartaMaquina()
        avanzarTurno()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [turnoActual, empezoLaPartida, bloquearMaquina, ordenTiradas, cartasComputadora.length, puntosMaquina])

  // ==================== ENVIDO ====================
  const calcularEnvido = (cartasParam) => {
    const valores = cartasParam.map(c => {
      const v = parseInt(c.value)
      return isNaN(v) ? 0 : Math.min(v, 7)
    })
    let max = 0
    for (let i = 0; i < valores.length; i++) {
      for (let j = i + 1; j < valores.length; j++) {
        if (cartasParam[i].suit === cartasParam[j].suit) {
          const suma = valores[i] + valores[j] + 20
          if (suma > max) max = suma
        }
      }
    }
    return max
  }

  const envido = async () => {
    if (seCantoEnvido) return Swal.fire('⚠️ Ya se cantó Envido en esta ronda.')
    if (!empezoLaPartida) return Swal.fire('⚠️ Primero repartí las cartas para iniciar la partida.')
    if (cartasJugador.length < 3) return Swal.fire('⚠️ No podés cantar Envido después de haber tirado cartas.')

    setSeCantoEnvido(true)

    const { value: declarado } = await Swal.fire({
      title: 'Cantar Envido',
      text: 'Ingresá el valor que querés declarar (0-33)',
      input: 'number',
      inputAttributes: { min: 0, max: 33, step: 1 },
      showCancelButton: true,
    })
    if (!declarado) return

    const declaradoNum = Math.max(0, Math.min(33, parseInt(declarado, 10) || 0))
    const realJugador = calcularEnvido(cartasJugador)
    const envidoMaquina = calcularEnvido(cartasComputadora)

    if (declaradoNum === realJugador) {
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
        if (declaradoNum > envidoMaquina) {
          Swal.fire(`🃏 No te descubrieron. Tu declarado (${declaradoNum}) vence (${envidoMaquina}). +2 pts`)
          cargarPuntos('jugador', 2)
        } else {
          Swal.fire(`🤖 No te descubrieron. La máquina (${envidoMaquina}) gana (${declaradoNum}). +2 pts`)
          cargarPuntos('maquina', 2)
        }
      }
    }

    verificarGanadorPartida()
  }

  // ==================== TRUCO ====================
  const truco = () => {
    if (!empezoLaPartida) return Swal.fire('⚠️ Primero repartí las cartas para iniciar la partida.')
    if (trucoActivo) return Swal.fire('⚠️ El Truco ya fue cantado.')
    setTrucoActivo(true)
    setPuntosALaRonda(2)
    Swal.fire(`🃏 Truco cantado! Ahora la ronda vale 2 puntos.`)
  }

  // ==================== COMPARAR CARTAS ====================
  useEffect(() => {
    if (!cartasTiradasJugador.length || cartasTiradasJugador.length !== cartasTiradasRival.length) return

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

  // Dispara el canto automático si la máquina ya empieza con 20 o más puntos


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
    setTimeout(verificarGanadorPartida, 200)
    envidoAutoTriggeredRef.current = false // <- resetear aquí
  }

  // 🔥 FORZAR chequeo inicial y por si puntosMaquina cambia dinámicamente

  // ==================== RENDER ====================
  return (
    <div className="juego-container">
      {mostrarApartadoEnvido && (
  <ApartadoEnvido
    onCerrar={() => setMostrarApartadoEnvido(false)}
    puntosJugador={puntosJugador}
    setPuntosJugador={setPuntosJugador}
  />
)}

      <h1 className="titulo-juego">Juego Medio</h1>
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
            {cartasComputadora.map(c => (
              <img key={c.code} src={imagenAtras} alt="espalda" style={{ width: 90 }} />
            ))}
          </div>
        </div>

        <div>
          <h3>Tus Cartas</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {cartasJugador.map(c => (
              <button
                key={c.code}
                onClick={() => tirarCartaJugador(c)}
                disabled={ordenTiradas[turnoActual] !== 'jugador' || bloquearMaquina}
                style={{ padding: 0, border: 'none', background: 'transparent' }}
              >
                <img
                  src={c.image}
                  alt={c.code}
                  style={{ width: 90, opacity: (ordenTiradas[turnoActual] !== 'jugador' || bloquearMaquina) ? 0.6 : 1 }}
                />
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
              {cartasTiradasRival.map(c => (
                <img key={c.code} src={c.image} alt={c.code} style={{ width: 80 }} />
              ))}
            </div>
          </div>

          <div>
            <h5>Jugador</h5>
            <div style={{ display: 'flex', gap: 8 }}>
              {cartasTiradasJugador.map(c => (
                <img key={c.code} src={c.image} alt={c.code} style={{ width: 80 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
