/**
 * Composable pour la persistance des préférences utilisateur
 *
 * Gère automatiquement la sauvegarde et restauration des états utilisateur
 */

import { ref, watch, onMounted } from 'vue'
import type { PersistenceConfig } from '../types/serverTable'

export interface UseDataTablePersistenceConfig {
  /** Clé de stockage LocalStorage */
  storageKey: string
  /** Délai de sauvegarde (ms) */
  saveDelay?: number
  /** Fonction appelée lors de la restauration */
  onRestore?: (config: PersistenceConfig) => void
  /** Fonction appelée lors de la sauvegarde */
  onSave?: (config: PersistenceConfig) => void
}

export interface PersistenceState {
  /** Configuration actuelle */
  config: PersistenceConfig
  /** Dernière sauvegarde */
  lastSaved: Date | null
  /** En cours de sauvegarde */
  isSaving: boolean
}

export interface PersistenceActions {
  /** Sauvegarder manuellement */
  save: () => void
  /** Restaurer depuis le stockage */
  restore: () => PersistenceConfig | null
  /** Effacer toutes les données persistées */
  clear: () => void
  /** Mettre à jour une partie de la config */
  update: (updates: Partial<PersistenceConfig>) => void
  /** Vérifier si des données sont persistées */
  hasData: () => boolean
}

/**
 * Composable principal pour la persistance
 */
export function useDataTablePersistence(config: UseDataTablePersistenceConfig) {
  const {
    storageKey,
    saveDelay = 500,
    onRestore,
    onSave
  } = config

  // État
  const currentConfig = ref<PersistenceConfig>({})
  const lastSaved = ref<Date | null>(null)
  const isSaving = ref(false)

  // Timer pour le délai de sauvegarde
  let saveTimer: NodeJS.Timeout | null = null

  // Actions
  const saveToStorage = (config: PersistenceConfig) => {
    try {
      isSaving.value = true
      const serialized = JSON.stringify(config)
      localStorage.setItem(storageKey, serialized)
      lastSaved.value = new Date()

      // Callback
      if (onSave) {
        onSave(config)
      }
    } catch (error) {
      console.warn('[DataTablePersistence] Erreur lors de la sauvegarde:', error)
    } finally {
      isSaving.value = false
    }
  }

  const loadFromStorage = (): PersistenceConfig | null => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return null

      const parsed = JSON.parse(stored)

      // Validation basique
      if (typeof parsed !== 'object' || parsed === null) {
        console.warn('[DataTablePersistence] Données invalides dans le stockage')
        return null
      }

      return parsed as PersistenceConfig
    } catch (error) {
      console.warn('[DataTablePersistence] Erreur lors du chargement:', error)
      return null
    }
  }

  const save = () => {
    if (Object.keys(currentConfig.value).length > 0) {
      saveToStorage(currentConfig.value)
    }
  }

  const saveThrottled = () => {
    if (saveTimer) {
      clearTimeout(saveTimer)
    }

    saveTimer = setTimeout(() => {
      save()
    }, saveDelay)
  }

  const restore = (): PersistenceConfig | null => {
    const stored = loadFromStorage()
    if (stored) {
      currentConfig.value = stored

      // Callback
      if (onRestore) {
        onRestore(stored)
      }

      return stored
    }
    return null
  }

  const clear = () => {
    try {
      localStorage.removeItem(storageKey)
      currentConfig.value = {}
      lastSaved.value = null
    } catch (error) {
      console.warn('[DataTablePersistence] Erreur lors de la suppression:', error)
    }
  }

  const update = (updates: Partial<PersistenceConfig>) => {
    currentConfig.value = {
      ...currentConfig.value,
      ...updates
    }
    saveThrottled()
  }

  const hasData = (): boolean => {
    return Object.keys(currentConfig.value).length > 0
  }

  // Initialisation
  onMounted(() => {
    restore()
  })

  // Nettoyage
  const cleanup = () => {
    if (saveTimer) {
      clearTimeout(saveTimer)
    }
  }

  // Interface retournée
  const state: PersistenceState = {
    config: currentConfig.value,
    lastSaved: lastSaved.value,
    isSaving: isSaving.value
  }

  const actions: PersistenceActions = {
    save,
    restore,
    clear,
    update,
    hasData
  }

  return {
    state,
    actions,
    // Helpers
    cleanup,
    // Pour compatibilité
    updateConfig: update,
    saveConfig: save,
    loadConfig: restore,
    clearConfig: clear
  }
}
