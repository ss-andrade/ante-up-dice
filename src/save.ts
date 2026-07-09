import{ANTES,CHARMS,type Pip,type RunState}from'./engine';

const STATUSES:RunState['status'][]=['playing','shop','won','lost'];
const charmIds=new Set(CHARMS.map(charm=>charm.id));
const isRecord=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const isInteger=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value);
const isPip=(value:unknown):value is Pip=>isInteger(value)&&value>=1&&value<=6;
const isBooleanArray=(value:unknown):value is boolean[]=>Array.isArray(value)&&value.every(item=>typeof item==='boolean');
const isKnownCharmArray=(value:unknown):value is string[]=>Array.isArray(value)&&value.every(item=>typeof item==='string'&&charmIds.has(item));

export function isRunState(value:unknown):value is RunState{
 if(!isRecord(value)||value.version!==1)return false;
 const{seed,ante,score,target,cash,hands,rolls,dice,held,charms,shop,refreshes,status}=value;
 if(!isInteger(seed)||seed<0||seed>0xffffffff||!isInteger(ante)||ante<1||ante>ANTES.length)return false;
 if(!isInteger(score)||score<0||!isInteger(target)||target<0||!isInteger(cash)||cash<0||!isInteger(hands)||hands<0||hands>4)return false;
 if(!isInteger(rolls)||rolls<0||rolls>3||!isInteger(refreshes)||refreshes<0)return false;
 if(!Array.isArray(dice)||dice.length>5||!dice.every(isPip)||!isBooleanArray(held)||held.length!==5)return false;
 if(!isKnownCharmArray(charms)||charms.length>5||new Set(charms).size!==charms.length)return false;
 if(!isKnownCharmArray(shop)||shop.length>3||new Set(shop).size!==shop.length||shop.some(id=>charms.includes(id)))return false;
 if(typeof status!=='string'||!STATUSES.includes(status as RunState['status']))return false;
 if(target!==ANTES[ante-1]?.target)return false;
 if(status==='playing'&&(shop.length!==0||hands<1))return false;
 if(status==='shop'&&(shop.length===0||score<target||ante===ANTES.length))return false;
 if(status==='won'&&(ante!==ANTES.length||score<target))return false;
 if(status==='lost'&&hands!==0)return false;
 return true;
}

export function parseSavedRun(raw:string|null):RunState|null{
 if(raw===null)return null;
 try{const value:unknown=JSON.parse(raw);return isRunState(value)?value:null}catch{return null}
}

export function isActiveRun(run:RunState):boolean{return run.status==='playing'||run.status==='shop'}
