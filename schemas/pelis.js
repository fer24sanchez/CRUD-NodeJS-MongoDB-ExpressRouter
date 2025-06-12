const z = require('zod')

const peliSchema = z.object({
  title: z.string().min(1, 'El titulo es obligatorio'),
  year: z.number().int().min(1900).max(2050),
  genre: z.array(
    z.enum([
      'Action',
      'Drama',
      'Adventure',
      'Sci-Fi',
      'Crime',
      'Comedy',
      'Fantasy',
    ])
  ),
  rate: z.number().int().min(0).max(10).default(5),
  director: z.string().min(1, 'El director es obligatorio'),
  duration: z.number().int().min(15).max(999),
  poster: z.string().url({ message: 'debe ser una URL valida' }).optional(),
})

function validarPeli(campos) {
  return peliSchema.safeParse(campos)
}
function validarPeliParcialmente(campos) {
  return peliSchema.partial().safeParse(campos)
}
module.exports = {
  validarPeli,
  validarPeliParcialmente,
}
