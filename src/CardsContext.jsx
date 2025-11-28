import React, { createContext, useContext, useEffect, useState } from 'react'

const CardsContext = createContext(null)

export function CardsProvider({ children }) {
  const [cartas, setCartas] = useState([])
  const [cartasFuertes, setCartasFuertes] = useState([])


  const asignarValorTruco = (carta) => {
    const valor = carta.value
    const palo = carta.suit
    const palos = { SPADES: 'espada', CLUBS: 'basto', DIAMONDS: 'oro', HEARTS: 'copa' }
    const p = palos[palo]

    if (valor === "ACE" && p === "espada") return 14
    if (valor === "ACE" && p === "basto") return 13
    if (valor === "7" && p === "espada") return 12
    if (valor === "7" && p === "oro") return 11
    if (valor === "3") return 10
    if (valor === "2") return 9
    if (valor === "ACE" && p === "basto" || "oro") return 8
    if (valor === "KING") return 7
    if (valor === "QUEEN") return 6
    if (valor === "10") return 5
    if (valor === "7" && p === "basto" || "oro") return 4
    if (valor === "6") return 3
    if (valor === "5") return 2
    if (valor === "4") return 1
    return 0
  }

  useEffect(() => {
    fetch('https://deckofcardsapi.com/api/deck/new/draw/?count=52')
      .then(res => res.json())
      .then(data => {
        const cartasOriginales = data.cards
        const cartasFiltradas = cartasOriginales.filter(c => {
          const valor = c.value
          return valor !== "JOKER" && valor !== "8" && valor !== "9"
        })
        const cartasConValor = cartasFiltradas.map(c => ({ ...c, trucoValor: asignarValorTruco(c) }))
        setCartas(cartasConValor)
        const soloFuertes = cartasConValor.filter(c => c.trucoValor > 7)
        setCartasFuertes(soloFuertes)
      })
      .catch(console.error)
  }, [])

  return (
    <CardsContext.Provider value={{ cartas, cartasFuertes, setCartas }}>

      {children}
    </CardsContext.Provider>
  )
}

export function useCards() {
  return useContext(CardsContext)
}