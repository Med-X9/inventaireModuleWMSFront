# Exemples de Requêtes GET avec QueryModel

Ce document présente tous les exemples de requêtes GET avec QueryModel dans les query params, incluant toutes les possibilités : tri, filtres, recherche globale, exportation, pagination, etc.

## Format de base

Les requêtes QueryModel utilisent des paramètres dans l'URL (query params) pour spécifier les filtres, tri, pagination et exportation.

## Structure générale

```
GET /api/endpoint/?param1=value1&param2=value2&param3=value3
```

---

## 1. Requête simple (sans filtres ni tri)

### Exemple basique
```
GET /api/jobs/
```

### Avec pagination simple
```
GET /api/jobs/?startRow=0&endRow=20
```

---

## 2. Tri simple (sortModel)

### Tri sur une colonne (ascendant)
```
GET /api/jobs/?sortModel=[{"colId":"reference","sort":"asc"}]
```

### Tri sur une colonne (descendant)
```
GET /api/jobs/?sortModel=[{"colId":"created_at","sort":"desc"}]
```

### Tri multiple (plusieurs colonnes)
```
GET /api/jobs/?sortModel=[{"colId":"status","sort":"asc"},{"colId":"reference","sort":"desc"}]
```

### Tri avec colonnes relationnelles
```
GET /api/jobs/?sortModel=[{"colId":"warehouse_name","sort":"asc"},{"colId":"inventory_reference","sort":"desc"}]
```

---

## 3. Filtres simples (filterModel)

### Filtre égalité (equals)
```
GET /api/jobs/?filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}}
```

### Filtre contient (contains)
```
GET /api/jobs/?filterModel={"reference":{"filterType":"text","type":"contains","filter":"job-"}}
```

### Filtre commence par (startsWith)
```
GET /api/jobs/?filterModel={"reference":{"filterType":"text","type":"startsWith","filter":"JOB"}}
```

### Filtre se termine par (endsWith)
```
GET /api/jobs/?filterModel={"reference":{"filterType":"text","type":"endsWith","filter":"-001"}}
```

### Filtre différent (notEqual)
```
GET /api/jobs/?filterModel={"status":{"filterType":"text","type":"notEqual","filter":"TERMINE"}}
```

### Filtre ne contient pas (notContains)
```
GET /api/jobs/?filterModel={"reference":{"filterType":"text","type":"notContains","filter":"test"}}
```

---

## 4. Filtres numériques

### Filtre inférieur à (lessThan)
```
GET /api/jobs/?filterModel={"id":{"filterType":"number","type":"lessThan","filter":100}}
```

### Filtre inférieur ou égal (lessThanOrEqual)
```
GET /api/jobs/?filterModel={"id":{"filterType":"number","type":"lessThanOrEqual","filter":50}}
```

### Filtre supérieur à (greaterThan)
```
GET /api/jobs/?filterModel={"id":{"filterType":"number","type":"greaterThan","filter":10}}
```

### Filtre supérieur ou égal (greaterThanOrEqual)
```
GET /api/jobs/?filterModel={"id":{"filterType":"number","type":"greaterThanOrEqual","filter":20}}
```

### Filtre plage (inRange)
```
GET /api/jobs/?filterModel={"id":{"filterType":"number","type":"inRange","filter":10,"filterTo":100}}
```

---

## 5. Filtres de date

### Filtre date égale (equals)
```
GET /api/jobs/?filterModel={"created_at":{"filterType":"date","type":"equals","dateFrom":"2024-01-15"}}
```

### Filtre date plage (inRange)
```
GET /api/jobs/?filterModel={"created_at":{"filterType":"date","type":"inRange","dateFrom":"2024-01-01","dateTo":"2024-01-31"}}
```

### Filtre date supérieure à (greaterThan)
```
GET /api/jobs/?filterModel={"created_at":{"filterType":"date","type":"greaterThan","dateFrom":"2024-01-01"}}
```

### Filtre date inférieure à (lessThan)
```
GET /api/jobs/?filterModel={"created_at":{"filterType":"date","type":"lessThan","dateTo":"2024-12-31"}}
```

---

## 6. Filtres multiples (plusieurs colonnes)

### Filtres sur plusieurs colonnes (ET logique)
```
GET /api/jobs/?filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"},"reference":{"filterType":"text","type":"contains","filter":"job-"}}
```

### Filtres combinés (texte + nombre)
```
GET /api/jobs/?filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"},"id":{"filterType":"number","type":"greaterThan","filter":10}}
```

