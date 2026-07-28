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
    include: ["src/__verify_pool_fix.spec.ts"]
  }
});
export {
  vitest_override_verify2_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0Lm92ZXJyaWRlLnZlcmlmeTIuY29uZmlnLnRzIiwgInZpdGUtcGx1Z2luLWZpeC1zeXN0ZW0tZGVzaWduLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL3Nlc3Npb25zL3BlYWNlZnVsLWNvbXBhc3Npb25hdGUtY29yaS9tbnQvaW52ZW50YWlyZU1vZHVsZVdNU0Zyb250XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvcGVhY2VmdWwtY29tcGFzc2lvbmF0ZS1jb3JpL21udC9pbnZlbnRhaXJlTW9kdWxlV01TRnJvbnQvdml0ZXN0Lm92ZXJyaWRlLnZlcmlmeTIuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9wZWFjZWZ1bC1jb21wYXNzaW9uYXRlLWNvcmkvbW50L2ludmVudGFpcmVNb2R1bGVXTVNGcm9udC92aXRlc3Qub3ZlcnJpZGUudmVyaWZ5Mi5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgZml4U3lzdGVtRGVzaWduSW1wb3J0cyB9IGZyb20gJy4vdml0ZS1wbHVnaW4tZml4LXN5c3RlbS1kZXNpZ24nXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGNhY2hlRGlyOiAnL3RtcC93bXNmcm9udC12aXRlLWNhY2hlMycsXG4gIHBsdWdpbnM6IFt2dWUoKSwgZml4U3lzdGVtRGVzaWduSW1wb3J0cygpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgJ0AvY29tcG9uZW50cyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9jb21wb25lbnRzJyksXG4gICAgICAnQC9jb21wb3NhYmxlcyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9jb21wb3NhYmxlcycpLFxuICAgICAgJ0AvaW50ZXJmYWNlcyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9pbnRlcmZhY2VzJyksXG4gICAgICAnQC91dGlscyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy91dGlscycpLFxuICAgICAgJ0Avc2VydmljZXMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvc2VydmljZXMnKSxcbiAgICB9LFxuICAgIGRlZHVwZTogWyd2dWUnLCAndnVlLXJvdXRlcicsICdAdnVldXNlL2NvcmUnLCAnQHZ1ZXVzZS9zaGFyZWQnXVxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ0BTTUFUQ0gtRGlnaXRhbC1kZXYvdnVlLXN5c3RlbS1kZXNpZ24nXVxuICB9LFxuICB0ZXN0OiB7XG4gICAgZW52aXJvbm1lbnQ6ICdoYXBweS1kb20nLFxuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgaW5jbHVkZTogWydzcmMvX192ZXJpZnlfcG9vbF9maXguc3BlYy50cyddXG4gIH1cbn0pXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9zZXNzaW9ucy9wZWFjZWZ1bC1jb21wYXNzaW9uYXRlLWNvcmkvbW50L2ludmVudGFpcmVNb2R1bGVXTVNGcm9udFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL3BlYWNlZnVsLWNvbXBhc3Npb25hdGUtY29yaS9tbnQvaW52ZW50YWlyZU1vZHVsZVdNU0Zyb250L3ZpdGUtcGx1Z2luLWZpeC1zeXN0ZW0tZGVzaWduLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9wZWFjZWZ1bC1jb21wYXNzaW9uYXRlLWNvcmkvbW50L2ludmVudGFpcmVNb2R1bGVXTVNGcm9udC92aXRlLXBsdWdpbi1maXgtc3lzdGVtLWRlc2lnbi50c1wiO2ltcG9ydCB0eXBlIHsgUGx1Z2luIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5cbmNvbnN0IFBBVENIRURfTU9EVUxFX0lEID0gJ1xcMHNtYXRjaC12dWUtc3lzdGVtLWRlc2lnbi1wYXRjaGVkJztcblxuLyoqXG4gKiBQbHVnaW4gVml0ZSBwb3VyIGNvcnJpZ2VyIGxlcyBidWdzIGR1IHBhY2thZ2UgQFNNQVRDSC1EaWdpdGFsLWRldi92dWUtc3lzdGVtLWRlc2lnblxuICogXG4gKiAxLiBJbXBvcnRzIG1hbCBjb21waWxcdTAwRTlzIChALyBxdWkgcG9pbnRlIHZlcnMgbGUgc3JjIGR1IHBhY2thZ2UpXG4gKiAyLiBpY29uU2l6ZXMsIGljb25TdHJva2VXaWR0aCwgY29sb3JzIG5vbiBkXHUwMEU5ZmluaXMgZGFucyBJY29uQmFzZSAoYWxpYXMgbWFucXVhbnRzKVxuICogMy4gdXNlQXBwU3RvcmUgZm91cm5pIHZpYSBnbG9iYWxUaGlzICh2b2lyIG1haW4udHMpXG4gKiA0LiB1c2VSb3V0ZXIgYXBwZWxcdTAwRTkgaG9ycyBzZXR1cCAtPiB1dGlsaXNlciB1bygpIHBlbmRhbnQgc2V0dXBcbiAqIFxuICogTk9URTogQ2UgcGFja2FnZSBlc3QgbWFsIGNvbXBpbFx1MDBFOSBldCBuZSBkZXZyYWl0IHBhcyBcdTAwRUF0cmUgdXRpbGlzXHUwMEU5IGVuIHByb2R1Y3Rpb24uXG4gKiBDZXR0ZSBzb2x1dGlvbiBlc3QgdW4gd29ya2Fyb3VuZCB0ZW1wb3JhaXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZml4U3lzdGVtRGVzaWduSW1wb3J0cygpOiBQbHVnaW4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIG5hbWU6ICdmaXgtc3lzdGVtLWRlc2lnbi1pbXBvcnRzJyxcbiAgICAgICAgZW5mb3JjZTogJ3ByZScsXG4gICAgICAgIHJlc29sdmVJZChzb3VyY2UsIF9pbXBvcnRlcikge1xuICAgICAgICAgICAgLy8gSW50ZXJjZXB0ZXIgbCdpbXBvcnQgcHJpbmNpcGFsIGR1IHBhY2thZ2UgcG91ciBmb3JjZXIgbGUgcGF0Y2hcbiAgICAgICAgICAgIGlmIChzb3VyY2UgPT09ICdAU01BVENILURpZ2l0YWwtZGV2L3Z1ZS1zeXN0ZW0tZGVzaWduJyB8fCBzb3VyY2UgPT09ICdAU01BVENILURpZ2l0YWwtZGV2L3Z1ZS1zeXN0ZW0tZGVzaWduLycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUEFUQ0hFRF9NT0RVTEVfSUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgbG9hZChpZCkge1xuICAgICAgICAgICAgLy8gUGF0Y2hlciBsZSBidW5kbGUgcHJpbmNpcGFsIGR1IHBhY2thZ2UgKGNoYXJnXHUwMEU5IHZpYSBtb2R1bGUgdmlydHVlbClcbiAgICAgICAgICAgIGlmIChpZCA9PT0gUEFUQ0hFRF9NT0RVTEVfSUQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwa2dQYXRoID0gcmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnbm9kZV9tb2R1bGVzL0BTTUFUQ0gtRGlnaXRhbC1kZXYvdnVlLXN5c3RlbS1kZXNpZ24vZGlzdC9pbmRleC5qcycpO1xuICAgICAgICAgICAgICAgIGxldCBjb2RlID0gcmVhZEZpbGVTeW5jKHBrZ1BhdGgsICd1dGYtOCcpO1xuXG4gICAgICAgICAgICAgICAgLy8gMS4gQWxpYXMgaWNvblNpemVzIC8gaWNvblN0cm9rZVdpZHRoIC8gY29sb3JzIHBvdXIgSWNvbkJhc2UgKHJcdTAwRTlmXHUwMEU5cmVuY2VzIG51ZXMgZGFucyBsZSBidW5kbGUpXG4gICAgICAgICAgICAgICAgaWYgKGNvZGUuaW5jbHVkZXMoJ2ljb25TaXplcycpICYmICFjb2RlLmluY2x1ZGVzKCd2YXIgaWNvblNpemVzPScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpY29uQWxpYXNQYXRjaGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gdjEuMS4zMSA6IFRiL0ZiL19iICsgZnVuY3Rpb24gZ3goKSBpbnN0YWxsVGhlbWVcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGhlbWVFbmRWMTEzMSA9IC92YXJpYW50czpcXHMqV2JcXHMqXFxuXFxzKlxcfVxccypcXG5cXH07XFxzKlxcbmZ1bmN0aW9uIGd4XFwoXFwpLztcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpY29uQWxpYXNQYXRjaGVkICYmIHRoZW1lRW5kVjExMzEudGVzdChjb2RlKSAmJiBjb2RlLmluY2x1ZGVzKCdUYiBhcyBpY29uU2l6ZXMnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVtZUVuZFYxMTMxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGB2YXJpYW50czogV2JcXG4gIH1cXG59O1xcbnZhciBpY29uU2l6ZXM9VGIsaWNvblN0cm9rZVdpZHRoPUZiLGNvbG9ycz1fYjtcXG5mdW5jdGlvbiBneCgpYFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb25BbGlhc1BhdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gdjEuMS4yNisgOiBCYi9IYi9iYiBleHBvcnRcdTAwRTlzLCB0aFx1MDBFOG1lIGR4IHB1aXMgaW5zdGFsbFRoZW1lIGh4KClcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGhlbWVFbmRWMTEyNiA9IC92YXJpYW50czpcXHMqRmJcXHMqXFxuXFxzKlxcfVxccypcXG5cXH07XFxzKlxcbmZ1bmN0aW9uIGh4XFwoXFwpLztcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpY29uQWxpYXNQYXRjaGVkICYmIHRoZW1lRW5kVjExMjYudGVzdChjb2RlKSAmJiBjb2RlLmluY2x1ZGVzKCdCYiBhcyBpY29uU2l6ZXMnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVtZUVuZFYxMTI2LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGB2YXJpYW50czogRmJcXG4gIH1cXG59O1xcbnZhciBpY29uU2l6ZXM9QmIsaWNvblN0cm9rZVdpZHRoPUhiLGNvbG9ycz1iYjtcXG5mdW5jdGlvbiBoeCgpYFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb25BbGlhc1BhdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gdjEuMS4yNCA6IFBiL0JiL3liICsgZnVuY3Rpb24gZHgoKSBpbnN0YWxsXG4gICAgICAgICAgICAgICAgICAgIGlmICghaWNvbkFsaWFzUGF0Y2hlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGhlbWVFbmRWMTEyNCA9IC9cXH1cXHMqO1xccypcXG5mdW5jdGlvbiBkeFxcKFxcKS87XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhlbWVFbmRWMTEyNC50ZXN0KGNvZGUpICYmIGNvZGUuaW5jbHVkZXMoJ1BiIGFzIGljb25TaXplcycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbWVFbmRWMTEyNCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYH07XFxudmFyIGljb25TaXplcz1QYixpY29uU3Ryb2tlV2lkdGg9QmIsY29sb3JzPXliO1xcbmZ1bmN0aW9uIGR4KClgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpY29uQWxpYXNQYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIHYxLjEuMjAtaXNoIDogRWIsIHpiLCBwYiArIGZ1bmN0aW9uIGF4KClcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpY29uQWxpYXNQYXRjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0aGVtZUVuZFRoZW5JbnN0YWxsID0gL3ZhcmlhbnRzOlxccypEYlxccypcXH1cXHMqXFx9XFxzKjtcXHMqZnVuY3Rpb24gYXhcXChcXCkvO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoZW1lRW5kVGhlbkluc3RhbGwudGVzdChjb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW1lRW5kVGhlbkluc3RhbGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGB2YXJpYW50czogRGJcXG4gIH1cXG59O1xcbnZhciBpY29uU2l6ZXM9RWIsaWNvblN0cm9rZVdpZHRoPXpiLGNvbG9ycz1wYjtcXG5mdW5jdGlvbiBheCgpYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWNvbkFsaWFzUGF0Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBMZWdhY3kgOiBEeSwgenksIHZ5ICsgZnVuY3Rpb24gaWIoKVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWljb25BbGlhc1BhdGNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxlZ2FjeVNlYXJjaCA9IC9cXH07XFxzKmZ1bmN0aW9uIGliXFwoXFwpLztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsZWdhY3lTZWFyY2gudGVzdChjb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUgPSBjb2RlLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlZ2FjeVNlYXJjaCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYH07XFxudmFyIGljb25TaXplcz1EeSxpY29uU3Ryb2tlV2lkdGg9enksY29sb3JzPXZ5O1xcbmZ1bmN0aW9uIGliKClgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpY29uQWxpYXNQYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrIGdcdTAwRTluXHUwMEU5cmlxdWUgOiBzeW1ib2xlcyBtaW5pZmlcdTAwRTlzIGRlcHVpcyBsZXMgZXhwb3J0cyBub21tXHUwMEU5c1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWljb25BbGlhc1BhdGNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNpemVzRXhwb3J0ID0gY29kZS5tYXRjaCgvKFxcdyspIGFzIGljb25TaXplcy8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3Ryb2tlRXhwb3J0ID0gY29kZS5tYXRjaCgvKFxcdyspIGFzIGljb25TdHJva2VXaWR0aC8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29sb3JzRXhwb3J0ID0gY29kZS5tYXRjaCgvKFxcdyspIGFzIGNvbG9ycywvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdlbmVyaWNUaGVtZUVuZCA9IC92YXJpYW50czpcXHMqKFxcdyspXFxzKlxcblxccypcXH1cXHMqXFxuXFx9O1xccypcXG5mdW5jdGlvbiAoZ3h8aHgpXFwoXFwpLztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaXplc0V4cG9ydCAmJiBzdHJva2VFeHBvcnQgJiYgY29sb3JzRXhwb3J0ICYmIGdlbmVyaWNUaGVtZUVuZC50ZXN0KGNvZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2VuZXJpY1RoZW1lRW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoX21hdGNoLCB2YXJpYW50TmFtZSwgZm4pID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgdmFyaWFudHM6ICR7dmFyaWFudE5hbWV9XFxuICB9XFxufTtcXG52YXIgaWNvblNpemVzPSR7c2l6ZXNFeHBvcnRbMV19LGljb25TdHJva2VXaWR0aD0ke3N0cm9rZUV4cG9ydFsxXX0sY29sb3JzPSR7Y29sb3JzRXhwb3J0WzFdfTtcXG5mdW5jdGlvbiAke2ZufSgpYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyAyLiB1c2VBcHBTdG9yZSBub24gaW1wb3J0XHUwMEU5IHBhciBEYXJrTW9kZVN3aXRjaCAtIGZvdXJuaSB2aWEgZ2xvYmFsVGhpcyAobWFpbi50cylcbiAgICAgICAgICAgICAgICBpZiAoY29kZS5pbmNsdWRlcygndXNlQXBwU3RvcmUoKScpICYmICFjb2RlLmluY2x1ZGVzKCdnbG9iYWxUaGlzJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZSgvXFxidXNlQXBwU3RvcmVcXChcXCkvZywgJygodHlwZW9mIGdsb2JhbFRoaXMhPT1cInVuZGVmaW5lZFwiP2dsb2JhbFRoaXM6d2luZG93KS51c2VBcHBTdG9yZSkoKScpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIDMuIHVzZVJvdXRlciBhcHBlbFx1MDBFOSBkYW5zIG9uTW91bnRlZCAoYXN5bmMpIC0gdXRpbGlzZXIgdW8oKSBwZW5kYW50IHNldHVwXG4gICAgICAgICAgICAgICAgaWYgKGNvZGUuaW5jbHVkZXMoJ2ltcG9ydChcInZ1ZS1yb3V0ZXJcIikudGhlbicpICYmIGNvZGUuaW5jbHVkZXMoJ2cudXNlUm91dGVyKCknKSkge1xuICAgICAgICAgICAgICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKCdsZXQgcyA9IG51bGw7JywgJ2xldCBzID0gdW8oKTsnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtcGxhY2VyIGxhIGZvbmN0aW9uIGkgcGFyIHVuZSBuby1vcCAobGUgcmVnZXggYWNjZXB0ZSB2YXJpYW50ZXMgZCdlc3BhY2VzKVxuICAgICAgICAgICAgICAgICAgICBjb2RlID0gY29kZS5yZXBsYWNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgL2Z1bmN0aW9uIGlcXChcXClcXHMqXFx7XFxzKmltcG9ydFxcKFwidnVlLXJvdXRlclwiXFwpXFwudGhlblxccypcXChcXHMqXFwoZ1xcKVxccyo9PlxccypcXHtcXHMqc1xccyo9XFxzKmdcXC51c2VSb3V0ZXJcXChcXCk7XFxzKlxcfVxcKVxcLmNhdGNoXFxzKlxcKFxccypcXChcXClcXHMqPT5cXHMqXFx7XFxzKlxcfVxcKVxccyo7XFxzKlxcfS8sXG4gICAgICAgICAgICAgICAgICAgICAgICAnZnVuY3Rpb24gaSgpIHt9J1xuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIDQuIEltcG9ydCBjYXNzXHUwMEU5IEAvdXRpbHMvcm91dGVUb05hdkl0ZW1zIFx1MjE5MiBmaWNoaWVyIGZvdXJuaSBwYXIgbCdhcHAgaFx1MDBGNHRlXG4gICAgICAgICAgICAgICAgaWYgKGNvZGUuaW5jbHVkZXMoJ0AvdXRpbHMvcm91dGVUb05hdkl0ZW1zJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgICAgIC9mcm9tXFxzK1wiQFxcL3V0aWxzXFwvcm91dGVUb05hdkl0ZW1zXCIvZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdmcm9tIFwiQC91dGlscy9yb3V0ZVRvTmF2SXRlbXMudHNcIidcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyA1LiBMb2dvdXQgQXBwTGF5b3V0IDogL2xvZ2luIG4nZXhpc3RlIHBhcyBcdTIxOTIgZFx1MDBFOWxcdTAwRTlndWVyIFx1MDBFMCBfX2FwcExvZ291dCAobWFpbi50cylcbiAgICAgICAgICAgICAgICBpZiAoY29kZS5pbmNsdWRlcygncC5wdXNoKFwiL2xvZ2luXCIpJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29kZSA9IGNvZGUucmVwbGFjZShcbiAgICAgICAgICAgICAgICAgICAgICAgIC9wXFwucHVzaFxcKFwiXFwvbG9naW5cIlxcKS9nLFxuICAgICAgICAgICAgICAgICAgICAgICAgJyh0eXBlb2YgZ2xvYmFsVGhpcyE9PVwidW5kZWZpbmVkXCImJmdsb2JhbFRoaXMuX19hcHBMb2dvdXQ/Z2xvYmFsVGhpcy5fX2FwcExvZ291dCgpOnZvaWQgMCknXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgY29kZSwgbWFwOiBudWxsIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFN0dWJzIHBvdXIgaW1wb3J0cyBALyBkZXB1aXMgbGUgcGFja2FnZVxuICAgICAgICAgICAgLy8gQ2hhcmdlciBsZXMgc3R1YnMgdmlkZXMgcG91ciBsZXMgaW1wb3J0cyBpbnRlcmNlcHRcdTAwRTlzXG4gICAgICAgICAgICBpZiAoaWQuc3RhcnRzV2l0aCgnXFwwc3lzdGVtLWRlc2lnbi1zdHViOicpKSB7XG4gICAgICAgICAgICAgICAgLy8gRXh0cmFpcmUgbGUgdHlwZSBkJ2ltcG9ydCBwb3VyIHJldG91cm5lciBsZSBib24gc3R1YlxuICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsSWQgPSBpZC5yZXBsYWNlKCdcXDBzeXN0ZW0tZGVzaWduLXN0dWI6JywgJycpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFNpIGMnZXN0IHVuIHN0b3JlLCByZXRvdXJuZXIgdW4gc3RvcmUgdmlkZVxuICAgICAgICAgICAgICAgIGlmIChvcmlnaW5hbElkLmluY2x1ZGVzKCcvc3RvcmVzLycpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnZXhwb3J0IGNvbnN0IHVzZVRvYXN0U3RvcmUgPSAoKSA9PiAoeyBzaG93VG9hc3Q6ICgpID0+IHt9LCBoaWRlVG9hc3Q6ICgpID0+IHt9IH0pOyBleHBvcnQgY29uc3QgdXNlQXBwU3RvcmUgPSAoKSA9PiAoe30pOyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFNpIGMnZXN0IHVuIGNvbXBvc2FudCBWdWUsIHJldG91cm5lciB1biBjb21wb3NhbnQgdmlkZVxuICAgICAgICAgICAgICAgIGlmIChvcmlnaW5hbElkLmVuZHNXaXRoKCcudnVlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdleHBvcnQgZGVmYXVsdCB7IG5hbWU6IFwiU3R1YkNvbXBvbmVudFwiLCB0ZW1wbGF0ZTogXCI8ZGl2PjwvZGl2PlwiIH07JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gU2kgYydlc3QgdW4gdXRpbGl0YWlyZSwgcmV0b3VybmVyIGRlcyBmb25jdGlvbnMgdmlkZXNcbiAgICAgICAgICAgICAgICBpZiAob3JpZ2luYWxJZC5pbmNsdWRlcygnL3V0aWxzLycpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnZXhwb3J0IGNvbnN0IGVuc3VyZVZhbGlkQ29sb3IgPSAoYykgPT4gYzsgZXhwb3J0IGNvbnN0IGFkZENvbG9yT3BhY2l0eSA9IChjLCBvKSA9PiBjOyBleHBvcnQgY29uc3QgZW5zdXJlVmFsaWRDb2xvcnMgPSAoYykgPT4gYzsnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBTaSBjJ2VzdCB1biB0aFx1MDBFOG1lLCByZXRvdXJuZXIgZGVzIHZhbGV1cnMgcGFyIGRcdTAwRTlmYXV0XG4gICAgICAgICAgICAgICAgaWYgKG9yaWdpbmFsSWQuaW5jbHVkZXMoJy90aGVtZS8nKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3JpZ2luYWxJZC5pbmNsdWRlcygnL2ljb25zJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnZXhwb3J0IGNvbnN0IGljb25TaXplcyA9IHt9OyBleHBvcnQgY29uc3QgaWNvblN0cm9rZVdpZHRoID0ge307JztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAob3JpZ2luYWxJZC5pbmNsdWRlcygnL2NvbG9ycycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ2V4cG9ydCBjb25zdCBjb2xvcnMgPSB7fTsnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFNpIGMnZXN0IHVuIGNvbXBvc2FudCBiYXNlLCByZXRvdXJuZXIgdW4gY29tcG9zYW50IHZpZGVcbiAgICAgICAgICAgICAgICBpZiAob3JpZ2luYWxJZC5pbmNsdWRlcygnL2NvbXBvbmVudHMvYmFzZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnZXhwb3J0IGRlZmF1bHQgeyBuYW1lOiBcIlN0dWJDb21wb25lbnRcIiwgdGVtcGxhdGU6IFwiPGRpdj48L2Rpdj5cIiB9Oyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIFBhciBkXHUwMEU5ZmF1dCwgcmV0b3VybmVyIHVuIG1vZHVsZSB2aWRlXG4gICAgICAgICAgICAgICAgcmV0dXJuICdleHBvcnQgZGVmYXVsdCB7fTsnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4WixTQUFTLG9CQUFvQjtBQUMzYixPQUFPLFNBQVM7QUFDaEIsT0FBTyxVQUFVOzs7QUNEakIsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxlQUFlO0FBRXhCLElBQU0sb0JBQW9CO0FBYW5CLFNBQVMseUJBQWlDO0FBQzdDLFNBQU87QUFBQSxJQUNILE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxJQUNULFVBQVUsUUFBUSxXQUFXO0FBRXpCLFVBQUksV0FBVywyQ0FBMkMsV0FBVywwQ0FBMEM7QUFDM0csZUFBTztBQUFBLE1BQ1g7QUFDQSxhQUFPO0FBQUEsSUFDWDtBQUFBLElBQ0EsS0FBSyxJQUFJO0FBRUwsVUFBSSxPQUFPLG1CQUFtQjtBQUMxQixjQUFNLFVBQVUsUUFBUSxRQUFRLElBQUksR0FBRyxrRUFBa0U7QUFDekcsWUFBSSxPQUFPLGFBQWEsU0FBUyxPQUFPO0FBR3hDLFlBQUksS0FBSyxTQUFTLFdBQVcsS0FBSyxDQUFDLEtBQUssU0FBUyxnQkFBZ0IsR0FBRztBQUNoRSxjQUFJLG1CQUFt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
