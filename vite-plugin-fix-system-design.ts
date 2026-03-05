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
                let code = readFileSync(pkgPath, 'utf-8');

                // 1. Ajouter alias iconSizes, iconStrokeWidth, colors (IconBase les utilise sans import)
                // Noms réels dans le bundle : Dy=iconSizes, zy=iconStrokeWidth, vy=colors (voir exports)
                const iconPatch = 'var iconSizes=Dy,iconStrokeWidth=zy,colors=vy;';
                const iconSearch = /\};\s*function ib\(\)/;
                const iconReplace = `};\n${iconPatch}\nfunction ib()`;
                if (code.includes('iconSizes[t.size]') && iconSearch.test(code)) {
                    code = code.replace(iconSearch, iconReplace);
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

