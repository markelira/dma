// @ts-nocheck

// Jest globals (describe, it, expect, beforeEach) are available without import.

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

process.env.FIREBASE_PROJECT_ID='demo-project';
process.env.FIREBASE_SERVICE_ACCOUNT_KEY='{}';

jest.mock('../../src/utils/firebaseAdmin',()=>{
 const store:Record<string,Record<string,any>>={};
 const seg = (p: string) => p.split('/');
 const ref = (segments: string[]) => {
   let r: any = store;
   segments.forEach((k: string) => {
     r[k] = r[k] || {};
     r = r[k];
   });
   return r;
 };
 function collection(path:string){return{doc(id?:string){const _id=id||Math.random().toString(36).slice(2);return{ id:_id,set:async(d:any)=>{ref(seg(path))[_id]=d;},get:async()=>({exists:!!ref(seg(path))[_id],id:_id,data:()=>ref(seg(path))[_id]}),collection:(sub:string)=>collection(`${path}/${_id}/${sub}`)}},get:async()=>({docs:Object.entries(ref(seg(path))).map(([i,d])=>({id:i,data:()=>d,ref:collection(path).doc(i as string)}))})};}
 return{firestore:{collection},auth:()=>({}),default:{}};
});

import { firestore } from '../../src/utils/firebaseAdmin';
import { createLesson } from '../../src/controllers/lessonController';

function mockRes(){const r:any={};r.status=jest.fn().mockReturnValue(r);r.json=jest.fn().mockReturnValue(r);return r;}
function mockNext(){return jest.fn();}

describe('lessonController',()=>{
 beforeEach(()=>{});
 it('creates lesson',async()=>{
  await firestore.collection('courses').doc('course1').set({});
  const modRef=firestore.collection('courses').doc('course1').collection('modules').doc('mod1');
  await modRef.set({});
  const req:any={body:{title:'L',type:'TEXT',moduleId:'mod1',order:0},userRole:'ADMIN'};
  const res=mockRes();const next=mockNext();
  await createLesson(req,res,next);
  expect(res.status).toHaveBeenCalledWith(201);
 });
}); 