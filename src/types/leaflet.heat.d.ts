declare module 'leaflet.heat' {
  import * as L from 'leaflet';
  
  interface HeatLayerOptions {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    minOpacity?: number;
    gradient?: Record<number, string>;
  }
  
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: HeatLayerOptions
  ): L.Layer;
  
  export = heatLayer;
}
