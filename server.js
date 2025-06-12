process.loadEnvFile()
const { MongoClient, ObjectId } = require('mongodb')
const express = require('express')
const app = express()
const morgan = require('morgan')
const { validarPeli, validarPeliParcialmente } = require('./schemas/pelis')
const port = process.env.PORT ?? 3008
const MONGO_URI = process.env.MONGODB_URLSTRING
const DATABASE_NAME = 'movies'
const COLLECTION_NAME = 'movies'

let client
let db

async function connectToMongoDB(req, res, next) {
  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    db = client.db(DATABASE_NAME).collection(COLLECTION_NAME)
    console.log('Conectado a MongoDB')
    req.db = db // Adjunta la conexión a la solicitud
    next()
  } catch (error) {
    console.error('Error al conectarse a MongoDB:', error)
    res.status(500).send('Error al conectarse a la BD')
  }
}

async function disconnectFromMongoDB(req, res, next) {
  if (client) {
    await client.close()
    console.log('Desconectado de MongoDB')
  }
  next()
}

// Middleware
app.use(express.json())
app.use(morgan('dev'))

// Ruta principal
app.get('/', (req, res) => {
  res.json('Bienvenido a la API de películas!')
})

// Middleware de conexión a MongoDB para todas las rutas de películas
app.use('/peliculas', connectToMongoDB, async (req, res, next) => {
  res.on('finish', async () => {
    await disconnectFromMongoDB(req, res, next)
  })
  next()
})

const peliculasRouter = require('./src/routes/peliculasRoutes')

// Usa el router de películas
app.use('/peliculas', peliculasRouter)

// Inicializamos el servidor
app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`)
})
