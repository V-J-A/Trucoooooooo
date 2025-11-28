import React, { useState, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'
import { useCards } from './CardsContext'

// ==================== CONFIGURACIÓN Y AYUDAS ====================

const esperar = (min, max = null) => {
  const tiempo = max ? Math.floor(Math.random() * (max - min + 1)) + min : min
  return new Promise(resolve => setTimeout(resolve, tiempo))
}

const obtenerFuerzaCarta = (carta) => {
  if (!carta || !carta.code) return 0
  const v = carta.code.substring(0, carta.code.length - 1)
  const p = carta.code.slice(-1)

  if (v === '1' && p === 'S') return 14
  if (v === '1' && p === 'C') return 13
  if (v === '7' && p === 'S') return 12
  if (v === '7' && p === 'D') return 11
  if (v === '3') return 10
  if (v === '2') return 9
  if (v === '1') return 8
  if (v === '12') return 7
  if (v === '11') return 6
  if (v === '10') return 5
  if (v === '7') return 4
  if (v === '6') return 3
  if (v === '5') return 2
  return 1
}

const calcularPuntosEnvido = (cartas) => {
  const valores = cartas.map(c => {
    let v = parseInt(c.value)
    if (isNaN(v)) {
        if (c.value === "ACE") v = 1
        else if (["KING", "QUEEN", "JACK"].includes(c.value)) v = 10 
        else v = 0
    }
    return (v >= 10) ? 0 : v
  })
  let max = 0, par = false
  for (let i = 0; i < cartas.length; i++) {
    for (let j = i + 1; j < cartas.length; j++) {
      if (cartas[i].suit === cartas[j].suit) {
        const suma = valores[i] + valores[j] + 20
        if (suma > max) max = suma
        par = true
      }
    }
  }
  if (!par) max = Math.max(...valores)
  return max
}

// Frases
const FRASES = {
    envido: {
      agresivo: ["¡Envido!", "¡Envido, carajo!", "Cantemos Envido."],
      dudoso: ["Mmm... Envido.", "Envido.", "A ver... Envido."],
      real: ["¡Real Envido!", "¡Real Envido, papá!", "Se agranda... Real Envido."],
      aceptar: ["¡Quiero!", "Venga, quiero.", "Sí, dale."],
      rechazar: ["No quiero.", "Paso.", "No llego... no quiero."]
    },
    truco: {
      cantar: ["¡Truco!", "¿Jugamos? ¡Truco!", "¡Truco!"],
      agresivo: ["¡TRUCO!", "¡Te canto TRUCO!", "¡Truco y a otra cosa!"],
      retruco: ["¡Quiero Retruco!", "¡No, Retruco!", "¡Retruco!"],
      vale4: ["¡Quiero Vale Cuatro!", "¡Vale Cuatro!"],
      aceptar: ["¡Quiero!", "Venga.", "Dale, jugá."],
      rechazar: ["No quiero.", "Me voy al mazo.", "Paso."]
    }
}
const decir = (cat, sub) => {
    const arr = FRASES[cat][sub]
    return arr[Math.floor(Math.random() * arr.length)]
}

export default function JuegoGaucho() {
  const { cartas } = useCards()
  const { cartasFuertes } = useCards()


  // --- ESTADOS DE FLUJO ---
  const [empezoLaPartida, setEmpezoLaPartida] = useState(false)
  const [bloqueoGeneral, setBloqueoGeneral] = useState(false) // Bloquea TODO (resolución manos)
  const [pensandoIA, setPensandoIA] = useState(false) // Bloquea solo por pensamiento
  
  // --- ESTADOS DE JUEGO ---
  const [turnoActual, setTurnoActual] = useState(0) // 0 o 1 (índice del array orden)
  const [ordenTiradas, setOrdenTiradas] = useState([]) // ['jugador', 'maquina'] o viceversa
  const [quienEmpieza, setQuienEmpieza] = useState('maquina')
  const [ronda, setRonda] = useState(1)

  // --- CARTAS ---
  const [cartasJugador, setCartasJugador] = useState([])
  const [cartasComputadora, setCartasComputadora] = useState([])
  const [cartasTiradasJugador, setCartasTiradasJugador] = useState([])
  const [cartasTiradasRival, setCartasTiradasRival] = useState([])

  // --- PUNTOS Y CANTOS ---
  const [puntosJugador, setPuntosJugador] = useState(0)
  const [puntosMaquina, setPuntosMaquina] = useState(0)
  const [manosGanadasJugador, setManosGanadasJugador] = useState(0)
  const [manosGanadasMaquina, setManosGanadasMaquina] = useState(0)
  
  const [seCantoEnvido, setSeCantoEnvido] = useState(false)
  const [trucoActivo, setTrucoActivo] = useState(false)
  const [puntosALaRonda, setPuntosALaRonda] = useState(1)

  // --- CONTROL DE SEGURIDAD (ANTIDOBLE TIRO) ---
  const ultimoTurnoProcesado = useRef(null) 

  const PUNTOS_PARA_GANAR = 15

  // ==================== 1. MOTOR DE IA (CEREBRO Y TURNOS) ====================

  useEffect(() => {
    // CONDICIONES ESTRICTAS PARA QUE LA IA JUEGUE
    if (!empezoLaPartida || bloqueoGeneral || pensandoIA) return
    if (ordenTiradas[turnoActual] !== 'maquina') return // No es su turno
    if (cartasComputadora.length === 0) return // No tiene cartas

    // --- CANDADO FÍSICO (Contar cartas en mesa) ---
    // Si la máquina es mano (tira primero) y ya hay mas cartas suyas que tuyas, STOP.
    if (ordenTiradas[0] === 'maquina' && cartasTiradasRival.length > cartasTiradasJugador.length) return
    // Si el jugador es mano y tenemos la misma cantidad, me toca a mí, sino STOP.
    // (Ej: Jugador tira (1-0), Maquina tira (1-1). Si vuelve a entrar aquí, (1-1) = STOP).
    if (ordenTiradas[0] === 'jugador' && cartasTiradasRival.length === cartasTiradasJugador.length && cartasTiradasRival.length > 0) return // Ya tiré mi respuesta

    // --- CANDADO LÓGICO (ID único de turno) ---
    // Creamos un ID basado en el estado actual del juego
    const idTurnoActual = `R${ronda}-M${manosGanadasJugador+manosGanadasMaquina}-T${turnoActual}-C${cartasComputadora.length}`
    if (ultimoTurnoProcesado.current === idTurnoActual) return // Ya procesé este momento exacto
    
    ultimoTurnoProcesado.current = idTurnoActual // Marco este momento como procesado
    ejecutarTurnoIA()

  }, [turnoActual, ordenTiradas, empezoLaPartida, bloqueoGeneral, cartasTiradasRival.length, cartasTiradasJugador.length])

  const ejecutarTurnoIA = async () => {
    setPensandoIA(true) // Activar bloqueo visual

    try {
        await esperar(800, 1800) // Pensamiento natural

        // 1. ENVIDO (Solo si es primera mano y no cantado)
        if (!seCantoEnvido && cartasComputadora.length === 3 && cartasJugador.length === 3) {
            const decision = cerebroEnvido()
            if (decision.cantar) {
                await cantarEnvidoIA(decision.nivel)
                if (verificarGanadorPartida()) { setPensandoIA(false); return } // Si terminó, salir
            }
        }

        // 2. TRUCO
        if (!trucoActivo) {
            const decisionTruco = cerebroTruco()
            if (decisionTruco.cantar) {
                 const res = await cantarTrucoIA(decisionTruco.nivel)
                 if (res === 'termino_ronda') { setPensandoIA(false); return }
            }
        }

        // 3. JUGAR CARTA
        await esperar(500) // Pequeña pausa pre-tiro
        const carta = seleccionarMejorCarta()
        
        // Ejecución atómica
        setCartasTiradasRival(prev => [...prev, carta])
        setCartasComputadora(prev => prev.filter(c => c.code !== carta.code))
        
        // Importante: No avanzamos turno aquí manualmente con setTurnoActual
        // El useEffect de "Resolución de Mano" detectará la carta y decidirá qué hacer.
        
    } catch (error) {
        console.error("Error IA", error)
    } finally {
        setPensandoIA(false) // Liberar siempre
    }
  }

  // ==================== 2. RESOLUCIÓN DE MANO (ÁRBITRO) ====================
  
  // Este efecto vigila la mesa. Cuando ambos tiraron, resuelve.
  useEffect(() => {
    if (!empezoLaPartida) return
    const cantJ = cartasTiradasJugador.length
    const cantM = cartasTiradasRival.length

    // Si no hay igualdad de cartas, significa que alguien tiró y le toca al otro.
    // Solo avanzamos turno si NO estamos resolviendo una mano completa.
    if (cantJ !== cantM) {
        // Ejemplo: Empieza Maquina. Tira (0,1). Turno actual es 0. 
        // Ahora debe ser 1 (Jugador).
        // Pero OJO: Si Maquina tiró, `cantM` > `cantJ`.
        
        // Calculamos a quién le toca matemáticamente
        // Si orden[0] es Maquina:
        // M: 1, J: 0 -> Toca J (índice 1)
        // M: 1, J: 1 -> Resolviendo...
        
        const totalCartas = cantJ + cantM
        const nuevoTurno = totalCartas % 2 
        
        // Solo actualizamos si difiere, para evitar renders innecesarios
        if (turnoActual !== nuevoTurno && cantJ !== cantM) {
            setTurnoActual(nuevoTurno)
        }
        return 
    }

    // SI LLEGAMOS ACÁ, cantJ === cantM y > 0. AMBOS TIRARON.
    if (cantJ === 0) return 

    // BLOQUEAMOS TODO PARA RESOLVER
    setBloqueoGeneral(true)

    const resolver = async () => {
        await esperar(800) // Suspenso viendo las cartas

        const uJ = cartasTiradasJugador[cantJ - 1]
        const uM = cartasTiradasRival[cantM - 1]
        
        const fJ = obtenerFuerzaCarta(uJ)
        const fM = obtenerFuerzaCarta(uM)
        
        let ganaMano = 'parda'
        if (fJ > fM) ganaMano = 'jugador'
        else if (fM > fJ) ganaMano = 'maquina'
        else ganaMano = quienEmpieza // En parda gana el mano

        // Actualizar contadores
        if (ganaMano === 'jugador') setManosGanadasJugador(p => p + 1)
        else setManosGanadasMaquina(p => p + 1)

        // Chequear si terminó la ronda
        const mj = manosGanadasJugador + (ganaMano === 'jugador' ? 1 : 0)
        const mm = manosGanadasMaquina + (ganaMano === 'maquina' ? 1 : 0)

        if (mj >= 2 || mm >= 2) {
             // FIN DE RONDA
             const ganadorRonda = mj >= 2 ? 'jugador' : 'maquina'
             await Swal.fire({
                 title: ganadorRonda === 'jugador' ? '👏 Ganaste la ronda' : '💀 Perdiste la ronda',
                 text: `Suman ${puntosALaRonda} puntos`,
                 timer: 1500, showConfirmButton: false
             })
             cargarPuntos(ganadorRonda, puntosALaRonda)
             reiniciarRonda()
        } else {
             // SIGUE LA RONDA
             // El que ganó tira primero (es índice 0 del nuevo orden)
             setQuienEmpieza(ganaMano) // Para saber quien es mano en sig parda
             setOrdenTiradas(ganaMano === 'maquina' ? ['maquina', 'jugador'] : ['jugador', 'maquina'])
             setTurnoActual(0) // El ganador siempre tira primero (índice 0)
             
             // Desbloqueamos para que juegue
             setBloqueoGeneral(false)
        }
    }
    resolver()

  }, [cartasTiradasJugador, cartasTiradasRival]) // Se dispara cuando cambian las cartas en mesa

  // ==================== 3. CEREBROS Y LÓGICA ====================

  const obtenerEstadoAnimico = () => {
    let animo = 50
    if (puntosMaquina > puntosJugador) animo += 15
    if (manosGanadasMaquina > manosGanadasJugador) animo += 15
    if (puntosMaquina < 5 && puntosJugador > 10) animo -= 20
    return Math.max(0, Math.min(100, animo))
  }

  const cerebroEnvido = () => {
      const ptos = calcularPuntosEnvido(cartasComputadora)
      const animo = obtenerEstadoAnimico()
      const umbral = animo > 70 ? 26 : 28 // Si está feliz arriesga más
      const mentira = Math.random() < 0.15 && ptos < 20
      
      if (ptos >= umbral || mentira) return { cantar: true, nivel: ptos > 30 ? 'agresivo' : 'dudoso' }
      return { cantar: false }
  }

  const cerebroTruco = () => {
      const fuerza = cartasComputadora.reduce((acc, c) => acc + obtenerFuerzaCarta(c), 0)
      const animo = obtenerEstadoAnimico()
      const ganoPrimera = manosGanadasMaquina === 1 && manosGanadasJugador === 0
      
      // Si ganó primera y tiene algo decente
      if (ganoPrimera && fuerza > 15) return { cantar: true, nivel: 'agresivo' }
      // Si tiene mano fuerte
      if (fuerza > 28) return { cantar: true, nivel: 'cantar' }
      // Desesperación
      if (animo < 30 && fuerza < 10 && Math.random() < 0.2) return { cantar: true, nivel: 'agresivo' }
      
      return { cantar: false }
  }

  const seleccionarMejorCarta = () => {
      const ordenadas = [...cartasComputadora].sort((a,b) => obtenerFuerzaCarta(b) - obtenerFuerzaCarta(a))
      
      // Si soy mano, tiro la más alta para asegurar (simple)
      if (cartasTiradasJugador.length === cartasTiradasRival.length) return ordenadas[0]

      // Si respondo
      const rival = cartasTiradasJugador[cartasTiradasJugador.length - 1]
      const fRival = obtenerFuerzaCarta(rival)
      
      // Buscar la carta más chica que le gane
      const ganadoras = ordenadas.filter(c => obtenerFuerzaCarta(c) > fRival)
      // Si tengo ganadoras, tiro la peor de ellas (la última del array filtrado) para guardar las altas
      if (ganadoras.length > 0) return ganadoras[ganadoras.length - 1]
      
      // Si pierdo, tiro la más chica (la última del array original)
      return ordenadas[ordenadas.length - 1]
  }

  // ==================== 4. ACCIONES ====================

  const cantarEnvidoIA = async (nivel) => {
      setSeCantoEnvido(true)
      const resp = await Swal.fire({
          title: `🤖 "${decir('envido', nivel)}"`,
          showDenyButton: true, showCancelButton: true,
          confirmButtonText: 'Quiero', denyButtonText: 'No quiero', cancelButtonText: 'Real Envido',
          allowOutsideClick: false
      })
      if (resp.isConfirmed) await resolverEnvido(2)
      else if (resp.isDenied) { cargarPuntos('maquina', 1); Swal.fire('🤖 Gana 1 punto.') }
      else if (resp.dismiss === Swal.DismissReason.cancel) {
          await esperar(1500)
          // Respuesta a Real Envido
          const pts = calcularPuntosEnvido(cartasComputadora)
          if (pts >= 27 || (pts > 24 && obtenerEstadoAnimico() > 60)) {
              Swal.fire(`🤖 "${decir('envido', 'aceptar')}"`)
              await resolverEnvido(3)
          } else {
              Swal.fire(`🤖 "${decir('envido', 'rechazar')}"`)
              cargarPuntos('jugador', 2)
          }
      }
  }

  const cantarTrucoIA = async (nivel) => {
      const resp = await Swal.fire({
          title: `🤖 "${decir('truco', nivel)}"`,
          showDenyButton: true, showCancelButton: true,
          confirmButtonText: 'Quiero', denyButtonText: 'No quiero', cancelButtonText: 'Re Truco',
          allowOutsideClick: false
      })
      if (resp.isConfirmed) {
          setTrucoActivo(true); setPuntosALaRonda(2); Swal.fire('🗣️ "¡Se juega!"'); return 'sigue'
      } else if (resp.isDenied) {
          cargarPuntos('maquina', 1); reiniciarRonda(); return 'termino_ronda'
      } else if (resp.dismiss === Swal.DismissReason.cancel) {
          return await responderReTrucoIA()
      }
  }

  const responderReTrucoIA = async () => {
      await esperar(1500)
      const tiene3 = cartasComputadora.some(c => obtenerFuerzaCarta(c) >= 10)
      if (tiene3 || (obtenerEstadoAnimico() > 80)) {
          Swal.fire(`🤖 "${decir('truco', 'aceptar')}"`); setTrucoActivo(true); setPuntosALaRonda(3); return 'sigue'
      }
      Swal.fire(`🤖 "${decir('truco', 'rechazar')}"`); cargarPuntos('jugador', 2); reiniciarRonda(); return 'termino_ronda'
  }

  // --- INTERACCIÓN JUGADOR ---

  const jugadorTiraCarta = (carta) => {
      if (bloqueoGeneral || pensandoIA || ordenTiradas[turnoActual] !== 'jugador') return
      
      setCartasTiradasJugador(prev => [...prev, carta])
      setCartasJugador(prev => prev.filter(c => c.code !== carta.code))
      // No tocamos turnoActual, el useEffect de resolución lo hará.
  }

  const jugadorCantaEnvido = async () => {
      if (bloqueoGeneral || pensandoIA) return
      setSeCantoEnvido(true); setBloqueoGeneral(true)
      Swal.fire({ title: '📣 ¡ENVIDO!', showConfirmButton: false, timer: 1000 })
      await esperar(1500)
      
      const pts = calcularPuntosEnvido(cartasComputadora)
      let accion = 'no_quiero'
      if (pts > 28) accion = 'real'
      else if (pts >= 24) accion = 'quiero'
      
      if (accion === 'real') {
         const r = await Swal.fire({ title: `🤖 "${decir('envido', 'real')}"`, showDenyButton: true, confirmButtonText: 'Quiero', denyButtonText: 'No' })
         if(r.isConfirmed) await resolverEnvido(4)
         else cargarPuntos('maquina', 2)
      } else if (accion === 'quiero') {
         Swal.fire(`🤖 "${decir('envido', 'aceptar')}"`); await resolverEnvido(2)
      } else {
         Swal.fire(`🤖 "${decir('envido', 'rechazar')}"`); cargarPuntos('jugador', 1)
      }
      setBloqueoGeneral(false)
  }

  const jugadorCantaTruco = async () => {
      if (bloqueoGeneral || pensandoIA) return
      if (trucoActivo) return // Aquí iría ReTruco jugador
      setTrucoActivo(true); setBloqueoGeneral(true)
      
      Swal.fire({ title: '📣 ¡TRUCO!', showConfirmButton: false, timer: 1000 })
      await esperar(1500)
      
      const fuerza = cartasComputadora.reduce((a,c)=>a+obtenerFuerzaCarta(c),0)
      const acepta = fuerza > 20 || (puntosMaquina > puntosJugador)
      
      if (acepta) {
          Swal.fire(`🤖 "${decir('truco', 'aceptar')}"`); setPuntosALaRonda(2); setBloqueoGeneral(false)
      } else {
          Swal.fire(`🤖 "${decir('truco', 'rechazar')}"`); cargarPuntos('jugador', 1); reiniciarRonda() // Termina
      }
  }

  // --- UTILS ---
const resolverEnvido = async (pts) => {
    const { value } = await Swal.fire({
        title: `Por ${pts} puntos`,
        input: "number",
        text: "¿Cuántos puntos tenés?",
        inputAttributes: { min: 0, max: 33 }
    });

    if (!value && value !== "0") return;

    const pJ = parseInt(value) || 0;
    const pM = calcularPuntosEnvido(cartasComputadora);
    const maxJugadorReal = calcularPuntosEnvido(cartasJugador);

    // ========================================
    // PROBABILIDAD DE DETECTAR LA MENTIRA
    // ========================================
    const PROB_DETECTAR_MENTIRA = 0.80; // 80% detecta, 20% te cree
    const random = Math.random(); // entre 0 y 1

    // ========================================
    // 1. DETECCCIÓN DE MENTIRA (ahora probabilística)
    // ========================================
    const jugadorMiente = pJ > maxJugadorReal;

    if (jugadorMiente) {
        if (random < PROB_DETECTAR_MENTIRA) {
            // La máquina detecta que mentiste
            await Swal.fire({
                title: "🤖 ¡Mentiste!",
                text: `Eso es imposible. Tu máximo real es ${maxJugadorReal}.`,
                icon: "warning"
            });

            await Swal.fire({
                title: "🤖 'El punto es mío por caradura.'",
                icon: "error"
            });

            cargarPuntos("maquina", pts);
            return;
        } else {
            // La máquina NO detecta tu mentira → te cree
            await Swal.fire({
                title: "🤖 Hm… bueno…",
                text: "Te creo. Vamos a ver quién gana.",
                icon: "info"
            });
        }
    }

    // ========================================
    // 2. RESOLUCIÓN NORMAL DEL ENVÍDO
    // ========================================
    if (pJ > pM) {
        await Swal.fire(`Ganás vos (${pJ} vs ${pM})`);
        cargarPuntos("jugador", pts);
    } else {
        await Swal.fire(`Gana la máquina (${pM} vs ${pJ})`);
        cargarPuntos("maquina", pts);
    }
};

  const cargarPuntos = (ganador, pts) => ganador === 'jugador' ? setPuntosJugador(p=>p+pts) : setPuntosMaquina(p=>p+pts)
  
  const verificarGanadorPartida = () => {
      if (puntosJugador >= PUNTOS_PARA_GANAR) { Swal.fire('🏆 GANASTE EL PARTIDO'); reset(); return true }
      if (puntosMaquina >= PUNTOS_PARA_GANAR) { Swal.fire('💀 PERDISTE EL PARTIDO'); reset(); return true }
      return false
  }

  const reset = () => {
      setPuntosJugador(0); setPuntosMaquina(0); setEmpezoLaPartida(false); setRonda(1)
      setCartasJugador([]); setCartasComputadora([]); setCartasTiradasJugador([]); setCartasTiradasRival([])
      setManosGanadasJugador(0); setManosGanadasMaquina(0); setSeCantoEnvido(false); setTrucoActivo(false)
      setBloqueoGeneral(false); setPensandoIA(false); setPuntosALaRonda(1)
  }
  
  const reiniciarRonda = () => {
      if (verificarGanadorPartida()) return
      setRonda(r => r + 1); setEmpezoLaPartida(false); setBloqueoGeneral(false); setPensandoIA(false)
      setCartasTiradasJugador([]); setCartasTiradasRival([]); setManosGanadasJugador(0); setManosGanadasMaquina(0)
      setTrucoActivo(false); setPuntosALaRonda(1); setSeCantoEnvido(false); ultimoTurnoProcesado.current = null
  }

  const repartir = () => {
      if (!cartas || cartas.length < 6) return
      const mazo = [...cartas].sort(() => Math.random() - 0.5)
      const mazoFuertes = [...cartasFuertes].sort(() => Math.random() - 0.5)
      setCartasJugador(mazo.slice(0,3)); setCartasComputadora(mazoFuertes.slice(0,3))
      setEmpezoLaPartida(true); setTurnoActual(0)
      setCartasTiradasJugador([]); setCartasTiradasRival([]); setManosGanadasJugador(0); setManosGanadasMaquina(0)
      const orden = quienEmpieza === 'maquina' ? ['maquina', 'jugador'] : ['jugador', 'maquina']
      setOrdenTiradas(orden); setSeCantoEnvido(false); setTrucoActivo(false); setPuntosALaRonda(1)
      setBloqueoGeneral(false); setPensandoIA(false); ultimoTurnoProcesado.current = null
  }

  // --- VISTA ---
  const imgAtras = "https://deckofcardsapi.com/static/img/back.png"
  const esMiTurno = !bloqueoGeneral && !pensandoIA && ordenTiradas[turnoActual] === 'jugador'

  return (
    <div className="juego-container" style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>TRUCO DEFINITIVO</h1>
      <div style={{ background: '#980000ff', padding: 15, margin: '10px auto', maxWidth: 600, display: 'flex', justifyContent: 'space-between', borderRadius: 8 }}>
          <div>Vos: <strong>{puntosJugador}</strong></div>
          <div>Ronda: {ronda} | Valor: {puntosALaRonda}</div>
          <div>Máquina: <strong>{puntosMaquina}</strong></div>
      </div>

      {!empezoLaPartida ? (
          <button onClick={repartir} style={{padding: '10px 20px', fontSize: 20}}>Repartir</button>
      ) : (
          <div>
              <div style={{marginBottom: 20}}>
                  <button onClick={jugadorCantaEnvido} disabled={!esMiTurno || seCantoEnvido}>Envido</button>
                  <button onClick={jugadorCantaTruco} disabled={!esMiTurno}>{trucoActivo ? 'Re Truco' : 'Truco'}</button>
              </div>

              {/* MÁQUINA */}
              <div>
                  <div style={{display:'flex', justifyContent:'center', gap:5}}>
                     {cartasComputadora.map((c,i) => <img key={i} src={imgAtras} width={80} style={{borderRadius:5}}/>)}
                  </div>
                  <p>{pensandoIA ? '🤖 Pensando...' : (bloqueoGeneral ? '⚖️ Resolviendo...' : '🤖 Esperando...')}</p>
              </div>

              {/* MESA */}
              <div style={{background: '#2e7d32', height: 160, margin: '20px auto', maxWidth: 600, borderRadius: 10, display:'flex', justifyContent:'space-around', alignItems:'center', border:'4px solid #1b5e20'}}>
                  <div>{cartasTiradasRival.map(c => <img key={c.code} src={c.image} width={70} style={{margin:4}}/>)}</div>
                  <div>{cartasTiradasJugador.map(c => <img key={c.code} src={c.image} width={70} style={{margin:4}}/>)}</div>
              </div>

              {/* JUGADOR */}
              <div>
                  <p>{esMiTurno ? '⚡ TU TURNO' : '✋ ESPERÁ...'}</p>
                  <div style={{display:'flex', justifyContent:'center', gap:10}}>
                      {cartasJugador.map(c => (
                          <img key={c.code} src={c.image} width={100} 
                            style={{ cursor: esMiTurno ? 'pointer' : 'not-allowed', opacity: esMiTurno ? 1 : 0.6, transition: '0.2s' }}
                            onClick={() => jugadorTiraCarta(c)}
                          />
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  )
}