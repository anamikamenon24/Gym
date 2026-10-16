import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('PulseFit crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-4 text-fg">
        <div className="glass max-w-md p-10 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-orange-400" />
          <h1 className="mt-4 text-2xl font-bold">Oops — we pulled a muscle</h1>
          <p className="mt-2 text-muted">Something went wrong on our side. A quick refresh usually fixes it.</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-6">
            <RotateCcw className="h-4 w-4" /> Reload PulseFit
          </button>
        </div>
      </div>
    )
  }
}
