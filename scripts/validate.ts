import {readFileSync} from 'node:fs';
import {validatePuzzles} from '../src/validate';
console.log('Validated:',validatePuzzles(JSON.parse(readFileSync('public/puzzles.json','utf8'))));
