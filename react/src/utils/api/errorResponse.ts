import type { IErrorMessage } from '../../types/errorModalMessage'

export const getErrorMessage = (status: string): IErrorMessage => {
  switch (status) {
    case '500':
      return {
        status: 500,
        message: 'Generare AWB a esuat. Mai incearca o data',
      }

    case '404':
      return {
        status: 404,
        message: 'Adresa nu a fost gasita',
      }

    case '408':
      return {
        status: 408,
        message: 'Timpul acestei actiuni a expirat. Mai incearca o data',
      }

    default:
      return {
        status: 0,
        message: 'Oops Ceva nu a mers',
      }
  }
}
