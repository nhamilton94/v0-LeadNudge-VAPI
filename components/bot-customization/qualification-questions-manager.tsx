'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import type { QualificationQuestion, QuestionType } from '@/types/bot-customization';

interface QualificationQuestionsManagerProps {
  questions: QualificationQuestion[];
  onChange: (questions: QualificationQuestion[]) => void;
  disabled?: boolean;
}

export function QualificationQuestionsManager({
  questions,
  onChange,
  disabled = false,
}: QualificationQuestionsManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QualificationQuestion | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    question_text: '',
    answer_type: 'text' as QuestionType,
    is_required: true,
    disqualifier_rule: '',
    multiple_choice_options: [] as string[],
  });

  const handleAdd = () => {
    setEditingQuestion(null);
    setFormData({
      question_text: '',
      answer_type: 'text',
      is_required: true,
      disqualifier_rule: '',
      multiple_choice_options: [],
    });
    setDialogOpen(true);
  };

  const handleEdit = (question: QualificationQuestion) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      answer_type: question.answer_type,
      is_required: question.is_required,
      disqualifier_rule: question.disqualifier_rule || '',
      multiple_choice_options: question.multiple_choice_options || [],
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.question_text.trim()) return;

    if (editingQuestion) {
      onChange(
        questions.map((q) =>
          q.id === editingQuestion.id
            ? {
                ...q,
                question_text: formData.question_text,
                answer_type: formData.answer_type,
                is_required: formData.is_required,
                disqualifier_rule: formData.disqualifier_rule || null,
                multiple_choice_options: formData.multiple_choice_options,
                updated_at: new Date().toISOString(),
              }
            : q
        )
      );
    } else {
      const newQuestion: QualificationQuestion = {
        id: `question-${Date.now()}`,
        question_text: formData.question_text,
        answer_type: formData.answer_type,
        is_required: formData.is_required,
        order_index: questions.length + 1,
        disqualifier_rule: formData.disqualifier_rule || null,
        multiple_choice_options: formData.multiple_choice_options,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      onChange([...questions, newQuestion]);
    }

    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setQuestionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (questionToDelete) {
      onChange(questions.filter((q) => q.id !== questionToDelete));
    }
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (disabled) return;
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;

    [newQuestions[index], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[index],
    ];

    // Update order_index
    newQuestions.forEach((q, idx) => {
      q.order_index = idx + 1;
    });

    onChange(newQuestions);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Configure questions to automatically screen and qualify prospects
          </p>
        </div>
        {!disabled && (
          <Button onClick={handleAdd} size="default">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            No qualification questions yet
          </p>
          {!disabled && (
            <Button onClick={handleAdd} variant="outline">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Your First Question
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {questions
            .sort((a, b) => a.order_index - b.order_index)
            .map((question, index) => (
              <div
                key={question.id}
                className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors bg-card"
              >
                {!disabled && (
                  <div className="flex flex-col gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveQuestion(index, 'down')}
                      disabled={index === questions.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="mt-0.5">
                      Q{index + 1}
                    </Badge>
                    <span className="font-medium flex-1">{question.question_text}</span>
                    {question.is_required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="capitalize">
                      {question.answer_type.replace('_', ' ')}
                    </span>
                    {question.disqualifier_rule && (
                      <>
                        <span>•</span>
                        <Badge variant="destructive" className="text-xs">
                          Disqualifier: {question.disqualifier_rule}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {!disabled && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(question)}
                      className="h-9 w-9"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(question.id)}
                      className="text-destructive hover:text-destructive h-9 w-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </DialogTitle>
            <DialogDescription>
              Configure a question to ask prospects during the screening process.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question-text">Question Text *</Label>
              <Input
                id="question-text"
                value={formData.question_text}
                onChange={(e) =>
                  setFormData({ ...formData, question_text: e.target.value })
                }
                placeholder="e.g., What's your expected move-in date?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer-type">Answer Type</Label>
              <Select
                value={formData.answer_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, answer_type: value as QuestionType })
                }
              >
                <SelectTrigger id="answer-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Free Text</SelectItem>
                  <SelectItem value="numeric">Number</SelectItem>
                  <SelectItem value="yes_no">Yes/No</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-required"
                checked={formData.is_required}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_required: checked as boolean })
                }
              />
              <Label htmlFor="is-required" className="font-normal cursor-pointer">
                Required question
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disqualifier-rule">Disqualifier Rule (Optional)</Label>
              <Input
                id="disqualifier-rule"
                value={formData.disqualifier_rule}
                onChange={(e) =>
                  setFormData({ ...formData, disqualifier_rule: e.target.value })
                }
                placeholder="e.g., income < 3000, pets = yes"
              />
              <p className="text-xs text-muted-foreground">
                Define conditions that disqualify a prospect
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.question_text.trim()}>
              {editingQuestion ? 'Update' : 'Add'} Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this question from the screening flow. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
