import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { useCards } from './CardsContext'

export default function JuegoDificil() {
  const { cartas } = useCards()

  // Estados básicos del juego (los mismos que venías usando)
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
  const [puntosALaRonda, setPuntosALaRonda] = useState(1) // base = 1 (sin truco)
  const [trucoActivo, setTrucoActivo] = useState(false) // si se cantó truco

  // Estados para envido
  const [envidoDeclaradoJugador, setEnvidoDeclaradoJugador] = useState(null)
  const [envidoRealJugador, setEnvidoRealJugador] = useState(null)

  // Contadores de manos ganadas (para decidir el truco)
  const [manosGanadasJugador, setManosGanadasJugador] = useState(0)
  const [manosGanadasMaquina, setManosGanadasMaquina] = useState(0)

  const imagenAtras = "https://deckofcardsapi.com/static/img/back.png"

  // ---------- FUNCIONES UTILES ----------

  // Suma puntos al ganador y verifica si terminó la partida a PUNTOS_PARA_GANAR
  const cargarPuntos = (ganador, puntos) => {
    if (ganador === 'jugador') {
      setPuntosJugador((prev) => prev + puntos)
    } else if (ganador === 'maquina') {
      setPuntosMaquina((prev) => prev + puntos)
    }
  }

  const verificarGanadorPartida = () => {
    if (puntosJugador >= PUNTOS_PARA_GANAR) {
      Swal.fire('🎉 ¡Felicidades! ¡Ganaste la partida!')
      // Reiniciar todo para comenzar otra partida limpia
      resetJuegoCompleto()
    } else if (puntosMaquina >= PUNTOS_PARA_GANAR) {
      Swal.fire('🤖 La máquina ha ganado la partida. ¡Mejor suerte la próxima vez!')
      resetJuegoCompleto()
    }
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

  // Genera orden según quien empiece (mantuvimos tu función)
  const generarOrden = (primero) => {
    return primero === 'maquina' ? ['maquina', 'jugador'] : ['jugador', 'maquina']
  }

  // ---------- REPARTO Y CONTROL DE TURNOS ----------

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
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Atención',
        text: 'Ya se repartieron las cartas para esta ronda.',
      })
    }
  }

  const avanzarTurno = () => {
    // si ordenTiradas está vacío protegemos
    if (!ordenTiradas || ordenTiradas.length === 0) return
    setTurnoActual((prev) => (prev + 1) % ordenTiradas.length)
  }

  // ---------- ACCIONES DE JUGAR CARTAS ----------

  // La máquina tira: elige una carta (aquí simple: primera) y la pone en tiradas
  const tirarCartaMaquina = () => {
    const carta = cartasComputadora[0]
    if (carta) {
      setCartasTiradasRival((prev) => [...prev, carta])
      setCartasComputadora((prev) => prev.filter((c) => c.code !== carta.code))
    }
  }

  // El jugador tira su carta (verifica turno)
  const tirarCartaJugador = (carta) => {
    const jugadorActual = ordenTiradas[turnoActual]
    if (jugadorActual !== 'jugador') {
      Swal.fire('⏳ No es tu turno aún.')
      return
    }
    // Al tirar, guarda carta en tiradas y la quita de mano
    setCartasTiradasJugador((prev) => [...prev, carta])
    setCartasJugador((prev) => prev.filter((c) => c.code !== carta.code))
    avanzarTurno()
  }

  // ---------- EFECTOS: máquina automática y sincronización ----------

  // Efecto que hace que la máquina juegue cuando le toca, respetando bloqueo y orden
  useEffect(() => {
    if (!empezoLaPartida || bloquearMaquina) return
    if (!ordenTiradas || ordenTiradas.length === 0) return

    const jugadorActual = ordenTiradas[turnoActual]
    if (jugadorActual === 'maquina') {
      const timer = setTimeout(() => {
        tirarCartaMaquina()
        avanzarTurno()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [turnoActual, empezoLaPartida, bloquearMaquina, ordenTiradas])

  // ---------- ENVIDO: flujo con input, mentira y descubrimiento ----------

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

  // Marcar envido cantado
  setSeCantoEnvido(true)

  const { value: declarado } = await Swal.fire({
    title: 'Cantar Envido',
    text: 'Ingresá el valor que querés declarar (0-33)',
    input: 'number',
    inputAttributes: { min: 0, max: 33, step: 1 },
    showCancelButton: true,
  })

  if (declarado === undefined || declarado === null || declarado === '') return

  const declaradoNumero = Math.max(0, Math.min(33, parseInt(declarado, 10) || 0))
  setEnvidoDeclaradoJugador(declaradoNumero)

  const realJugador = calcularEnvido(cartasJugador)
  setEnvidoRealJugador(realJugador)

    // si el declarado es igual al real -> verdad
    if (declaradoNumero === realJugador) {
      // VERDAD: comparamos contra la máquina y el ganador recibe 2 puntos
      const envidoMaquina = calcularEnvido(cartasComputadora)
      if (realJugador > envidoMaquina) {
        Swal.fire(`🃏 Verdadero. Ganás Envido (${realJugador} vs ${envidoMaquina}). +2 pts`)
        // si además hay truco activo, sumamos también puntosALaRonda
        const totalPuntos = 2 + (trucoActivo ? puntosALaRonda : 0)
        cargarPuntos('jugador', totalPuntos)
      } else {
        Swal.fire(`🤖 Verdadero. La máquina gana Envido (${envidoMaquina} vs ${realJugador}). +2 pts`)
        const totalPuntos = 2 + (trucoActivo ? puntosALaRonda : 0)
        cargarPuntos('maquina', totalPuntos)
      }
    } else {
      // MENTIRA: se tira azar (1..5). Si cae 2 -> la máquina te descubre y gana 2 pts
      const azar = Math.floor(Math.random() * 5) + 1
      if (azar === 2) {
        Swal.fire('🤖 La máquina te descubrió. Gana 2 puntos.')
        // la máquina gana 2 puntos (además, si hay truco activo sumamos puntosALaRonda)
        const totalPuntos = 2 + (trucoActivo ? puntosALaRonda : 0)
        cargarPuntos('maquina', totalPuntos)
      } else {
        // No te descubrieron: comparamos el declarado del jugador con el real de la máquina
        const envidoMaquina = calcularEnvido(cartasComputadora)
        // IMPORTANTE: la comparación usa el valor declarado del jugador (según tu pedido)
        if (declaradoNumero > envidoMaquina) {
          Swal.fire(`🃏 No te descubrieron. Tu declarado (${declaradoNumero}) vence a la máquina (${envidoMaquina}). +2 pts`)
          const totalPuntos = 2 + (trucoActivo ? puntosALaRonda : 0)
          cargarPuntos('jugador', totalPuntos)
        } else {
          Swal.fire(`🤖 No te descubrieron. La máquina (${envidoMaquina}) gana al declarado (${declaradoNumero}). +2 pts`)
          const totalPuntos = 2 + (trucoActivo ? puntosALaRonda : 0)
          cargarPuntos('maquina', totalPuntos)
        }
      }
    }

    // Después del envido no se finaliza la ronda automáticamente por envido (salvo que quieras),
    // simplemente se actualizan puntos y se continúa el juego.
    verificarGanadorPartida()
  }

  // función para calcular envido (la tuya, exactamente)
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
          if (envido > maxEnvido) {
            maxEnvido = envido
          }
        }
      }
    }
    return maxEnvido
  }

  // ---------- TRUCO: cantar y efecto en puntos por ronda ----------

  const truco = () => {
    if (!empezoLaPartida) {
      Swal.fire('⚠️ Primero repartí las cartas para iniciar la partida.')
      return
    }
    // Si ya se cantó, no hacer nada por ahora (podés escalar)
    if (trucoActivo) {
      Swal.fire('⚠️ El Truco ya fue cantado; si querés podés aceptar/ir al re-truco en una extensión.')
      return
    }
    // Cantaron truco: ahora la ronda vale 2 (puedes ajustar escalas después)
    setTrucoActivo(true)
    setPuntosALaRonda(2)
    Swal.fire(`🃏 Truco cantado! Ahora la ronda vale ${2} puntos.`)
  }

  // ---------- COMPARATIVA DE CARTAS (tu efecto) ----------
  useEffect(() => {
    // Solo actuamos cuando ambos tiraron la misma cantidad de cartas (1 vs 1, 2 vs 2, ...)
    if (
      cartasTiradasJugador.length > 0 &&
      cartasTiradasJugador.length === cartasTiradasRival.length
    ) {
      const ultimaJugador = cartasTiradasJugador[cartasTiradasJugador.length - 1]
      const ultimaRival = cartasTiradasRival[cartasTiradasRival.length - 1]

      if (!ultimaJugador || !ultimaRival) return

      // Decidir ganadora de la mano por trucoValor (tu campo)
      let ganadorMano = null
      if (ultimaJugador.trucoValor > ultimaRival.trucoValor) {
        ganadorMano = 'jugador'
        setManosGanadasJugador((prev) => prev + 1)
        Swal.fire('🧠 Ganaste esta comparativa (mano).')
      } else if (ultimaJugador.trucoValor < ultimaRival.trucoValor) {
        ganadorMano = 'maquina'
        setManosGanadasMaquina((prev) => prev + 1)
        Swal.fire('🤖 La máquina ganó esta comparativa (mano).')
      } else {
        // Empate: según tus reglas, la máquina mantiene (como antes)
        ganadorMano = 'maquina'
        setManosGanadasMaquina((prev) => prev + 1)
        Swal.fire('⚖️ Empate: la máquina se queda la mano.')
      }

      // Bloqueamos la máquina momentáneamente para evitar que actúe durante la re-sincronización
      setBloquearMaquina(true)

      // Después de actualizar manos, verificamos si alguien alcanzó 2 manos (fin del truco/ronda)
      setTimeout(() => {
        // Tomamos valores actualizados desde estado (manosGanadasX podrían estar ligeramente desfasados en closure,
        // por seguridad leemos con funciones como desde el valor que sabe React).
        // Para evitar problemas de lectura inmediata, recomputamos con las longitudes y contadores al momento:
        // (aquí usamos una pequeña lectura basada en arrays y counters previos)
        const mgJugador = manosGanadasJugador + (ganadorMano === 'jugador' ? 1 : 0)
        const mgMaquina = manosGanadasMaquina + (ganadorMano === 'maquina' ? 1 : 0)

        if (mgJugador >= 2 || mgMaquina >= 2) {
          // Alguien ganó el truco por 2 manos: se suma puntosALaRonda al ganador y se reinicia la ronda.
          const ganadorRonda = mgJugador >= 2 ? 'jugador' : 'maquina'
          Swal.fire(`🏆 ${ganadorRonda === 'jugador' ? 'Ganaste' : 'La máquina ganó'} el Truco por 2 manos. +${puntosALaRonda} pts`)
          cargarPuntos(ganadorRonda, puntosALaRonda)

          // Reiniciamos la ronda (limpiamos manos tiradas y manos ganadas)
          reiniciarRonda(ganadorRonda)

        } else {
          // Si no terminó el truco, simplemente reiniciamos para la próxima comparativa:
          // reseteamos turno para la siguiente sub-mano y actualizamos el orden según quienEmpieza actual
          // (NOTA: quienEmpieza se mantiene o se actualiza de acuerdo a la última comparativa — mantendremos la regla anterior:
          // si gana jugador, empieza jugador en la siguiente comparativa; si gana la máquina, empieza máquina.)
          const nuevoInicio = ganadorMano === 'jugador' ? 'jugador' : 'maquina'
          setQuienEmpieza(nuevoInicio)
          setTurnoActual(0)
          setOrdenTiradas(generarOrden(nuevoInicio))

          // desbloqueamos la máquina luego de re-sincronizar
          setBloquearMaquina(false)
        }
      }, 300) // pequeño retardo para evitar race conditions
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartasTiradasJugador, cartasTiradasRival]) // este effect solo depende de las cartas tiradas

  // ---------- REINICIAR RONDA (cuando alguien ganó la ronda/truco) ----------
  const reiniciarRonda = (ganadorRonda) => {
    // aumentamos ronda, limpiamos manos y cartas tiradas, y preparamos siguiente reparto
    setRonda((prev) => prev + 1)
    setEmpezoLaPartida(false)
    setCartasTiradasJugador([])
    setCartasTiradasRival([])
    setManosGanadasJugador(0)
    setManosGanadasMaquina(0)
    setTrucoActivo(false)
    setPuntosALaRonda(1)
    setBloquearMaquina(false)
    setSeCantoEnvido(false)

    // cargamos puntos (ya lo hicimos antes de llamar a reiniciarRonda, pero si quisieras hacerlo aquí:
    // cargarPuntos(ganadorRonda, puntosALaRonda)

    // Verificamos si la partida llegó a su fin por puntos acumulados
    setTimeout(() => verificarGanadorPartida(), 200)
  }

  // ---------- UI: renderizado (tu estructura conservada) ----------
  return (
    <div className="juego-container">
      <h1 className="titulo-juego">Juego Dificil</h1>
      <h2 className="titulo-juego">Truco con cartas de blackshack</h2>

      <p>Ronda {ronda}</p>
      <p>Puntos Jugador: {puntosJugador} | Puntos Máquina: {puntosMaquina}</p>
      <p>Manos ganadas - Jugador: {manosGanadasJugador} | Máquina: {manosGanadasMaquina}</p>
      <h2>Valores pasados a blackshack</h2>
      
      Picas = Espadas<br /> 
      Tréboles = Bastos<br /> 
      Diamantes = Oros<br /> 
      Corazones = Copas<br />
      
      <p>Valor ronda (puntosALaRonda): {puntosALaRonda} {trucoActivo ? '(Truco activo)' : ''}</p>

      <br /> 
      <button onClick={repartirCartas}>Repartir Cartas</button>

      <br />
      <button onClick={envido}>Cantar Envido</button>

      <br />
      <button onClick={truco}>Cantar Truco</button>

      <div className="zona-juego" style={{ display: 'flex', gap: 40, marginTop: 20 }}>
        {/* Rival */}
        <div>
          <h3>Cartas del Rival</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {cartasComputadora.map((c) => (
              <img key={c.code} src={imagenAtras} alt="espalda" style={{ width: 90 }} />
            ))}
          </div>
        </div>

        {/* Jugador */}
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
