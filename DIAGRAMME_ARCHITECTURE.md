# 🏗️ Diagramme d'Architecture - Inventaire WMS

## 📐 Architecture Générale

```mermaid
graph TB
    subgraph "🌐 Frontend (Vue 3 + TypeScript)"
        subgraph "📱 Couche Présentation"
            V1[📄 Views/Pages]
            V2[🧩 Components UI]
            V3[🎨 Layouts]
        end
        
        subgraph "🧠 Couche Logique"
            C1[⚡ Composables]
            C2[🔧 Services]
            C3[📊 Stores Pinia]
        end
        
        subgraph "🏗️ Couche Infrastructure"
            I1[🛣️ Router]
            I2[🌐 API Config]
            I3[🔧 Utils]
        end
    end
    
    subgraph "🖥️ Backend APIs"
        B1[🏢 Inventory API]
        B2[👷 Job API]
        B3[📍 Location API]
        B4[🏪 Warehouse API]
        B5[🔐 Auth API]
    end
    
    V1 --> C1
    V2 --> C1
    C1 --> C2
    C2 --> C3
    C2 --> I2
    I2 --> B1
    I2 --> B2
    I2 --> B3
    I2 --> B4
    I2 --> B5
```

## 🔄 Flux de Données

```mermaid
sequenceDiagram
    participant U as 👤 Utilisateur
    participant V as 📄 Vue
    participant C as ⚡ Composable
    participant S as 🔧 Service
    participant St as 📊 Store
    participant API as 🌐 Backend

    U->>V: Action (clic, saisie)
    V->>C: Appel fonction
    C->>S: Demande données
    S->>API: Requête HTTP
    API-->>S: Réponse
    S->>St: Mise à jour état
    St-->>C: État réactif
    C-->>V: Données mises à jour
    V-->>U: Interface actualisée
```

## 🏢 Architecture par Modules

```mermaid
graph LR
    subgraph "📦 Module Inventaire"
        IM1[📋 Création]
        IM2[📊 Gestion]
        IM3[📈 Résultats]
        IM4[🔍 Détails]
        IM5[📅 Planning]
        IM6[👥 Affectation]
        IM7[📝 Grille Excel]
    end
    
    subgraph "👷 Module Jobs"
        JM1[📋 Gestion Jobs]
        JM2[👤 Affectation]
        JM3[📊 Statuts]
        JM4[🔄 Actions Lot]
    end
    
    subgraph "🔐 Module Auth"
        AM1[🔑 Login]
        AM2[🛡️ Guards]
        AM3[🍪 Tokens]
    end
    
    IM1 --> IM2
    IM2 --> IM3
    IM2 --> IM4
    IM4 --> IM5
    IM5 --> IM6
    IM2 --> IM7
    
    JM1 --> JM2
    JM1 --> JM3
    JM1 --> JM4
    
    AM1 --> AM2
    AM2 --> AM3
```

## 📊 Structure DataTable

```mermaid
graph TD
    subgraph "🗂️ DataTable System"
        DT[📋 DataTable.vue]
        TB[📝 TableBody.vue]
        TH[🏷️ TableHeader.vue]
        TL[🔧 Toolbar.vue]
        PG[📄 Pagination.vue]
        
        DT --> TB
        DT --> TH
        DT --> TL
        DT --> PG
    end
    
    subgraph "⚙️ Composables DataTable"
        CDT[useDataTable]
        CF[useFilters]
        CS[useSorting]
        CP[usePagination]
        
        CDT --> CF
        CDT --> CS
        CDT --> CP
    end
    
    subgraph "🎨 Renderers"
        CR[cellRenderers]
        Badge[🏷️ Badges]
        Btn[🔘 Boutons]
        
        CR --> Badge
        CR --> Btn
    end
    
    DT --> CDT
    TB --> CR
```

## 🔄 Gestion d'État

```mermaid
graph TB
    subgraph "🏪 Stores Pinia"
        AS[🏢 AppStore]
        AuS[🔐 AuthStore]
        IS[📦 InventoryStore]
        JS[👷 JobStore]
        LS[📍 LocationStore]
        WS[🏪 WarehouseStore]
    end
    
    subgraph "💾 Persistance"
        LS1[🗃️ LocalStorage]
        CK[🍪 Cookies]
        
        AS --> LS1
        AuS --> CK
        IS --> LS1
        JS --> LS1
    end
    
    subgraph "🔄 Réactivité"
        R1[⚡ ref]
        R2[🧮 computed]
        R3[👁️ watch]
        
        AS --> R1
        IS --> R2
        JS --> R3
    end
```

## 🎯 Architecture Composables

