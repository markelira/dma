// @ts-nocheck
// Jest provides describe, it, expect, beforeEach globals out-of-the-box.
// We simply remove Vitest-specific imports and use the Jest global namespace.

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

process.env.FIREBASE_PROJECT_ID = 'demo-project';
process.env.FIREBASE_SERVICE_ACCOUNT_KEY = '{}';

jest.mock('../../src/utils/firebaseAdmin', () => {
  const store: Record<string, Record<string, any>> = {};
  const segs = (p: string) => p.split('/');
  const refStore = (s: string[]) => { let r: any = store; s.forEach(k=>{r[k]=r[k]||{}; r=r[k];}); return r; };
  function collection(path: string){
    return {
      doc(id?:string){const _id=id||Math.random().toString(36).slice(2);return{
        id:_id,
        async set(d:any){refStore(segs(path))[_id]=d;},
        async get(){return{exists:!!refStore(segs(path))[_id],id:_id,data:()=>refStore(segs(path))[_id]}},
        collection(sub:string){return collection(`${path}/${_id}/${sub}`);}
      }},
      async add(d:any){const _id=Math.random().toString(36).slice(2);refStore(segs(path))[_id]=d;return{id:_id}},
      async get(){const docs=Object.entries(refStore(segs(path))).map(([i,d])=>({id:i,data:()=>d,ref:collection(path).doc(i as string)}));return{docs}},
    };
  }
  return { firestore:{ collection }, auth: () => ({}), default:{} };
});

import { firestore } from '../../src/utils/firebaseAdmin';
import { createModule } from '../../src/controllers/moduleController';

function mockRes(){const r:any={}; r.status=jest.fn().mockReturnValue(r); r.json=jest.fn().mockReturnValue(r);return r;}
function mockNext(){return jest.fn();}

describe('moduleController', () => {
  beforeEach(()=>{});
  it('creates module under course', async () => {
    await firestore.collection('courses').doc('course1').set({});
    const req:any={body:{title:'Mod 1',order:0,courseId:'course1',subscriptionTier:'FREE'},userRole:'ADMIN'};
    const res=mockRes(); const next=mockNext();
    await createModule(req,res,next);
    expect(res.status).toHaveBeenCalledWith(201);
  });
}); 