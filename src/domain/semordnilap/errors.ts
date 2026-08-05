export class InvalidSemordnilapError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidSemordnilapError'
  }
}
