# 📊 Logique de Remplissage du DataTable - JobTracking

## 🎯 Vue d'ensemble

Le DataTable de `JobTracking.vue` affiche le suivi des jobs d'inventaire avec leurs emplacements et leurs dates de comptage. La logique de remplissage suit un flux complexe qui transforme les données de jobs en lignes de suivi.

---

## 🔄 Flux de Données Complet

```
1. Initialisation (onMounted)
   ↓
2. Chargement de l'inventaire (fetchInventory)
   ↓
3. Chargement des magasins (fetchStores)
   ↓
4. Chargement des jobs validés (fetchTrackingData)
   ↓
5. Transformation des jobs en lignes (transformJobsToRows)
   ↓
6. Affichage dans le DataTable
```

---

## 📋 Étapes Détaillées

### 1️⃣ **Initialisation** (`JobTracking.vue`)

```typescript
onMounted(async () => {
    await initialize(referenceParam.value)
})
```

- Récupère la référence de l'inventaire depuis l'URL (`route.params.reference`)
- Appelle `initialize()` du composable `useJobTracking`

---

### 2️⃣ **Chargement de l'Inventaire** (`fetchInventory`)

```typescript
const fetchInventory = async (reference: string) => {
    const fetchedInventory = await inventoryStore.fetchInventoryByReference(reference)
    inventory.value = fetchedInventory
    inventoryId.value = fetchedInventory?.id || null
    accountId.value = fetchedInventory?.account_id || null
}
```

**Données récupérées :**
- Objet inventaire complet
- `inventoryId` : ID de l'inventaire
- `accountId` : ID du compte (pour filtrer les magasins)
- `inventory.comptages` : Liste des comptages configurés

---

### 3️⃣ **Chargement des Magasins** (`fetchStores`)

```typescript
const fetchStores = async () => {
    // Priorité 1 : Magasins depuis l'inventaire
    const inventoryWarehouses = inventory.value.warehouses || []
    
    if (inventoryWarehouses.length > 0) {
        // Convertir en StoreOption
        const storeList = inventoryWarehouses.map(wh => ({
            label: wh.warehouse_name || wh.reference,
            value: String(wh.id || wh.warehouse_id)
        }))
    } else {
        // Fallback : Charger par account_id
        await warehouseStore.fetchWarehouses(accountId.value)
    }
}
```

**Logique :**
1. **Priorité** : Utilise `inventory.warehouses` si disponible
2. **Fallback** : Charge les magasins filtrés par `account_id`
3. **Sélection automatique** : Le premier magasin est sélectionné par défaut

---

### 4️⃣ **Chargement des Jobs Validés** (`fetchTrackingData`)

```typescript
const fetchTrackingData = async () => {
    const warehouseId = Number(selectedStore.value)
    
    // Appel API via le store
    await jobStore.fetchJobsValidated(inventoryId.value, warehouseId)
    
    const jobs = jobsValidated.value || []
    
    // Résoudre les options de comptage
    if (inventory.value?.comptages?.length > 0) {
        resolveCountingOptions() // Depuis l'inventaire
    } else {
        resolveCountingOptions(calculateMaxCountingOrder(jobs)) // Depuis les jobs
    }
    
    // Transformer les jobs en lignes
    trackingRows.value = transformJobsToRows(jobs)
}
```

**API appelée :**
```
GET /web/api/job/valid/warehouse/{warehouseId}/inventory/{inventoryId}/
```

**Réponse API :**
```typescript
interface JobValidatedDataTableResponse {
    draw: number
    recordsTotal: number
    recordsFiltered: number
    data: JobResult[]  // ← Données brutes des jobs
}
```

**Structure `JobResult` :**
```typescript
interface JobResult {
    id: number
    reference: string
    status: string
    emplacements: JobEmplacement[]      // Liste des emplacements
    assignments: JobAssignment[]        // Liste des assignments (comptages)
    valide_date?: string | null
    en_attente_date?: string | null
    termine_date?: string | null
    date_transfer?: string | null
}
```

---

### 5️⃣ **Transformation des Données** (`transformJobsToRows`)

C'est la partie la plus complexe ! Cette fonction transforme les jobs en lignes de suivi.

#### 🔍 **Logique de Transformation**

```typescript
const transformJobsToRows = (jobs: JobResult[]): JobTrackingRow[] => {
    const rows: JobTrackingRow[] = []
    const countingTarget = selectedCountingOrder.value  // Ex: 1, 2, 3
    
    jobs.forEach(job => {
        // 1. Filtrer les assignments par comptage sélectionné
        const assignments = job.assignments || []
        const filteredAssignments = countingTarget
            ? assignments.filter(a => a.counting_order === countingTarget)
            : assignments
        
        // 2. CAS 1 : Aucun assignment correspondant
        if (filteredAssignments.length === 0) {
            // Créer une ligne par emplacement (ou une ligne "Non défini")
            // ...
        }
        
        // 3. CAS 2 : Assignments trouvés
        filteredAssignments.forEach(assignment => {
            // Créer une ligne par combinaison (assignment × emplacement)
            job.emplacements.forEach(emplacement => {
                rows.push({
                    id: `${job.id}-${assignment.counting_order}-${emplacement.id}`,
                    emplacement: emplacement.location_reference,
                    statut: assignment.status || job.status,
                    dateTransfert: formatDateTime(...),
                    dateLancement: formatDateTime(...),
                    dateFin: formatDateTime(...)
                })
            })
        })
    })
    
    return rows
}
```

