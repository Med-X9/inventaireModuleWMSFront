import type { Plugin } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const PATCHED_MODULE_ID = '\0smatch-vue-system-design-patched';

/**
 * Plugin Vite pour corriger les bugs du package @SMATCH-Digital-dev/vue-system-design
 * 
 * 1. Imports mal compilés (@/ qui pointe vers le src du package)
 * 2. iconSizes, iconStrokeWidth, colors non définis dans IconBase (alias manquants)
 * 3. useAppStore fourni via globalThis (voir main.ts)
 * 4. useRouter appelé hors setup -> utiliser uo() pendant setup
 * 
 * NOTE: Ce package est mal compilé et ne devrait pas être utilisé en production.
 * Cette solution est un workaround temporaire.
 */
export function fixSystemDesignImports(): Plugin {
    return {
        name: 'fix-system-design-imports',
        enforce: 'pre',
        resolveId(source, _importer) {
            // Intercepter l'import principal du package pour forcer le patch
            if (source === '@SMATCH-Digital-dev/vue-system-design' || source === '@SMATCH-Digital-dev/vue-system-design/') {
                return PATCHED_MODULE_ID;
            }
            return null;
        },
        load(id) {
            // Patcher le bundle principal du package (chargé via module virtuel)
            if (id === PATCHED_MODULE_ID) {
                const pkgPath = resolve(process.cwd(), 'node_modules/@SMATCH-Digital-dev/vue-system-design/dist/index.js');
                // ⚡ FIX CRITIQUE : sans addWatchFile, Vite ignore que ce module virtuel dépend
                // de dist/index.js. Résultat : après `npm publish` + `npm install` d'une nouvelle
                // version, ce load() n'est JAMAIS ré-exécuté par le serveur de dev (le module
                // virtuel reste caché avec l'ancien contenu en mémoire) tant que le process
                // `npm run dev` n'est pas totalement arrêté puis relancé. C'est très probablement
                // la cause racine de "je republie mais le bug est toujours là" observé en boucle :
                // le code patché servi au navigateur n'était pas le code du dist réinstallé.
                this.addWatchFile(pkgPath);
                let code = readFileSync(pkgPath, 'utf-8');

                // 1. Alias iconSizes / iconStrokeWidth / colors pour IconBase (références nues dans le bundle)
                if (code.includes('iconSizes') && !code.includes('var iconSizes=')) {
                    let iconAliasPatched = false;

                    // v1.1.31 : Tb/Fb/_b + function gx() installTheme
                    const themeEndV1131 = /variants:\s*Wb\s*\n\s*\}\s*\n\};\s*\nfunction gx\(\)/;
                    if (!iconAliasPatched && themeEndV1131.test(code) && code.includes('Tb as iconSizes')) {
                        code = code.replace(
                            themeEndV1131,
                            `variants: Wb\n  }\n};\nvar iconSizes=Tb,iconStrokeWidth=Fb,colors=_b;\nfunction gx()`
                        );
                        iconAliasPatched = true;
                    }

                    // v1.1.26+ : Bb/Hb/bb exportés, thème dx puis installTheme hx()
                    const themeEndV1126 = /variants:\s*Fb\s*\n\s*\}\s*\n\};\s*\nfunction hx\(\)/;
                    if (!iconAliasPatched && themeEndV1126.test(code) && code.includes('Bb as iconSizes')) {
                        code = code.replace(
                            themeEndV1126,
                            `variants: Fb\n  }\n};\nvar iconSizes=Bb,iconStrokeWidth=Hb,colors=bb;\nfunction hx()`
                        );
                        iconAliasPatched = true;
                    }

                    // v1.1.24 : Pb/Bb/yb + function dx() install
                    if (!iconAliasPatched) {
                        const themeEndV1124 = /\}\s*;\s*\nfunction dx\(\)/;
                        if (themeEndV1124.test(code) && code.includes('Pb as iconSizes')) {
                            code = code.replace(
                                themeEndV1124,
                                `};\nvar iconSizes=Pb,iconStrokeWidth=Bb,colors=yb;\nfunction dx()`
                            );
                            iconAliasPatched = true;
                        }
                    }

                    // v1.1.20-ish : Eb, zb, pb + function ax()
                    if (!iconAliasPatched) {
                        const themeEndThenInstall = /variants:\s*Db\s*\}\s*\}\s*;\s*function ax\(\)/;
                        if (themeEndThenInstall.test(code)) {
                            code = code.replace(
                                themeEndThenInstall,
                                `variants: Db\n  }\n};\nvar iconSizes=Eb,iconStrokeWidth=zb,colors=pb;\nfunction ax()`
                            );
                            iconAliasPatched = true;
                        }
                    }

                    // Legacy : Dy, zy, vy + function ib()
                    if (!iconAliasPatched) {
                        const legacySearch = /\};\s*function ib\(\)/;
                        if (legacySearch.test(code)) {
                            code = code.replace(
                                legacySearch,
                                `};\nvar iconSizes=Dy,iconStrokeWidth=zy,colors=vy;\nfunction ib()`
                            );
                            iconAliasPatched = true;
                        }
                    }

                    // Fallback générique : symboles minifiés depuis les exports nommés
                    if (!iconAliasPatched) {
                        const sizesExport = code.match(/(\w+) as iconSizes/);
                        const strokeExport = code.match(/(\w+) as iconStrokeWidth/);
                        const colorsExport = code.match(/(\w+) as colors,/);
                        const genericThemeEnd = /variants:\s*(\w+)\s*\n\s*\}\s*\n\};\s*\nfunction (gx|hx)\(\)/;
                        if (sizesExport && strokeExport && colorsExport && genericThemeEnd.test(code)) {
                            code = code.replace(
                                genericThemeEnd,
                                (_match, variantName, fn) =>
                                    `variants: ${variantName}\n  }\n};\nvar iconSizes=${sizesExport[1]},iconStrokeWidth=${strokeExport[1]},colors=${colorsExport[1]};\nfunction ${fn}()`
                            );
                        }
                    }
                }

                // 2. useAppStore non importé par DarkModeSwitch - fourni via globalThis (main.ts)
                if (code.includes('useAppStore()') && !code.includes('globalThis')) {
                    code = code.replace(/\buseAppStore\(\)/g, '((typeof globalThis!=="undefined"?globalThis:window).useAppStore)()');
                }

                // 3. useRouter appelé dans onMounted (async) - utiliser uo() pendant setup
                if (code.includes('import("vue-router").then') && code.includes('g.useRouter()')) {
                    code = code.replace('let s = null;', 'let s = uo();');
                    // Remplacer la fonction i par une no-op (le regex accepte variantes d'espaces)
                    code = code.replace(
                        /function i\(\)\s*\{\s*import\("vue-router"\)\.then\s*\(\s*\(g\)\s*=>\s*\{\s*s\s*=\s*g\.useRouter\(\);\s*\}\)\.catch\s*\(\s*\(\)\s*=>\s*\{\s*\}\)\s*;\s*\}/,
                        'function i() {}'
                    );
                }

                // 4. Import cassé @/utils/routeToNavItems → fichier fourni par l'app hôte
                if (code.includes('@/utils/routeToNavItems')) {
                    code = code.replace(
                        /from\s+"@\/utils\/routeToNavItems"/g,
                        'from "@/utils/routeToNavItems.ts"'
                    );
                }

                // 5. Logout AppLayout : /login n'existe pas → déléguer à __appLogout (main.ts)
                if (code.includes('p.push("/login")')) {
                    code = code.replace(
                        /p\.push\("\/login"\)/g,
                        '(typeof globalThis!=="undefined"&&globalThis.__appLogout?globalThis.__appLogout():void 0)'
                    );
                }

                return { code, map: null };
            }

            // Stubs pour imports @/ depuis le package
            // Charger les stubs vides pour les imports interceptés
            if (id.startsWith('\0system-design-stub:')) {
                // Extraire le type d'import pour retourner le bon stub
                const originalId = id.replace('\0system-design-stub:', '');
                
                // Si c'est un store, retourner un store vide
                if (originalId.includes('/stores/')) {
                    return 'export const useToastStore = () => ({ showToast: () => {}, hideToast: () => {} }); export const useAppStore = () => ({});';
                }
                
                // Si c'est un composant Vue, retourner un composant vide
                if (originalId.endsWith('.vue')) {
                    return 'export default { name: "StubComponent", template: "<div></div>" };';
                }
                
                // Si c'est un utilitaire, retourner des fonctions vides
                if (originalId.includes('/utils/')) {
                    return 'export const ensureValidColor = (c) => c; export const addColorOpacity = (c, o) => c; export const ensureValidColors = (c) => c;';
                }
                
                // Si c'est un thème, retourner des valeurs par défaut
                if (originalId.includes('/theme/')) {
                    if (originalId.includes('/icons')) {
                        return 'export const iconSizes = {}; export const iconStrokeWidth = {};';
                    }
                    if (originalId.includes('/colors')) {
                        return 'export const colors = {};';
                    }
                }
                
                // Si c'est un composant base, retourner un composant vide
                if (originalId.includes('/components/base')) {
                    return 'export default { name: "StubComponent", template: "<div></div>" };';
                }
                
                // Par défaut, retourner un module vide
                return 'export default {};';
            }
            return null;
        },
    };
}

