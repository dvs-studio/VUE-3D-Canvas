import type { TriplanarTextureItem } from '../core/types';

export interface BuiltinTriplanarTexture extends TriplanarTextureItem {
  color: string;
  desc: string;
  src: string;
}

/**
 * Six reviewed user-supplied surface photographs.
 * Keep the semantic filenames stable; the image assets live in public/textures/triplanar.
 */
export const BUILTIN_TRIPLANAR_TEXTURES: BuiltinTriplanarTexture[] = [
  { id: 'autumn_leaf_veins', name: 'Autumn Leaf Veins', color: '#a64b1d', desc: 'Dense orange autumn leaves and branching veins', src: '/textures/triplanar/Autumn_Leaf_Veins.jpg', dataUrl: '/textures/triplanar/Autumn_Leaf_Veins.jpg', opacity: 100, scale: 1, tintColor: '#a64b1d', colorAlpha: 1, useInstanceColor: false },
  { id: 'brown_animal_fur', name: 'Brown Animal Fur', color: '#5b3928', desc: 'Fine directional brown fur strands', src: '/textures/triplanar/Brown_Animal_Fur.jpg', dataUrl: '/textures/triplanar/Brown_Animal_Fur.jpg', opacity: 100, scale: 1, tintColor: '#5b3928', colorAlpha: 1, useInstanceColor: false },
  { id: 'lush_lawn_grass', name: 'Lush Lawn Grass', color: '#397b2d', desc: 'Dense green lawn grass blades', src: '/textures/triplanar/Lush_Lawn_Grass.jpg', dataUrl: '/textures/triplanar/Lush_Lawn_Grass.jpg', opacity: 100, scale: 1, tintColor: '#397b2d', colorAlpha: 1, useInstanceColor: false },
  { id: 'rust_patina_metal', name: 'Rust Patina Metal', color: '#a6532c', desc: 'Flaking orange-brown oxidised metal', src: '/textures/triplanar/Rust_Patina_Metal.jpg', dataUrl: '/textures/triplanar/Rust_Patina_Metal.jpg', opacity: 100, scale: 1, tintColor: '#a6532c', colorAlpha: 1, useInstanceColor: false },
  { id: 'dark_walnut_grain', name: 'Dark Walnut Grain', color: '#4b342e', desc: 'Dark walnut with flowing natural grain', src: '/textures/triplanar/Dark_Walnut_Grain.jpg', dataUrl: '/textures/triplanar/Dark_Walnut_Grain.jpg', opacity: 100, scale: 1, tintColor: '#4b342e', colorAlpha: 1, useInstanceColor: false },
  { id: 'weathered_wood_planks', name: 'Weathered Wood Planks', color: '#a18b73', desc: 'Pale aged timber boards with visible knots', src: '/textures/triplanar/Weathered_Wood_Planks.jpg', dataUrl: '/textures/triplanar/Weathered_Wood_Planks.jpg', opacity: 100, scale: 1, tintColor: '#a18b73', colorAlpha: 1, useInstanceColor: false },
];