```mermaid
graph LR
    subgraph "🎯 Composables Métier"
        CP[📅 usePlanning]
        CIM[📦 useInventoryManagement]
        CJM[👷 useJobManagement]
        CAF[👥 useAffecter]
        CEG[📝 useExcelGrid]
    end
    
    subgraph "🔧 Composables Techniques"
        CDT[📋 useDataTable]
        CF[🔍 useFilters]
        CS[📊 useSorting]
        CPG[📄 usePagination]
        CA[🔐 useAuth]
    end
    
    subgraph "🏢 Services"
        IS[📦 InventoryService]
        JS[👷 JobService]
        LS[📍 LocationService]
        AS[🔐 AuthService]
        ALS[🚨 AlertService]
    end
    
    CP --> CDT
    CIM --> IS
    CJM --> JS
    CAF --> LS
    CEG --> CDT
    
    CDT --> CF
    CDT --> CS
    CDT --> CPG
    
    CP --> IS
    CJM --> ALS
    CA --> AS
```

## 🌐 Configuration API

```mermaid
graph TB
    subgraph "⚙️ API Configuration"
        AC[🔧 API Config]
        AX[📡 Axios Instance]
        EP[🎯 Endpoints]
    end
    
    subgraph "🔌 Endpoints"
        E1[🔐 /api/auth/]
        E2[📦 /web/api/inventory/]
        E3[👷 /web/api/jobs/]
        E4[📍 /masterdata/api/locations/]
        E5[🏪 /masterdata/api/warehouses/]
    end
    
    subgraph "🛡️ Intercepteurs"
        I1[🔑 Token Injection]
        I2[🚨 Error Handling]
        I3[📊 Request Logging]
    end
    
    AC --> AX
    AC --> EP
    AX --> I1
    AX --> I2
    AX --> I3
    
    EP --> E1
    EP --> E2
    EP --> E3
    EP --> E4
    EP --> E5
```

## 🎨 Design System

```mermaid
graph TB
    subgraph "🎨 Design Tokens"
        C1[🟡 Primary: #FECD1C]
        C2[⚪ Secondary: #B4B6BA]
        C3[🟢 Success: #10b981]
        C4[🔴 Error: #dc2626]
        C5[🟠 Warning: #f59e0b]
    end
    
    subgraph "🧩 Composants UI"
        B1[🔘 Boutons]
        B2[🏷️ Badges]
        B3[📦 Modales]
        B4[📝 Formulaires]
        B5[🚨 Alertes]
    end
    
    subgraph "📱 Responsive"
        R1[📱 Mobile: 640px]
        R2[📟 Tablet: 768px]
        R3[🖥️ Desktop: 1024px]
        R4[🖥️ Large: 1280px]
    end
    
    C1 --> B1
    C2 --> B2
    C3 --> B5
    C4 --> B5
    C5 --> B5
    
    B1 --> R1
    B2 --> R2
    B3 --> R3
    B4 --> R4
```

## 🚀 Déploiement

```mermaid
graph LR
    subgraph "💻 Développement"
        D1[📝 Code Source]
        D2[🔧 Vite Dev]
        D3[🌐 Hot Reload]
    end
    
    subgraph "🏗️ Build"
        B1[📦 npm run build]
        B2[⚡ Vite Build]
        B3[📁 dist/]
    end
    
    subgraph "🚀 Production"
        P1[🐳 Docker]
        P2[☁️ Cloud]
        P3[🌐 CDN]
    end
    
    D1 --> D2
    D2 --> D3
    
    D1 --> B1
    B1 --> B2
    B2 --> B3
    
    B3 --> P1
    P1 --> P2
    P2 --> P3
```

## 📈 Performance

```mermaid
graph TB
    subgraph "⚡ Optimisations"
        O1[🔄 Lazy Loading]
        O2[📦 Code Splitting]
        O3[🗂️ Tree Shaking]
        O4[💾 Caching]
    end
    
    subgraph "📊 Métriques"
        M1[⏱️ Load Time]
        M2[🎯 FCP]
        M3[📈 LCP]
        M4[🔄 CLS]
    end
    
    subgraph "🛠️ Outils"
        T1[📊 Lighthouse]
        T2[📈 Web Vitals]
        T3[🔍 Bundle Analyzer]
    end
    
    O1 --> M1
    O2 --> M2
    O3 --> M3
    O4 --> M4
    
    M1 --> T1
    M2 --> T2
    M3 --> T3
```

## 🔮 Évolutions Futures

```mermaid
timeline
    title Roadmap du Projet
    
    section Court Terme
        Tests : Tests unitaires
              : Tests E2E
              : Storybook
    
    section Moyen Terme
        PWA : Service Workers
            : Mode hors ligne
            : Notifications Push
    
    section Long Terme
        Architecture : Micro-frontends
                    : Module Fédération
                    : SSR/SSG
                    : Mobile App
``` 
