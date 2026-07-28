// vitest.override.verify2.config.ts
import { defineConfig } from "file:///sessions/peaceful-compassionate-cori/mnt/inventaireModuleWMSFront/node_modules/vitest/dist/config.js";
import vue from "file:///sessions/peaceful-compassionate-cori/mnt/inventaireModuleWMSFront/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";

// vite-plugin-fix-system-design.ts
import { readFileSync } from "fs";
import { resolve } from "path";
var PATCHED_MODULE_ID = "\0smatch-vue-system-design-patched";
function fixSystemDesignImports() {
  return {
    name: "fix-system-design-imports",
    enforce: "pre",
    resolveId(source, _importer) {
      if (source === "@SMATCH-Digital-dev/vue-system-design" || source === "@SMATCH-Digital-dev/vue-system-design/") {
        return PATCHED_MODULE_ID;
      }
      return null;
    },
    load(id) {
      if (id === PATCHED_MODULE_ID) {
        const pkgPath = resolve(process.cwd(), "node_modules/@SMATCH-Digital-dev/vue-system-design/dist/index.js");
        let code = readFileSync(pkgPath, "utf-8");
        if (code.includes("iconSizes") && !code.includes("var iconSizes=")) {
          let iconAliasPatched = false;
          const themeEndV1131 = /variants:\s*Wb\s*\n\s*\}\s*\n\};\s*\nfunction gx\(\)/;
          if (!iconAliasPatched && themeEndV1131.test(code) && code.includes("Tb as iconSizes")) {
            code = code.replace(
              themeEndV1131,
              `variants: Wb
  }
};
var iconSizes=Tb,iconStrokeWidth=Fb,colors=_b;
function gx()`
            );
            iconAliasPatched = true;
          }
          const themeEndV1126 = /variants:\s*Fb\s*\n\s*\}\s*\n\};\s*\nfunction hx\(\)/;
          if (!iconAliasPatched && themeEndV1126.test(code) && code.includes("Bb as iconSizes")) {
            code = code.replace(
              themeEndV1126,
              `variants: Fb
  }
};
var iconSizes=Bb,iconStrokeWidth=Hb,colors=bb;
function hx()`
            );
            iconAliasPatched = true;
          }
          if (!iconAliasPatched) {
            const themeEndV1124 = /\}\s*;\s*\nfunction dx\(\)/;
            if (themeEndV1124.test(code) && code.includes("Pb as iconSizes")) {
              code = code.replace(
                themeEndV1124,
                `};
var iconSizes=Pb,iconStrokeWidth=Bb,colors=yb;
function dx()`
              );
              iconAliasPatched = true;
            }
          }
          if (!iconAliasPatched) {
            const themeEndThenInstall = /variants:\s*Db\s*\}\s*\}\s*;\s*function ax\(\)/;
            if (themeEndThenInstall.test(code)) {
              code = code.replace(
                themeEndThenInstall,
                `variants: Db
  }
};
var iconSizes=Eb,iconStrokeWidth=zb,colors=pb;
function ax()`
              );
              iconAliasPatched = true;
            }
          }
          if (!iconAliasPatched) {
            const legacySearch = /\};\s*function ib\(\)/;
            if (legacySearch.test(code)) {
              code = code.replace(
                legacySearch,
                `};
var iconSizes=Dy,iconStrokeWidth=zy,colors=vy;
function ib()`
              );
              iconAliasPatched = true;
            }
          }
          if (!iconAliasPatched) {
            const sizesExport = code.match(/(\w+) as iconSizes/);
            const strokeExport = code.match(/(\w+) as iconStrokeWidth/);
            const colorsExport = code.match(/(\w+) as colors,/);
            const genericThemeEnd = /variants:\s*(\w+)\s*\n\s*\}\s*\n\};\s*\nfunction (gx|hx)\(\)/;
            if (sizesExport && strokeExport && colorsExport && genericThemeEnd.test(code)) {
              code = code.replace(
                genericThemeEnd,
                (_match, variantName, fn) => `variants: ${variantName}
  }
};
var iconSizes=${sizesExport[1]},iconStrokeWidth=${strokeExport[1]},colors=${colorsExport[1]};
function ${fn}()`
              );
            }
          }
        }
        if (code.includes("useAppStore()") && !code.includes("globalThis")) {
          code = code.replace(/\buseAppStore\(\)/g, '((typeof globalThis!=="undefined"?globalThis:window).useAppStore)()');
        }
        if (code.includes('import("vue-router").then') && code.includes("g.useRouter()")) {
          code = code.replace("let s = null;", "let s = uo();");
          code = code.replace(
            /function i\(\)\s*\{\s*import\("vue-router"\)\.then\s*\(\s*\(g\)\s*=>\s*\{\s*s\s*=\s*g\.useRouter\(\);\s*\}\)\.catch\s*\(\s*\(\)\s*=>\s*\{\s*\}\)\s*;\s*\}/,
            "function i() {}"
          );
        }
        if (code.includes("@/utils/routeToNavItems")) {
          code = code.replace(
            /from\s+"@\/utils\/routeToNavItems"/g,
            'from "@/utils/routeToNavItems.ts"'
          );
        }
        if (code.includes('p.push("/login")')) {
          code = code.replace(
            /p\.push\("\/login"\)/g,
            '(typeof globalThis!=="undefined"&&globalThis.__appLogout?globalThis.__appLogout():void 0)'
          );
        }
        return { code, map: null };
      }
      if (id.startsWith("\0system-design-stub:")) {
        const originalId = id.replace("\0system-design-stub:", "");
        if (originalId.includes("/stores/")) {
          return "export const useToastStore = () => ({ showToast: () => {}, hideToast: () => {} }); export const useAppStore = () => ({});";
        }
        if (originalId.endsWith(".vue")) {
          return 'export default { name: "StubComponent", template: "<div></div>" };';
        }
        if (originalId.includes("/utils/")) {
          return "export const ensureValidColor = (c) => c; export const addColorOpacity = (c, o) => c; export const ensureValidColors = (c) => c;";
        }
        if (originalId.includes("/theme/")) {
          if (originalId.includes("/icons")) {
            return "export const iconSizes = {}; export const iconStrokeWidth = {};";
          }
          if (originalId.includes("/colors")) {
            return "export const colors = {};";
          }
        }
        if (originalId.includes("/components/base")) {
          return 'export default { name: "StubComponent", template: "<div></div>" };';
        }
        return "export default {};";
      }
      return null;
    }
  };
}

