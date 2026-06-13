/**
 * Point d'entrée public — façade vers le module affecter/.
 * @module useAffecter
 */
export { useAffecter } from './affecter/index'
export type { RowNode, RowAction } from './affecter/types'
export { dateValueParser, dateValueSetter } from './affecter/helpers'
