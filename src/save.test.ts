import{describe,expect,it}from'vitest';import{newRun}from'./engine';import{isRunState,parseSavedRun}from'./save';
describe('saved runs',()=>{
 it('accepts the current run schema',()=>expect(isRunState(newRun(7))).toBe(true));
 it.each([
  ['unsupported version',{...newRun(7),version:2}],
  ['missing field',(({seed:_,...run})=>run)(newRun(7))],
  ['invalid die',{...newRun(7),dice:[0]}],
  ['unknown charm',{...newRun(7),charms:['counterfeit']}],
  ['wrong target',{...newRun(7),target:999}],
 ])('rejects %s',(_label,value)=>expect(isRunState(value)).toBe(false));
 it('returns null for malformed and valid-but-corrupt JSON',()=>{expect(parseSavedRun('{')).toBeNull();expect(parseSavedRun('{"version":1}')).toBeNull()});
});
