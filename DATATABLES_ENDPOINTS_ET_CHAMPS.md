# Liste des DataTables avec leurs URLs et Champs

Ce document liste tous les DataTables de l'application avec leurs endpoints API et leurs colonnes/champs.

---

## 1. Résultats d'Inventaire (Inventory Results)

**Composable**: `useInventoryResults`  
**Store**: `useResultsStore` (action: `fetchResults`)  
**Service**: `InventoryResultsService.getResults()`  
**Endpoint**: `GET /web/api/inventory/{inventoryId}/warehouses/{storeId}/results/`  
**Format de requête**: QueryParams (sortModel, filterModel, search, startRow, endRow)  
**Pagination par défaut**: 20 lignes  
**Exemple URL**: `/web/api/inventory/123/warehouses/456/results/?sortModel=[{"colId":"article","sort":"asc"}]&search=test&startRow=0&endRow=20`

### Colonnes principales :
- `id` - Identifiant unique (caché)
- `article` - Référence de l'article
- `emplacement` - Emplacement de l'article
- `contage_1`, `contage_2`, `contage_3`, ... - Valeurs des comptages (dynamiques selon le nombre de comptages)
- `ecart_1_2`, `ecart_2_3`, ... - Écarts entre comptages (dynamiques)
- `resultats` - Résultat final (éditable)
- `resultats_valides` - Résultat final validé (éditable)

### Colonnes dynamiques :
Les colonnes de comptage et d'écart sont générées dynamiquement selon les données reçues :
- Colonnes de comptage : `contage_X` où X est le numéro du comptage
- Colonnes d'écart : `ecart_X_Y` où X et Y sont les numéros de comptages comparés

---

## 2. Jobs (Gestion des Jobs)

**Composable**: `useJobManagement`  
**Store**: `useJobStore` (action: `fetchJobs`)  
**Service**: `JobService.getAll()`  
**Endpoint**: `GET /web/api/inventory/{inventoryId}/warehouse/{warehouseId}/jobs/`  
**Format de requête**: QueryParams (sortModel, filterModel, search, startRow, endRow)  
**Pagination par défaut**: 20 lignes  
**Exemple URL**: `/web/api/inventory/123/warehouse/456/jobs/?sortModel=[{"colId":"reference","sort":"asc"}]&filterModel={"status":{"filterType":"text","type":"equals","filter":"VALIDE"}}&startRow=0&endRow=20`

### Colonnes :
- `id` - Identifiant
- `reference` - Référence unique du job
- `status` - Statut du job (EN ATTENTE, VALIDE, TERMINE)
- `warehouse_name` - Nom de l'entrepôt
- `inventory_reference` - Référence de l'inventaire
- `en_attente_date` - Date de mise en attente
- `valide_date` - Date de validation
- `termine_date` - Date de terminaison

---

## 3. Jobs Validés (Affectation)

**Composable**: `useAffecter`  
**Store**: `useJobStore` (action: `fetchJobsValidated`)  
**Service**: `JobService.getAllValidated()`  
**Endpoint**: `GET /web/api/jobs/valid/warehouse/{warehouseId}/inventory/{inventoryId}/`  
**Format de requête**: QueryParams (sortModel, filterModel, search, startRow, endRow)  
**Pagination par défaut**: 20 lignes  
**Exemple URL**: `/web/api/jobs/valid/warehouse/456/inventory/123/?sortModel=[{"colId":"job","sort":"asc"}]&startRow=0&endRow=20`

### Colonnes :
- `job` - Référence du job
- `locations` - Liste des emplacements (expandable, nested data)
  - `location_reference` - Référence de l'emplacement
  - `zone_name` - Nom de la zone
  - `sous_zone_name` - Nom de la sous-zone
- `team1` - Équipe du 1er comptage (éditable, select)
- `team1Status` - Statut de l'équipe 1 (badge avec styles)
- `date1` - Date du 1er comptage (éditable, date picker)
- `team2` - Équipe du 2e comptage (éditable, select)
- `team2Status` - Statut de l'équipe 2 (badge avec styles)
- `date2` - Date du 2e comptage (éditable, date picker)
- `resources` - Ressources affectées (éditable, select multiple)
- `nbResources` - Nombre de ressources (calculé)
- `status` - Statut du job (AFFECTE, VALIDE, TRANSFERT, PRET, ENTAME, TERMINE)

---

## 4. Jobs (Planning)

