import React from "react";

export default function Agradecimiento() {
  return (
    <div className="agradecimiento">
      <h1>🎉 ¡Felicidades por completar el Modo Historia! 🎉</h1>
      <p>
        Gracias por jugar y aprender sobre el arte del truco con El Gaucho Maestro.
        Esperamos que hayas disfrutado la experiencia y te sientas más preparado para tus futuras partidas.
      </p>
      <p>¡Nos vemos en la próxima mano!</p>
      <button onClick={() => window.location.href = '/'}>Volver al Menú Principal</button>
    </div>
  );
}