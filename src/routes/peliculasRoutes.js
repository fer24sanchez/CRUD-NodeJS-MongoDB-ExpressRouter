const { Router } = require('express')
const controller = require('../controllers/peliculasController')

const router = Router()

router.get('/', controller.getPeliculas)
router.get('/:id', controller.getPeliculaById)
router.post('/', controller.createPelicula)
router.delete('/:id', controller.deletePelicula)
router.patch('/:id', controller.updatePelicula)

module.exports = router