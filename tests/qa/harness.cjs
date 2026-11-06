/* eslint-disable @typescript-eslint/no-require-imports -- Optional Node QA harness loads CommonJS modules. */
const assert=require('node:assert/strict'), fs=require('fs'),path=require('path'),Module=require('module');
const ROOT=process.env.POKER_REPO_ROOT || path.resolve(__dirname, '../..');
const qaRequire=name=>process.env.POKER_QA_NODE_MODULES ? require(path.join(process.env.POKER_QA_NODE_MODULES,name)) : require(name);
const ts=require(ROOT+'/node_modules/typescript');
const React=qaRequire('react');
const {act,create}=qaRequire('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT=true;
let params='';const modules={};
function load(file){file=path.resolve(file);if(modules[file])return modules[file].exports;const m=new Module(file,module);modules[file]=m;m.paths=Module._nodeModulePaths(ROOT);const normal=m.require.bind(m);m.require=id=>{if(id==='react')return React;if(id==='react/jsx-runtime')return qaRequire('react/jsx-runtime');if(id==='next/link')return {__esModule:true,default:({children,...p})=>React.createElement('a',p,children)};if(id==='next/image')return {__esModule:true,default:p=>React.createElement('img',p)};if(id==='next/navigation')return {useSearchParams:()=>new URLSearchParams(params)};if(id.startsWith('@/')||id.startsWith('.')){let f=id.startsWith('@/')?path.join(ROOT,id.slice(2)):path.resolve(path.dirname(file),id);for(const s of ['', '.ts','.tsx','/index.ts','/index.tsx'])if(fs.existsSync(f+s)&&fs.statSync(f+s).isFile())return load(f+s);}return normal(id)};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}
class Storage {constructor(d={}){this.data={...d};this.writes=[];this.fail=false;}get length(){return Object.keys(this.data).length}key(i){return Object.keys(this.data)[i]??null}getItem(k){return this.data[k]??null}setItem(k,v){if(this.fail)throw Error('QuotaExceededError');this.data[k]=String(v);this.writes.push(k)}removeItem(k){if(this.fail)throw Error('SecurityError');delete this.data[k];this.writes.push(k)}}
const hand=(id,notation='AKs')=>({id,savedAt:'2026-11-04T12:00:00Z',heroHand:{notation},positions:{heroPosition:'BTN'},table:{heroStack:'1000',smallBlind:'5',bigBlind:'10'},tournament:{tournamentName:'QA Cup',smallBlind:5,bigBlind:10,heroStack:1000},preflop:{actions:[]},result:{type:'win',importance:3,memo:'QA'},unknown:{retained:true}});
const review=(score=62)=>({totalScore:score,grade:'C',stars:3,shortSummary:'QA unique summary '+score,mainLeak:'ベットサイズ',improvementPoints:['相手レンジを考える'],nextGoals:['リバーのサイズを復習'],streets:{preflop:{score:score,improvementPoints:['プリフロップ課題']},flop:{score:80},turn:{score:55},river:{score:60}},unknown:{retained:true}});
function setup(entries={}){const s=new Storage(entries);global.localStorage=s;global.window=new EventTarget();window.localStorage=s;window.confirm=()=>true;global.fetch=async()=>{throw Error('UNEXPECTED FETCH')};return s}
function text(n){if(n==null)return '';if(typeof n==='string'||typeof n==='number')return String(n);if(Array.isArray(n))return n.map(text).join('');if(n.children)return text(n.children);return ''}
async function render(Component){let r;await act(async()=>{r=create(React.createElement(Component))});return r}
async function click(node){await act(async()=>{await node.props.onClick({stopPropagation(){},preventDefault(){}})})}
function button(r,label){return r.root.findAllByType('button').find(n=>text(n).includes(label))}
const results=[];async function test(name,fn){try{await fn();results.push({name,pass:true});console.log('PASS',name)}catch(e){results.push({name,pass:false,error:e.stack});console.error('FAIL',name,e.stack)}}
module.exports={assert,fs,path,ROOT,React,act,load,Storage,hand,review,setup,text,render,click,button,test,results};
