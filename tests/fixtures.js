import {Simulation} from '../src/simulation.js';
import {createLegacyCity} from '../src/world.js';
import {createCampaign} from '../src/campaign.js';
export const legacyGame=(random=()=>.4)=>new Simulation({...createLegacyCity(),worldMode:'legacy',campaign:createCampaign(null)},random);
