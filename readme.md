
# API de Películas

Este repositorio contiene una API desarrollada con Express y MongoDB que permite gestionar una colección de películas. La API permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre las películas almacenadas en una base de datos MongoDB.

## Instalación

Para instalar y ejecutar este proyecto, sigue los siguientes pasos:

1. Inicializa el proyecto y añade las dependencias necesarias:
    ```sh
    npm init -y
    npm install express mongodb
    ```

2. Crea un archivo `src/mongodb.js` donde pondremos la configuración de conexión a la base de datos.

3. Crea el archivo `server.js` que será el punto de entrada a nuestra aplicación.

4. Crea un archivo `.env` donde irán nuestras credenciales y la ruta de conexión a la base de datos.

### Configuración de MongoDB

1. Carga el archivo `.env`:
    ```js
    process.loadEnvFile()
    ```
2. Importa el cliente de MongoDB:
    ```js
    const { MongoClient } = require('mongodb')
    ```
3. Conéctate utilizando `connectionString`.
4. Crea las funciones de conexión y desconexión.

## Archivo `server.js`

1. Carga el archivo `.env`:
    ```js
    process.loadEnvFile()
    ```
2. Importa las dependencias necesarias:
    ```js
    const { MongoClient, ObjectId } = require('mongodb')
    const express = require('express')
    const app = express()
    const morgan = require('morgan')
    const { validarPeli, validarPeliParcialmente } = require('./schemas/pelis')
    ```
3. Define las variables de entorno y la configuración de la base de datos:
    ```js
    const port = process.env.PORT ?? 3008
    const MONGO_URI = process.env.MONGODB_URLSTRING
    const DATABASE_NAME = 'database'
    const COLLECTION_NAME = 'movies'
    ```
4. Crea las funciones de conexión y desconexión:
    ```js
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
    ```
5. Configura el middleware:
    ```js
    app.use(express.json())
    app.use(morgan('dev'))
    ```
6. Define las rutas y sus controladores:
    ```js
    app.get('/', (req, res) => {
      res.json('Bienvenido a la API de películas!')
    })

    app.use('/peliculas', connectToMongoDB, async (req, res, next) => {
      res.on('finish', async () => {
        await disconnectFromMongoDB(req, res, next)
      })
      next()
    })

    app.get('/peliculas', async (req, res) => {
      try {
        const { genero } = req.query
        const peliculas = genero
          ? await req.db.find({ genre: { $regex: genero, $options: 'i' } }).toArray()
          : await req.db.find().toArray()
        res.json(peliculas)
      } catch (error) {
        res.status(500).send('Error al obtener las películas')
      }
    })

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

    app.delete('/peliculas/:id', async (req, res) => {
      const { id } = req.params
      try {
        const objectId = new ObjectId(id)
        const { deletedCount } = await req.db.deleteOne({ _id: objectId })
        res.status(deletedCount > 0 ? 200 : 404).json(
          deletedCount > 0
            ? { message: 'Peli borrada con éxito' }
            : { message: 'Peli no encontrada para borrar' }
        )
      } catch (error) {
        res.status(500).send('Error al borrar la película')
      }
    })

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

    app.listen(port, () => {
      console.log(`Example app listening on http://localhost:${port}`)
    })
    ```

## Estructura del Proyecto

- `src/mongodb.js`: Módulo para conectar y desconectar de la base de datos MongoDB.
- `schemas/pelis.js`: Módulo para la validación de los datos de las películas.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request para discutir cualquier cambio que desees realizar.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.
