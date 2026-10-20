import path from 'path';

// Where generated certificado PDFs are stored. Not versioned in git; in
// production point CERTIFICADOS_DIR to a persistent volume.
export function certificadosDir() {
  return (
    process.env.CERTIFICADOS_DIR ??
    path.join(process.cwd(), 'static', 'certificados')
  );
}
