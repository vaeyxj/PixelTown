import { startGame } from './game/GameScene'
import { startEditor } from './editor/EditorApp'

const params = new URLSearchParams(location.search)
const route = params.get('mode') ?? (location.pathname.includes('editor') ? 'collision' : 'game')

const app = document.getElementById('app')!

if (route === 'game') {
  startGame(app)
} else {
  startEditor(app, route === 'foreground' ? 'foreground' : 'collision')
}
