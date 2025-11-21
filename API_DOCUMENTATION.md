# Documentation des APIs

## 1. API de génération de PDF pour un job/assignment/équipe

### Endpoint
```
POST /jobs/<int:job_id>/assignments/<int:assignment_id>/pdf/
```

### Paramètres d'URL (requis)
- `job_id` (int) : ID du job d'inventaire
- `assignment_id` (int) : ID de l'assignment

### Paramètres du corps (optionnel)
```json
{
  "equipe_id": 123
}
```
- `equipe_id` (int, optionnel) : ID de l'équipe (personne ou personne_two). Si fourni, le PDF sera filtré pour cette équipe spécifique.

### Réponses

#### Succès (200 OK)
Retourne un fichier PDF avec les en-têtes HTTP suivants :
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="job_{job_id}_assignment_{assignment_id}_equipe_{equipe_id}.pdf"`

**Exemple de nom de fichier :**
- Sans équipe : `job_1_assignment_5.pdf`
- Avec équipe : `job_1_assignment_5_equipe_123.pdf`

#### Erreurs

**400 Bad Request** - Paramètres manquants ou invalides :
```json
{
  "success": false,
  "message": "job_id est requis"
}
```

```json
{
  "success": false,
  "message": "assignment_id est requis"
}
```

```json
{
  "success": false,
  "message": "equipe_id doit etre un nombre entier"
}
```

**400 Bad Request** - Erreur de validation :
```json
{
  "success": false,
  "message": "Assignment avec l'ID {assignment_id} non trouve"
}
```

```json
{
  "success": false,
  "message": "L'assignment {assignment_id} n'appartient pas au job {job_id}"
}
```

**500 Internal Server Error** - Erreur lors de la génération :
```json
{
  "success": false,
  "message": "Erreur lors de la generation du PDF"
}
```

```json
{
  "success": false,
  "message": "Erreur interne : {détails de l'erreur}"
}
```

---

## 2. API de mise à jour du résultat final d'un écart de comptage

### Endpoint
```
PATCH /ecarts-comptage/<int:ecart_id>/final-result/
```

### Paramètres d'URL (requis)
- `ecart_id` (int) : ID de l'écart de comptage

### Paramètres du corps (JSON)
```json
{
  "final_result": 120,
  "justification": "Ajustement manuel après contrôle",
  "resolved": true
}
```

**Champs :**
- `final_result` (int, **requis**) : Le résultat final du comptage
- `justification` (string, optionnel) : Justification de la modification
- `resolved` (boolean, optionnel) : Indique si l'écart est résolu (défaut: false)

### Contraintes métier
- Il doit y avoir **au moins deux comptages (séquences)** enregistrés pour l'écart avant de pouvoir modifier le résultat final.

### Réponses

#### Succès (200 OK)
```json
{
  "success": true,
  "message": "Résultat final mis à jour avec succès.",
  "data": {
    "id": 1,
    "reference": "ECT-001",
    "inventory": 5,
    "total_sequences": 2,
    "stopped_sequence": 2,
    "final_result": 120,
    "justification": "Ajustement manuel après contrôle",
    "resolved": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:45:00Z"
  }
}
```

#### Erreurs

**400 Bad Request** - Erreur de validation :
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": {
    "final_result": ["Ce champ est requis."]
  }
}
```

```json
{
  "success": false,
  "message": "Le champ 'final_result' est obligatoire."
}
```

```json
{
  "success": false,
  "message": "Il faut au moins deux comptages enregistrés pour modifier le résultat final."
}
```

**404 Not Found** - Écart non trouvé :
```json
{
  "success": false,
  "message": "Écart de comptage avec l'ID {ecart_id} non trouvé"
}
```

---

## 3. API de résolution d'un écart de comptage

### Endpoint
```
PATCH /ecarts-comptage/<int:ecart_id>/resolve/
```

### Paramètres d'URL (requis)
- `ecart_id` (int) : ID de l'écart de comptage

### Paramètres du corps (JSON)
```json
{
  "justification": "Résolution après double comptage"
}
```

**Champs :**
- `justification` (string, optionnel) : Justification de la résolution

### Contraintes métier
- Il doit y avoir **au moins deux comptages (séquences)** enregistrés pour l'écart.
- Le champ `final_result` doit être **déjà renseigné** (non nul) avant de pouvoir résoudre l'écart.

### Réponses

#### Succès (200 OK)
```json
{
  "success": true,
  "message": "Écart de comptage résolu avec succès.",
  "data": {
    "id": 1,
    "reference": "ECT-001",
    "inventory": 5,
    "total_sequences": 2,
    "stopped_sequence": 2,
    "final_result": 120,
    "justification": "Résolution après double comptage",
    "resolved": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:45:00Z"
  }
}
```

#### Erreurs

**400 Bad Request** - Erreur de validation :
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": {
    "justification": ["Format invalide"]
  }
}
```

```json
{
  "success": false,
  "message": "Il faut au moins deux comptages enregistrés pour résoudre l'écart."
}
```

```json
{
  "success": false,
  "message": "Le résultat final doit être renseigné avant de pouvoir résoudre l'écart."
}
```

**404 Not Found** - Écart non trouvé :
```json
{
  "success": false,
  "message": "Écart de comptage avec l'ID {ecart_id} non trouvé"
}
```

---

## Notes importantes

1. **Ordre des opérations pour les écarts de comptage :**
   - D'abord, enregistrer au moins 2 séquences de comptage
   - Ensuite, mettre à jour le `final_result` via l'API `/final-result/`
   - Enfin, résoudre l'écart via l'API `/resolve/`

2. **Authentification :** Toutes ces APIs nécessitent probablement une authentification (à vérifier selon votre configuration DRF).

3. **Format des dates :** Les dates dans les réponses sont au format ISO 8601 (UTC).

