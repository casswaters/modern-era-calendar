/* Captain's Log v38: Aretoria lives at its own site (https://casswaters.github.io/aretoria/).
   This stub only catches tabs still running an older Captain's Log that imports the old embedded
   module: opening Aretoria sends the visitor to the standalone site instead of failing. */
export const STANDALONE = 'https://casswaters.github.io/aretoria/';
export function openAretoria() { location.assign(STANDALONE); }
