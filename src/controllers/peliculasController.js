const { ObjectId } = require('mongodb')
const { validarPeli, validarPeliParcialmente } = require('../../schemas/pelis')

// Obtener todas las películas
exports.getPeliculas = async (req, res) => {
  try {
    const { genero } = req.query
    const peliculas = genero
      ? await req.db.find({ genre: { $regex: genero, $options: 'i' } }).toArray()
      : await req.db.find().toArray()
    res.json(peliculas)
  } catch (error) {
    res.status(500).send('Error al obtener las películas')
  }
}

// Obtener una película por id
exports.getPeliculaById = async (req, res) => {
  try {
    const { id } = req.params
    const objectId = new ObjectId(id)
    const pelicula = await req.db.findOne({ _id: objectId })
    res.json(pelicula)
  } catch (error) {
    res.status(500).send('Error al obtener la película')
  }
}

// Agregar una película
exports.createPelicula = async (req, res) => {
  const resultado = validarPeli(req.body)
  if (!resultado.success) return res.status(400).json(resultado.error.message)

  try {
    await req.db.insertOne(resultado.data)
    res.status(201).json(resultado.data)
  } catch (error) {
    res.status(500).send('Error al agregar la película')
  }
}

// Borrar una película por id
exports.deletePelicula = async (req, res) => {
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
}

// Modificar/Actualizar una película
exports.updatePelicula = async (req, res) => {
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
}