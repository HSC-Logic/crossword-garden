import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config({ignores:['dist/**','node_modules/**','playwright-report/**','test-results/**']},js.configs.recommended,...ts.configs.recommended,{files:['**/*.{js,mjs,ts,tsx}'],languageOptions:{globals:{console:'readonly',process:'readonly',structuredClone:'readonly',setTimeout:'readonly',clearTimeout:'readonly',URL:'readonly',self:'readonly',__dirname:'readonly'}},rules:{'@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_'}],'no-empty':['error',{allowEmptyCatch:true}]} });