**Composable**: `usePlanning` (Jobs DataTable)  
**Store**: `useJobStore` (action: `fetchJobs`)  
**Service**: `JobService.getAll()`  
**Endpoint**: `GET /web/api/inventory/{inventoryId}/warehouse/{warehouseId}/jobs/`  
**Format de requête**: QueryParams (sortModel, filterModel, search, startRow, endRow)  
**Pagination par défaut**: 20 lignes  
**Exemple URL**: `/web/api/inventory/123/warehouse/456/jobs/?sortModel=[{"colId":"reference","sort":"asc"}]&startRow=0&endRow=20`

### Colonnes :
- `id` - Identifiant
- `reference` - Référence du job
- `status` - Statut (EN ATTENTE, VALIDE, AFFECTE, PRET, TRANSFERET, TERMINE, ENTAME) avec badges
- `locations` - Emplacements (expandable, nested data)
  - `location_reference` - Référence
  - `zone_name` - Zone
  - `sous_zone_name` - Sous-zone
- `team1` - Équipe 1er comptage (avec statut)
- `date1` - Date 1er comptage
- `team2` - Équipe 2e comptage (avec statut)
- `date2` - Date 2e comptage
- `resources` - Ressources (liste)
- `nbResources` - Nombre de ressources

---

## 5. Locations (Planning)

**Composable**: `usePlanning` (Locations DataTable)  
**Store**: `useLocationStore` (action: `fetchLocations`)  
**Service**: `LocationService.getUnassigned()`  
**Endpoint**: `GET /masterdata/api/warehouses/{accountId}/warehouse/{warehouseId}/inventory/{inventoryId}/locations/unassigned/`  
**Format de requête**: QueryParams (sortModel, filterModel, search, startRow, endRow)  
**Pagination par défaut**: 20 lignes  
**Exemple URL**: `/masterdata/api/warehouses/1/warehouse/456/inventory/123/locations/unassigned/?sortModel=[{"colId":"reference","sort":"asc"}]&startRow=0&endRow=20`

### Colonnes :
- `reference` - Référence de la location
- `location_reference` - Référence complète
- `zone_name` - Nom de la zone
- `sous_zone_name` - Nom de la sous-zone
- `warehouse_name` - Nom de l'entrepôt

---

## 6. Inventaires (Gestion)

**Composable**: `useInventoryManagement`  
**Store**: `useInventoryStore` (action: `fetchInventories`)  
**Service**: `InventoryService.getAll()`  
**Endpoint**: `GET /web/api/inventory/`  
**Format de requête**: QueryParams (sortModel, filterModel, search, startRow, endRow)  
**Pagination par défaut**: 20 lignes  
**Exemple URL**: `/web/api/inventory/?sortModel=[{"colId":"label","sort":"asc"}]&filterModel={"status":{"filterType":"text","type":"equals","filter":"EN PREPARATION"}}&startRow=0&endRow=20`

### Colonnes :
- `label` - Libellé de l'inventaire (éditable)
- `date` - Date de l'inventaire (éditable)
- `status` - Statut (EN PREPARATION, EN REALISATION, TERMINE, CLOTURE)
- `en_preparation_status_date` - Date passage en préparation (cachée)
- `en_realisation_status_date` - Date passage en réalisation (cachée)
- `termine_status_date` - Date passage terminé (cachée)
- `cloture_status_date` - Date passage clôturé (cachée)
- `account_name` - Nom du compte
- `reference` - Référence de l'inventaire

---

## 7. Magasins (Planning Management)

**Composable**: `usePlanningManagement`  
**Store**: `useInventoryStore` (action: `fetchPlanningManagement`)  
**Service**: `InventoryService.getPlanningManagement()`  
**Endpoint**: `GET /web/api/inventory/{inventoryId}/planning-management/`  
**Format de requête**: QueryParams (sortModel, filterModel, search, startRow, endRow)  
**Pagination par défaut**: 20 lignes  
**Exemple URL**: `/web/api/inventory/123/planning-management/?sortModel=[{"colId":"store_name","sort":"asc"}]&startRow=0&endRow=20`

### Colonnes :
- `store_name` - Nom du magasin
- `teams_count` - Nombre d'équipes
- `jobs_count` - Nombre de jobs
- `reference` - Référence du magasin

---

## 8. Jobs Validés (DataTable générique)

