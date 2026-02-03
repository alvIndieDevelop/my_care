'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">📵</div>
        <h1 className="text-2xl font-bold text-foreground">
          Sin conexión
        </h1>
        <p className="text-muted-foreground">
          No hay conexión a internet. Por favor, verifica tu conexión e intenta de nuevo.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors min-h-[48px]"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
