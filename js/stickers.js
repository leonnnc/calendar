/* ============================================================
   stickers.js — set de stickers ilustrados (SVG propio)
   Estilo: acuarela suave con contornos mínimos, como los
   imanes del calendario de referencia.
   Formato compacto: [id, nombre, categoria, palabrasClave, svg]
   ============================================================ */

const V = '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';

const D = [

/* ---------- Fiesta ---------- */
['cake','Torta de cumpleaños','Fiesta',['torta','pastel','cumpleanos','cumple','birthday','cake','vela','fiesta'],
 V + '<ellipse cx="24" cy="42.5" rx="16" ry="2.6" fill="#e6ded4"/>'
   + '<path d="M8 24h32v12.5a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="#f3d3a3"/>'
   + '<path d="M8 24c0-3.6 3.6-6 8-6s8 2.4 8 2.4S27.6 18 32 18s8 2.4 8 6z" fill="#f7a8c0"/>'
   + '<path d="M8 29.5h32" stroke="#dbb47f" stroke-width="1.3"/>'
   + '<rect x="22.4" y="8" width="3.2" height="9" rx="1.6" fill="#e04a3f"/>'
   + '<path d="M24 4.4c1.7 1.7 1.7 3.4 0 4.6-1.7-1.2-1.7-2.9 0-4.6z" fill="#f2c94c"/>'
   + '<circle cx="15" cy="27" r="1.6" fill="#ffffff"/>'
   + '<circle cx="33" cy="34" r="1.6" fill="#f7a8c0"/>'
   + '</svg>'],

['gift','Regalo','Fiesta',['regalo','gift','presente','caja','navidad','cumpleanos','sorpresa'],
 V + '<rect x="8" y="18" width="32" height="22" rx="3" fill="#e05d4f"/>'
   + '<rect x="5" y="13" width="38" height="8" rx="3" fill="#ee7a6a"/>'
   + '<rect x="20.5" y="13" width="7" height="27" fill="#f2c94c"/>'
   + '<path d="M24 13c-4-6-10-6-10-2.6S17 13 24 13z" fill="#f6e3c5"/>'
   + '<path d="M24 13c4-6 10-6 10-2.6S31 13 24 13z" fill="#f6e3c5"/>'
   + '</svg>'],

['balloons','Globos','Fiesta',['globo','globos','balloon','fiesta','cumpleanos','aire'],
 V + '<path d="M18 8c4 0 7 3.2 7 7.2 0 4.6-3.2 8.8-7 8.8s-7-4.2-7-8.8C11 11.2 14 8 18 8z" fill="#f7a8c0"/>'
   + '<path d="M18 24.6l1.7 2.2h-3.4z" fill="#d1718f"/>'
   + '<path d="M18 27c0 3-2 4.6-2 7.4" stroke="#c9c2b6" stroke-width="1.2" fill="none"/>'
   + '<path d="M31 12c3.4 0 6 2.8 6 6.2 0 4-2.8 7.6-6 7.6s-6-3.6-6-7.6c0-3.4 2.6-6.2 6-6.2z" fill="#7fb3e0"/>'
   + '<path d="M31 26.4l1.5 2h-3z" fill="#3f7fb5"/>'
   + '<path d="M31 28.4c0 2.8 2 4.2 2 7" stroke="#c9c2b6" stroke-width="1.2" fill="none"/>'
   + '</svg>'],

['party-hat','Gorro de fiesta','Fiesta',['gorro','cono','fiesta','party','cumpleanos','sombrero'],
 V + '<path d="M24 7l11.5 30H12.5z" fill="#f2c94c"/>'
   + '<path d="M17.5 24.5h13l2.4 6.5H15.1z" fill="#e05d4f"/>'
   + '<path d="M14.6 33h18.8l1.2 4H13.4z" fill="#5aa877"/>'
   + '<circle cx="24" cy="6" r="3" fill="#e04a3f"/>'
   + '</svg>'],

['fireworks','Fuegos artificiales','Fiesta',['fuegos','artificiales','fiesta','fireworks','celebracion','ano nuevo'],
 V + '<g stroke="#e0a63f" stroke-width="2" stroke-linecap="round">'
   + '<path d="M24 20V8"/><path d="M24 20v12"/><path d="M24 20H12"/><path d="M24 20h12"/>'
   + '<path d="M15.5 11.5L20 16"/><path d="M32.5 11.5L28 16"/><path d="M15.5 28.5L20 24"/><path d="M32.5 28.5L28 24"/>'
   + '</g>'
   + '<circle cx="24" cy="20" r="3.4" fill="#f2c94c"/>'
   + '<g fill="#e04a3f"><circle cx="24" cy="5.5" r="2.2"/><circle cx="24" cy="34.5" r="2.2"/>'
   + '<circle cx="9.5" cy="20" r="2.2"/><circle cx="38.5" cy="20" r="2.2"/>'
   + '<circle cx="13" cy="9" r="1.9"/><circle cx="35" cy="9" r="1.9"/>'
   + '<circle cx="13" cy="31" r="1.9"/><circle cx="35" cy="31" r="1.9"/></g>'
   + '</svg>'],

['confetti','Confeti','Fiesta',['confeti','fiesta','celebracion','party','papelillos'],
 V + '<g stroke-width="2.4" stroke-linecap="round" fill="none">'
   + '<path d="M12 12l4 3" stroke="#e04a3f"/><path d="M34 10l3 4" stroke="#5aa877"/>'
   + '<path d="M37 26l4 1" stroke="#f2c94c"/><path d="M10 28l4-2" stroke="#7fb3e0"/>'
   + '<path d="M22 6l1 4" stroke="#b39ddb"/><path d="M40 38l-2 3" stroke="#e08a3f"/></g>'
   + '<g fill="#e05d4f"><circle cx="20" cy="18" r="2"/><circle cx="30" cy="30" r="2"/></g>'
   + '<g fill="#5aa877"><circle cx="28" cy="14" r="2"/><circle cx="16" cy="34" r="2"/></g>'
   + '<g fill="#f2c94c"><circle cx="36" cy="18" r="2"/><circle cx="24" cy="40" r="2"/></g>'
   + '</svg>'],

['candle','Vela','Fiesta',['vela','candle','luz','cumpleanos','llama'],
 V + '<rect x="19" y="20" width="10" height="19" rx="3" fill="#f6e3c5" stroke="#d9bc8f" stroke-width="1.3"/>'
   + '<path d="M24 6c3 3.4 3 6.4 0 8.6-3-2.2-3-5.2 0-8.6z" fill="#f2c94c"/>'
   + '<path d="M24 9.5c1.5 1.7 1.5 3.2 0 4.3-1.5-1.1-1.5-2.6 0-4.3z" fill="#ffffff" opacity=".7"/>'
   + '<rect x="19" y="26" width="10" height="3" fill="#f7a8c0" opacity=".85"/>'
   + '<path d="M15 40h18" stroke="#d9bc8f" stroke-width="2" stroke-linecap="round"/>'
   + '</svg>'],

['cheers','Brindis','Fiesta',['brindis','copa','champan','vino','celebrar','cheers','toast'],
 V + '<path d="M14 10h12l-1.6 9.5a4.4 4.4 0 0 1-8.8 0z" fill="#f2c94c"/>'
   + '<path d="M14 10h12l-.4 2.4H14.7z" fill="#ffffff" opacity=".5"/>'
   + '<path d="M20 24v10" stroke="#c99a5b" stroke-width="2"/>'
   + '<path d="M15.5 36h9" stroke="#c99a5b" stroke-width="2.4" stroke-linecap="round"/>'
   + '<path d="M31 14h10l-1.4 8a3.8 3.8 0 0 1-7.2 0z" fill="#7fb3e0"/>'
   + '<path d="M36 26v8" stroke="#c99a5b" stroke-width="2"/>'
   + '<path d="M32 36h8" stroke="#c99a5b" stroke-width="2.4" stroke-linecap="round"/>'
   + '<g fill="#ffffff" opacity=".9"><circle cx="22" cy="6" r="1.6"/><circle cx="27" cy="3.5" r="1.3"/><circle cx="17.5" cy="3.8" r="1.2"/></g>'
   + '</svg>'],

/* ---------- Comida ---------- */
['coffee','Café','Comida',['cafe','taza','coffee','desayuno','infusion','caliente'],
 V + '<ellipse cx="22" cy="40.5" rx="12" ry="2.4" fill="#e6ded4"/>'
   + '<path d="M11 14h22v12a9 9 0 0 1-9 9h-4a9 9 0 0 1-9-9z" fill="#f6e3c5" stroke="#c99a5b" stroke-width="1.4"/>'
   + '<path d="M33 17h3.5a4.5 4.5 0 0 1 0 9H33" fill="none" stroke="#c99a5b" stroke-width="2"/>'
   + '<path d="M11 19h22v3H11z" fill="#c99a5b" opacity=".5"/>'
   + '<g stroke="#c9c2b6" stroke-width="1.8" fill="none" stroke-linecap="round"><path d="M18 11c0-2 2-2 2-4"/><path d="M24 11c0-2 2-2 2-4"/></g>'
   + '</svg>'],

['pizza','Pizza','Comida',['pizza','porcion','italiana','cena','comida'],
 V + '<path d="M24 7l15.5 30a31 31 0 0 1-31 0z" fill="#f2c94c"/>'
   + '<path d="M24 7l15.5 30a32 32 0 0 1-13 3.6z" fill="#f6d9a8"/>'
   + '<circle cx="24" cy="24" r="3" fill="#e04a3f"/>'
   + '<circle cx="17.5" cy="31" r="2.4" fill="#e04a3f"/>'
   + '<circle cx="30" cy="33" r="2.2" fill="#e04a3f"/>'
   + '<circle cx="25" cy="35" r="1.8" fill="#5aa877"/>'
   + '<circle cx="20" cy="20" r="1.7" fill="#5aa877"/>'
   + '</svg>'],

['icecream','Helado','Comida',['helado','cono','ice cream','postre','verano'],
 V + '<path d="M15 22h18l-7.8 20a1.3 1.3 0 0 1-2.4 0z" fill="#e0b184"/>'
   + '<path d="M18.6 22l5.4 14M29.4 22L24 36" stroke="#c99a5b" stroke-width="1.2"/>'
   + '<circle cx="24" cy="16" r="9.5" fill="#f7a8c0"/>'
   + '<circle cx="17" cy="19" r="6" fill="#f6e3c5"/>'
   + '<circle cx="31" cy="19" r="6" fill="#a7d8a0"/>'
   + '<circle cx="24" cy="8.5" r="3.2" fill="#e04a3f"/>'
   + '</svg>'],

['burger','Hamburguesa','Comida',['hamburguesa','burger','comida','almuerzo','pan'],
 V + '<path d="M9 18c0-6 6.7-10 15-10s15 4 15 10z" fill="#e0a63f"/>'
   + '<g fill="#ffffff" opacity=".7"><circle cx="17" cy="14" r="1.1"/><circle cx="24" cy="12.5" r="1.1"/><circle cx="31" cy="14" r="1.1"/></g>'
   + '<rect x="9" y="18" width="30" height="4" rx="2" fill="#5aa877"/>'
   + '<rect x="9" y="22" width="30" height="5" rx="2" fill="#8d6432"/>'
   + '<path d="M9 27h30v3.5c0 3-3 5.5-6 5.5H15c-3 0-6-2.5-6-5.5z" fill="#e0a63f"/>'
   + '</svg>'],

['donut','Dona','Comida',['dona','donut','rosquilla','postre','desayuno'],
 V + '<circle cx="24" cy="24" r="16.5" fill="#e0b184"/>'
   + '<circle cx="24" cy="24" r="13.6" fill="#f7a8c0"/>'
   + '<circle cx="24" cy="24" r="4.6" fill="#ffffff"/>'
   + '<g stroke-width="2" stroke-linecap="round" fill="none">'
   + '<path d="M18 15.5l4 2" stroke="#ffffff"/><path d="M31 20l3 3" stroke="#f2c94c"/>'
   + '<path d="M14 27l4 1" stroke="#5aa877"/><path d="M28 32.5l4-2" stroke="#ffffff"/></g>'
   + '<circle cx="24" cy="24" r="17.6" fill="none" stroke="#c99a5b" stroke-width="1.1" opacity=".45"/>'
   + '</svg>'],

['cupcake','Magdalena','Comida',['magdalena','cupcake','muffin','postre','cumpleanos'],
 V + '<path d="M13 22h22l-3 16a3 3 0 0 1-3 2.6H19a3 3 0 0 1-3-2.6z" fill="#f2c94c"/>'
   + '<path d="M13 26h22M14.5 31h19.5" stroke="#d9a72c" stroke-width="1.1" opacity=".7"/>'
   + '<path d="M24 6c6 0 10 4 10 8.5 0 4.2-4.4 7.5-10 7.5s-10-3.3-10-7.5C14 10 18 6 24 6z" fill="#f7a8c0"/>'
   + '<circle cx="24" cy="6" r="3" fill="#e04a3f"/>'
   + '<path d="M13 22h22" stroke="#d9a72c" stroke-width="1.4"/>'
   + '</svg>'],

['sushi','Sushi','Comida',['sushi','japonesa','arroz','rollo','comida'],
 V + '<path d="M7 40.5h34" stroke="#8d6432" stroke-width="2.6" stroke-linecap="round"/>'
   + '<rect x="10" y="16" width="28" height="18" rx="9" fill="#f6e3c5" stroke="#c9c2b6" stroke-width="1.3"/>'
   + '<rect x="15.5" y="16" width="17" height="18" fill="#e04a3f" opacity=".75"/>'
   + '<circle cx="24" cy="25" r="4.2" fill="#f7f2e8"/>'
   + '<path d="M8 12l6-3M40 12l-6-3" stroke="#8d6432" stroke-width="2" stroke-linecap="round"/>'
   + '</svg>'],

['apple','Manzana','Comida',['manzana','fruta','apple','salud','snack'],
 V + '<path d="M24 15c-2-5-7-7-11-4.6C8.6 13 8 18.5 10.6 24.4 13 29.7 18.6 36 24 39c5.4-3 11-9.3 13.4-14.6C40 18.5 39.4 13 34.6 10.4 30.6 8 26 10 24 15z" fill="#e04a3f"/>'
   + '<ellipse cx="17" cy="22" rx="2.8" ry="4.6" fill="#ffffff" opacity=".28"/>'
   + '<path d="M24 14.5c-.6-4.4.8-8 4.6-9.6-.3 4.6-2 7.8-4.6 9.6z" fill="#5aa877"/>'
   + '<path d="M24 15v-4.5" stroke="#8d6432" stroke-width="1.8" stroke-linecap="round"/>'
   + '</svg>'],

['gingerbread','Galleta de jengibre','Comida',['galleta','jengibre','navidad','dulce','hombrecito','cookie'],
 V + '<g fill="#c98a4b" stroke="#a06a34" stroke-width="1.2" stroke-linejoin="round">'
   + '<circle cx="24" cy="13" r="7"/>'
   + '<rect x="17.5" y="19" width="13" height="14" rx="5"/>'
   + '<path d="M17 23l-8-3 2-5 8.5 3z"/><path d="M31 23l8-3-2-5-8.5 3z"/>'
   + '<path d="M20.5 32l-3 9h5l2-7z"/><path d="M27.5 32l3 9h-5l-2-7z"/>'
   + '</g>'
   + '<g fill="#ffffff"><circle cx="21.5" cy="12" r="1.3"/><circle cx="26.5" cy="12" r="1.3"/></g>'
   + '<path d="M21.5 16c1.6 1.6 3.4 1.6 5 0" stroke="#ffffff" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
   + '<g fill="#e04a3f"><circle cx="24" cy="23" r="1.5"/><circle cx="24" cy="28" r="1.5"/></g>'
   + '</svg>'],

['wine','Copa de vino','Comida',['vino','copa','tinto','brindis','wine','cena'],
 V + '<path d="M17 10h14l-1.6 10.5a5.6 5.6 0 0 1-10.8 0z" fill="#c0392b"/>'
   + '<path d="M17 10h14l-.5 3.5H17.5z" fill="#e05d4f"/>'
   + '<path d="M24 26v10" stroke="#c99a5b" stroke-width="2"/>'
   + '<path d="M19 36h10" stroke="#c99a5b" stroke-width="2.4" stroke-linecap="round"/>'
   + '</svg>'],

/* ---------- Mascotas ---------- */
['dog','Perro','Mascotas',['perro','dog','mascota','paseo','cachorro','animal'],
 V + '<path d="M12 18c-2-6-1-11 2-12s6 3 6.5 8z" fill="#c98a4b"/>'
   + '<path d="M36 18c2-6 1-11-2-12s-6 3-6.5 8z" fill="#c98a4b"/>'
   + '<path d="M13 20c0-6 5-11 11-11s11 5 11 11v7c0 6-5 11-11 11s-11-5-11-11z" fill="#e0b184"/>'
   + '<g fill="#3d2b1f"><circle cx="19.5" cy="24" r="1.9"/><circle cx="28.5" cy="24" r="1.9"/></g>'
   + '<path d="M24 28c1.9 0 3.2 1 3.2 2.3 0 1.3-1.5 2.1-3.2 2.1s-3.2-.8-3.2-2.1c0-1.3 1.3-2.3 3.2-2.3z" fill="#8d6432"/>'
   + '<path d="M24 32.4v2.8" stroke="#8d6432" stroke-width="1.4" stroke-linecap="round"/>'
   + '<path d="M21.4 36.6c1.5 1.5 3.7 1.5 5.2 0" stroke="#8d6432" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
   + '<path d="M16 34.5c1.4 1.6 3.4 1.6 4.8 0" stroke="#c98a4b" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
   + '</svg>'],

['cat','Gato','Mascotas',['gato','cat','mascota','minino','animal','bigotes'],
 V + '<path d="M11 16l-2-9 9 4z" fill="#f0b878"/>'
   + '<path d="M37 16l2-9-9 4z" fill="#f0b878"/>'
   + '<path d="M13.6 14.4l-1.2-5.6 5.4 2.4z" fill="#f7cfa2"/>'
   + '<path d="M34.4 14.4l1.2-5.6-5.4 2.4z" fill="#f7cfa2"/>'
   + '<path d="M11 21c0-7 6-12 13-12s13 5 13 12v5c0 7-6 12-13 12S11 33 11 26z" fill="#f0b878"/>'
   + '<g fill="#4a6b3f"><ellipse cx="19.5" cy="24" rx="1.6" ry="2.4"/><ellipse cx="28.5" cy="24" rx="1.6" ry="2.4"/></g>'
   + '<path d="M24 28.6l1.8 1.6-1.8 1.4-1.8-1.4z" fill="#e08a8a"/>'
   + '<path d="M24 31.6c0 1.7-1.6 2.5-2.9 2.1M24 31.6c0 1.7 1.6 2.5 2.9 2.1" stroke="#8d6432" stroke-width="1.3" fill="none" stroke-linecap="round"/>'
   + '<g stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"><path d="M9.5 26.5H5"/><path d="M9.5 30.5l-4 1.6"/><path d="M38.5 26.5H43"/><path d="M38.5 30.5l4 1.6"/></g>'
   + '</svg>'],

['bone','Hueso','Mascotas',['hueso','bone','perro','premio','juguete'],
 V + '<g fill="#e8d4b0"><rect x="14" y="22.5" width="20" height="7" rx="3.5"/>'
   + '<circle cx="14.5" cy="22.5" r="4.6"/><circle cx="14.5" cy="29.5" r="4.6"/>'
   + '<circle cx="33.5" cy="22.5" r="4.6"/><circle cx="33.5" cy="29.5" r="4.6"/></g>'
   + '<g fill="#f8ecd6" transform="translate(0,-1.6)"><rect x="14" y="21.5" width="20" height="7" rx="3.5"/>'
   + '<circle cx="14.5" cy="21.5" r="4.6"/><circle cx="14.5" cy="28.5" r="4.6"/>'
   + '<circle cx="33.5" cy="21.5" r="4.6"/><circle cx="33.5" cy="28.5" r="4.6"/></g>'
   + '</svg>'],

['paw','Huella','Mascotas',['huella','paw','mascota','perro','gato','animal'],
 V + '<g fill="#c98a4b"><ellipse cx="16" cy="17" rx="4" ry="5"/><ellipse cx="32" cy="17" rx="4" ry="5"/>'
   + '<ellipse cx="10.5" cy="26" rx="3.4" ry="4.2"/><ellipse cx="37.5" cy="26" rx="3.4" ry="4.2"/>'
   + '<path d="M24 26c5 0 9 4 9 8 0 4.4-5.4 6.4-9 3.4-3.6 3-9 1-9-3.4 0-4 4-8 9-8z"/></g>'
   + '<g fill="#e0b184" opacity=".65"><ellipse cx="16" cy="16" rx="2.4" ry="3.2"/><ellipse cx="32" cy="16" rx="2.4" ry="3.2"/></g>'
   + '</svg>'],

['fish','Pez','Mascotas',['pez','fish','mascota','acuario','pecera'],
 V + '<ellipse cx="23" cy="24" rx="14" ry="9" fill="#7fb3e0"/>'
   + '<path d="M36 24l9-7v14z" fill="#5a96cc"/>'
   + '<circle cx="14" cy="22" r="1.9" fill="#2a342e"/>'
   + '<path d="M20 16.5c2 2 2 13 0 15" stroke="#5a96cc" stroke-width="1.6" fill="none"/>'
   + '<ellipse cx="29" cy="20" rx="2.6" ry="1.8" fill="#c5e0f2" opacity=".8"/>'
   + '</svg>'],

['cat-food','Comida de gatos','Mascotas',['gato','comida','plato','pet food','mascota','lata'],
 V + '<ellipse cx="24" cy="38" rx="14" ry="4" fill="#e6ded4"/>'
   + '<path d="M10 26h28a14 14 0 0 1-14 12 14 14 0 0 1-14-12z" fill="#7fb3e0"/>'
   + '<path d="M10 26h28" stroke="#5a96cc" stroke-width="1.8"/>'
   + '<g fill="#e05d4f"><circle cx="19" cy="31" r="2.4"/><circle cx="28" cy="32" r="2"/><circle cx="24" cy="28" r="1.8"/></g>'
   + '<g stroke="#c9c2b6" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="M31 22c0-2 2-2 2-4"/><path d="M36 22c0-2 2-2 2-4"/></g>'
   + '</svg>'],

['bird','Pájaro','Mascotas',['pajaro','ave','bird','mascota','cantar'],
 V + '<path d="M30 22c6 0 10 3 12 7-5 1.4-10 .6-13-2z" fill="#e0a63f"/>'
   + '<ellipse cx="23" cy="26" rx="12" ry="10" fill="#f2c94c"/>'
   + '<circle cx="17" cy="17" r="7.5" fill="#f6d96b"/>'
   + '<circle cx="15" cy="16" r="1.8" fill="#2a342e"/>'
   + '<path d="M10.5 19l-5 2 5 2z" fill="#e08a3f"/>'
   + '<path d="M22 35l-2 6M28 35l2 6" stroke="#e08a3f" stroke-width="2" stroke-linecap="round"/>'
   + '<path d="M18 24c3 4 8 4 11 0" stroke="#d9a72c" stroke-width="1.4" fill="none"/>'
   + '</svg>'],

['rabbit','Conejo','Mascotas',['conejo','rabbit','liebre','mascota','pascua'],
 V + '<ellipse cx="19" cy="12" rx="4" ry="10" fill="#e6e1d8"/>'
   + '<ellipse cx="29" cy="12" rx="4" ry="10" fill="#e6e1d8"/>'
   + '<ellipse cx="19" cy="12" rx="2" ry="6.6" fill="#f2c0c8"/>'
   + '<ellipse cx="29" cy="12" rx="2" ry="6.6" fill="#f2c0c8"/>'
   + '<ellipse cx="24" cy="31" rx="12" ry="11" fill="#e6e1d8"/>'
   + '<g fill="#4a4a4a"><circle cx="20" cy="29" r="1.8"/><circle cx="28" cy="29" r="1.8"/></g>'
   + '<path d="M24 33l1.7 1.5L24 36l-1.7-1.5z" fill="#e08a8a"/>'
   + '<g stroke="#c9c2b6" stroke-width="1.3" stroke-linecap="round"><path d="M9.5 31H5"/><path d="M9.5 34l-4 1.6"/><path d="M38.5 31H43"/><path d="M38.5 34l4 1.6"/></g>'
   + '</svg>'],

/* ---------- Naturaleza ---------- */
['sun','Sol','Naturaleza',['sol','sun','verano','dia','clima','feliz'],
 V + '<g stroke="#f2c94c" stroke-width="2.6" stroke-linecap="round">'
   + '<path d="M24 4v6"/><path d="M24 38v6"/><path d="M4 24h6"/><path d="M38 24h6"/>'
   + '<path d="M9.5 9.5l4.2 4.2"/><path d="M34.3 34.3l4.2 4.2"/><path d="M38.5 9.5l-4.2 4.2"/><path d="M13.7 34.3l-4.2 4.2"/></g>'
   + '<circle cx="24" cy="24" r="11" fill="#f6d33f"/>'
   + '<g fill="#8a6b1f"><circle cx="20" cy="22" r="1.7"/><circle cx="28" cy="22" r="1.7"/></g>'
   + '<path d="M19 27c3 3 7 3 10 0" stroke="#8a6b1f" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
   + '<g fill="#e08a8a" opacity=".6"><circle cx="16.5" cy="26" r="1.8"/><circle cx="31.5" cy="26" r="1.8"/></g>'
   + '</svg>'],

['moon','Luna','Naturaleza',['luna','moon','noche','dormir','estrellas'],
 V + '<path d="M28 7a17.5 17.5 0 1 0 13 28.5A18.5 18.5 0 0 1 28 7z" fill="#f6d96b"/>'
   + '<g fill="#f2c94c"><path d="M37 9l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4z"/>'
   + '<path d="M41 20l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1z"/></g>'
   + '</svg>'],

['star','Estrella','Naturaleza',['estrella','star','favorito','importante','brilla'],
 V + '<path d="M24 5l5.6 11.6 12.4 1.8-9 8.8 2.2 12.4L24 33.8 12.8 39.6 15 27.2 6 18.4l12.4-1.8z" fill="#f6d33f" stroke="#e0b52c" stroke-width="1.4"/>'
   + '<path d="M24 10l3.8 7.9 8.4 1.2-6.1 6 1.5 8.4L24 29.7z" fill="#ffffff" opacity=".28"/>'
   + '</svg>'],

['flower','Flor','Naturaleza',['flor','flower','planta','primavera','regalo','jardin'],
 V + '<g fill="#f7a8c0"><circle cx="24" cy="13" r="6.5"/><circle cx="35" cy="21" r="6.5"/>'
   + '<circle cx="31" cy="34" r="6.5"/><circle cx="17" cy="34" r="6.5"/><circle cx="13" cy="21" r="6.5"/></g>'
   + '<circle cx="24" cy="24" r="5.2" fill="#f2c94c"/>'
   + '<g fill="#ffd9e3" opacity=".8"><circle cx="23.5" cy="10.5" r="2.4"/><circle cx="33" cy="18.5" r="2.4"/></g>'
   + '</svg>'],

['leaf','Hoja','Naturaleza',['hoja','planta','verde','eco','jardin','nature'],
 V + '<path d="M24 6c10 8 15 16 15 24a15 15 0 0 1-30 0c0-8 5-16 15-24z" fill="#5aa877"/>'
   + '<path d="M24 8v34" stroke="#2e7d4f" stroke-width="1.7"/>'
   + '<g stroke="#2e7d4f" stroke-width="1.2" opacity=".55" fill="none">'
   + '<path d="M24 18l8-4"/><path d="M24 26l9-3"/><path d="M24 34l9-2"/>'
   + '<path d="M24 18l-8-4"/><path d="M24 26l-9-3"/><path d="M24 34l-9-2"/></g>'
   + '</svg>'],

['tree','Árbol','Naturaleza',['arbol','tree','pino','bosque','verde','navidad'],
 V + '<rect x="21" y="30" width="6" height="14" rx="2.4" fill="#8d6432"/>'
   + '<path d="M24 5l11 14h-6l8 10h-9l6 8H14l6-8H11l8-10h-6z" fill="#2e7d4f"/>'
   + '<path d="M24 8l8 11h-4l6 8h-5" fill="#5aa877" opacity=".45"/>'
   + '</svg>'],

['rainbow','Arcoíris','Naturaleza',['arcoiris','rainbow','color','buena suerte','clima'],
 V + '<g fill="none" stroke-width="4" stroke-linecap="round">'
   + '<path d="M6 36a18 18 0 0 1 36 0" stroke="#e05d4f"/>'
   + '<path d="M11 36a13 13 0 0 1 26 0" stroke="#e0a63f"/>'
   + '<path d="M16 36a8 8 0 0 1 16 0" stroke="#5aa877"/>'
   + '<path d="M21 36a3 3 0 0 1 6 0" stroke="#7fb3e0"/></g>'
   + '<g fill="#ffffff" opacity=".85"><ellipse cx="7" cy="39" rx="5" ry="3.4"/><ellipse cx="41" cy="39" rx="5" ry="3.4"/></g>'
   + '</svg>'],

['cloud','Nube','Naturaleza',['nube','cloud','nublado','clima','cielo'],
 V + '<path d="M13 33a8.5 8.5 0 0 1 1-16.9 11 11 0 0 1 20.6-2.4A8.6 8.6 0 0 1 34 33z" fill="#e8eef3" stroke="#c3d3de" stroke-width="1.4"/>'
   + '<path d="M17 28h12" stroke="#c3d3de" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>'
   + '</svg>'],

['rain','Lluvia','Naturaleza',['lluvia','rain','paraguas','clima','agua','tormenta'],
 V + '<path d="M14 30a8 8 0 0 1 .6-15.9 10.5 10.5 0 0 1 19.4-2.6A8.5 8.5 0 0 1 34.5 30z" fill="#cfe0ea"/>'
   + '<g stroke="#7fb3e0" stroke-width="2.4" stroke-linecap="round"><path d="M18 34l-1.6 5"/><path d="M25 34l-1.6 5"/><path d="M32 34l-1.6 5"/></g>'
   + '</svg>'],

/* ---------- Deporte y salud ---------- */
['yoga','Yoga','Deporte',['yoga','estiramiento','relax','meditacion','postura','calma'],
 V + '<circle cx="24" cy="9" r="4.6" fill="#8a5a3b"/>'
   + '<path d="M24 15v12" stroke="#e05d4f" stroke-width="3.4" stroke-linecap="round"/>'
   + '<path d="M24 17l-9-5M24 17l9-5" stroke="#8a5a3b" stroke-width="2.8" stroke-linecap="round"/>'
   + '<path d="M24 27l-8 12M24 27l8 12" stroke="#3f6b8a" stroke-width="3.6" stroke-linecap="round"/>'
   + '<path d="M13 42h22" stroke="#c9c2b6" stroke-width="2" stroke-linecap="round"/>'
   + '</svg>'],

['run','Correr','Deporte',['correr','running','trote','ejercicio','deporte','entrenar'],
 V + '<circle cx="28" cy="9" r="4.4" fill="#8a5a3b"/>'
   + '<path d="M28 14l-5 8 3 6" stroke="#e05d4f" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
   + '<path d="M23 22l-9 4M26 28l-6 9M26 28l9 3" stroke="#3f6b8a" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
   + '<path d="M24 15l8 3" stroke="#8a5a3b" stroke-width="2.8" stroke-linecap="round"/>'
   + '<path d="M7 31h6M6 36h6" stroke="#c9c2b6" stroke-width="1.8" stroke-linecap="round"/>'
   + '</svg>'],

['bike','Bicicleta','Deporte',['bici','bicicleta','bike','ciclismo','ejercicio','paseo'],
 V + '<g fill="none" stroke="#2a342e" stroke-width="1.8"><circle cx="13" cy="32" r="8"/><circle cx="35" cy="32" r="8"/></g>'
   + '<path d="M13 32l7-13h9l6 13M20 19h6" stroke="#e05d4f" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
   + '<circle cx="24" cy="17" r="2.4" fill="#2a342e"/>'
   + '</svg>'],

['dumbbell','Pesas','Deporte',['pesas','gimnasio','gym','fuerza','ejercicio','mancuerna'],
 V + '<rect x="17" y="22" width="14" height="4.5" rx="2" fill="#9aa8a0"/>'
   + '<g fill="#5a6771"><rect x="8" y="16" width="6" height="17" rx="2.6"/><rect x="34" y="16" width="6" height="17" rx="2.6"/>'
   + '<rect x="3" y="20" width="5" height="9" rx="2.2"/><rect x="40" y="20" width="5" height="9" rx="2.2"/></g>'
   + '</svg>'],

['heart','Corazón','Deporte',['corazon','amor','heart','salud','favorito','gustar'],
 V + '<path d="M24 40C12 32 7 26 7 19.5A9.5 9.5 0 0 1 24 14a9.5 9.5 0 0 1 17 5.5C41 26 36 32 24 40z" fill="#e05d4f"/>'
   + '<path d="M15.5 18c2.2-2.6 5.4-2.6 7-.4" stroke="#ffffff" stroke-width="1.9" fill="none" opacity=".55" stroke-linecap="round"/>'
   + '</svg>'],

['medicine','Medicina','Deporte',['medicina','pastilla','remedio','doctor','salud','farmacia'],
 V + '<g transform="rotate(-38 24 24)">'
   + '<rect x="9" y="19" width="30" height="11" rx="5.5" fill="#f2efe6"/>'
   + '<path d="M24 19h9.5a5.5 5.5 0 0 1 0 11H24z" fill="#8ec9e6"/>'
   + '<rect x="9" y="19" width="30" height="11" rx="5.5" fill="none" stroke="#c9c2b6" stroke-width="1.2"/>'
   + '</g>'
   + '</svg>'],

['swim','Natación','Deporte',['nadar','natacion','piscina','swim','agua','deporte'],
 V + '<g stroke="#7fb3e0" stroke-width="2.4" fill="none" stroke-linecap="round">'
   + '<path d="M5 34c3-3 6-3 9 0s6 3 9 0 6-3 9 0 6 3 9 0"/>'
   + '<path d="M5 41c3-3 6-3 9 0s6 3 9 0 6-3 9 0 6 3 9 0"/></g>'
   + '<circle cx="31" cy="15" r="4.4" fill="#8a5a3b"/>'
   + '<path d="M22 28l7-7 8 4" stroke="#e05d4f" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
   + '</svg>'],

/* ---------- Casa ---------- */
['house','Casa','Casa',['casa','hogar','home','house','familia','piso'],
 V + '<path d="M24 6l18 15v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V21z" fill="#f6e3c5"/>'
   + '<path d="M24 3l20 17.4-3 3.4L24 9.6 7 23.8l-3-3.4z" fill="#c0392b"/>'
   + '<rect x="19" y="28" width="10" height="13" rx="1.5" fill="#8d6432"/>'
   + '<rect x="12" y="24" width="6" height="6" rx="1" fill="#8ec9e6"/>'
   + '<rect x="30" y="24" width="6" height="6" rx="1" fill="#8ec9e6"/>'
   + '</svg>'],

['laundry','Lavandería','Casa',['lavar','ropa','lavadora','laundry','limpieza','colada'],
 V + '<rect x="9" y="6" width="30" height="36" rx="5" fill="#e8eef3" stroke="#b9c8d2" stroke-width="1.5"/>'
   + '<circle cx="24" cy="29" r="10" fill="#a8cdeb" stroke="#7fa8c9" stroke-width="1.6"/>'
   + '<circle cx="24" cy="29" r="6" fill="#dbeaf6"/>'
   + '<rect x="13" y="9" width="8" height="3" rx="1.5" fill="#8fa39a"/>'
   + '<circle cx="34" cy="10.5" r="2.4" fill="#e05d4f"/>'
   + '</svg>'],

['clean','Limpieza','Casa',['limpiar','escoba','barrer','clean','tareas','casa'],
 V + '<path d="M30 6l6 6-16 16-6-6z" fill="#c99a5b"/>'
   + '<path d="M14 22l-6 20 20-6z" fill="#f2c94c"/>'
   + '<path d="M14 22l6 6" stroke="#c99a5b" stroke-width="1.6"/>'
   + '<g stroke="#d9a72c" stroke-width="1.3"><path d="M11.5 31l5 5"/><path d="M10 36l5 5"/></g>'
   + '</svg>'],

['key','Llave','Casa',['llave','key','casa','seguridad','nuevo','cerradura'],
 V + '<circle cx="15" cy="15" r="7" fill="none" stroke="#e0b23f" stroke-width="4"/>'
   + '<path d="M20 20l16 16" stroke="#e0b23f" stroke-width="4" stroke-linecap="round"/>'
   + '<path d="M29 31l4-4M33 35l4-4" stroke="#e0b23f" stroke-width="3" stroke-linecap="round"/>'
   + '</svg>'],

['bulb','Idea','Casa',['idea','bombilla','luz','creatividad','recordar','proyecto'],
 V + '<g stroke="#e0b52c" stroke-width="2.2" stroke-linecap="round">'
   + '<path d="M24 2v4"/><path d="M6 19H2"/><path d="M46 19h-4"/>'
   + '<path d="M10 6L7 3"/><path d="M38 6l3-3"/></g>'
   + '<circle cx="24" cy="19" r="11" fill="#f6d96b"/>'
   + '<path d="M17.5 18c1.6 3 1.6 6 0 9" stroke="#ffffff" stroke-width="2" fill="none" opacity=".7"/>'
   + '<rect x="19" y="30" width="10" height="4" rx="2" fill="#b9c1bd"/>'
   + '<rect x="19.5" y="35" width="9" height="4" rx="2" fill="#9aa8a0"/>'
   + '<rect x="20.5" y="40" width="7" height="3" rx="1.5" fill="#7e8b84"/>'
   + '</svg>'],

['trash','Basura','Casa',['basura','tirar','reciclar','papelera','trash','limpiar'],
 V + '<path d="M13 14h22l-2.4 27a3 3 0 0 1-3 2.8H18.4a3 3 0 0 1-3-2.8z" fill="#9aa8a0"/>'
   + '<path d="M10 11h28v4H10z" fill="#7e8b84"/>'
   + '<path d="M19 8h10v3H19z" fill="#7e8b84"/>'
   + '<g stroke="#e8eef3" stroke-width="1.6" stroke-linecap="round"><path d="M20 20v16"/><path d="M24 20v16"/><path d="M28 20v16"/></g>'
   + '</svg>'],

/* ---------- Estudio y trabajo ---------- */
['books','Libros','Estudio',['libro','libros','leer','read','estudiar','biblioteca','notas'],
 V + '<rect x="7" y="9" width="15" height="30" rx="2.4" fill="#e05d4f"/>'
   + '<rect x="24" y="9" width="15" height="30" rx="2.4" fill="#5aa877"/>'
   + '<rect x="22" y="9" width="4" height="30" fill="#f6e3c5"/>'
   + '<g stroke="#ffffff" stroke-width="1.6" opacity=".7" stroke-linecap="round">'
   + '<path d="M11 15h7M11 20h7M28 15h7M28 20h7"/></g>'
   + '</svg>'],

['laptop','Portátil','Estudio',['portatil','laptop','computadora','ordenador','trabajo','teletrabajo'],
 V + '<rect x="8" y="12" width="32" height="21" rx="2.6" fill="#5a6771"/>'
   + '<rect x="10.5" y="14.5" width="27" height="16" rx="1.4" fill="#bfe0f0"/>'
   + '<path d="M4 35h40l-3 4H7z" fill="#9aa8a0"/>'
   + '<path d="M20 37h8" stroke="#5a6771" stroke-width="1.6" stroke-linecap="round"/>'
   + '<g stroke="#7fa8c9" stroke-width="1.6" stroke-linecap="round"><path d="M14 19h12"/><path d="M14 24h9"/></g>'
   + '</svg>'],

['pencil','Lápiz','Estudio',['lapiz','pencil','escribir','redactar','nota','dibujar'],
 V + '<path d="M8 40l2-8 22-22 6 6-22 22z" fill="#f2c94c"/>'
   + '<path d="M10 32l6 6-8 2z" fill="#f6e3c5"/>'
   + '<path d="M30 12l6 6 3-3a4.2 4.2 0 0 0-6-6z" fill="#e08a8a"/>'
   + '<path d="M32.5 14.5l2 2" stroke="#d9a72c" stroke-width="1.4"/>'
   + '</svg>'],

['briefcase','Maletín','Estudio',['maletin','trabajo','oficina','work','reunion','empleo'],
 V + '<rect x="4" y="15" width="40" height="26" rx="4" fill="#8d6432"/>'
   + '<rect x="4" y="22" width="40" height="4" fill="#6f4c22"/>'
   + '<path d="M18 15v-3a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3" fill="none" stroke="#6f4c22" stroke-width="2.2"/>'
   + '<rect x="20" y="24" width="8" height="6" rx="1.6" fill="#e0b184"/>'
   + '</svg>'],

['clock','Reloj','Estudio',['reloj','hora','clock','tiempo','cita','recordatorio'],
 V + '<circle cx="24" cy="24" r="17" fill="#f6e3c5" stroke="#c99a5b" stroke-width="2"/>'
   + '<path d="M24 12v12l8 5" stroke="#8d6432" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
   + '<circle cx="24" cy="24" r="2.2" fill="#8d6432"/>'
   + '<g fill="#d9bc8f"><circle cx="24" cy="9" r="1.2"/><circle cx="24" cy="39" r="1.2"/><circle cx="9" cy="24" r="1.2"/><circle cx="39" cy="24" r="1.2"/></g>'
   + '</svg>'],

['chart','Gráfico','Estudio',['grafico','chart','reunion','datos','informe','ventas','meta'],
 V + '<g><rect x="6" y="30" width="7" height="12" rx="1.6" fill="#7fb3e0"/>'
   + '<rect x="16" y="22" width="7" height="20" rx="1.6" fill="#5aa877"/>'
   + '<rect x="26" y="26" width="7" height="16" rx="1.6" fill="#f2c94c"/>'
   + '<rect x="36" y="14" width="7" height="28" rx="1.6" fill="#e05d4f"/></g>'
   + '<path d="M8 26l10-8 9 4 12-12" stroke="#2a342e" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
   + '</svg>'],

['calendar-mini','Calendario','Estudio',['calendario','calendar','fecha','mes','agenda','plan'],
 V + '<rect x="15" y="4" width="4" height="8" rx="2" fill="#5a6771"/>'
   + '<rect x="29" y="4" width="4" height="8" rx="2" fill="#5a6771"/>'
   + '<rect x="5" y="9" width="38" height="34" rx="5" fill="#ffffff" stroke="#5a6771" stroke-width="2"/>'
   + '<path d="M5 13.5a4.5 4.5 0 0 1 4.5-4.5h29A4.5 4.5 0 0 1 43 13.5V18H5z" fill="#e05d4f"/>'
   + '<g fill="#c9d4ce"><rect x="10" y="22" width="6" height="5" rx="1.4"/><rect x="21" y="22" width="6" height="5" rx="1.4"/>'
   + '<rect x="32" y="22" width="6" height="5" rx="1.4"/><rect x="10" y="31" width="6" height="5" rx="1.4"/>'
   + '<rect x="21" y="31" width="6" height="5" rx="1.4"/></g>'
   + '<rect x="32" y="31" width="6" height="5" rx="1.4" fill="#f2c94c"/>'
   + '</svg>'],

['graduation','Graduación','Estudio',['graduacion','titulo','graduation','escuela','curso','estudiar'],
 V + '<path d="M24 8L4 18l20 10 20-10z" fill="#3d4a43"/>'
   + '<path d="M24 8L4 18l20 10z" fill="#5a6771"/>'
   + '<path d="M13 23v8c0 3 5 6 11 6s11-3 11-6v-8" fill="none" stroke="#3d4a43" stroke-width="2.6"/>'
   + '<path d="M42 20v12" stroke="#f2c94c" stroke-width="2.2" stroke-linecap="round"/>'
   + '<circle cx="42" cy="34" r="3" fill="#f2c94c"/>'
   + '</svg>'],

/* ---------- Compras ---------- */
['cart','Carrito','Compras',['carrito','compra','supermercado','cart','compras','mercado'],
 V + '<path d="M6 9h5l6 20h20" stroke="#5a6771" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
   + '<path d="M13 14h28l-4 12H16z" fill="#7fb3e0"/>'
   + '<g fill="#3f6b8a"><circle cx="19" cy="37" r="3.2"/><circle cx="35" cy="37" r="3.2"/></g>'
   + '</svg>'],

['bag','Bolsa de compras','Compras',['bolsa','compra','bag','supermercado','mandado','groceries'],
 V + '<path d="M11 16h26l2.6 25a2 2 0 0 1-2 2.2H10.4a2 2 0 0 1-2-2.2z" fill="#c98a4b"/>'
   + '<path d="M18 16v-4a6 6 0 0 1 12 0v4" fill="none" stroke="#8d6432" stroke-width="2.4"/>'
   + '<rect x="14" y="24" width="20" height="12" rx="2" fill="#f6e3c5"/>'
   + '<path d="M18 30h12" stroke="#8d6432" stroke-width="1.4"/>'
   + '</svg>'],

['tag','Etiqueta','Compras',['etiqueta','oferta','precio','descuento','tag','sale'],
 V + '<path d="M25 5l18 18-20 20L5 25V9a4 4 0 0 1 4-4z" fill="#f2c94c"/>'
   + '<path d="M25 5l18 18-20 20" fill="none" stroke="#d9a72c" stroke-width="1.4"/>'
   + '<circle cx="15" cy="15" r="3.6" fill="#ffffff"/>'
   + '</svg>'],

['money','Dinero','Compras',['dinero','moneda','pagar','precio','money','presupuesto'],
 V + '<circle cx="24" cy="24" r="16" fill="#f2c94c" stroke="#d9a72c" stroke-width="2"/>'
   + '<circle cx="24" cy="24" r="12" fill="none" stroke="#d9a72c" stroke-width="1.3" opacity=".7"/>'
   + '<path d="M24 14v20M20 18h6.5a3.5 3.5 0 0 1 0 7h-5a3.5 3.5 0 0 0 0 7H29" stroke="#8a6b1f" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
   + '</svg>'],

['card','Tarjeta','Compras',['tarjeta','pago','credito','card','banco','comprar'],
 V + '<rect x="5" y="11" width="38" height="26" rx="4" fill="#7fb3e0"/>'
   + '<rect x="5" y="17" width="38" height="6" fill="#3f6b8a"/>'
   + '<rect x="10" y="28" width="12" height="4.5" rx="2" fill="#e8eef3"/>'
   + '<circle cx="36" cy="31" r="3.4" fill="#f2c94c"/>'
   + '</svg>'],

/* ---------- Viaje ---------- */
['plane','Avión','Viaje',['avion','vuelo','viaje','plane','vacaciones','viajar'],
 V + '<path d="M43 6L5 24l12 4 3 12 6-9 11 6z" fill="#dbe7f0" stroke="#9fb6c6" stroke-width="1.5" stroke-linejoin="round"/>'
   + '<path d="M17 28l26-22-17 26" fill="none" stroke="#9fb6c6" stroke-width="1.2"/>'
   + '</svg>'],

['suitcase','Maleta','Viaje',['maleta','viaje','equipaje','suitcase','vacaciones','aeropuerto'],
 V + '<rect x="5" y="16" width="38" height="24" rx="4" fill="#c98a4b"/>'
   + '<rect x="5" y="24" width="38" height="5" fill="#a06a34"/>'
   + '<path d="M18 16v-4a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4" fill="none" stroke="#8d6432" stroke-width="2.2"/>'
   + '<rect x="20" y="30" width="8" height="4" rx="1.6" fill="#e0b184"/>'
   + '</svg>'],

['car','Coche','Viaje',['coche','auto','carro','car','viaje','conducir'],
 V + '<path d="M6 30l3-9a5 5 0 0 1 4.6-3.4h20.8A5 5 0 0 1 39 21l3 9v6h-5v-4H11v4H6z" fill="#e05d4f"/>'
   + '<path d="M14 22h20l1.6 5H12.4z" fill="#bfe0f0"/>'
   + '<g fill="#3d4a43"><circle cx="14" cy="36" r="4.4"/><circle cx="34" cy="36" r="4.4"/></g>'
   + '</svg>'],

['map','Mapa','Viaje',['mapa','map','viaje','ruta','direccion','ubicacion'],
 V + '<path d="M4 12l13-5 14 5 13-5v29l-13 5-14-5-13 5z" fill="#e8e2d4"/>'
   + '<path d="M17 7v29M31 12v29" stroke="#c3b9a4" stroke-width="1.6"/>'
   + '<path d="M24 12c4 0 7 3 7 7 0 5-7 13-7 13s-7-8-7-13c0-4 3-7 7-7z" fill="#e05d4f"/>'
   + '<circle cx="24" cy="19" r="2.6" fill="#ffffff"/>'
   + '</svg>'],

['camera','Cámara','Viaje',['camara','foto','camera','recuerdo','viaje','fotografia'],
 V + '<rect x="14" y="9" width="13" height="6" rx="2" fill="#3d4a43"/>'
   + '<rect x="4" y="14" width="40" height="27" rx="5" fill="#2f6f6b"/>'
   + '<circle cx="24" cy="27.5" r="9.5" fill="#cfe3f0"/>'
   + '<circle cx="24" cy="27.5" r="6.5" fill="#2a342e"/>'
   + '<circle cx="21.5" cy="25" r="2.2" fill="#ffffff" opacity=".7"/>'
   + '<circle cx="37" cy="20" r="2.4" fill="#f2c94c"/>'
   + '</svg>'],

['beach','Playa','Viaje',['playa','palmera','beach','verano','vacaciones','sol'],
 V + '<path d="M22 44c0-12 1-20 2-26" stroke="#8d6432" stroke-width="3.4" stroke-linecap="round" fill="none"/>'
   + '<g fill="#5aa877">'
   + '<path d="M24 17C18 10 10 10 6 14c6-1 12 1 18 3z"/>'
   + '<path d="M24 17c6-7 14-7 18-3-6-1-12 1-18 3z"/>'
   + '<path d="M24 17c-3-8 1-13 5-15-3 5-3 10-5 15z"/>'
   + '<path d="M24 17c3-8-1-13-5-15 3 5 3 10 5 15z"/>'
   + '</g>'
   + '<circle cx="22" cy="18" r="2.6" fill="#8d6432"/>'
   + '<g fill="#f6d33f"><circle cx="26.5" cy="19" r="2"/><circle cx="19.5" cy="19" r="2"/></g>'
   + '</svg>'],

/* ---------- Ánimo ---------- */
['smile','Carita feliz','Ánimo',['carita','feliz','sonrisa','smile','animar','bien'],
 V + '<circle cx="24" cy="24" r="18" fill="#f6d33f"/>'
   + '<g fill="#8a6b1f"><circle cx="18" cy="20" r="2.2"/><circle cx="30" cy="20" r="2.2"/></g>'
   + '<path d="M16 29c4 4.4 12 4.4 16 0" stroke="#8a6b1f" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
   + '</svg>'],

['check','Hecho','Ánimo',['check','hecho','listo','visto','completado','logro','ok'],
 V + '<path d="M8 26l11 11L41 9" stroke="#c0392b" stroke-width="6.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
   + '<path d="M8 26l11 11L41 9" stroke="#e05d4f" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
   + '</svg>'],

['pin','Chincheta','Ánimo',['chincheta','pin','recordatorio','fijar','aviso','sujetar'],
 V + '<g transform="rotate(45 24 22)">'
   + '<path d="M24 4a8 8 0 0 1 8 8v8H16v-8a8 8 0 0 1 8-8z" fill="#e05d4f"/>'
   + '<path d="M20 20h8l-2 6h-4z" fill="#c0392b"/>'
   + '<path d="M24 26v16" stroke="#9aa8a0" stroke-width="2.6" stroke-linecap="round"/>'
   + '</g>'
   + '</svg>'],

['flag','Bandera','Ánimo',['bandera','flag','meta','objetivo','final','logro'],
 V + '<path d="M12 4v40" stroke="#9aa8a0" stroke-width="2.8" stroke-linecap="round"/>'
   + '<path d="M14 7h26l-6 8 6 8H14z" fill="#e05d4f"/>'
   + '</svg>'],

['fire','Fuego','Ánimo',['fuego','fire','racha','energia','importante','urgente'],
 V + '<path d="M24 4c2 8 10 10 10 20a10 10 0 0 1-20 0c0-5 3-8 5-11 1 4 3 5 4 3 1.4-2 1.6-6 1-12z" fill="#e08a3f"/>'
   + '<path d="M24 20c1.4 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-5 3.4-7 .6 2 1.2 2.6 1.6 2z" fill="#f6d33f"/>'
   + '</svg>'],

['sparkle','Brillos','Ánimo',['brillo','brillos','nuevo','sparkle','destacar','estrella'],
 V + '<g fill="#f2c94c"><path d="M18 6l2.6 8.4L29 17l-8.4 2.6L18 28l-2.6-8.4L7 17l8.4-2.6z"/>'
   + '<path d="M34 24l1.8 5.4 5.4 1.8-5.4 1.8L34 38.4l-1.8-5.4-5.4-1.8 5.4-1.8z"/></g>'
   + '<path d="M12 32l1.4 4.4L18 38l-4.6 1.6L12 44l-1.4-4.4L6 38l4.6-1.6z" fill="#f6d96b"/>'
   + '</svg>'],

['bell','Campana','Ánimo',['campana','aviso','recordatorio','alarma','bell','importante'],
 V + '<path d="M24 6a13 13 0 0 1 13 13v9l3 4v3H8v-3l3-4v-9A13 13 0 0 1 24 6z" fill="#f2c94c"/>'
   + '<path d="M24 6a13 13 0 0 1 13 13v9l3 4v3H24z" fill="#e0b52c"/>'
   + '<circle cx="24" cy="40" r="4" fill="#e0b52c"/>'
   + '<circle cx="24" cy="3.5" r="2.6" fill="#e0b52c"/>'
   + '</svg>'],

];

/* ---------- conversión a objetos + índice ---------- */

const norm = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const STICKERS = D.map(([id, name, cat, keys, svg]) => ({
  kind: 'svg',
  id,
  key: 'svg:' + id,
  name,
  cat,
  keys,
  svg,
  hay: norm([name, cat, id].concat(keys).join(' ')),
}));

export const normKey = norm;

/** Todas las categorías del set ilustrado, en orden de aparición. */
export const STICKER_CATS = STICKERS.reduce((acc, s) => {
  if (!acc.includes(s.cat)) acc.push(s.cat);
  return acc;
}, []);