### Filtres combinés (texte + date)
```
GET /api/jobs/?filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"},"created_at":{"filterType":"date","type":"inRange","dateFrom":"2024-01-01","dateTo":"2024-01-31"}}
```

### Filtres sur relations
```
GET /api/jobs/?filterModel={"warehouse_name":{"filterType":"text","type":"contains","filter":"Entrepôt"},"inventory_reference":{"filterType":"text","type":"startsWith","filter":"INV"}}
```

---

## 7. Recherche globale (search)

### Recherche globale simple
```
GET /api/jobs/?search=job-001
```

### Recherche globale avec espaces
```
GET /api/jobs/?search=job%20test
```

### Recherche globale avec caractères spéciaux
```
GET /api/jobs/?search=job-001%20AFFECTE
```

### Recherche globale combinée avec filtres
```
GET /api/jobs/?search=test&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}}
```

### Recherche globale combinée avec tri
```
GET /api/jobs/?search=test&sortModel=[{"colId":"reference","sort":"asc"}]
```

---

## 8. Pagination

### Pagination simple (première page)
```
GET /api/jobs/?startRow=0&endRow=20
```

### Pagination (deuxième page)
```
GET /api/jobs/?startRow=20&endRow=40
```

### Pagination (troisième page)
```
GET /api/jobs/?startRow=40&endRow=60
```

### Pagination avec grand nombre d'éléments
```
GET /api/jobs/?startRow=0&endRow=100
```

### Pagination combinée avec filtres
```
GET /api/jobs/?startRow=0&endRow=20&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}}
```

### Pagination combinée avec tri
```
GET /api/jobs/?startRow=0&endRow=20&sortModel=[{"colId":"reference","sort":"asc"}]
```

---

## 9. Exportation

### Export Excel simple
```
GET /api/jobs/?export=excel
```

### Export CSV simple
```
GET /api/jobs/?export=csv
```

### Export Excel avec filtres
```
GET /api/jobs/?export=excel&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}}
```

### Export Excel avec tri
```
GET /api/jobs/?export=excel&sortModel=[{"colId":"reference","sort":"asc"}]
```

### Export Excel avec filtres et tri
```
GET /api/jobs/?export=excel&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}}&sortModel=[{"colId":"reference","sort":"asc"}]
```

### Export CSV avec recherche globale
```
GET /api/jobs/?export=csv&search=test
```

### Export Excel avec filtres multiples
```
GET /api/jobs/?export=excel&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"},"reference":{"filterType":"text","type":"contains","filter":"job-"}}
```

### Export Excel avec filtres et tri multiples
```
GET /api/jobs/?export=excel&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"},"id":{"filterType":"number","type":"greaterThan","filter":10}}&sortModel=[{"colId":"status","sort":"asc"},{"colId":"reference","sort":"desc"}]
```

---

## 10. Combinaisons complètes

### Tri + Filtres + Pagination
```
GET /api/jobs/?sortModel=[{"colId":"reference","sort":"asc"}]&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}}&startRow=0&endRow=20
```

### Tri + Filtres + Recherche globale + Pagination
```
GET /api/jobs/?sortModel=[{"colId":"reference","sort":"asc"}]&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}}&search=test&startRow=0&endRow=20
```

### Tri multiple + Filtres multiples + Recherche globale
```
GET /api/jobs/?sortModel=[{"colId":"status","sort":"asc"},{"colId":"reference","sort":"desc"}]&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"},"warehouse_name":{"filterType":"text","type":"contains","filter":"Entrepôt"}}&search=job
```

### Export avec tri + Filtres + Recherche globale
```
GET /api/jobs/?export=excel&sortModel=[{"colId":"reference","sort":"asc"}]&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}}&search=test
```

### Tri + Filtres numériques + Filtres texte + Pagination
```
GET /api/jobs/?sortModel=[{"colId":"id","sort":"desc"}]&filterModel={"id":{"filterType":"number","type":"inRange","filter":10,"filterTo":100},"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}}&startRow=0&endRow=50
```

### Tri + Filtres date + Filtres texte + Recherche globale
```
GET /api/jobs/?sortModel=[{"colId":"created_at","sort":"desc"}]&filterModel={"created_at":{"filterType":"date","type":"inRange","dateFrom":"2024-01-01","dateTo":"2024-01-31"},"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}}&search=test
```

