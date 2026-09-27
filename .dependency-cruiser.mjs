// The only modules each module is allowed to depend on (via their public index.ts).
// Add a module here and this file automatically forbids everything not listed.
const allowedModuleDeps = {
  'bash-parser': [],
  core: ['bash-parser'],
  'rule-packs': ['core'],
};

const moduleNames = Object.keys(allowedModuleDeps);

const moduleBoundaryRules = moduleNames.flatMap((mod) => {
  const allowed = allowedModuleDeps[mod];
  const forbiddenModules = moduleNames.filter((m) => m !== mod && !allowed.includes(m));

  const rules = [
    {
      // Even for allowed modules, only their index.ts (public API) may be imported.
      name: `${mod}-must-use-public-api-of-other-modules`,
      severity: 'error',
      comment: `src/${mod} may only import other modules through their index.ts`,
      from: { path: `^src/${mod}/` },
      to: { path: `^src/(?!${mod}/)[^/]+/(?!index\\.ts$).+$` },
    },
  ];

  if (forbiddenModules.length > 0) {
    rules.push({
      name: `${mod}-can-only-depend-on-allowed-modules`,
      severity: 'error',
      comment: `src/${mod} may only depend on: ${allowed.join(', ') || '(nothing)'}`,
      from: { path: `^src/${mod}/` },
      to: { path: `^src/(${forbiddenModules.join('|')})/` },
    });
  }

  return rules;
});

/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'This dependency is part of a circular relationship.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: "This is an orphan module - it's likely not used (anymore?).",
      from: {
        orphan: true,
        pathNot: ['index\\.ts$'],
      },
      to: {},
    },
    ...moduleBoundaryRules,
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
