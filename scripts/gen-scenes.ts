import { writeFileSync } from 'node:fs'
import { sceneCss } from '../src/lib/scene/scenes'
writeFileSync('src/styles/scenes.css', sceneCss())
console.log('wrote src/styles/scenes.css')
