import express from 'express'
import morgan from 'morgan'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000
const imagesDir = path.resolve(__dirname, '../imagenes')

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true })
}

app.use(morgan(':date[iso] :method :url :status :response-time ms'))
app.use(express.json())
app.use('/imagenes', express.static(imagesDir))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'backend',
    time: new Date().toISOString()
  })
})

app.get('/api/info', (_req, res) => {
  res.json({
    message: 'Backend activo',
    imagesPath: imagesDir
  })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`[backend] running on http://0.0.0.0:${port}`)
  console.log(`[backend] serving images from ${imagesDir}`)
})
