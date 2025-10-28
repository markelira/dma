// @ts-nocheck
// Jest globals are available; import types for jest here.
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/utils/firebaseAdmin', () => {
  const store: Record<string, Record<string, any>> = {};
  const col = (path: string) => path.split('/');
  const getColRef = (segments: string[]) => {
    let ref = store;
    for (const seg of segments) {
      ref[seg] = ref[seg] || {};
      ref = ref[seg];
    }
    return ref;
  };
  function collection(name: string) {
    return {
      doc(id?: string) {
        const _id = id || Math.random().toString(36).slice(2);
        return {
          id: _id,
          async set(data: any) { getColRef(col(name))[_id] = data; },
          async update(data: any) { Object.assign(getColRef(col(name))[_id], data); },
          async get() { return { exists: !!getColRef(col(name))[_id], id: _id, data: () => getColRef(col(name))[_id] }; },
          collection(sub: string) { return collection(`${name}/${_id}/${sub}`); },
        };
      },
      async add(data: any) { const ref = this.doc(); await ref.set(data); return ref; },
      async get() { const docs = Object.entries(getColRef(col(name))).map(([id, data]) => ({ id, data: () => data, ref: this.doc(id) })); return { docs }; },
      where() { return { get: async () => ({ empty: true }) }; },
    };
  }
  return { firestore: { collection }, auth: () => ({}), default: {} };
});

import { createCourse } from '../../src/controllers/courseController';
import { firestore } from '../../src/utils/firebaseAdmin';

function mockRes() { const r:any={}; r.status=jest.fn().mockReturnValue(r); r.json=jest.fn().mockReturnValue(r); return r; }
function mockNext(){return jest.fn();}

describe('courseController', () => {
  beforeEach(() => { /* reset store */ });
  it('creates course', async () => {
    await firestore.collection('categories').doc('cat').set({});
    await firestore.collection('users').doc('user').set({});
    const req:any={body:{title:'t',description:'d',categoryId:'cat',instructorId:'user',language:'hu',difficulty:'BEGINNER',certificateEnabled:false},userRole:'ADMIN'};
    const res=mockRes(); const next=mockNext();
    await createCourse(req,res,next);
    expect(res.status).toHaveBeenCalledWith(201);
  });
}); 