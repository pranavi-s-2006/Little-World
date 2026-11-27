// gardenEngine.js
import { GARDEN_PLANTS, getGrowthStage } from '../data/gardenData.js';

export function buildInitialGarden(saved = null) {
  if (saved) return saved;
  return {
    plots: [
      { id: 'plot1', plantId: 'rose',  plantedAt: 0, wateredAt: null, collected: false },
      { id: 'plot2', plantId: 'daisy', plantedAt: 0, wateredAt: null, collected: false },
      { id: 'plot3', plantId: null,    plantedAt: 0, wateredAt: null, collected: false },
      { id: 'plot4', plantId: null,    plantedAt: 0, wateredAt: null, collected: false },
      { id: 'plot5', plantId: null,    plantedAt: 0, wateredAt: null, collected: false },
      { id: 'plot6', plantId: null,    plantedAt: 0, wateredAt: null, collected: false },
    ],
  };
}

export function plantSeed(garden, plotId, plantId, virtualMinutes) {
  return {
    ...garden,
    plots: garden.plots.map(p =>
      p.id === plotId ? { ...p, plantId, plantedAt: virtualMinutes, wateredAt: null, collected: false } : p
    ),
  };
}

export function waterPlot(garden, plotId, virtualMinutes) {
  return {
    ...garden,
    plots: garden.plots.map(p =>
      p.id === plotId ? { ...p, wateredAt: virtualMinutes } : p
    ),
  };
}

export function collectPlot(garden, plotId) {
  return {
    ...garden,
    plots: garden.plots.map(p =>
      p.id === plotId ? { ...p, plantId: null, plantedAt: 0, wateredAt: null, collected: false } : p
    ),
  };
}

export function getPlotStage(plot, virtualMinutes) {
  if (!plot.plantId) return null;
  const plant = GARDEN_PLANTS.find(p => p.id === plot.plantId);
  if (!plant) return null;
  return getGrowthStage(plot.plantedAt, plot.wateredAt, virtualMinutes, plant.growTime);
}