### Export avec tri multiple + Filtres multiples + Recherche globale
```
GET /api/jobs/?export=excel&sortModel=[{"colId":"status","sort":"asc"},{"colId":"reference","sort":"desc"},{"colId":"created_at","sort":"desc"}]&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"},"reference":{"filterType":"text","type":"contains","filter":"job-"},"id":{"filterType":"number","type":"greaterThan","filter":10}}&search=inventory
```

---

## 11. Cas d'usage réels

### Liste des jobs actifs triés par date
```
GET /api/jobs/?sortModel=[{"colId":"created_at","sort":"desc"}]&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}}&startRow=0&endRow=20
```

### Recherche de jobs par référence avec export
```
GET /api/jobs/?export=excel&filterModel={"reference":{"filterType":"text","type":"contains","filter":"job-"}}&sortModel=[{"colId":"reference","sort":"asc"}]
```

### Jobs créés ce mois avec pagination
```
GET /api/jobs/?filterModel={"created_at":{"filterType":"date","type":"inRange","dateFrom":"2024-01-01","dateTo":"2024-01-31"}}&startRow=0&endRow=50
```

### Jobs d'un entrepôt spécifique avec tri
```
GET /api/jobs/?filterModel={"warehouse_name":{"filterType":"text","type":"equals","filter":"Entrepôt Principal"}}&sortModel=[{"colId":"reference","sort":"asc"}]&startRow=0&endRow=100
```

### Export de tous les jobs terminés
```
GET /api/jobs/?export=excel&filterModel={"status":{"filterType":"text","type":"equals","filter":"TERMINE"}}&sortModel=[{"colId":"termine_date","sort":"desc"}]
```

### Jobs avec recherche globale et filtres multiples
```
GET /api/jobs/?search=inventory&filterModel={"status":{"filterType":"text","type":"in","filter":["AFFECTE","PRET"]},"created_at":{"filterType":"date","type":"greaterThan","dateFrom":"2024-01-01"}}&sortModel=[{"colId":"created_at","sort":"desc"}]
```

---

## 12. Encodage URL

### Caractères spéciaux dans les filtres

Les caractères spéciaux doivent être encodés dans l'URL :

- Espace : `%20` ou `+`
- Guillemets : `%22`
- Accolades : `%7B` et `%7D`
- Crochets : `%5B` et `%5D`
- Virgule : `%2C`
- Deux-points : `%3A`

### Exemple avec caractères spéciaux
```
GET /api/jobs/?filterModel=%7B%22reference%22%3A%7B%22filterType%22%3A%22text%22%2C%22type%22%3A%22contains%22%2C%22filter%22%3A%22job-%20test%22%7D%7D
```

Décodé :
```
GET /api/jobs/?filterModel={"reference":{"filterType":"text","type":"contains","filter":"job- test"}}
```

---

## 13. Paramètres optionnels

### Paramètres disponibles

- `sortModel` : Tri (tableau JSON)
- `filterModel` : Filtres (objet JSON)
- `search` : Recherche globale (texte)
- `startRow` : Index de début de pagination (nombre)
- `endRow` : Index de fin de pagination (nombre)
- `export` : Format d'export (`excel` ou `csv`)

### Tous les paramètres ensemble
```
GET /api/jobs/?sortModel=[{"colId":"reference","sort":"asc"}]&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}}&search=test&startRow=0&endRow=20&export=excel
```

---

## 14. Notes importantes

### Ordre des paramètres

L'ordre des paramètres dans l'URL n'a pas d'importance. Tous ces exemples sont équivalents :

```
GET /api/jobs/?sortModel=[...]&filterModel={...}&search=test
GET /api/jobs/?search=test&filterModel={...}&sortModel=[...]
GET /api/jobs/?filterModel={...}&search=test&sortModel=[...]
```

### Exportation et pagination

⚠️ **Important** : Lors de l'exportation, la pagination est ignorée. Toutes les lignes correspondant aux filtres sont exportées.

### Filtres multiples

Les filtres multiples dans `filterModel` sont combinés avec un ET logique (tous les filtres doivent être satisfaits).

### Tri multiple

Le tri multiple dans `sortModel` est appliqué dans l'ordre : le premier tri est prioritaire, puis le second, etc.

### Recherche globale

La recherche globale (`search`) recherche dans tous les champs configurés dans `search_fields` de la vue.

---

## 15. Exemples par type de filtre

### Filtres texte disponibles