#### 📊 **Règles de Transformation**

**Règle 1 : Filtrage par comptage**
- Si un comptage est sélectionné (ex: "1er comptage"), seuls les assignments avec `counting_order === 1` sont pris en compte
- Sinon, tous les assignments sont inclus

**Règle 2 : Gestion des assignments**
- **Sans assignment** : Crée une ligne par emplacement avec les dates du job
- **Avec assignment** : Crée une ligne par combinaison `(assignment × emplacement)`

**Règle 3 : Extraction des dates**
- **Date transfert** : `assignment.date_transfer` → `job.date_transfer` → `job.valide_date`
- **Date lancement** : `assignment.date_lancement` → `assignment.date_launch` → `assignment.date_start`
- **Date fin** : `assignment.date_fin` → `assignment.date_end` → `job.termine_date`

**Règle 4 : Formatage des dates**
```typescript
formatDateTime(value) // Convertit en "DD/MM/YYYY HH:mm"
```

**Règle 5 : Label d'emplacement**
```typescript
mapEmplacementLabel(emplacement) 
// → emplacement.location_reference 
// → emplacement.reference 
// → "Emplacement {index}"
```

---

### 6️⃣ **Exemple Concret**

#### **Données API (JobResult) :**
```json
{
  "id": 123,
  "reference": "JOB-001",
  "status": "VALIDE",
  "emplacements": [
    { "id": 1, "location_reference": "A-01-01-00" },
    { "id": 2, "location_reference": "A-01-01-01" }
  ],
  "assignments": [
    {
      "counting_order": 1,
      "status": "TERMINE",
      "date_transfer": "2024-01-15T10:00:00Z",
      "date_lancement": "2024-01-15T08:00:00Z",
      "date_fin": "2024-01-15T12:00:00Z"
    },
    {
      "counting_order": 2,
      "status": "EN ATTENTE",
      "date_transfer": null,
      "date_lancement": null,
      "date_fin": null
    }
  ],
  "valide_date": "2024-01-15T10:00:00Z"
}
```

#### **Comptage sélectionné : "1er comptage" (counting_order = 1)**

#### **Résultat (JobTrackingRow[]) :**
```json
[
  {
    "id": "123-1-1",
    "jobReference": "JOB-001",
    "emplacement": "A-01-01-00",
    "statut": "TERMINE",
    "countingOrder": 1,
    "dateTransfert": "15/01/2024 10:00",
    "dateLancement": "15/01/2024 08:00",
    "dateFin": "15/01/2024 12:00"
  },
  {
    "id": "123-1-2",
    "jobReference": "JOB-001",
    "emplacement": "A-01-01-01",
    "statut": "TERMINE",
    "countingOrder": 1,
    "dateTransfert": "15/01/2024 10:00",
    "dateLancement": "15/01/2024 08:00",
    "dateFin": "15/01/2024 12:00"
  }
]
```

**Résultat : 2 lignes** (1 assignment × 2 emplacements)

---

## 🔄 Réactivité et Watchers

### **Watcher sur les sélections :**
```typescript
watch([selectedStore, selectedCountingOrder], async () => {
    if (!isInitialized.value) return
    await fetchTrackingData()  // Recharge les données
})
```

**Déclenchement :**
- Changement de magasin → Recharge les jobs
- Changement de comptage → Re-transforme les jobs (sans recharger l'API)

---

## 📊 Structure Finale du DataTable

### **Colonnes affichées :**
1. **Emplacement** : Référence de l'emplacement
2. **Statut** : Statut du job/assignment
3. **Date transfert** : Date de transfert formatée
4. **Date lancement** : Date de lancement formatée
5. **Date fin** : Date de fin formatée

### **Propriétés du DataTable :**
```vue
<DataTable
    :columns="displayColumns"      ← Colonnes définies
    :rowDataProp="rows"            ← Lignes transformées
    :loading="loading"              ← État de chargement
    :pagination="false"             ← Pas de pagination (toutes les lignes)
    :enableGlobalSearch="false"     ← Pas de recherche globale
    :enableFiltering="false"        ← Pas de filtrage
/>
```

---

## 🎯 Points Clés

1. **Pas de pagination côté serveur** : Toutes les données sont chargées et affichées
2. **Transformation complexe** : 1 job peut générer plusieurs lignes (1 par emplacement × assignment)
3. **Filtrage par comptage** : Seuls les assignments du comptage sélectionné sont affichés
4. **Dates flexibles** : Extraction depuis plusieurs sources (assignment → job)
5. **Réactivité** : Changement de magasin/comptage → Rechargement automatique

---

## 🔍 Cas Particuliers

### **Cas 1 : Job sans assignment**
- Crée une ligne par emplacement avec les dates du job
- Statut = statut du job

### **Cas 2 : Job sans emplacement**
- Crée une ligne avec `emplacement: "Non défini"`

### **Cas 3 : Aucun comptage sélectionné**
- Affiche tous les assignments (tous les comptages)

### **Cas 4 : Assignment sans dates**
- Dates = `null` → Affichage "-" dans le DataTable

---

## 📝 Résumé

**Flux simplifié :**
```
URL (reference) 
  → Inventaire 
    → Magasins 
      → Jobs validés (API)
        → Transformation (jobs → lignes)
          → DataTable
```

**Transformation :**
```
JobResult (1 job)
  → JobTrackingRow[] (N lignes)
    où N = nombre d'emplacements × nombre d'assignments filtrés
```

