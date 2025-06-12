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
  // Asegúrate de desconectar después de enviar la respuesta
  res.on('finish', async () => {
    await disconnectFromMongoDB(req, res, next)
  })
  next()
})

// Obtener todas las películas
app.get('/peliculas', async (req, res) => {
  try {
    const { genero } = req.query
    const peliculas = genero
      ? await req.db
          .find({ genre: { $regex: genero, $options: 'i' } })
          .toArray()
      : await req.db.find().toArray()
    res.json(peliculas)
  } catch (error) {
    res.status(500).send('Error al obtener las películas')
  }
})

// Mostrar una peli por id
app.get('/peliculas/:id', async (req, res) => {
  try {
    const { id } = req.params
    const objectId = new ObjectId(id)
    const pelicula = await req.db.findOne({ _id: objectId })
    res.json(pelicula)
  } catch (error) {
    res.status(500).send('Error al obtener la película')
  }
})

// Agregar una peli
app.post('/peliculas', async (req, res) => {
  const resultado = validarPeli(req.body)
  if (!resultado.success) return res.status(400).json(resultado.error.message)

  try {
    await req.db.insertOne(resultado.data)
    res.status(201).json(resultado.data)
  } catch (error) {
    res.status(500).send('Error al agregar la película')
  }
})

// Borrar una peli por id
app.delete('/peliculas/:id', async (req, res) => {
  const { id } = req.params
  try {
    const objectId = new ObjectId(id)
    const { deletedCount } = await req.db.deleteOne({ _id: objectId })
    res
      .status(deletedCount > 0 ? 200 : 404)
      .json(
        deletedCount > 0
          ? { message: 'Peli borrada con éxito' }
          : { message: 'Peli no encontrada para borrar' }
      )
  } catch (error) {
    res.status(500).send('Error al borrar la película')
  }
})

// Modificar/Actualizar una peli
app.patch('/peliculas/:id', async (req, res) => {
  const resultado = validarPeliParcialmente(req.body)

  if (!resultado.success) return res.status(400).json(resultado.error.details)

  const { id } = req.params
  const objectId = new ObjectId(id)

  try {
    const updateResult = await req.db.findOneAndUpdate(
      { _id: objectId },
      { $set: resultado.data },
      { returnDocument: 'after' }
    )

    if (!updateResult) {
      res.status(404).json({ message: 'Peli no encontrada para actualizar' })
      return
    }

    res.json({
      message: 'Peli actualizada con éxito',
      updatedMovie: updateResult,
    })
  } catch (error) {
    res.status(500).send('Error al actualizar la película')
  }
})

// Inicializamos el servidor
app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`)
})
