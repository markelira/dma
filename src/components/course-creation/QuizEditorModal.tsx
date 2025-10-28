import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, Check, X, MessageCircle, List, ListChecks, BookOpen, Code as CodeIcon } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Answer row DnD

export interface QuizAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}
export interface QuizQuestion {
  id: string;
  questionText: string;
  answers: QuizAnswer[];
  questionType: 'SINGLE' | 'MULTIPLE' | 'SCENARIO' | 'CODE';
  scenarioContent?: string;
  codeBlock?: { code: string; language: string };
  explanation: string;
  points: number;
}
export interface LessonQuiz {
  passingScore: number;
  allowRetakes: boolean;
  maxAttempts?: number | null;
  timeLimitMinutes?: number | null;
  questions: QuizQuestion[];
}
interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: LessonQuiz | null;
  onSave: (quiz: LessonQuiz) => void;
}

function SortableQuestionCard({ q, onChange, onRemove }: { q: QuizQuestion; onChange: (upd: QuizQuestion) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: q.id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="bg-muted/20 border rounded-xl shadow p-6 space-y-4">
      {/* ----- HEADER ----- */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b">
        <div className="flex items-center gap-3">
          <GripVertical aria-hidden className="h-4 w-4 cursor-grab text-muted-foreground" {...listeners} />
          {/* Modern select with icons */}
          <Select value={q.questionType} onValueChange={(v)=> onChange({ ...q, questionType: v as QuizQuestion['questionType'] })}>
            <SelectTrigger className="w-52 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE"><div className="flex items-center gap-2"><List className="h-4 w-4"/>Egyszeres választás</div></SelectItem>
              <SelectItem value="MULTIPLE"><div className="flex items-center gap-2"><ListChecks className="h-4 w-4"/>Többes választás</div></SelectItem>
              <SelectItem value="SCENARIO"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4"/>Esettanulmány</div></SelectItem>
              <SelectItem value="CODE"><div className="flex items-center gap-2"><CodeIcon className="h-4 w-4"/>Kód példa</div></SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" min={1} className="w-20 ml-2" value={q.points} onChange={(e)=> onChange({ ...q, points: Number(e.target.value||1) })} />
          <span className="text-xs text-muted-foreground">pont</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove}><Trash2 className="h-4 w-4 text-red-600" /></Button>
      </div>

      {/* ----- BODY ----- */}
      <div className="space-y-4">
        {/* Kérdés szöveg */}
        <Input
          className="w-full"
          placeholder="Kérdés szövege"
          value={q.questionText}
          onChange={(e) => onChange({ ...q, questionText: e.target.value })}
        />

        <div className="space-y-2">
          {q.questionType === 'SCENARIO' && (
            <div>
              <label className="block text-xs font-medium mb-1">Esettanulmány szövege</label>
              <Textarea
                rows={4}
                placeholder="Írd ide a scenariót / dossier leírást..."
                value={q.scenarioContent || ''}
                onChange={(e)=> onChange({ ...q, scenarioContent: e.target.value })}
              />
            </div>
          )}

          {q.questionType === 'CODE' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium">Nyelv:</label>
                <select
                  value={q.codeBlock?.language || 'javascript'}
                  onChange={(e)=> onChange({ ...q, codeBlock: { ...(q.codeBlock||{ code:'', language:'javascript'}), language: e.target.value } })}
                  className="border rounded px-1 py-0.5 text-xs">
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                </select>
              </div>
              <Textarea
                rows={6}
                placeholder="Illeszd ide a kódblokkot..."
                className="font-mono"
                value={q.codeBlock?.code || ''}
                onChange={(e)=> onChange({ ...q, codeBlock: { ...(q.codeBlock||{ language:'javascript'}), code: e.target.value } })}
              />
            </div>
          )}

          {/* ---- Válaszok ---- */}
          <h4 className="text-sm font-semibold pt-2">Válaszok</h4>
          <DndContext sensors={useSensors(useSensor(PointerSensor))} onDragEnd={(ev)=>{
            const { active, over } = ev;
            if(!over || active.id===over.id) return;
            const oldIndex = q.answers.findIndex(a=>a.id===active.id);
            const newIndex = q.answers.findIndex(a=>a.id===over.id);
            const newArr = arrayMove(q.answers, oldIndex, newIndex);
            onChange({ ...q, answers: newArr });
          }}>
            <SortableContext items={q.answers.map(a=>a.id)} strategy={verticalListSortingStrategy}>
              {q.answers.map((a, idx)=>(
                <SortableAnswerRow key={a.id} answer={a} question={q} index={idx} onChange={(newAns)=> onChange({ ...q, answers: newAns })} />
              ))}
            </SortableContext>
          </DndContext>
          <Button variant="outline" size="sm" className="mt-1" onClick={()=>{
            const newAns: QuizAnswer = { id: crypto.randomUUID(), text: "", isCorrect: false, feedback: "" };
            onChange({ ...q, answers: [...q.answers, newAns] });
          }}><Plus className="h-4 w-4 mr-1"/>Új válasz</Button>

          {/* Magyarázat */}
          <div className="pt-2">
            <label className="block text-xs font-medium mb-1">Magyarázat / Feedback</label>
            <Textarea
              rows={3}
              placeholder="Miért ez a helyes válasz?"
              value={q.explanation}
              onChange={(e)=> onChange({ ...q, explanation: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Sidebar navigáció egyetlen sorának komponense
function SortableNavItem({ q, index, selected, onSelect }: { q: QuizQuestion; index: number; selected: boolean; onSelect: ()=>void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const typeInfo: Record<QuizQuestion['questionType'], { label: string; icon: JSX.Element }> = {
    SINGLE: { label: 'Egyszeres', icon: <List className="h-3 w-3" /> },
    MULTIPLE: { label: 'Többes', icon: <ListChecks className="h-3 w-3" /> },
    SCENARIO: { label: 'Esettanulmány', icon: <BookOpen className="h-3 w-3" /> },
    CODE: { label: 'Kód', icon: <CodeIcon className="h-3 w-3" /> },
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={onSelect}
      className={clsx(
        'flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors',
        selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
        isDragging ? 'opacity-50' : 'border border-transparent'
      )}
    >
      <GripVertical className="h-3 w-3 cursor-grab text-muted-foreground" {...listeners} />
      <span className="text-xs font-semibold w-5">{index+1}.</span>
      {typeInfo[q.questionType].icon}
      <span className="truncate flex-1">{typeInfo[q.questionType].label}</span>
    </div>
  );
}

// Sortable answer row inside question card
function SortableAnswerRow({ answer, question, onChange, index }: { answer: QuizAnswer; question: QuizQuestion; onChange: (updAnswers: QuizAnswer[])=>void; index: number }) {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({ id: answer.id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const isSingle = question.questionType === 'SINGLE';
  const [fbOpen, setFbOpen] = React.useState<boolean>(!!answer.feedback);
  const toggleCorrect = () => {
    const updated = question.answers.map((a)=> isSingle ? ({ ...a, isCorrect: a.id===answer.id }) : (a.id===answer.id? { ...a, isCorrect: !a.isCorrect }: a));
    onChange(updated);
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex flex-col gap-1 bg-white border rounded-md px-3 py-2 shadow-sm">
      <div className="flex items-center gap-3">
        <GripVertical className="h-3 w-3 cursor-grab text-muted-foreground" {...listeners} />
        <Button type="button" variant="ghost" size="icon" onClick={toggleCorrect} className={clsx('transition-colors', answer.isCorrect && 'text-green-600')}>
          {isSingle ? <div className={clsx('h-3 w-3 rounded-full border', answer.isCorrect && 'bg-green-600 border-green-600')}/> : <div className={clsx('h-3 w-3 rounded-sm border', answer.isCorrect && 'bg-green-600 border-green-600')}/>}
        </Button>
        <Input
          className="flex-1"
          placeholder={`Válasz #${index+1}`}
          value={answer.text ?? ''}
          onChange={(e)=>{
            const updated = question.answers.map((a)=> a.id===answer.id? { ...a, text: e.target.value }: a);
            onChange(updated);
          }}
        />
        <Button variant="ghost" size="icon" onClick={()=> setFbOpen(o=>!o)}><MessageCircle className={clsx('h-4 w-4', answer.feedback && 'text-blue-600')} /></Button>
        <Button variant="ghost" size="icon" onClick={()=>{
          const updated = question.answers.filter(a=>a.id!==answer.id);
          onChange(updated);
        }}><X className="h-4 w-4" /></Button>
      </div>
      {fbOpen && (
        <Textarea
          rows={2}
          className="ml-6"
          placeholder="Feedback erre a válaszra..."
          value={answer.feedback || ''}
          onChange={(e)=>{
            const updated = question.answers.map((a)=> a.id===answer.id? { ...a, feedback: e.target.value }: a);
            onChange(updated);
          }}
        />
      )}
    </div>
  );
}

export default function QuizEditorModal({ open, onOpenChange, value, onSave }: Props) {
  const [quiz, setQuiz] = useState<LessonQuiz>(value ?? { passingScore: 80, allowRetakes: true, maxAttempts: null, timeLimitMinutes: null, questions: [] });
  const [currentId, setCurrentId] = useState<string | null>(quiz.questions[0]?.id ?? null);
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = quiz.questions.findIndex((qq) => qq.id === active.id);
    const newIndex = quiz.questions.findIndex((qq) => qq.id === over.id);
    const moved = arrayMove(quiz.questions, oldIndex, newIndex);
    setQuiz({ ...quiz, questions: moved });
  };

  // Ensure currentId is valid when questions change
  useEffect(()=>{
    if(currentId===null && quiz.questions.length){
      setCurrentId(quiz.questions[0].id);
    }
    if(currentId!==null && !quiz.questions.find(q=>q.id===currentId)){
      setCurrentId(quiz.questions[0]?.id ?? null);
    }
  }, [quiz.questions, currentId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
       * Make the dialog take up the full viewport so no content can fall outside of view.
       * We also switch to a flex column layout to reserve space for the footer while the
       * main editor area becomes scrollable.
       */}
      <DialogContent className="w-screen h-screen max-w-none flex flex-col">
        <DialogHeader>
          <DialogTitle>Kvíz szerkesztése</DialogTitle>
          <DialogDescription>Add hozzá a kérdéseket, jelöld meg a helyes válaszokat.</DialogDescription>
        </DialogHeader>
        {/* TIMING & ATTEMPTS */}
        <div className="space-y-2 mb-4">
          <h3 className="text-sm font-semibold">Időzítés & próbálkozások</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={quiz.timeLimitMinutes !== null && quiz.timeLimitMinutes !== undefined}
                onChange={(e)=>{
                  setQuiz({...quiz, timeLimitMinutes: e.target.checked ? 30 : null});
                }} /> Időkorlát beállítása
            </label>
            { (quiz.timeLimitMinutes !== null && quiz.timeLimitMinutes !== undefined) && (
              <div className="flex items-center gap-1">
                <Input type="number" min={1} className="w-24" value={quiz.timeLimitMinutes}
                  onChange={(e)=> setQuiz({...quiz, timeLimitMinutes: e.target.value ? Number(e.target.value) : null})} />
                <span className="text-sm">perc</span>
              </div>
            )}
          </div>
        </div>

        {/* Main editor area – fills the remaining space and becomes scrollable */}
        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* ------ Navigátor oszlop ------ */}
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="w-56 flex flex-col border-r pr-2 overflow-y-auto">
              <SortableContext items={quiz.questions.map((q)=>q.id)} strategy={verticalListSortingStrategy}>
                {quiz.questions.map((q, idx)=>(
                  <SortableNavItem key={q.id} q={q} index={idx} selected={q.id===currentId} onSelect={()=>setCurrentId(q.id)} />
                ))}
              </SortableContext>
              <Button variant="secondary" className="mt-4" onClick={()=>{
                const newQ: QuizQuestion = { id: crypto.randomUUID(), questionText: "", answers: [], questionType: 'SINGLE', explanation:'', points:10 };
                setQuiz(prev=> ({ ...prev, questions: [...prev.questions, newQ] }));
                setCurrentId(newQ.id);
              }}><Plus className="h-4 w-4 mr-1"/>Új kérdés</Button>
            </div>
          </DndContext>

          {/* ------ Szerkesztő oszlop ------ */}
          <div className="flex-1 overflow-y-auto pr-1">
            {currentId ? (
              <SortableQuestionCard
                key={currentId}
                q={quiz.questions.find(q=>q.id===currentId)!}
                onChange={(upd)=>{
                  setQuiz({...quiz, questions: quiz.questions.map(q=> q.id===upd.id? upd: q)});
                }}
                onRemove={()=>{
                  setQuiz({...quiz, questions: quiz.questions.filter(q=> q.id!==currentId)});
                }}
              />
            ) : (
              <p className="italic text-muted-foreground">Nincs kérdés kiválasztva.</p>
            )}
          </div>
        </div>
        {/* Passing score + total points info */}
        <div className="flex items-center gap-4 mt-4">
          <label className="text-sm font-medium">Átmenő pontszám (%)</label>
          <Input type="number" min={0} max={100} className="w-24" value={quiz.passingScore} onChange={(e)=>setQuiz({ ...quiz, passingScore: Number(e.target.value) })} />
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={quiz.allowRetakes} onChange={()=>setQuiz({ ...quiz, allowRetakes: !quiz.allowRetakes, maxAttempts: null })}/> Újrapróba engedélyezett</label>
          {quiz.allowRetakes && (
            <div className="flex items-center gap-1">
              <Input type="number" min={0} className="w-20" value={quiz.maxAttempts ?? ''} placeholder="0" onChange={(e)=>{
                const v = e.target.value;
                setQuiz({...quiz, maxAttempts: v === '' ? null : Number(v)});
              }} />
              <span className="text-xs text-muted-foreground">max próbálkozás (0 = korlátlan)</span>
            </div>
          )}
          <span className="text-sm text-muted-foreground ml-auto">Összpontszám: {quiz.questions.reduce((sum,q)=> sum + (q.points||0),0)} • Átmenő: {Math.round(quiz.questions.reduce((s,q)=>s+q.points,0)*quiz.passingScore/100)} pont</span>
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={()=>{ onSave(quiz); onOpenChange(false); }}><Check className="h-4 w-4 mr-1"/>Mentés</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 