// vitest.override.verify2.config.ts
var __vite_injected_original_dirname = "/sessions/peaceful-compassionate-cori/mnt/inventaireModuleWMSFront";
var vitest_override_verify2_config_default = defineConfig({
  cacheDir: "/tmp/wmsfront-vite-cache3",
  plugins: [vue(), fixSystemDesignImports()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "@/components": path.resolve(__vite_injected_original_dirname, "./src/components"),
      "@/composables": path.resolve(__vite_injected_original_dirname, "./src/composables"),
      "@/interfaces": path.resolve(__vite_injected_original_dirname, "./src/interfaces"),
      "@/utils": path.resolve(__vite_injected_original_dirname, "./src/utils"),
      "@/services": path.resolve(__vite_injected_original_dirname, "./src/services")
    },
    dedupe: ["vue", "vue-router", "@vueuse/core", "@vueuse/shared"]
  },
  optimizeDeps: {
    exclude: ["@SMATCH-Digital-dev/vue-system-design"]
  },
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["src/__verify_basic_reactivity.spec.ts"]
  }
});
export {
  vitest_override_verify2_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0Lm92ZXJyaWRlLnZlcmlmeTIuY29uZmlnLnRzIiwgInZpdGUtcGx1Z2luLWZpeC1zeXN0ZW0tZGVzaWduLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL3Nlc3Npb25zL3BlYWNlZnVsLWNvbXBhc3Npb25hdGUtY29yaS9tbnQvaW52ZW50YWlyZU1vZHVsZVdNU0Zyb250XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvcGVhY2VmdWwtY29tcGFzc2lvbmF0ZS1jb3JpL21udC9pbnZlbnRhaXJlTW9kdWxlV01TRnJvbnQvdml0ZXN0Lm92ZXJyaWRlLnZlcmlmeTIuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9wZWFjZWZ1bC1jb21wYXNzaW9uYXRlLWNvcmkvbW50L2ludmVudGFpcmVNb2R1bGVXTVNGcm9udC92aXRlc3Qub3ZlcnJpZGUudmVyaWZ5Mi5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgZml4U3lzdGVtRGVzaWduSW1wb3J0cyB9IGZyb20gJy4vdml0ZS1wbHVnaW4tZml4LXN5c3RlbS1kZXNpZ24nXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGNhY2hlRGlyOiAnL3RtcC93bXNmcm9udC12aXRlLWNhY2hlMycsXG4gIHBsdWdpbnM6IFt2dWUoKSwgZml4U3lzdGVtRGVzaWduSW1wb3J0cygpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgJ0AvY29tcG9uZW50cyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9jb21wb25lbnRzJyksXG4gICAgICAnQC9jb21wb3NhYmxlcyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9jb21wb3NhYmxlcycpLFxuICAgICAgJ0AvaW50ZXJmYWNlcyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9pbnRlcmZhY2VzJyksXG4gICAgICAnQC91dGlscyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy91dGlscycpLFxuICAgICAgJ0Avc2VydmljZXMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvc2VydmljZXMnKSxcbiAgICB9LFxuICAgIGRlZHVwZTogWyd2dWUnLCAndnVlLXJvdXRlcicsICdAdnVldXNlL2NvcmUnLCAnQHZ1ZXVzZS9zaGFyZWQnXVxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ0BTTUFUQ0gtRGlnaXRhbC1kZXYvdnVlLXN5c3RlbS1kZXNpZ24nXVxuICB9LFxuICB0ZXN0OiB7XG4gICAgZW52aXJvbm1lbnQ6ICdoYXBweS1kb20nLFxuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgaW5jbHVkZTogWydzcmMvX192ZXJpZnlfYmFzaWNfcmVhY3Rpdml0eS5zcGVjLnRzJ11cbiAgfVxufSlcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL3Nlc3Npb25zL3BlYWNlZnVsLWNvbXBhc3Npb25hdGUtY29yaS9tbnQvaW52ZW50YWlyZU1vZHVsZVdNU0Zyb250XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvcGVhY2VmdWwtY29tcGFzc2lvbmF0ZS1jb3JpL21udC9pbnZlbnRhaXJlTW9kdWxlV01TRnJvbnQvdml0ZS1wbHVnaW4tZml4LXN5c3RlbS1kZXNpZ24udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL3BlYWNlZnVsLWNvbXBhc3Npb25hdGUtY29yaS9tbnQvaW52ZW50YWlyZU1vZHVsZVdNU0Zyb250L3ZpdGUtcGx1Z2luLWZpeC1zeXN0ZW0tZGVzaWduLnRzXCI7aW1wb3J0IHR5cGUgeyBQbHVnaW4gfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcblxuY29uc3QgUEFUQ0hFRF9NT0RVTEVfSUQgPSAnXFwwc21hdGNoLXZ1ZS1zeXN0ZW0tZGVzaWduLXBhdGNoZWQnO1xuXG4vKipcbiAqIFBsdWdpbiBWaXRlIHBvdXIgY29ycmlnZXIgbGVzIGJ1Z3MgZHUgcGFja2FnZSBAU01BVENILURpZ2l0YWwtZGV2L3Z1ZS1zeXN0ZW0tZGVzaWduXG4gKiBcbiAqIDEuIEltcG9ydHMgbWFsIGNvbXBpbFx1MDBFOXMgKEAvIHF1aSBwb2ludGUgdmVycyBsZSBzcmMgZHUgcGFja2FnZSlcbiAqIDIuIGljb25TaXplcywgaWNvblN0cm9rZVdpZHRoLCBjb2xvcnMgbm9uIGRcdTAwRTlmaW5pcyBkYW5zIEljb25CYXNlIChhbGlhcyBtYW5xdWFudHMpXG4gKiAzLiB1c2VBcHBTdG9yZSBmb3VybmkgdmlhIGdsb2JhbFRoaXMgKHZvaXIgbWFpbi50cylcbiAqIDQuIHVzZVJvdXRlciBhcHBlbFx1MDBFOSBob3JzIHNldHVwIC0+IHV0aWxpc2VyIHVvKCkgcGVuZGFudCBzZXR1cFxuICogXG4gKiBOT1RFOiBDZSBwYWNrYWdlIGVzdCBtYWwgY29tcGlsXHUwMEU5IGV0IG5lIGRldnJhaXQgcGFzIFx1MDBFQXRyZSB1dGlsaXNcdTAwRTkgZW4gcHJvZHVjdGlvbi5cbiAqIENldHRlIHNvbHV0aW9uIGVzdCB1biB3b3JrYXJvdW5kIHRlbXBvcmFpcmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaXhTeXN0ZW1EZXNpZ25JbXBvcnRzKCk6IFBsdWdpbiB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogJ2ZpeC1zeXN0ZW0tZGVzaWduLWltcG9ydHMnLFxuICAgICAgICBlbmZvcmNlOiAncHJlJyxcbiAgICAgICAgcmVzb2x2ZUlkKHNvdXJjZSwgX2ltcG9ydGVyKSB7XG4gICAgICAgICAgICAvLyBJbnRlcmNlcHRlciBsJ2ltcG9ydCBwcmluY2lwYWwgZHUgcGFja2FnZSBwb3VyIGZvcmNlciBsZSBwYXRjaFxuICAgICAgICAgICAgaWYgKHNvdXJjZSA9PT0gJ0BTTUFUQ0gtRGlnaXRhbC1kZXYvdnVlLXN5c3RlbS1kZXNpZ24nIHx8IHNvdXJjZSA9PT0gJ0BTTUFUQ0gtRGlnaXRhbC1kZXYvdnVlLXN5c3RlbS1kZXNpZ24vJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBQQVRDSEVEX01PRFVMRV9JRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBsb2FkKGlkKSB7XG4gICAgICAgICAgICAvLyBQYXRjaGVyIGxlIGJ1bmRsZSBwcmluY2lwYWwgZHUgcGFja2FnZSAoY2hhcmdcdTAwRTkgdmlhIG1vZHVsZSB2aXJ0dWVsKVxuICAgICAgICAgICAgaWYgKGlkID09PSBQQVRDSEVEX01PRFVMRV9JRCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBrZ1BhdGggPSByZXNvbHZlKHByb2Nlc3MuY3dkKCksICdub2RlX21vZHVsZXMvQFNNQVRDSC1EaWdpdGFsLWRldi92dWUtc3lzdGVtLWRlc2lnbi9kaXN0L2luZGV4LmpzJyk7XG4gICAgICAgICAgICAgICAgbGV0IGNvZGUgPSByZWFkRmlsZVN5bmMocGtnUGF0aCwgJ3V0Zi04Jyk7XG5cbiAgICAgICAgICAgICAgICAvLyAxLiBBbGlhcyBpY29uU2l6ZXMgLyBpY29uU3Ryb2tlV2lkdGggLyBjb2xvcnMgcG91ciBJY29uQmFzZSAoclx1MDBFOWZcdTAwRTlyZW5jZXMgbnVlcyBkYW5zIGxlIGJ1bmRsZSlcbiAgICAgICAgICAgICAgICBpZiAoY29kZS5pbmNsdWRlcygnaWNvblNpemVzJykgJiYgIWNvZGUuaW5jbHVkZXMoJ3ZhciBpY29uU2l6ZXM9JykpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGljb25BbGlhc1BhdGNoZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyB2MS4xLjMxIDogVGIvRmIvX2IgKyBmdW5jdGlvbiBneCgpIGluc3RhbGxUaGVtZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0aGVtZUVuZFYxMTMxID0gL3ZhcmlhbnRzOlxccypXYlxccypcXG5cXHMqXFx9XFxzKlxcblxcfTtcXHMqXFxuZnVuY3Rpb24gZ3hcXChcXCkvO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWljb25BbGlhc1BhdGNoZWQgJiYgdGhlbWVFbmRWMTEzMS50ZXN0KGNvZGUpICYmIGNvZGUuaW5jbHVkZXMoJ1RiIGFzIGljb25TaXplcycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW1lRW5kVjExMzEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYHZhcmlhbnRzOiBXYlxcbiAgfVxcbn07XFxudmFyIGljb25TaXplcz1UYixpY29uU3Ryb2tlV2lkdGg9RmIsY29sb3JzPV9iO1xcbmZ1bmN0aW9uIGd4KClgXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbkFsaWFzUGF0Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyB2MS4xLjI2KyA6IEJiL0hiL2JiIGV4cG9ydFx1MDBFOXMsIHRoXHUwMEU4bWUgZHggcHVpcyBpbnN0YWxsVGhlbWUgaHgoKVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0aGVtZUVuZFYxMTI2ID0gL3ZhcmlhbnRzOlxccypGYlxccypcXG5cXHMqXFx9XFxzKlxcblxcfTtcXHMqXFxuZnVuY3Rpb24gaHhcXChcXCkvO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWljb25BbGlhc1BhdGNoZWQgJiYgdGhlbWVFbmRWMTEyNi50ZXN0KGNvZGUpICYmIGNvZGUuaW5jbHVkZXMoJ0JiIGFzIGljb25TaXplcycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW1lRW5kVjExMjYsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYHZhcmlhbnRzOiBGYlxcbiAgfVxcbn07XFxudmFyIGljb25TaXplcz1CYixpY29uU3Ryb2tlV2lkdGg9SGIsY29sb3JzPWJiO1xcbmZ1bmN0aW9uIGh4KClgXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWNvbkFsaWFzUGF0Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyB2MS4xLjI0IDogUGIvQmIveWIgKyBmdW5jdGlvbiBkeCgpIGluc3RhbGxcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpY29uQWxpYXNQYXRjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0aGVtZUVuZFYxMTI0ID0gL1xcfVxccyo7XFxzKlxcbmZ1bmN0aW9uIGR4XFwoXFwpLztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGVtZUVuZFYxMTI0LnRlc3QoY29kZSkgJiYgY29kZS5pbmNsdWRlcygnUGIgYXMgaWNvblNpemVzJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVtZUVuZFYxMTI0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgfTtcXG52YXIgaWNvblNpemVzPVBiLGljb25TdHJva2VXaWR0aD1CYixjb2xvcnM9eWI7XFxuZnVuY3Rpb24gZHgoKWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGljb25BbGlhc1BhdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gdjEuMS4yMC1pc2ggOiBFYiwgemIsIHBiICsgZnVuY3Rpb24gYXgoKVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWljb25BbGlhc1BhdGNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRoZW1lRW5kVGhlbkluc3RhbGwgPSAvdmFyaWFudHM6XFxzKkRiXFxzKlxcfVxccypcXH1cXHMqO1xccypmdW5jdGlvbiBheFxcKFxcKS87XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhlbWVFbmRUaGVuSW5zdGFsbC50ZXN0KGNvZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbWVFbmRUaGVuSW5zdGFsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYHZhcmlhbnRzOiBEYlxcbiAgfVxcbn07XFxudmFyIGljb25TaXplcz1FYixpY29uU3Ryb2tlV2lkdGg9emIsY29sb3JzPXBiO1xcbmZ1bmN0aW9uIGF4KClgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpY29uQWxpYXNQYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIExlZ2FjeSA6IER5LCB6eSwgdnkgKyBmdW5jdGlvbiBpYigpXG4gICAgICAgICAgICAgICAgICAgIGlmICghaWNvbkFsaWFzUGF0Y2hlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGVnYWN5U2VhcmNoID0gL1xcfTtcXHMqZnVuY3Rpb24gaWJcXChcXCkvO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxlZ2FjeVNlYXJjaC50ZXN0KGNvZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVnYWN5U2VhcmNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgfTtcXG52YXIgaWNvblNpemVzPUR5LGljb25TdHJva2VXaWR0aD16eSxjb2xvcnM9dnk7XFxuZnVuY3Rpb24gaWIoKWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGljb25BbGlhc1BhdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRmFsbGJhY2sgZ1x1MDBFOW5cdTAwRTlyaXF1ZSA6IHN5bWJvbGVzIG1pbmlmaVx1MDBFOXMgZGVwdWlzIGxlcyBleHBvcnRzIG5vbW1cdTAwRTlzXG4gICAgICAgICAgICAgICAgICAgIGlmICghaWNvbkFsaWFzUGF0Y2hlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2l6ZXNFeHBvcnQgPSBjb2RlLm1hdGNoKC8oXFx3KykgYXMgaWNvblNpemVzLyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdHJva2VFeHBvcnQgPSBjb2RlLm1hdGNoKC8oXFx3KykgYXMgaWNvblN0cm9rZVdpZHRoLyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2xvcnNFeHBvcnQgPSBjb2RlLm1hdGNoKC8oXFx3KykgYXMgY29sb3JzLC8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ2VuZXJpY1RoZW1lRW5kID0gL3ZhcmlhbnRzOlxccyooXFx3KylcXHMqXFxuXFxzKlxcfVxccypcXG5cXH07XFxzKlxcbmZ1bmN0aW9uIChneHxoeClcXChcXCkvO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNpemVzRXhwb3J0ICYmIHN0cm9rZUV4cG9ydCAmJiBjb2xvcnNFeHBvcnQgJiYgZ2VuZXJpY1RoZW1lRW5kLnRlc3QoY29kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmljVGhlbWVFbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChfbWF0Y2gsIHZhcmlhbnROYW1lLCBmbikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGB2YXJpYW50czogJHt2YXJpYW50TmFtZX1cXG4gIH1cXG59O1xcbnZhciBpY29uU2l6ZXM9JHtzaXplc0V4cG9ydFsxXX0saWNvblN0cm9rZVdpZHRoPSR7c3Ryb2tlRXhwb3J0WzFdfSxjb2xvcnM9JHtjb2xvcnNFeHBvcnRbMV19O1xcbmZ1bmN0aW9uICR7Zm59KClgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIDIuIHVzZUFwcFN0b3JlIG5vbiBpbXBvcnRcdTAwRTkgcGFyIERhcmtNb2RlU3dpdGNoIC0gZm91cm5pIHZpYSBnbG9iYWxUaGlzIChtYWluLnRzKVxuICAgICAgICAgICAgICAgIGlmIChjb2RlLmluY2x1ZGVzKCd1c2VBcHBTdG9yZSgpJykgJiYgIWNvZGUuaW5jbHVkZXMoJ2dsb2JhbFRoaXMnKSkge1xuICAgICAgICAgICAgICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKC9cXGJ1c2VBcHBTdG9yZVxcKFxcKS9nLCAnKCh0eXBlb2YgZ2xvYmFsVGhpcyE9PVwidW5kZWZpbmVkXCI/Z2xvYmFsVGhpczp3aW5kb3cpLnVzZUFwcFN0b3JlKSgpJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gMy4gdXNlUm91dGVyIGFwcGVsXHUwMEU5IGRhbnMgb25Nb3VudGVkIChhc3luYykgLSB1dGlsaXNlciB1bygpIHBlbmRhbnQgc2V0dXBcbiAgICAgICAgICAgICAgICBpZiAoY29kZS5pbmNsdWRlcygnaW1wb3J0KFwidnVlLXJvdXRlclwiKS50aGVuJykgJiYgY29kZS5pbmNsdWRlcygnZy51c2VSb3V0ZXIoKScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoJ2xldCBzID0gbnVsbDsnLCAnbGV0IHMgPSB1bygpOycpO1xuICAgICAgICAgICAgICAgICAgICAvLyBSZW1wbGFjZXIgbGEgZm9uY3Rpb24gaSBwYXIgdW5lIG5vLW9wIChsZSByZWdleCBhY2NlcHRlIHZhcmlhbnRlcyBkJ2VzcGFjZXMpXG4gICAgICAgICAgICAgICAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAvZnVuY3Rpb24gaVxcKFxcKVxccypcXHtcXHMqaW1wb3J0XFwoXCJ2dWUtcm91dGVyXCJcXClcXC50aGVuXFxzKlxcKFxccypcXChnXFwpXFxzKj0+XFxzKlxce1xccypzXFxzKj1cXHMqZ1xcLnVzZVJvdXRlclxcKFxcKTtcXHMqXFx9XFwpXFwuY2F0Y2hcXHMqXFwoXFxzKlxcKFxcKVxccyo9PlxccypcXHtcXHMqXFx9XFwpXFxzKjtcXHMqXFx9LyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdmdW5jdGlvbiBpKCkge30nXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gNC4gSW1wb3J0IGNhc3NcdTAwRTkgQC91dGlscy9yb3V0ZVRvTmF2SXRlbXMgXHUyMTkyIGZpY2hpZXIgZm91cm5pIHBhciBsJ2FwcCBoXHUwMEY0dGVcbiAgICAgICAgICAgICAgICBpZiAoY29kZS5pbmNsdWRlcygnQC91dGlscy9yb3V0ZVRvTmF2SXRlbXMnKSkge1xuICAgICAgICAgICAgICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgL2Zyb21cXHMrXCJAXFwvdXRpbHNcXC9yb3V0ZVRvTmF2SXRlbXNcIi9nLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2Zyb20gXCJAL3V0aWxzL3JvdXRlVG9OYXZJdGVtcy50c1wiJ1xuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIDUuIExvZ291dCBBcHBMYXlvdXQgOiAvbG9naW4gbidleGlzdGUgcGFzIFx1MjE5MiBkXHUwMEU5bFx1MDBFOWd1ZXIgXHUwMEUwIF9fYXBwTG9nb3V0IChtYWluLnRzKVxuICAgICAgICAgICAgICAgIGlmIChjb2RlLmluY2x1ZGVzKCdwLnB1c2goXCIvbG9naW5cIiknKSkge1xuICAgICAgICAgICAgICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgL3BcXC5wdXNoXFwoXCJcXC9sb2dpblwiXFwpL2csXG4gICAgICAgICAgICAgICAgICAgICAgICAnKHR5cGVvZiBnbG9iYWxUaGlzIT09XCJ1bmRlZmluZWRcIiYmZ2xvYmFsVGhpcy5fX2FwcExvZ291dD9nbG9iYWxUaGlzLl9fYXBwTG9nb3V0KCk6dm9pZCAwKSdcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4geyBjb2RlLCBtYXA6IG51bGwgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU3R1YnMgcG91ciBpbXBvcnRzIEAvIGRlcHVpcyBsZSBwYWNrYWdlXG4gICAgICAgICAgICAvLyBDaGFyZ2VyIGxlcyBzdHVicyB2aWRlcyBwb3VyIGxlcyBpbXBvcnRzIGludGVyY2VwdFx1MDBFOXNcbiAgICAgICAgICAgIGlmIChpZC5zdGFydHNXaXRoKCdcXDBzeXN0ZW0tZGVzaWduLXN0dWI6JykpIHtcbiAgICAgICAgICAgICAgICAvLyBFeHRyYWlyZSBsZSB0eXBlIGQnaW1wb3J0IHBvdXIgcmV0b3VybmVyIGxlIGJvbiBzdHViXG4gICAgICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxJZCA9IGlkLnJlcGxhY2UoJ1xcMHN5c3RlbS1kZXNpZ24tc3R1YjonLCAnJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gU2kgYydlc3QgdW4gc3RvcmUsIHJldG91cm5lciB1biBzdG9yZSB2aWRlXG4gICAgICAgICAgICAgICAgaWYgKG9yaWdpbmFsSWQuaW5jbHVkZXMoJy9zdG9yZXMvJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdleHBvcnQgY29uc3QgdXNlVG9hc3RTdG9yZSA9ICgpID0+ICh7IHNob3dUb2FzdDogKCkgPT4ge30sIGhpZGVUb2FzdDogKCkgPT4ge30gfSk7IGV4cG9ydCBjb25zdCB1c2VBcHBTdG9yZSA9ICgpID0+ICh7fSk7JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gU2kgYydlc3QgdW4gY29tcG9zYW50IFZ1ZSwgcmV0b3VybmVyIHVuIGNvbXBvc2FudCB2aWRlXG4gICAgICAgICAgICAgICAgaWYgKG9yaWdpbmFsSWQuZW5kc1dpdGgoJy52dWUnKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ2V4cG9ydCBkZWZhdWx0IHsgbmFtZTogXCJTdHViQ29tcG9uZW50XCIsIHRlbXBsYXRlOiBcIjxkaXY+PC9kaXY+XCIgfTsnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBTaSBjJ2VzdCB1biB1dGlsaXRhaXJlLCByZXRvdXJuZXIgZGVzIGZvbmN0aW9ucyB2aWRlc1xuICAgICAgICAgICAgICAgIGlmIChvcmlnaW5hbElkLmluY2x1ZGVzKCcvdXRpbHMvJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdleHBvcnQgY29uc3QgZW5zdXJlVmFsaWRDb2xvciA9IChjKSA9PiBjOyBleHBvcnQgY29uc3QgYWRkQ29sb3JPcGFjaXR5ID0gKGMsIG8pID0+IGM7IGV4cG9ydCBjb25zdCBlbnN1cmVWYWxpZENvbG9ycyA9IChjKSA9PiBjOyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFNpIGMnZXN0IHVuIHRoXHUwMEU4bWUsIHJldG91cm5lciBkZXMgdmFsZXVycyBwYXIgZFx1MDBFOWZhdXRcbiAgICAgICAgICAgICAgICBpZiAob3JpZ2luYWxJZC5pbmNsdWRlcygnL3RoZW1lLycpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcmlnaW5hbElkLmluY2x1ZGVzKCcvaWNvbnMnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdleHBvcnQgY29uc3QgaWNvblNpemVzID0ge307IGV4cG9ydCBjb25zdCBpY29uU3Ryb2tlV2lkdGggPSB7fTsnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcmlnaW5hbElkLmluY2x1ZGVzKCcvY29sb3JzJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnZXhwb3J0IGNvbnN0IGNvbG9ycyA9IHt9Oyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gU2kgYydlc3QgdW4gY29tcG9zYW50IGJhc2UsIHJldG91cm5lciB1biBjb21wb3NhbnQgdmlkZVxuICAgICAgICAgICAgICAgIGlmIChvcmlnaW5hbElkLmluY2x1ZGVzKCcvY29tcG9uZW50cy9iYXNlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdleHBvcnQgZGVmYXVsdCB7IG5hbWU6IFwiU3R1YkNvbXBvbmVudFwiLCB0ZW1wbGF0ZTogXCI8ZGl2PjwvZGl2PlwiIH07JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gUGFyIGRcdTAwRTlmYXV0LCByZXRvdXJuZXIgdW4gbW9kdWxlIHZpZGVcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2V4cG9ydCBkZWZhdWx0IHt9Oyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThaLFNBQVMsb0JBQW9CO0FBQzNiLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7OztBQ0RqQixTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGVBQWU7QUFFeEIsSUFBTSxvQkFBb0I7QUFhbkIsU0FBUyx5QkFBaUM7QUFDN0MsU0FBTztBQUFBLElBQ0gsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLElBQ1QsVUFBVSxRQUFRLFdBQVc7QUFFekIsVUFBSSxXQUFXLDJDQUEyQyxXQUFXLDBDQUEwQztBQUMzRyxlQUFPO0FBQUEsTUFDWDtBQUNBLGFBQU87QUFBQSxJQUNYO0FBQUEsSUFDQSxLQUFLLElBQUk7QUFFTCxVQUFJLE9BQU8sbUJBQW1CO0FBQzFCLGNBQU0sVUFBVSxRQUFRLFFBQVEsSUFBSSxHQUFHLGtFQUFrRTtBQUN6RyxZQUFJLE9BQU8sYUFBYSxTQUFTLE9BQU87QUFHeEMsWUFBSSxLQUFLLFNBQVMsV0FBVyxLQUFLLENBQUMsS0FBSyxTQUFTLGdCQUFnQixHQUFHO0FBQ2hFLGNB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
