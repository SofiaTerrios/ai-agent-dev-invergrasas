Crea una landing page completa en Next.js y tailwind, tsx, para Invergrasas, empresa colombiana distribuidora de aceites y grasas comestibles (oleína de palma, RBD, aceites refinados).

HERO: Fondo con imagen de textura de aceite o gradiente dorado/verde oscuro como fallback. Imagen PNG sin fondo de un envase de aceite flotando con efecto float suave (keyframes, 8px arriba/abajo, 4s infinito). Slogan grande: "Lo que mueve la industria, lo mueve Invergrasas". CTA doble: "Conoce nuestros productos" y "Contáctanos".

QUIÉNES SOMOS / MISIÓN / VISIÓN: Sección de 3 tarjetas en columnas. Quiénes Somos (texto breve empresa), Misión (calidad y cadena de suministro), Visión (liderar el mercado colombiano de aceites industriales). Fondo blanco, bordes sutiles, icono superior por tarjeta.

CUALIDADES: Grilla de 4 ítems animados con scroll: 100% Natural, Certificado INVIMA, Entrega puntual, Documentación digital automatizada. Animación fadeInUp con stagger 100ms por ítem usando Intersection Observer.

PRODUCTOS (sección clave): 2 tarjetas: Oleína de Palma y Aceite RBD. Al entrar al viewport, cada tarjeta entra desde la esquina opuesta: oleína desde abajo-izquierda, RBD desde abajo-derecha. Usar transform: translate(-80px, 80px) → neutral con transition: transform 0.7s ease, opacity 0.7s ease. Cada tarjeta: imagen del producto sin fondo, nombre, descripción técnica breve, botón "Ver ficha técnica". Fondo sección: crema o verde muy claro.

Verde principal — el arco y la hoja: #1A8A3A / #0F6E2E
Dorado/Amarillo — letras "INVERGRASAS" y la gota de aceite: #D4A017 / #C8880A
Naranja/Ámbar — degradado inferior de la gota: #C86010 / #A84800
Gris oscuro — texto "Compra y venta de grasas animales y vegetales": #3A3A3A
Blanco — fondo: #FFFFFF
TIPOGRAFÍA: Playfair Display (headings) + DM Sans (body) de Google Fonts.
FOOTER: Logo, links, contacto. Fondo #1B4D1E texto blanco.

Todas las animaciones de scroll via Intersection Observer con clase .visible. Código en un solo archivo HTML.