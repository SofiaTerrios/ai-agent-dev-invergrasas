import path from 'path';

// Where generated movimiento PDFs are stored (like CERTIFICADOS_DIR). Not
// versioned in git; in production point MOVIMIENTOS_DIR to a persistent volume.
export function movimientosDir() {
  return (
    process.env.MOVIMIENTOS_DIR ??
    path.join(process.cwd(), 'static', 'movimientos')
  );
}