- `equals` : Égalité exacte
- `notEqual` : Différent
- `contains` : Contient
- `notContains` : Ne contient pas
- `startsWith` : Commence par
- `endsWith` : Se termine par

### Filtres numériques disponibles

- `equals` : Égalité exacte
- `notEqual` : Différent
- `lessThan` : Inférieur à
- `lessThanOrEqual` : Inférieur ou égal
- `greaterThan` : Supérieur à
- `greaterThanOrEqual` : Supérieur ou égal
- `inRange` : Dans une plage (nécessite `filter` et `filterTo`)

### Filtres date disponibles

- `equals` : Date égale (nécessite `dateFrom`)
- `notEqual` : Date différente (nécessite `dateFrom`)
- `lessThan` : Date inférieure (nécessite `dateTo`)
- `lessThanOrEqual` : Date inférieure ou égale (nécessite `dateTo`)
- `greaterThan` : Date supérieure (nécessite `dateFrom`)
- `greaterThanOrEqual` : Date supérieure ou égale (nécessite `dateFrom`)
- `inRange` : Plage de dates (nécessite `dateFrom` et `dateTo`)

---

## 16. Exemples de requêtes complexes

### Requête complète avec tous les paramètres
```
GET /api/jobs/?sortModel=[{"colId":"status","sort":"asc"},{"colId":"reference","sort":"desc"},{"colId":"created_at","sort":"desc"}]&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"},"reference":{"filterType":"text","type":"contains","filter":"job-"},"id":{"filterType":"number","type":"inRange","filter":10,"filterTo":100},"created_at":{"filterType":"date","type":"inRange","dateFrom":"2024-01-01","dateTo":"2024-01-31"},"warehouse_name":{"filterType":"text","type":"contains","filter":"Entrepôt"}}&search=inventory&startRow=0&endRow=50
```

### Export complet avec tous les filtres
```
GET /api/jobs/?export=excel&sortModel=[{"colId":"status","sort":"asc"},{"colId":"reference","sort":"desc"}]&filterModel={"status":{"filterType":"text","type":"equals","filter":"AFFECTE"},"reference":{"filterType":"text","type":"contains","filter":"job-"},"id":{"filterType":"number","type":"greaterThan","filter":10},"created_at":{"filterType":"date","type":"inRange","dateFrom":"2024-01-01","dateTo":"2024-01-31"}}&search=test
```

---

## 17. Format des réponses

### Réponse normale (avec pagination)

La réponse contient les données paginées avec les métadonnées.

### Réponse d'export

La réponse est un fichier à télécharger :
- Excel : `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- CSV : `text/csv; charset=utf-8`

Le nom du fichier est généré automatiquement : `{export_filename}_{timestamp}.{extension}`

---

## 18. Bonnes pratiques

### Utilisation de POST pour requêtes complexes

Pour les requêtes très complexes avec beaucoup de filtres, il est recommandé d'utiliser POST avec JSON dans le body plutôt que GET avec query params.

### Encodage des paramètres

Toujours encoder correctement les paramètres JSON dans l'URL, surtout les caractères spéciaux.

### Limitation de la longueur d'URL

Les navigateurs ont une limite de longueur d'URL (environ 2000 caractères). Pour les requêtes très complexes, utilisez POST.

### Performance

- Les filtres sont appliqués côté serveur (optimisé)
- La pagination réduit la quantité de données transférées
- L'exportation ignore la pagination pour exporter toutes les lignes filtrées

---

## 19. Résumé des possibilités

### ✅ Tri
- Tri simple (une colonne)
- Tri multiple (plusieurs colonnes)
- Tri ascendant et descendant
- Tri sur relations

### ✅ Filtres
- Filtres texte (equals, contains, startsWith, etc.)
- Filtres numériques (lessThan, greaterThan, inRange, etc.)
- Filtres date (equals, inRange, greaterThan, etc.)
- Filtres multiples (combinaison ET logique)
- Filtres sur relations

### ✅ Recherche
- Recherche globale simple
- Recherche avec caractères spéciaux
- Recherche combinée avec filtres et tri

### ✅ Pagination
- Pagination simple (startRow, endRow)
- Pagination combinée avec filtres et tri

### ✅ Exportation
- Export Excel
- Export CSV
- Export avec filtres
- Export avec tri
- Export avec recherche globale
- Export complet (toutes les lignes filtrées)

### ✅ Combinaisons
- Toutes les combinaisons possibles entre tri, filtres, recherche, pagination et exportation

