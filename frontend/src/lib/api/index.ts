// Barrel re-export for the API layer
export { baseRequest } from './client';
export {
  getIncidents,
  getIncident,
  createIncident,
  resolveIncident,
  createPostMortem,
  retainKnowledge,
} from './incidents';
export { analyzeIncident, updateStep } from './analysis';
