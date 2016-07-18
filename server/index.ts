export * from './source/index';

import { Things } from './things';

console.log(`#Things: ${Things.find().count()}`);