**Composable**: `useJobValidatedDataTable`  
**Store**: `useJobStore` (action: `fetchJobsValidated`)  
**Service**: `JobService.getAllValidated()`  
**Endpoint**: `GET /web/api/jobs/valid/warehouse/{warehouseId}/inventory/{inventoryId}/`  
**Format de requête**: QueryParams (sortModel, filterModel, search, startRow, endRow)  
**Pagination par défaut**: 20 lignes  
**Exemple URL**: `/web/api/jobs/valid/warehouse/456/inventory/123/?sortModel=[{"colId":"reference","sort":"asc"}]&startRow=0&endRow=20`

### Colonnes :
Dépendent de la configuration du DataTable qui utilise ce composable.

---

## 9. Locations (DataTable générique)

**Composable**: `useLocationDataTable`  
**Store**: `useLocationStore` (action: `fetchLocations`)  
**Service**: `LocationService.getAll()`  
**Endpoint**: `GET /masterdata/api/locations/`  
**Format de requête**: QueryParams (sortModel, filterModel, search, startRow, endRow)  
**Pagination par défaut**: 20 lignes  
**Exemple URL**: `/masterdata/api/locations/?sortModel=[{"colId":"reference","sort":"asc"}]&filterModel={"zone_name":{"filterType":"text","type":"contains","filter":"Zone A"}}&startRow=0&endRow=20`

### Colonnes principales :
- `id` - Identifiant
- `reference` - Référence de la location
- `location_reference` - Référence complète
- `zone_name` - Nom de la zone
- `sous_zone_name` - Nom de la sous-zone

Les colonnes exactes dépendent du DataTable qui utilise ce composable.

---

## 10. Ressources (DataTable générique)

**Composable**: `useResourceDataTable`  
**Store**: `useResourceStore` (action: `fetchResources`)  
**Service**: `ResourceService.getResources()`  
**Endpoint**: `GET masterdata/api/ressources`  
**Format de requête**: QueryParams (sortModel, filterModel, search, startRow, endRow)  
**Pagination par défaut**: 20 lignes  
**Exemple URL**: `masterdata/api/ressources?sortModel=[{"colId":"ressource_nom","sort":"asc"}]&startRow=0&endRow=20`

### Colonnes principales :
- `id` - Identifiant
- `reference` - Référence de la ressource
- `ressource_nom` - Nom de la ressource

Les colonnes exactes dépendent du DataTable qui utilise ce composable.

---

## 11. Suivi des Jobs (Job Tracking)

**Composable**: `useJobTracking`  
**Store**: `useJobStore` (action: `fetchJobsValidated`)  
**Service**: `JobService.getAllValidated()`  
**Endpoint**: `GET /web/api/jobs/valid/warehouse/{warehouseId}/inventory/{inventoryId}/`  
**Format de requête**: QueryParams (sortModel, filterModel, search, startRow, endRow)  
**Pagination par défaut**: 20 lignes  
**Exemple URL**: `/web/api/jobs/valid/warehouse/456/inventory/123/?sortModel=[{"colId":"emplacement","sort":"asc"}]&startRow=0&endRow=20`

### Colonnes :
- `emplacement` - Emplacement concerné
- `statut` - Statut du job pour ce comptage
- `dateTransfert` - Date de transfert
- `dateLancement` - Date de lancement
- `dateFin` - Date de fin

---

## Format des Requêtes QueryParams

Tous les DataTables envoient maintenant les requêtes au format suivant :

```
GET /api/endpoint/?sortModel=[{"colId":"field","sort":"asc"}]&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}}&search=term&startRow=0&endRow=20
```

### Paramètres disponibles :
- `sortModel` - Tableau JSON stringifié : `[{"colId":"field","sort":"asc"}]`
- `filterModel` - Objet JSON stringifié : `{"field":{"filterType":"text","type":"equals","filter":"value"}}`
- `search` - Recherche globale (texte simple)
- `startRow` - Index de début de pagination
- `endRow` - Index de fin de pagination
- `export` - Format d'export (`excel` ou `csv`) - optionnel

### Exemple complet :
```
GET /web/api/inventory/123/warehouses/456/results/?sortModel=[{"colId":"article","sort":"asc"}]&filterModel={"status":{"filterType":"text","type":"equals","filter":"VALIDE"}}&search=test&startRow=0&endRow=20
```

---

## Notes importantes

1. **Pagination standardisée** : Tous les DataTables utilisent maintenant 20 lignes par défaut
2. **Format unifié** : Tous les DataTables utilisent le format QueryParams par défaut
3. **Conversion automatique** : Le QueryModel est automatiquement converti vers le format QueryParams avant l'envoi
4. **Rétrocompatibilité** : Les anciens formats (StandardDataTableParams, RestApi) sont toujours acceptés mais convertis automatiquement

